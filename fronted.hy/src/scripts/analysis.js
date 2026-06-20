import { generateAnalysisPlan, getPlanStatus } from './api.js';

export class AnalysisController {
    constructor() {
        this.contentContainer = document.getElementById('analysis-content');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.actionFooter = document.getElementById('action-footer');
        this.revealBtn = document.getElementById('reveal-gift-btn');
        
        this.sessionId = localStorage.getItem('chat_session_id') || 'temp_session_id';

        this.init();
    }

    async init() {
        // Event listeners
        this.revealBtn.addEventListener('click', () => {
            // Next page goes here (e.g. gift.html)
            window.location.href = './gift.html';
        });

        try {
            const data = await generateAnalysisPlan(this.sessionId, {
                onRetry: (attempt, total, msg) => {
                    this.loadingIndicator.textContent = `Retrying... (${attempt}/${total}) — ${msg}`;
                }
            });

            if (data.status === 'not_ready') {
                this.loadingIndicator.innerHTML = 'Please complete the chat conversation first.<br><br><a href="./chat.html" style="color:rgba(255,255,255,0.7);font-size:0.9rem">← Back to chat</a>';
                return;
            }

            // If processing, poll for completion
            let plan = data.plan;
            if (data.status === 'processing') {
                plan = await this.pollPlan();
                if (!plan) return; // error already shown
            }

            const analysisData = this.parsePlan(plan);
            if (analysisData.length === 0) {
                this.loadingIndicator.textContent = 'Analysis returned empty, please go back and try again.';
                return;
            }
            this.loadingIndicator.style.display = 'none';
            this.renderAnalysis(analysisData);
        } catch (error) {
            console.error("Failed to load analysis", error);
            this.loadingIndicator.innerHTML = `Generation failed: ${error.message}<br><br><a href="./chat.html" style="color:rgba(255,255,255,0.6);font-size:0.85rem">← Go back</a>`;
        }
    }

    parsePlan(plan) {
        if (!plan) return [];
        return Object.keys(plan).filter(k => k.startsWith('title')).sort().reduce((arr, tKey) => {
            const num = tKey.replace('title', '');
            if (plan[`text${num}`]) arr.push({ title: plan[tKey], text: plan[`text${num}`] });
            return arr;
        }, []);
    }

    async pollPlan() {
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            this.loadingIndicator.textContent = `Analyzing${'.'.repeat((i % 3) + 1)}  (${(i + 1) * 2}s)`;
            try {
                const res = await getPlanStatus(this.sessionId);
                if (res.status === 'done') return res.plan;
                if (res.status === 'error') {
                    this.loadingIndicator.innerHTML = `Analysis failed: ${res.detail}<br><br><a href="./chat.html" style="color:rgba(255,255,255,0.6);font-size:0.85rem">← Go back</a>`;
                    return null;
                }
            } catch (e) { console.warn('poll plan error', e); }
        }
        this.loadingIndicator.innerHTML = 'Timed out, please try again.<br><br><a href="./chat.html" style="color:rgba(255,255,255,0.6)">← Go back</a>';
        return null;
    }

    renderAnalysis(data) {
        data.forEach((section, index) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'analysis-section';
            
            const titleEl = document.createElement('h3');
            titleEl.textContent = section.title;
            
            const textEl = document.createElement('p');
            textEl.textContent = section.text;

            sectionEl.appendChild(titleEl);
            sectionEl.appendChild(textEl);
            this.contentContainer.appendChild(sectionEl);

            // Staggered animation
            setTimeout(() => {
                sectionEl.classList.add('visible');
                
                // Show footer after the last item is visible
                if (index === data.length - 1) {
                    setTimeout(() => {
                        this.actionFooter.style.opacity = '1';
                        this.actionFooter.style.pointerEvents = 'auto';
                    }, 800);
                }
            }, index * 1200 + 100); // 1.2s delay between each paragraph
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnalysisController();
});