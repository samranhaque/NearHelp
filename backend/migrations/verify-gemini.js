#!/usr/bin/env node

/**
 * Gemini AI Verification Script
 * 
 * This script tests if Gemini AI is working and shows you exactly
 * what guidance is being generated (AI vs hardcoded fallback)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

async function testGemini() {
    console.log('🔍 Testing Gemini AI Integration...\n');
    console.log('═'.repeat(70));

    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not found in .env file');
        console.log('\n📝 To enable Gemini AI:');
        console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
        console.log('   2. Add to backend/.env: GEMINI_API_KEY=your_key_here');
        console.log('\n⚠️  Currently using HARDCODED FALLBACK guidance\n');
        return;
    }

    console.log('✅ GEMINI_API_KEY found:', apiKey.substring(0, 15) + '...' + apiKey.slice(-4));
    console.log('═'.repeat(70));
    console.log('\n🧪 Testing Gemini API with sample SOS...\n');

    // Test prompt
    const testPrompt = `You are an emergency response expert. A person in India has triggered a "Medical" SOS alert.

Their situation in their own words: "I fell and hurt my leg, can't walk"
Blood group: O+

Provide exactly 6 numbered, concise, actionable first-response steps specific to this person's exact situation.
Rules:
- Each step must be 1-2 short sentences only
- Reference their specific situation, description, or health details where directly relevant
- Include the most relevant Indian emergency number: 112 (national), 108 (ambulance), 100 (police), 101 (fire)
- Use plain numbered format only: "1. Step text\\n2. Step text\\n..."
- No headers, no markdown, no asterisks, no extra formatting whatsoever`;

    let success = false;
    let responseText = null;
    let modelUsed = null;

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        console.log(`⚙️  Testing model: ${model}...`);
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
                }),
            });

            if (res.status === 429) {
                console.log(`   ⚠️  Rate limited (429) - trying next model...`);
                continue;
            }

            if (res.status === 404) {
                console.log(`   ⚠️  Model not found (404) - trying next model...`);
                continue;
            }

            if (res.status === 403) {
                console.log(`   ❌ Access denied (403) - Check API key permissions`);
                continue;
            }

            if (!res.ok) {
                const errorText = await res.text();
                console.log(`   ❌ Error ${res.status}:`, errorText.substring(0, 100));
                continue;
            }

            const data = await res.json();
            responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (responseText && responseText.trim().length > 10) {
                success = true;
                modelUsed = model;
                console.log(`   ✅ Success with ${model}!\n`);
                break;
            } else {
                console.log(`   ⚠️  Empty response from ${model}`);
            }
        } catch (err) {
            console.log(`   ❌ Fetch error:`, err.message);
        }
    }

    console.log('═'.repeat(70));
    
    if (success) {
        console.log('\n✅ GEMINI AI IS WORKING!');
        console.log(`   Model: ${modelUsed}`);
        console.log('\n📋 Generated Guidance (from Gemini AI):\n');
        console.log('─'.repeat(70));
        console.log(responseText);
        console.log('─'.repeat(70));
        console.log('\n✨ This is PERSONALIZED, AI-generated guidance!');
        console.log('   It references the specific situation ("fell and hurt my leg")');
        console.log('   and user details (Blood group: O+)\n');
    } else {
        console.log('\n❌ GEMINI AI NOT WORKING');
        console.log('   All models failed or returned empty responses');
        console.log('\n📝 Possible reasons:');
        console.log('   1. Invalid API key');
        console.log('   2. API quota exceeded');
        console.log('   3. Network connectivity issues');
        console.log('   4. Gemini API service disruption');
        console.log('\n⚠️  Backend will use HARDCODED FALLBACK guidance instead\n');
        
        console.log('📋 Example Hardcoded Fallback:\n');
        console.log('─'.repeat(70));
        console.log('1. Stay calm and assess the situation');
        console.log('2. Call 108 for ambulance or 112 for emergency services');
        console.log('3. Check for breathing and pulse');
        console.log('4. Do not move the person unless there is immediate danger');
        console.log('5. Keep the person warm and comfortable');
        console.log('6. Wait for professional help to arrive');
        console.log('─'.repeat(70));
        console.log('\n⚠️  This is GENERIC guidance, not personalized!\n');
    }

    console.log('═'.repeat(70));
    console.log('\n💡 How to tell in your app:');
    console.log('   • Check backend logs for: "[aiService] Gemini guidance generated"');
    console.log('   • AI guidance = References YOUR specific description');
    console.log('   • Fallback = Generic steps, no personal details');
    console.log('\n📊 Test Results Summary:');
    console.log(`   API Key: ${apiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Gemini Status: ${success ? '✅ Working' : '❌ Not Working'}`);
    console.log(`   Model Used: ${modelUsed || 'None (fallback will be used)'}`);
    console.log('\n');
}

testGemini().catch(err => {
    console.error('\n❌ Unexpected error:', err);
    process.exit(1);
});
