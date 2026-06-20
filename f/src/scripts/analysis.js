export class AnalysisController {
    constructor() {
        this.contentContainer = document.getElementById('analysis-content');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.actionFooter = document.getElementById('action-footer');
        this.revealBtn = document.getElementById('reveal-gift-btn');

        this.init();
    }

    async init() {
        // Event listeners
        this.revealBtn.addEventListener('click', () => {
            // Next page goes here (e.g. gift.html)
            window.location.href = './gift.html';
        });

        try {
            // ⭐ 预留调用后端接口获取 AI 分析数据 ⭐
            const analysisData = await this.mockFetchAnalysisData();
            
            this.loadingIndicator.style.display = 'none';
            this.renderAnalysis(analysisData);
        } catch (error) {
            console.error("Failed to load analysis", error);
            this.loadingIndicator.textContent = "Failed to generate analysis.";
        }
    }

    mockFetchAnalysisData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        title: "1 — The Essence of the Gift",
                        text: "Based on your responses, this gift embodies a profound appreciation for their creative spirit. It speaks to a shared memory of quiet afternoons and vibrant conversations."
                    },
                    {
                        title: "2 — Emotional Resonance",
                        text: "The selection reflects a desire to offer comfort and inspiration, a gentle reminder of the bond that ties you together through the passage of time."
                    },
                    {
                        title: "3 — The Uncertain Future of Space",
                        text: "As space continues to expand, questions remain about its ultimate fate, whether it will stretch forever into darkness or transform in ways we have yet to understand. Much like this journey, your relationship continues to evolve."
                    }
                ]);
            }, 1500); // 1.5 seconds mock loading time
        });
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