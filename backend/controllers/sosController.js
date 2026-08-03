const supabase = require('../config/supabase');
const { getUsersInRadius, haversineDistance } = require('../utils/routingEngine');
const aiService = require('../services/aiService');
const { scheduleWelfareCheck } = require('../jobs/welfareCheck');

// @route POST /api/sos/create
const createSOS = async (req, res) => {
    try {
        const { type, modalData = {}, lat: bodyLat, lng: bodyLng } = req.body;

        // When creating SOS, use the seeker's current stored lat/lng
        // These should have been updated by the GPS fetch on dashboard load
        const { data: seeker } = await supabase
            .from('users')
            .select('id, name, lat, lng, blood_group, health_conditions')
            .eq('id', req.user.id)
            .single();

        // Validate coords are real — reject Delhi default if user never set GPS
        let finalLat = seeker?.lat;
        let finalLng = seeker?.lng;

        if (!finalLat || !finalLng || (finalLat === 28.6139 && finalLng === 77.2090)) {
            // Coords are still the hardcoded default
            // Use coords from request body if frontend passed them
            finalLat = bodyLat || finalLat;
            finalLng = bodyLng || finalLng;
        }

        if (!finalLat || !finalLng) {
            return res.status(400).json({ message: 'User location is not set. Please update your location first.' });
        }

        // Auto-populate medical info for Medical SOS
        if (type === 'Medical') {
            modalData.bloodGroup = seeker.blood_group || '';
            modalData.healthConditions = seeker.health_conditions || '';
        }

        const { data: sos, error } = await supabase.from('sos').insert({
            seeker_id: seeker.id,
            type,
            modal_data: modalData,
            lat: finalLat,
            lng: finalLng,
            status: 'active',
        }).select().single();

        if (error) throw error;

        const targets = await getUsersInRadius({ lat: seeker.lat, lng: seeker.lng }, 5, {
            seekerId: seeker.id,
            type
        });

        const io = req.app.get('io');

        // --- PERSISTENCE LAYER: Save notifications to DB for 100% reliability ---
        const allTargetIds = [...new Set([...targets.priority, ...targets.general, ...targets.guardians])];
        if (allTargetIds.length > 0) {
            const notificationsToInsert = allTargetIds.map(userId => ({
                user_id: userId,
                sender_id: seeker.id,
                type: 'sos_alert',
                status: 'unread',
                data: {
                    sos_id: sos.id,
                    message: `New ${type} SOS alert nearby!`,
                    seeker_name: seeker.name,
                    is_priority: targets.priority.includes(userId),
                    is_guardian: targets.guardians.includes(userId)
                }
            }));
            await supabase.from('notifications').insert(notificationsToInsert);
        }

        if (io) {
            // 0. Notify the SEEKER that their own SOS was created
            io.to(`user:${req.user.id}`).emit('sos:created', { sos, seeker });

            // 1. Guardians first
            targets.guardians.forEach(guardianId => {
                io.to(`user:${guardianId}`).emit('sos:guardian_alert', {
                    sos, seekerName: seeker.name, isGuardian: true
                });
            });

            // 2. Community after short delay
            setTimeout(() => {
                targets.priority.forEach(userId => {
                    if (!targets.guardians.includes(userId)) {
                        io.to(`user:${userId}`).emit('sos:priority_alert', { sos, isPriority: true });
                    }
                });
                targets.general.forEach(userId => {
                    if (!targets.priority.includes(userId) && !targets.guardians.includes(userId)) {
                        io.to(`user:${userId}`).emit('sos:new_alert', { sos, isPriority: false });
                    }
                });
                io.to('admin:room').emit('admin:sos_created', sos);
            }, 500);
        }

        // ... (rest of the code omitted for brevity but stays) ...
        // Async AI: generate guidance + call script SEQUENTIALLY to save quota
        (async () => {
            try {
                console.log(`[AI] Starting generation for SOS ${sos.id}, type: ${type}`);
                
                // Generate guidance first
                let guidance = null;
                let callScript = null;
                
                try {
                    guidance = await aiService.generateFirstResponseGuidance(type, modalData, seeker);
                    console.log(`[AI] ✅ Guidance generated for SOS ${sos.id}`);
                } catch (err) {
                    console.error(`[AI] ❌ Guidance generation failed:`, err.message);
                    guidance = null; // Will use frontend fallback
                }
                
                // Then generate call script (optional - don't let this block the guidance)
                try {
                    callScript = await aiService.generateCallScript(
                        type, 
                        modalData, 
                        seeker, 
                        modalData?.landmark || '', 
                        finalLat, 
                        finalLng
                    );
                    console.log(`[AI] ✅ Call script generated for SOS ${sos.id}`);
                } catch (err) {
                    console.error(`[AI] ⚠️ Call script generation failed (non-critical):`, err.message);
                    callScript = null; // Will use frontend fallback
                }
                
                // Save both to database (even if one is null)
                const updateData = {};
                if (guidance) updateData.first_response_guidance = guidance;
                if (callScript) updateData.call_script = callScript;
                
                if (Object.keys(updateData).length > 0) {
                    await supabase.from('sos').update(updateData).eq('id', sos.id);
                    console.log(`[AI] 💾 Saved to database for SOS ${sos.id}`);
                }

                if (io) {
                    const payload = {
                        sosId: sos.id,
                        guidance,
                        callScript,
                    };
                    
                    // Log exactly what we're sending
                    console.log('[AI] 📤 Socket payload:', JSON.stringify({
                        sosId: sos.id,
                        hasGuidance: !!guidance,
                        hasCallScript: !!callScript,
                        guidanceLength: guidance?.length || 0,
                        guidancePreview: guidance?.substring(0, 100) || ''
                    }));
                    
                    console.log(`[AI] 📡 About to emit sos:ai_ready - Connected sockets:`, io.sockets.sockets.size);
                    console.log(`[AI] 📡 Seeker room: user:${seeker.id}`);
                    
                    // Emit EVEN IF only guidance succeeded - using BROADCAST to ALL connected clients
                    io.emit('sos:ai_ready', payload);
                    console.log(`[AI] ✅ Global emit sent for SOS ${sos.id}`);
                    
                    // Also emit to specific user room as backup
                    if (seeker && seeker.id) {
                        const roomEmitResult = io.to(`user:${seeker.id}`).emit('sos:ai_ready', payload);
                        console.log(`[AI] ✅ Room emit sent to user:${seeker.id}`, roomEmitResult ? 'success' : 'might have failed');
                    }
                    
                    // Log all rooms this seeker is in
                    const seekerSockets = await io.in(`user:${seeker.id}`).fetchSockets();
                    console.log(`[AI] 🔍 Seeker has ${seekerSockets.length} socket(s) connected in their room`);
                    seekerSockets.forEach((s, i) => {
                        console.log(`[AI]   Socket ${i}: ID=${s.id}, rooms=${Array.from(s.rooms).join(', ')}`);
                    });
                    
                    io.emit('sos:stats_updated');
                } else {
                    console.error('[AI] ❌ Socket IO not available!');
                }
            } catch (err) {
                console.error('[AI] ❌ Critical error in AI generation:', err);
                // Don't block SOS creation if AI fails completely
            }
        })();

        res.status(201).json({ ...sos, _id: sos.id, notifiedUsers: targets.priority.length + targets.general.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/anonymous
const createAnonymousSOS = async (req, res) => {
    try {
        const { type, modalData = {}, lat, lng, anonymousName, anonymousBloodGroup } = req.body;
        if (!type || !lat || !lng) return res.status(400).json({ message: 'Type and location required' });

        const { data: sos, error } = await supabase.from('sos').insert({
            seeker_id: null,
            type,
            modal_data: { ...modalData, bloodGroup: anonymousBloodGroup || '' },
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            status: 'active',
            is_anonymous: true,
            anonymous_name: anonymousName || 'Anonymous User',
            anonymous_blood_group: anonymousBloodGroup || '',
        }).select().single();

        if (error) throw error;

        const targets = await getUsersInRadius({ lat: parseFloat(lat), lng: parseFloat(lng) }, 5, { type, isAnonymous: true });

        // --- PERSISTENCE LAYER: Save anonymous notifications to DB ---
        const allTargetIds = [...new Set([...targets.priority, ...targets.general])];
        if (allTargetIds.length > 0) {
            const notificationsToInsert = allTargetIds.map(userId => ({
                user_id: userId,
                sender_id: null,
                type: 'sos_alert',
                status: 'unread',
                data: {
                    sos_id: sos.id,
                    message: `Anonymous ${type} SOS alert nearby!`,
                    seeker_name: sos.anonymous_name,
                    is_priority: targets.priority.includes(userId)
                }
            }));
            await supabase.from('notifications').insert(notificationsToInsert);
        }

        const io = global.io;
        if (io) {
            setTimeout(() => {
                targets.priority.forEach(userId => {
                    io.to(`user:${userId}`).emit('sos:priority_alert', {
                        sos: { ...sos, seekerName: sos.anonymous_name },
                        isPriority: true, isAnonymous: true
                    });
                });
                targets.general.forEach(userId => {
                    if (!targets.priority.includes(userId)) {
                        io.to(`user:${userId}`).emit('sos:new_alert', {
                            sos: { ...sos, seekerName: sos.anonymous_name },
                            isPriority: false, isAnonymous: true
                        });
                    }
                });
                io.to('admin:room').emit('admin:sos_created', sos);
                io.emit('sos:stats_updated');
            }, 500);
        }

        aiService.generateFirstResponseGuidance(type, modalData, {
            blood_group: anonymousBloodGroup || '',
            health_conditions: ''
        }).then(guidance => {
            supabase.from('sos').update({ first_response_guidance: guidance }).eq('id', sos.id);
            if (global.io) global.io.emit(`sos:guidance_${sos.id}`, { guidance });
        });

        res.json({ sos: { ...sos, _id: sos.id }, message: 'SOS broadcast to nearby community' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/active
const getActiveSOS = async (req, res) => {
    try {
        const user = req.user;
        if (!user.lat || !user.lng) {
            return res.status(400).json({ message: 'Location not set' });
        }

        const { data: allActive } = await supabase
            .from('sos')
            .select('*, users!seeker_id(name, blood_group, health_conditions, skills)')
            .in('status', ['active', 'responding']);

        const nearbySOS = (allActive || []).filter(sos => {
            if (!sos.lat || !sos.lng) return false;
            return haversineDistance(user.lat, user.lng, sos.lat, sos.lng) <= 5;
        });

        res.json((nearbySOS || []).map(s => ({ ...s, _id: s.id })));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/stats
const getSOSStats = async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const [{ data: active }, { data: resolvedToday }, { data: online }, { data: myResponses }] = await Promise.all([
            supabase.from('sos').select('id').eq('status', 'active'),
            supabase.from('sos').select('id').eq('status', 'resolved').gte('resolved_at', today.toISOString()),
            supabase.from('users').select('id').eq('is_online', true),
            supabase.from('sos').select('response_time_seconds').contains('responders', [req.user.id]).eq('status', 'resolved'),
        ]);

        const avgResponse = myResponses?.length
            ? Math.round(myResponses.reduce((s, r) => s + (r.response_time_seconds || 0), 0) / myResponses.length)
            : 0;

        res.json({
            activeSOS: active?.length || 0,
            resolvedToday: resolvedToday?.length || 0,
            respondersOnline: online?.length || 0,
            avgResponseSeconds: avgResponse,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/global-stats
const getGlobalStats = async (req, res) => {
    try {
        const { data: allSOS } = await supabase.from('sos').select('*').eq('status', 'resolved');
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const resolvedToday = (allSOS || []).filter(s => s.resolved_at && new Date(s.resolved_at) >= today).length;
        const sosByType = {};
        const typeTimeSums = {};
        const typeTimeCounts = {};

        (allSOS || []).forEach(sos => {
            sosByType[sos.type] = (sosByType[sos.type] || 0) + 1;
            if (sos.response_time_seconds > 0) {
                typeTimeSums[sos.type] = (typeTimeSums[sos.type] || 0) + sos.response_time_seconds;
                typeTimeCounts[sos.type] = (typeTimeCounts[sos.type] || 0) + 1;
            }
        });

        const avgResponseTimeByType = {};
        for (const t in sosByType) {
            avgResponseTimeByType[t] = typeTimeCounts[t] > 0 ? Math.round(typeTimeSums[t] / typeTimeCounts[t]) : 0;
        }

        res.json({
            totalSOS: allSOS?.length || 0,
            resolvedToday,
            sosByType,
            avgResponseTimeByType
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/:id
const getSOSById = async (req, res) => {
    try {
        const { data: sos } = await supabase
            .from('sos')
            .select('*, users!seeker_id(name, email, phone, blood_group, health_conditions, skills)')
            .eq('id', req.params.id)
            .single();
        if (!sos) return res.status(404).json({ message: 'SOS not found' });
        res.json({ ...sos, _id: sos.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/:id/respond
const respondToSOS = async (req, res) => {
    try {
        const { data: sos } = await supabase.from('sos').select('*').eq('id', req.params.id).single();
        if (!sos) return res.status(404).json({ message: 'SOS not found' });
        if (sos.seeker_id === req.user.id) return res.status(403).json({ message: 'You cannot respond to your own SOS' });
        if (sos.status === 'resolved' || sos.status === 'cancelled') return res.status(400).json({ message: 'SOS is no longer active' });

        const responders = sos.responders || [];
        if (!responders.includes(req.user.id)) {
            responders.push(req.user.id);
        }

        const newStatus = sos.status === 'active' ? 'responding' : sos.status;
        const { data: updated } = await supabase.from('sos')
            .update({ responders, status: newStatus })
            .eq('id', req.params.id)
            .select().single();

        const io = req.app.get('io');
        if (io) io.to('admin:room').emit('admin:sos_updated', updated);

        res.json({ ...updated, _id: updated.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/:id/resolve
const resolveSOS = async (req, res) => {
    try {
        console.log(`[resolveSOS] Attempting to resolve SOS ${req.params.id} by user ${req.user.id}`);
        
        const { data: sos, error: fetchError } = await supabase.from('sos').select('*').eq('id', req.params.id).single();
        if (fetchError) {
            console.error('[resolveSOS] Error fetching SOS:', fetchError);
            return res.status(500).json({ message: 'Failed to fetch SOS', error: fetchError.message });
        }
        if (!sos) {
            console.error('[resolveSOS] SOS not found:', req.params.id);
            return res.status(404).json({ message: 'SOS not found' });
        }
        if (sos.seeker_id !== req.user.id) {
            console.error('[resolveSOS] Permission denied. SOS seeker:', sos.seeker_id, 'User:', req.user.id);
            return res.status(403).json({ message: 'Only the seeker can resolve' });
        }

        const resolvedAt = new Date().toISOString();
        const responseTimeSeconds = Math.round((new Date(resolvedAt) - new Date(sos.created_at)) / 1000);

        console.log(`[resolveSOS] Updating SOS ${req.params.id} to resolved status`);
        const { data: updated, error: updateError } = await supabase.from('sos').update({
            status: 'resolved',
            resolved_at: resolvedAt,
            response_time_seconds: responseTimeSeconds,
        }).eq('id', req.params.id).select().single();

        // Prevent backlog chain: Also resolve any other stuck active SOSes for this user
        await supabase.from('sos').update({
            status: 'resolved',
            resolved_at: resolvedAt,
        })
        .eq('seeker_id', req.user.id)
        .in('status', ['active', 'responding'])
        .neq('id', req.params.id);

        if (updateError) {
            console.error('[resolveSOS] Error updating SOS:', updateError);
            return res.status(500).json({ message: 'Failed to resolve SOS', error: updateError.message });
        }

        console.log(`[resolveSOS] ✅ SOS ${req.params.id} successfully resolved`);

        const io = req.app.get('io');

        // AI: generate incident summary + debrief SEQUENTIALLY to save quota
        if (sos.seeker_id) {
            (async () => {
                try {
                    // Generate summary first
                    const summary = await aiService.generateResolutionSummary(updated);
                    
                    // Then generate debrief
                    const debrief = await aiService.generateDebriefPrompt(updated);
                    
                    // Save both to database
                    await supabase.from('sos').update({ 
                        resolution_summary: summary, 
                        debrief_prompt: debrief 
                    }).eq('id', sos.id);
                    
                    if (io) {
                        // Push debrief to seeker only
                        io.to(`user:${sos.seeker_id}`).emit('sos:debrief_ready', { sosId: sos.id, debrief });
                        io.to(`chat:${sos.id}`).emit('sos:summary_ready', { sosId: sos.id, summary });
                    }
                } catch (err) {
                    console.error('AI Resolution Error:', err);
                    // Don't block resolution if AI fails
                }
            })();
        }

        scheduleWelfareCheck(sos.seeker_id, sos.id);

        if (io) {
            io.to('admin:room').emit('admin:sos_resolved', updated);
            io.emit('sos:resolved', { sosId: sos.id });
            io.emit('sos:stats_updated');
        }

        res.json({ ...updated, _id: updated.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/:id/flag
const flagSOS = async (req, res) => {
    try {
        const { data: sos } = await supabase.from('sos').select('*').eq('id', req.params.id).single();
        if (!sos) return res.status(404).json({ message: 'SOS not found' });
        
        // Removed responder-only restriction to allow community reporting from the map

        const flaggedBy = sos.flagged_by || [];
        if (flaggedBy.includes(req.user.id)) {
            return res.json({ message: 'Already flagged by you', seekerSuspended: false });
        }

        flaggedBy.push(req.user.id);
        await supabase.from('sos').update({ flagged_by: flaggedBy, is_flagged: true }).eq('id', req.params.id);

        if (sos.seeker_id) {
            const { data: seeker } = await supabase.from('users').select('*').eq('id', sos.seeker_id).single();
            if (seeker) {
                const newCount = (seeker.false_alert_count || 0) + 1;
                await supabase.from('users').update({
                    false_alert_count: newCount
                }).eq('id', seeker.id);

                return res.json({ message: 'SOS flagged successfully', seekerSuspended: false });
            }
        }
        res.json({ message: 'SOS flagged' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/history
const getSOSHistory = async (req, res) => {
    try {
        const { data: history } = await supabase
            .from('sos')
            .select('*, users!seeker_id(name)')
            .or(`seeker_id.eq.${req.user.id},responders.cs.{${req.user.id}}`)
            .order('created_at', { ascending: false })
            .limit(20);
        res.json((history || []).map(s => ({ ...s, _id: s.id })));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/chat
const handleAIChat = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const contents = req.body.contents;
        const system_instruction = req.body.system_instruction;
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        let geminiRes = null;
        let lastError = null;

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            try {
                geminiRes = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents, system_instruction }),
                });

                if (geminiRes.status === 429 || geminiRes.status === 404 || geminiRes.status === 403) {
                    console.warn(`[sosController] Model ${model} hit ${geminiRes.status}. Trying fallback...`);
                    continue;
                }
                if (geminiRes.ok) break;

                lastError = await geminiRes.text();
            } catch (err) {
                lastError = err.message;
            }
        }

        if (!geminiRes || !geminiRes.ok) {
            console.error(`[sosController] All Gemini models failed:`, lastError);
            return res.status(500).json({ error: "AI Assistant failed", details: lastError });
        }

        const data = await geminiRes.json();
        return res.status(geminiRes.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/sos/me/active
const getMyActiveSOS = async (req, res) => {
    try {
        console.log('[getMyActiveSOS] Checking for user:', req.user.id);
        
        const { data: sosList, error } = await supabase
            .from('sos')
            .select('*')
            .eq('seeker_id', req.user.id)
            .in('status', ['active', 'responding'])
            .order('created_at', { ascending: false })
            .limit(1);

        // Handle case where no active SOS exists (don't use .single())
        if (error) {
            console.error('[getMyActiveSOS] Error:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }

        const sos = sosList && sosList.length > 0 ? sosList[0] : null;
        if (sos) {
            sos._id = sos.id;
            console.log('[getMyActiveSOS] Found active SOS:', sos.id, 'Status:', sos.status, 'Created:', sos.created_at);
        } else {
            console.log('[getMyActiveSOS] No active SOS found');
        }
        
        res.json(sos);
    } catch (error) {
        console.error('[getMyActiveSOS] Unexpected error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/sos/:id/presence
const confirmPresence = async (req, res) => {
    try {
        const { available } = req.body;
        const io = req.app.get('io');

        const { data: sos, error } = await supabase.from('sos').select('*').eq('id', req.params.id).single();
        if (error || !sos) return res.status(404).json({ message: 'SOS not found' });
        if (sos.status === 'resolved' || sos.status === 'cancelled') return res.status(400).json({ message: 'SOS is no longer active' });
        if (sos.seeker_id === req.user.id) return res.status(403).json({ message: 'Cannot respond to own SOS' });

        // Declined — just dismiss on responder side
        if (!available) {
            if (io) io.to(`user:${req.user.id}`).emit('presence:declined', { sosId: sos.id });
            return res.json({ message: 'Declined' });
        }

        // Add responder
        const responders = sos.responders || [];
        
        // Ensure only one responder can accept the SOS
        if (responders.length > 0 && !responders.includes(req.user.id)) {
            return res.status(400).json({ message: 'This SOS has already been accepted by another responder.' });
        }
        
        if (!responders.includes(req.user.id)) responders.push(req.user.id);

        const { data: updated } = await supabase.from('sos')
            .update({ responders, status: 'responding' })
            .eq('id', req.params.id).select().single();

        // Fetch both profiles in parallel
        const [{ data: seeker }, { data: responder }] = await Promise.all([
            sos.seeker_id
                ? supabase.from('users').select('id, name, lat, lng, blood_group, health_conditions, skills').eq('id', sos.seeker_id).single()
                : Promise.resolve({ data: null }),
            supabase.from('users').select('id, name, lat, lng, skills, trust_score').eq('id', req.user.id).single()
        ]);

        const mutualPayload = {
            sosId: sos.id,
            _id: sos.id,
            sosType: sos.type,
            modalData: sos.modal_data,
            seeker: seeker ? {
                id: seeker.id,
                name: sos.is_anonymous ? 'Anonymous User' : (seeker.name || 'Help Seeker'),
                lat: seeker.lat,
                lng: seeker.lng,
                bloodGroup: sos.modal_data?.bloodGroup || seeker.blood_group,
                healthConditions: seeker.health_conditions,
            } : { id: null, name: 'Anonymous User', lat: sos.lat, lng: sos.lng },
            responder: {
                id: responder.id,
                name: responder.name,
                lat: responder.lat,
                lng: responder.lng,
                skills: responder.skills,
                trustScore: responder.trust_score
            },
            seekerLocation: { lat: sos.lat, lng: sos.lng },
        };

        if (io) {
            io.to(`user:${req.user.id}`).emit('response:mutual_open', mutualPayload);
            if (sos.seeker_id) io.to(`user:${sos.seeker_id}`).emit('response:mutual_open', mutualPayload);
        }

        return res.json({ success: true, payload: mutualPayload });
    } catch (error) {
        console.error('[confirmPresence]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createSOS, createAnonymousSOS, getActiveSOS, getSOSStats, getGlobalStats, getSOSById, respondToSOS, resolveSOS, flagSOS, getSOSHistory, handleAIChat, getMyActiveSOS, confirmPresence };
