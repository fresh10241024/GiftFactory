// API Module for Gift Factory Frontend

const BASE_URL = '/api'; // Adjust this if your backend runs on a different port, e.g. 'http://localhost:8000/api' or leave as '/api' for relative proxy

/**
 * Helper for making fetch requests
 */
async function fetchApi(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `HTTP error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
}

/**
 * 1. Create a new session
 * POST /sessions
 */
export async function createSession() {
    // mock implementation for now until backend is fully hooked up, or call actual
    // return fetchApi('/sessions', { method: 'POST' });
    
    // Defaulting to mock just in case the backend isn't running yet
    console.log('[API] createSession called');
    return { session_id: "mock-session-123" };
}

/**
 * 2. Send a chat message
 * POST /sessions/{session_id}/chat
 * body: { message: str }
 */
export async function sendChatMessage(sessionId, message) {
    // return fetchApi(`/sessions/${sessionId}/chat`, {
    //     method: 'POST',
    //     body: JSON.stringify({ message })
    // });
    
    console.log(`[API] sendChatMessage: ${message}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                reply: "This is a mock AI reply based on your answer.",
                ready: false, // True if AI has enough info
                state: {},
                mood: {}
            });
        }, 800);
    });
}

/**
 * 3. Upload Image (Placeholder, backend might need to add this)
 * Since backend Python doesn't have an explicit image upload yet, mock it.
 */
export async function uploadImage(sessionId, file) {
    console.log(`[API] uploadImage: ${file.name}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true, url: `/mock-url/${file.name}` });
        }, 1000);
    });
}

/**
 * 4. Generate AI Plan / Analysis
 * POST /sessions/{session_id}/plan
 */
export async function generateAnalysisPlan(sessionId) {
    // return fetchApi(`/sessions/${sessionId}/plan`, { method: 'POST' });
    
    console.log(`[API] generateAnalysisPlan for session ${sessionId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                plan: {
                    title1: "1 — The Essence of the Gift",
                    text1: "Based on your responses, this gift embodies a profound appreciation for their creative spirit.",
                    title2: "2 — Emotional Resonance",
                    text2: "The selection reflects a desire to offer comfort and inspiration.",
                    title3: "3 — The Uncertain Future",
                    text3: "As space continues to expand, questions remain about its ultimate fate."
                }
            });
        }, 1500);
    });
}

/**
 * 5. Start generating the final gift website
 * POST /sessions/{session_id}/generate
 */
export async function startGeneratingGift(sessionId) {
    // return fetchApi(`/sessions/${sessionId}/generate`, { method: 'POST' });
    console.log(`[API] startGeneratingGift`);
    return { status: "generating" };
}

/**
 * 6. Poll gift generation status
 * GET /sessions/{session_id}/gift
 */
export async function pollGiftStatus(sessionId) {
    // return fetchApi(`/sessions/${sessionId}/gift`, { method: 'GET' });
    console.log(`[API] pollGiftStatus`);
    return { status: "done", slug: "mock-gift-slug" };
}