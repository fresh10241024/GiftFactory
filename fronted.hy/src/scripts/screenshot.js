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

        // Size card to viewport at 3:4 ratio
        const cardH = Math.min(window.innerHeight * 0.9, 900);
        const cardW = Math.round(cardH * 0.75);

        // Proportional type scale
        const qLen    = questionText.length;
        const qFontPx = qLen > 80 ? Math.round(cardW * 0.046)
                      : qLen > 40 ? Math.round(cardW * 0.060)
                      : Math.round(cardW * 0.075);
        const bubbleDiam = Math.round(cardW * 0.54);
        const ansFontPx  = Math.round(bubbleDiam * 0.073);
        const hPad       = Math.round(cardW * 0.057);
        const vPad       = Math.round(cardH * 0.038);

        // ── Card root ─────────────────────────────────────────────
        const card = document.createElement('div');
        Object.assign(card.style, {
            width:         cardW + 'px',
            height:        cardH + 'px',
            background:    '#121212',
            display:       'flex',
            flexDirection: 'column',
            boxSizing:     'border-box',
            overflow:      'hidden',
            flexShrink:    '0',
        });

        // ── Header (mirrors live page header) ────────────────────
        const hdr = document.createElement('div');
        Object.assign(hdr.style, {
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            padding:        `${vPad}px ${hPad}px 0`,
            flexShrink:     '0',
        });

        const brandEl = document.createElement('span');
        brandEl.textContent = 'GiftFactory';
        Object.assign(brandEl.style, {
            color:         'rgba(255,255,255,0.7)',
            fontFamily:    'Arial, sans-serif',
            fontSize:      '14px',
            letterSpacing: '0.01em',
        });

        const infoEl = document.createElement('div');
        Object.assign(infoEl.style, { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' });
        [['AI Generative Canvas', 'rgba(255,255,255,0.55)'],
         ['Engine Active',        'rgba(255,255,255,0.3)'],
         ['Digital Art Edition',  'rgba(255,255,255,0.3)'],
        ].forEach(([text, color]) => {
            const s = document.createElement('span');
            s.textContent = text;
            Object.assign(s.style, { color, fontFamily: 'Arial, sans-serif', fontSize: '11px' });
            infoEl.appendChild(s);
        });

        hdr.appendChild(brandEl);
        hdr.appendChild(infoEl);

        // ── Content (question + bubble, vertically centered) ──────
        const content = document.createElement('div');
        Object.assign(content.style, {
            flex:           '1',
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            alignItems:     'center',
            padding:        `16px ${Math.round(cardW * 0.085)}px`,
            gap:            `${Math.round(cardH * 0.048)}px`,
            boxSizing:      'border-box',
        });

        const q = document.createElement('h2');
        q.textContent = questionText;
        Object.assign(q.style, {
            color:      '#ffffff',
            fontFamily: 'Times, serif',
            fontSize:   qFontPx + 'px',
            lineHeight: '1.35',
            textAlign:  'center',
            margin:     '0',
            fontWeight: 'normal',
            width:      '100%',
            wordBreak:  'break-word',
            overflow:   'hidden',
        });

        const bubble = document.createElement('div');
        Object.assign(bubble.style, {
            width:          bubbleDiam + 'px',
            height:         bubbleDiam + 'px',
            borderRadius:   '50%',
            background:     '#4D83FC',
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
            padding:        '28px',
            boxSizing:      'border-box',
            flexShrink:     '0',
        });

        if (answerText) {
            const ans = document.createElement('p');
            ans.textContent = answerText;
            Object.assign(ans.style, {
                color:      '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontSize:   ansFontPx + 'px',
                textAlign:  'center',
                lineHeight: '1.55',
                margin:     '0',
                wordBreak:  'break-word',
                overflow:   'hidden',
            });
            bubble.appendChild(ans);
        }

        content.appendChild(q);
        content.appendChild(bubble);

        // ── Watermark ─────────────────────────────────────────────
        const wm = document.createElement('p');
        wm.textContent = 'GIFTFACTORY';
        Object.assign(wm.style, {
            color:         'rgba(255,255,255,0.2)',
            fontFamily:    'Arial, sans-serif',
            fontSize:      '10px',
            letterSpacing: '0.14em',
            margin:        '0',
            padding:       `0 0 ${Math.round(cardH * 0.033)}px`,
            textAlign:     'center',
            flexShrink:    '0',
        });

        card.appendChild(hdr);
        card.appendChild(content);
        card.appendChild(wm);

        // ── On-screen overlay (fonts load correctly when visible) ─
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position:       'fixed',
            top:            '0', left: '0',
            width:          '100%', height: '100%',
            background:     'rgba(0,0,0,0.85)',
            zIndex:         '9999',
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
        });
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        this.closePanel();

        // Two RAF cycles ensure the browser paints before capture
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 80));

        try {
            const canvas = await html2canvas(card, {
                scale:           2,
                useCORS:         true,
                backgroundColor: '#121212',
                logging:         false,
            });
            this.download(canvas);
        } finally {
            document.body.removeChild(overlay);
        }
    }

    download(canvas) {
        const link = document.createElement('a');
        link.download = 'giftfactory-moment.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}
