import { generateAnalysisPlan } from './api.js';

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

            let analysisData = [];
            if (data && data.plan) {
                const titles = Object.keys(data.plan).filter(k => k.startsWith('title')).sort();
                titles.forEach(tKey => {
                    const num = tKey.replace('title', '');
                    if (data.plan[`text${num}`]) {
                        analysisData.push({ title: data.plan[tKey], text: data.plan[`text${num}`] });
                    }
                });
            } else if (Array.isArray(data)) {
                analysisData = data;
            }

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