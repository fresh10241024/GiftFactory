const BASE_URL = '/api';

async function fetchApi(endpoint, options = {}) {
    const config = {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    };
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `HTTP error ${response.status}`);
    }
    return response.json();
}

export async function createSession() {
    return fetchApi('/sessions', { method: 'POST' });
}

export async function sendChatMessage(sessionId, message) {
    return fetchApi(`/sessions/${sessionId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function uploadImage(sessionId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed: ${response.status}`);
    }
    return response.json();
}

export async function generateAnalysisPlan(sessionId) {
    return fetchApi(`/sessions/${sessionId}/plan`, { method: 'POST' });
}

export async function startGeneratingGift(sessionId) {
    return fetchApi(`/sessions/${sessionId}/generate`, { method: 'POST' });
}

export async function pollGiftStatus(sessionId) {
    return fetchApi(`/sessions/${sessionId}/gift`);
}
