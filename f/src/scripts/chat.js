export class ChatInteraction {
    constructor() {
        this.answerBtn = document.getElementById('answer-button');
        this.input = document.getElementById('answer-input');
        this.buttonText = this.answerBtn.querySelector('.button-text');
        this.measure = this.answerBtn.querySelector('.input-measure');
        this.questionEl = document.getElementById('current-question');
        
        // Upload Elements
        this.uploadBtn = document.getElementById('upload-button');
        this.fileInput = document.getElementById('image-upload-input');
        
        // Finish Button
        this.finishBtn = document.getElementById('finish-chat-button');

        this.initEvents();
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
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
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
        
        try {
            // ⭐ 预留的图片上传后端接口调用位置 ⭐
            await this.mockUploadApiCall(file);
            
            // 成功后恢复
            this.uploadBtn.style.opacity = '1';
            this.uploadBtn.style.pointerEvents = 'auto';
            this.fileInput.value = ''; // Reset input
            
            // 可选：上传完成后也可以切换问题或给出提示
            console.log("图片上传成功");

        } catch (error) {
            console.error("Upload API Error", error);
            this.uploadBtn.style.opacity = '1';
            this.uploadBtn.style.pointerEvents = 'auto';
            this.fileInput.value = '';
        }
    }

    mockUploadApiCall(file) {
        return new Promise((resolve) => {
            // 模拟 1秒 的上传网络请求
            setTimeout(() => {
                console.log("前端向后端上传了图片:", file.name, file.type, file.size);
                resolve({ success: true, url: "/mock-url/" + file.name });
            }, 1000);
        });
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
    }

    adjustSize() {
        const text = this.input.value || '|';
        this.measure.textContent = text;
        
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

        // Mock API Call
        try {
            await this.mockApiCall(answer);
            
            // Move to next step or clear
            this.input.disabled = false;
            this.answerBtn.style.opacity = '1';
            this.deactivateInput();
            
            // Example of changing question
            this.questionEl.style.opacity = 0;
            setTimeout(() => {
                this.questionEl.textContent = "What occasion is this gift for?";
                this.questionEl.style.opacity = 1;
            }, 300);

        } catch (error) {
            console.error("API Error", error);
            this.input.disabled = false;
            this.answerBtn.style.opacity = '1';
        }
    }

    mockApiCall(answer) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("Submitted answer:", answer);
                resolve({ success: true });
            }, 800);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatInteraction();
});
