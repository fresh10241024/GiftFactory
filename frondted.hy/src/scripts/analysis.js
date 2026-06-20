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
            const data = await generateAnalysisPlan(this.sessionId);
            
            // Format data into an array if backend returns a dict
            let analysisData = [];
            if (data && data.plan) {
                // If it's a dict like { title1: "...", text1: "..." }
                // Convert to array of objects
                const planKeys = Object.keys(data.plan);
                const titles = planKeys.filter(k => k.startsWith('title')).sort();
                
                titles.forEach(tKey => {
                    const num = tKey.replace('title', '');
                    const textKey = `text${num}`;
                    if (data.plan[textKey]) {
                        analysisData.push({
                            title: data.plan[tKey],
                            text: data.plan[textKey]
                        });
                    }
                });
            } else if (Array.isArray(data)) {
                analysisData = data;
            } else {
                // Fallback mock
                analysisData = [
                    { title: "Analysis", text: "Generated successfully." }
                ];
            }
            
            this.loadingIndicator.style.display = 'none';
            this.renderAnalysis(analysisData);
        } catch (error) {
            console.error("Failed to load analysis", error);
            this.loadingIndicator.textContent = "Failed to generate analysis.";
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