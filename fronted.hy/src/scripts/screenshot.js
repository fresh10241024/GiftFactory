import html2canvas from 'html2canvas';
import { gsap } from 'gsap';

const TRANSLATIONS = {
    en: {
        'ss-title':       'Save this moment',
        'ss-subtitle':    'Keep it as a memory, share with a friend, or post it.',
        'ss-original':    'Original',
        'ss-original-sub':'Current size',
        'ss-34-sub':      'Portrait card',
        'ss-save':        'Save Image',
    },
    zh: {
        'ss-title':       '保存这一刻',
        'ss-subtitle':    '留作纪念，发给朋友，或分享到社交平台。',
        'ss-original':    '原始尺寸',
        'ss-original-sub':'当前比例',
        'ss-34-sub':      '竖版卡片',
        'ss-save':        '保存图片',
    },
};

function t(key) {
    const lang = localStorage.getItem('lang') || 'en';
    return TRANSLATIONS[lang]?.[key] ?? key;
}

export class ScreenshotFeature {
    constructor() {
        this.btn    = document.getElementById('screenshot-btn');
        this.panel  = document.getElementById('screenshot-panel');
        this.saveBtn = document.getElementById('save-image-btn');
        this.selectedSize = 'original';
        this.isOpen = false;

        if (!this.btn || !this.panel) return;

        this.applyTranslations();
        this.initEvents();
    }

    applyTranslations() {
        this.panel.querySelectorAll('[data-ss-i18n]').forEach(el => {
            el.textContent = t(el.dataset.ssI18n);
        });
    }

    initEvents() {
        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isOpen ? this.closePanel() : this.openPanel();
        });

        this.panel.querySelectorAll('.size-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this.panel.querySelectorAll('.size-option').forEach(o => o.classList.remove('is-active'));
                opt.classList.add('is-active');
                this.selectedSize = opt.dataset.size;
            });
        });

        this.saveBtn.addEventListener('click', () => this.capture());

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.panel.contains(e.target) && e.target !== this.btn) {
                this.closePanel();
            }
        });
    }

    openPanel() {
        this.applyTranslations();

        const rect = this.btn.getBoundingClientRect();
        this.panel.style.top   = (rect.bottom + 10) + 'px';
        this.panel.style.right = (window.innerWidth - rect.right) + 'px';
        this.panel.style.display = 'block';

        gsap.fromTo(this.panel,
            { scale: 0.75, opacity: 0, y: -8, transformOrigin: 'top right' },
            { scale: 1,    opacity: 1, y: 0,  duration: 0.38, ease: 'back.out(1.8)' }
        );

        this.isOpen = true;
    }

    closePanel() {
        if (!this.isOpen) return;
        this.isOpen = false;
        gsap.to(this.panel, {
            scale: 0.75, opacity: 0, y: -8,
            duration: 0.22, ease: 'power2.in',
            onComplete: () => { this.panel.style.display = 'none'; },
        });
    }

    async capture() {
        this.saveBtn.classList.add('is-loading');
        this.saveBtn.disabled = true;
        try {
            if (this.selectedSize === 'original') {
                await this.captureOriginal();
            } else {
                await this.capture34();
            }
        } finally {
            this.saveBtn.classList.remove('is-loading');
            this.saveBtn.disabled = false;
        }
    }

    async captureOriginal() {
        // Swap "Curate a gift" → "GiftFactory" as brand mark
        const curateBtn = document.getElementById('curate-btn');
        const originalText = curateBtn?.textContent;
        if (curateBtn) curateBtn.textContent = 'GiftFactory';

        // Keep header visible; only hide action controls
        const toHide = [
            this.btn,
            document.getElementById('upload-button'),
            document.querySelector('.finish-chat-wrapper'),
            document.querySelector('.uploaded-gallery'),
            this.panel,
        ].filter(Boolean);

        this.closePanel();
        toHide.forEach(el => { el.style.visibility = 'hidden'; });

        // Wait for panel close animation to finish before capturing
        await new Promise(r => setTimeout(r, 280));

        try {
            const canvas = await html2canvas(document.body, {
                scale: window.devicePixelRatio || 2,
                useCORS: true,
                backgroundColor: '#121212',
                logging: false,
            });
            this.download(canvas);
        } finally {
            toHide.forEach(el => { el.style.visibility = ''; });
            if (curateBtn && originalText !== undefined) curateBtn.textContent = originalText;
        }
    }

    async capture34() {
        const questionText = document.getElementById('current-question')?.textContent || '';
        const answerText   = document.getElementById('answer-input')?.value || '';

        const W = 750, H = 1000;

        const card = document.createElement('div');
        Object.assign(card.style, {
            position:      'fixed',
            top:           '-9999px',
            left:          '-9999px',
            width:         W + 'px',
            height:        H + 'px',
            background:    '#121212',
            display:       'flex',
            flexDirection: 'column',
            justifyContent:'center',
            alignItems:    'center',
            gap:           '48px',
            padding:       '80px 64px',
            boxSizing:     'border-box',
            overflow:      'hidden',
        });

        // Question — font scales down for longer text to stay within card
        const qFontSize = questionText.length > 80 ? '30px'
                        : questionText.length > 40 ? '38px'
                        : '48px';
        const q = document.createElement('h2');
        q.textContent = questionText;
        Object.assign(q.style, {
            color:      '#ffffff',
            fontFamily: 'Times, serif',
            fontSize:   qFontSize,
            lineHeight: '1.35',
            textAlign:  'center',
            margin:     '0',
            fontWeight: 'normal',
            width:      '100%',
            boxSizing:  'border-box',
            wordBreak:  'break-word',
            overflow:   'hidden',
        });

        // Answer bubble — mirror the live circle
        const bubbleSize = answerText ? '320px' : '140px';
        const bubble = document.createElement('div');
        Object.assign(bubble.style, {
            width:         bubbleSize,
            height:        bubbleSize,
            borderRadius:  '50%',
            background:    '#4D83FC',
            display:       'flex',
            justifyContent:'center',
            alignItems:    'center',
            padding:       '36px',
            boxSizing:     'border-box',
            flexShrink:    '0',
        });

        if (answerText) {
            const ans = document.createElement('p');
            ans.textContent = answerText;
            Object.assign(ans.style, {
                color:      '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontSize:   '17px',
                textAlign:  'center',
                lineHeight: '1.55',
                margin:     '0',
                wordBreak:  'break-word',
            });
            bubble.appendChild(ans);
        }

        // Brand watermark
        const brand = document.createElement('p');
        brand.textContent = 'GiftFactory';
        Object.assign(brand.style, {
            position:      'absolute',
            bottom:        '36px',
            color:         'rgba(255,255,255,0.25)',
            fontFamily:    'Arial, sans-serif',
            fontSize:      '13px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin:        '0',
        });

        card.appendChild(q);
        card.appendChild(bubble);
        card.appendChild(brand);
        document.body.appendChild(card);

        this.closePanel();
        await new Promise(r => setTimeout(r, 280));

        try {
            const canvas = await html2canvas(card, {
                width:           W,
                height:          H,
                scale:           2,
                useCORS:         true,
                backgroundColor: '#121212',
                logging:         false,
            });
            this.download(canvas);
        } finally {
            document.body.removeChild(card);
        }
    }

    download(canvas) {
        const link = document.createElement('a');
        link.download = 'giftfactory-moment.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}
