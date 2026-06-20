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

async function fetchWithRetry(endpoint, options = {}, { retries = 3, delayMs = 1500, onRetry } = {}) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchApi(endpoint, options);
        } catch (err) {
            lastErr = err;
            console.warn(`[retry ${i + 1}/${retries}] ${endpoint} — ${err.message}`);
            if (onRetry) onRetry(i + 1, retries, err.message);
            if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        }
    }
    throw lastErr;
}

export async function createSession() {
    const token = localStorage.getItem('token');
    return fetchApi('/sessions', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
}

export async function getMySessions() {
    const token = localStorage.getItem('token');
    return fetchApi('/sessions/my', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function deleteSession(sessionId) {
    const token = localStorage.getItem('token');
    return fetchApi(`/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendChatMessage(sessionId, message) {
    return fetchWithRetry(`/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ message }),
    }, { retries: 2, delayMs: 1000 });
}

export async function uploadImage(sessionId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/upload`, {
        method: 'POST',
        headers: authHeader(),
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed: ${response.status}`);
    }
    return response.json();
}

export async function generateAnalysisPlan(sessionId, { onRetry } = {}) {
    return fetchWithRetry(`/sessions/${sessionId}/plan`, { method: 'POST', headers: authHeader() }, { retries: 3, delayMs: 2000, onRetry });
}

export async function startGeneratingGift(sessionId) {
    return fetchWithRetry(`/sessions/${sessionId}/generate`, { method: 'POST', headers: authHeader() }, { retries: 2, delayMs: 1500 });
}

export async function pollGiftStatus(sessionId) {
    return fetchWithRetry(`/sessions/${sessionId}/gift`, { headers: authHeader() }, { retries: 2, delayMs: 1000 });
}
