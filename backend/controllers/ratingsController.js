const supabase = require('../config/supabase');

// @route POST /api/ratings/:sosId
// Seeker rates responder
const submitRating = async (req, res) => {
    try {
        const { responderId, stars, review } = req.body;
        const sosId = req.params.sosId;
        if (!responderId || !stars || stars < 1 || stars > 5) {
            return res.status(400).json({ message: 'Please provide responderId and a valid star rating (1-5)' });
        }

        const { data: sos } = await supabase.from('sos').select('*').eq('id', sosId).single();
        if (!sos) return res.status(404).json({ message: 'SOS not found' });
        if (sos.seeker_id !== req.user.id) return res.status(403).json({ message: 'Not authorized: must be the seeker' });
        if (sos.status !== 'resolved') return res.status(400).json({ message: 'SOS must be resolved before rating' });
        if (!(sos.responders || []).includes(responderId)) return res.status(400).json({ message: 'User was not a responder for this SOS' });

        const { data: existing } = await supabase.from('ratings')
            .select('id').eq('sos_id', sosId).eq('rater_id', req.user.id).eq('ratee_id', responderId).single();
        if (existing) return res.status(400).json({ message: 'You have already rated this responder for this SOS' });

        const { data: ratingObj } = await supabase.from('ratings').insert({
            sos_id: sosId, rater_id: req.user.id, ratee_id: responderId, rating: stars, feedback: review
        }).select().single();

        // Update trust score and check for one-star ratings
        await updateUserTrustScore(responderId, stars);
        
        res.status(201).json({ rating: ratingObj });
    } catch (error) {
        console.error('[Ratings] ❌ Error submitting rating:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/ratings/:sosId/rate-seeker
// Responder rates seeker
const submitSeekerRating = async (req, res) => {
    try {
        const { stars, review } = req.body;
        const sosId = req.params.sosId;
        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ message: 'Please provide a valid star rating (1-5)' });
        }

        const { data: sos } = await supabase.from('sos').select('*').eq('id', sosId).single();
        if (!sos) return res.status(404).json({ message: 'SOS not found' });
        if (!(sos.responders || []).includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized: must be a responder for this SOS' });
        }
        if (sos.status !== 'resolved') return res.status(400).json({ message: 'SOS must be resolved before rating' });

        // Check if responder already rated this seeker
        const { data: existing } = await supabase.from('ratings')
            .select('id').eq('sos_id', sosId).eq('rater_id', req.user.id).eq('ratee_id', sos.seeker_id).single();
        if (existing) return res.status(400).json({ message: 'You have already rated the seeker for this SOS' });

        const { data: ratingObj } = await supabase.from('ratings').insert({
            sos_id: sosId,
            rater_id: req.user.id,
            ratee_id: sos.seeker_id,
            rating: stars,
            feedback: review
        }).select().single();

        // Update seeker's trust score
        await updateUserTrustScore(sos.seeker_id, stars);
        
        res.status(201).json({ rating: ratingObj });
    } catch (error) {
        console.error('[Ratings] ❌ Error submitting seeker rating:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Helper function to update trust score and handle auto-suspension
async function updateUserTrustScore(userId, stars) {
    const { data: user, error: userError } = await supabase.from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (userError) {
        console.error('[Ratings] ❌ Error fetching user for trust score update:', userError);
        return;
    }

    if (user) {
        const newSum = (user.rating_sum || 0) + stars;
        const newCount = (user.total_ratings || 0) + 1;
        const newScore = Math.round((newSum / newCount) * 10) / 10;
        
        // Count one-star ratings dynamically instead of relying on a potentially missing column
        const { count: oneStarCount, error: countError } = await supabase.from('ratings')
            .select('*', { count: 'exact', head: true })
            .eq('ratee_id', userId)
            .eq('rating', 1);

        if (countError) {
            console.error('[Ratings] ❌ Error counting one-star ratings:', countError);
        }

        const newOneStarCount = (oneStarCount || 0) + (stars === 1 ? 1 : 0);
        
        // Auto-suspend if user has received more than 3 one-star ratings
        const shouldSuspend = newOneStarCount > 3;
        
        const updateData = {
            rating_sum: newSum,
            total_ratings: newCount,
            trust_score: newScore
        };
        
        if (shouldSuspend) {
            updateData.is_suspended = true;
            console.log(`[Ratings] 🚫 User ${user.name} (${userId}) auto-suspended after ${newOneStarCount} one-star ratings`);
        }
        
        const { error: updateError } = await supabase.from('users').update(updateData).eq('id', userId);
        if (updateError) {
            console.error('[Ratings] ❌ Error updating trust score:', updateError);
        } else {
            console.log(`[Ratings] ✅ Updated trust score for ${user.name}: ${newScore} (${newCount} ratings, ${newOneStarCount} one-stars)${shouldSuspend ? ' - SUSPENDED' : ''}`);
        }
    }
}

// @route GET /api/ratings/responder/:userId
const getResponderRatings = async (req, res) => {
    try {
        const { data: ratings } = await supabase.from('ratings')
            .select('*, sos!sos_id(type), rater:users!rater_id(name)')
            .eq('ratee_id', req.params.userId)
            .order('created_at', { ascending: false });

        const { data: user } = await supabase.from('users')
            .select('trust_score, total_ratings')
            .eq('id', req.params.userId)
            .single();
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ 
            ratings: ratings || [], 
            averageScore: user.trust_score, 
            totalCount: user.total_ratings,
            oneStarCount: 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/ratings/user/:userId
// Get all ratings for a user (both as responder and seeker)
const getUserRatings = async (req, res) => {
    try {
        // Get ratings where user was responder (ratee)
        const { data: asResponder } = await supabase.from('ratings')
            .select('*, sos!sos_id(type), rater:users!rater_id(name)')
            .eq('ratee_id', req.params.userId)
            .order('created_at', { ascending: false });

        // Get ratings where user was seeker (rater)
        const { data: asSeeker } = await supabase.from('ratings')
            .select('*, sos!sos_id(type), ratee:users!ratee_id(name)')
            .eq('rater_id', req.params.userId)
            .order('created_at', { ascending: false });

        const { data: user } = await supabase.from('users')
            .select('trust_score, total_ratings, is_suspended')
            .eq('id', req.params.userId)
            .single();
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ 
            ratingsReceived: asResponder || [],
            ratingsGiven: asSeeker || [],
            averageScore: user.trust_score, 
            totalCount: user.total_ratings,
            oneStarCount: 0,
            isSuspended: user.is_suspended
        });
    } catch (error) {
        console.error('[Ratings] Error fetching user ratings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { 
    submitRating, 
    submitSeekerRating,
    getResponderRatings,
    getUserRatings
};
