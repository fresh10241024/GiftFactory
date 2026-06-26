import { sendChatMessage, uploadImage, createSession, getMySessions } from './api.js';

export class ChatInteraction {
    constructor() {
        this.answerBtn = document.getElementById('answer-button');
        this.input = document.getElementById('answer-input');
        this.buttonText = this.answerBtn.querySelector('.button-text');
        this.measure = this.answerBtn.querySelector('.input-measure');
        this.questionEl = document.getElementById('current-question');
        this.enterHint = document.getElementById('enter-hint');
        
        // Upload Elements
        this.uploadBtn = document.getElementById('upload-button');
        this.fileInput = document.getElementById('image-upload-input');
        this.gallery = document.getElementById('uploaded-gallery');
        
        // Finish Button
        this.finishBtn = document.getElementById('finish-chat-button');
        
        this.sessionId = null;
        this.allSessions = [];

        this.initSession();
        this.initEvents();
        this.initPanel();
    }

    async initSession() {
        // URL param takes priority (from dashboard "Continue" link)
        const urlSession = new URLSearchParams(window.location.search).get('session');
        if (urlSession) {
            this.sessionId = urlSession;
            localStorage.setItem('chat_session_id', urlSession);
        }

        // Already have a session → keep using it
        const existing = localStorage.getItem('chat_session_id');
        if (existing) {
            this.sessionId = existing;
            if (localStorage.getItem('token')) {
                try {
                    const data = await getMySessions();
                    this.allSessions = data.sessions || [];
                    // If this session is already done, go to gift page
                    const thisSession = this.allSessions.find(s => s.id === existing);
                    if (thisSession && thisSession.status === 'done') {
                        window.location.href = './gift.html';
                        return;
                    }
                    this.renderPanel();
                } catch (_) {}
            }
            return;
        }

        // No session yet → decide whether to create new or load latest
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const data = await getMySessions();
                this.allSessions = data.sessions || [];
                if (this.allSessions.length >= 5) {
                    // Full: enter the latest one
                    this.sessionId = this.allSessions[0].id;
                } else {
                    // Not full: create new
                    const res = await createSession();
                    this.sessionId = res.session_id;
                    this.allSessions.unshift({ id: this.sessionId, status: 'chatting', recipient: '', occasion: '' });
                }
                localStorage.setItem('chat_session_id', this.sessionId);
                this.renderPanel();
                return;
            } catch (err) {
                console.error("Session init failed:", err);
                // Fallback: create new directly
            }
        }

        // Not logged in: create anonymous session
        try {
            const res = await createSession();
            this.sessionId = res.session_id;
            localStorage.setItem('chat_session_id', this.sessionId);
        } catch (err) {
            console.error("Anonymous session creation failed:", err);
            this.questionEl.textContent = 'Failed to start session, please refresh and try again.';
            this.answerBtn.style.display = 'none';
        }
    }

    initPanel() {
        document.getElementById('curate-btn')?.addEventListener('click', () => {
            document.getElementById('session-panel').style.display = 'block';
            this.renderPanel();
        });
        document.getElementById('close-panel')?.addEventListener('click', () => {
            document.getElementById('session-panel').style.display = 'none';
        });
        document.getElementById('panel-new-btn')?.addEventListener('click', async () => {
            if (this.allSessions.length >= 5) {
                alert('Reached the limit of 5 gifts, please delete one first.');
                return;
            }
            try {
                const res = await createSession();
                this.sessionId = res.session_id;
                localStorage.setItem('chat_session_id', this.sessionId);
                this.allSessions.unshift({ id: this.sessionId, status: 'chatting', recipient: '', occasion: '' });
                this.questionEl.textContent = 'Who do you want to customize this gift for?';
                document.getElementById('session-panel').style.display = 'none';
                this.renderPanel();
            } catch (err) {
                alert('Creation failed: ' + err.message);
            }
        });
    }

    renderPanel() {
        const list = document.getElementById('panel-session-list');
        if (!list) return;
        list.innerHTML = '';
        this.allSessions.forEach(s => {
            const btn = document.createElement('button');
            const isActive = s.id === this.sessionId;
            btn.style.cssText = `width:100%;padding:12px;text-align:left;background:${isActive ? 'rgba(255,255,255,0.12)' : 'transparent'};border:1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'transparent'};color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem`;
            btn.innerHTML = `<div style="font-weight:500">${s.recipient ? 'To ' + s.recipient : 'New Gift'}</div><div style="opacity:0.4;font-size:0.75rem;margin-top:2px">${s.status === 'done' ? 'Completed' : 'In Progress'}</div>`;
            btn.addEventListener('click', () => {
                this.sessionId = s.id;
                localStorage.setItem('chat_session_id', s.id);
                this.questionEl.textContent = '...';
                document.getElementById('session-panel').style.display = 'none';
                this.renderPanel();
            });
            list.appendChild(btn);
        });
        // Hide new button if full
        const newBtn = document.getElementById('panel-new-btn');
        if (newBtn) newBtn.style.display = this.allSessions.length >= 5 ? 'none' : 'block';
    }

    initEvents() {
        this.answerBtn.addEventListener('click', () => {
            if (!this.answerBtn.classList.contains('is-active')) {
                this.activateInput();
            }
        });

        this.input.addEventListener('input', () => {
            this.adjustSize();
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAnswer();
            }
        });

        // Close on blur if empty
        this.input.addEventListener('blur', () => {
            if (this.input.value.trim() === '') {
                this.deactivateInput();
            }
        });

        // Upload functionality
        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                files.forEach(file => this.handleFileUpload(file));
            }
        });

        // Navigate to analysis page
        this.finishBtn.addEventListener('click', () => {
            window.location.href = './analysis.html';
        });
    }

    async handleFileUpload(file) {
        // Visual feedback
        this.uploadBtn.style.opacity = '0.5';
        this.uploadBtn.style.pointerEvents = 'none';
        
        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        const card = document.createElement('div');
        card.className = 'uploaded-image-card';
        
        const img = document.createElement('img');
        img.src = objectUrl;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-image-btn';
        deleteBtn.innerHTML = '✕';
        deleteBtn.onclick = () => {
            card.remove();
            URL.revokeObjectURL(objectUrl);
        };
        
        card.appendChild(img);
        card.appendChild(deleteBtn);
        this.gallery.appendChild(card);
        
        try {
            await uploadImage(this.sessionId, file);
            
            // Restore after success
            this.uploadBtn.style.opacity = '1';
            this.uploadBtn.style.pointerEvents = 'auto';
            this.fileInput.value = ''; // Reset input
            
            console.log("Image uploaded successfully");

        } catch (error) {
            console.error("Upload failed:", error.message);
            this.uploadBtn.style.opacity = '1';
            this.uploadBtn.style.pointerEvents = 'auto';
            this.fileInput.value = '';
            card.remove();
            alert(`Image upload failed: ${error.message}`);
        }
    }

    activateInput() {
        this.answerBtn.classList.add('is-active');
        this.input.style.display = 'block';
        this.input.focus();
        this.adjustSize();
    }

    deactivateInput() {
        this.answerBtn.classList.remove('is-active');
        this.input.style.display = 'none';
        this.input.value = '';
        this.answerBtn.style.width = '';
        this.answerBtn.style.height = '';
        this.input.style.fontSize = '';
        this.enterHint.classList.remove('is-visible');
    }

    adjustSize() {
        const text = this.input.value;
        const textToMeasure = text || '|';
        this.measure.textContent = textToMeasure;
        
        // Show enter hint if there is text
        if (text.trim().length > 0) {
            this.enterHint.classList.add('is-visible');
        } else {
            this.enterHint.classList.remove('is-visible');
        }
        
        // Base sizes
        const minSize = 200;
        const padding = 60;
        
        // Calculate needed width based on text
        const textWidth = this.measure.offsetWidth;
        let newSize = Math.max(minSize, textWidth + padding);
        
        // If text is very long, cap the size and reduce font size
        const maxSize = 400;
        let fontSize = 24;
        
        if (newSize > maxSize) {
            newSize = maxSize;
            // Roughly calculate new font size
            const ratio = (maxSize - padding) / textWidth;
            fontSize = Math.max(14, Math.floor(24 * ratio));
        }

        this.answerBtn.style.width = `${newSize}px`;
        this.answerBtn.style.height = `${newSize}px`;
        this.input.style.fontSize = `${fontSize}px`;
        this.measure.style.fontSize = `${fontSize}px`;
    }

    async submitAnswer() {
        const answer = this.input.value.trim();
        if (!answer) return;

        // Visual feedback for submission (optional)
        this.input.disabled = true;
        this.answerBtn.style.opacity = '0.7';

        try {
            const res = await sendChatMessage(this.sessionId, answer);
            
            // Move to next step or clear
            this.input.disabled = false;
            this.answerBtn.style.opacity = '1';
            this.deactivateInput();
            
            // Example of changing question based on AI reply
            if (res && res.reply) {
                this.questionEl.style.opacity = 0;
                setTimeout(() => {
                    this.questionEl.textContent = res.reply;
                    this.questionEl.style.opacity = 1;
                }, 300);
            }

            if (res && res.ready) {
                setTimeout(() => {
                    window.location.href = './analysis.html';
                }, 1200);
            }

        } catch (error) {
            console.error("API Error", error);
            this.input.disabled = false;
            this.answerBtn.style.opacity = '1';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatInteraction();
});
