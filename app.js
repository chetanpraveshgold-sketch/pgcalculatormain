const MAKING_RANGES = { Classic: { min: 0.09, max: 0.11 }, Antique: { min: 0.10, max: 0.13 }, Premium: { min: 0.13, max: 0.15 }, Italian: { min: 0.17, max: 0.19 } };
const COIN_WEIGHTS = [0.5, 1, 2, 5, 10, 20, 50];
const SILVER_WEIGHTS = [5, 10, 20, 50, 100];
const GST_RATE = 0.03;
const COIN_MAKING_RATE = 0.03;

window.calculatorApp = function calculatorApp() {
    return {
        status: 'INITIALIZING',
        data: null,
        errorMessage: '',
        selectedKarat: '22KT',
        weight: '',
        makingType: 'Classic',
        coinWeight: 1,
        silverWeight: 10,
        showMakingGuide: false,

        optHaptic() {
            // Haptic vibration (mobile)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(20); } catch (e) {}
            }
            
            // Standard, normal UI tab sound (very subtle tick)
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    if (!window.audioCtx) window.audioCtx = new AudioContext();
                    const ctx = window.audioCtx;
                    if (ctx.state === 'suspended') ctx.resume();
                    
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    
                    osc.type = 'triangle';
                    osc.frequency.value = 600; 
                    
                    // Extremely short, standard click envelope
                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
                    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.015);
                    
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.02);
                }
            } catch (e) {}
        },

        init() {
            this.fetchRates();
            
            this.$watch('weight', (value) => {
                if (!value) return;
                
                // 1. Remove any non-numeric/non-decimal characters
                let clean = value.replace(/[^0-9.]/g, '');
                
                // 2. Prevent multiple decimals (e.g. "1.2.3" -> "1.23")
                const parts = clean.split('.');
                if (parts.length > 2) {
                    clean = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // 3 & 4. Limit integer part to 3 digits (max 999), and decimal part to 3 digits
                if (clean.includes('.')) {
                    const [intPart, decPart] = clean.split('.');
                    clean = `${intPart.slice(0, 3)}.${decPart.slice(0, 3)}`;
                } else {
                    clean = clean.slice(0, 3);
                }
                
                // Update if changed
                if (value !== clean) {
                    this.weight = clean;
                }
            });
        },

        async fetchRates() {
            const CACHE_KEY = 'pg_rates_cache';
            const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
            
            this.errorMessage = '';
            
            // 1. Try Cache First
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.data && parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL)) {
                        this.data = parsed.data;
                        this.status = 'SUCCESS';
                        console.log('⚡ Loaded from Cache (Flash Fast)');
                        // Fetch in background to keep fresh without blocking UI
                        this.performLiveSync(CACHE_KEY).catch(() => {}); 
                        return;
                    }
                }
            } catch(e) {}

            // 2. No valid cache, show loading and fetch
            this.status = 'INITIALIZING';
            await this.performLiveSync(CACHE_KEY);
        },

        async performLiveSync(CACHE_KEY) {
            console.log('🚀 Sync Version: 2.3 - Production (Live Fetch)');

            const clean = (val) => {
                if (val === undefined || val === null) return 0;
                const n = parseFloat(val.toString().replace(/[^\d.]/g, ''));
                return isNaN(n) ? 0 : n;
            };

            try {
                const res = await fetch('/api/rates');
                if (!res.ok) throw new Error('API_OFFLINE');
                const body = await res.json();

                if (this.selectedKarat === 'SILVER' && (!body.rates || !body.rates.rate_silver)) {
                    throw new Error('SILVER_DATA_INCOMPLETE');
                }

                this.data = body;
                this.status = 'SUCCESS';
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: body, timestamp: Date.now() }));
                console.log('✅ Sync: API (Live)');
            } catch (err) {
                console.warn('⚠️ Sync Fallback:', err.message);
                try {
                    const GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbxwLcOb1AeVbLdnaZ0OG6tncb91K5wCuneNk06fq_dQnAxlF4AYsbrq53mIGcO3lk27/exec';
                    const res = await fetch(GOOGLE_URL, { redirect: 'follow' });
                    const raw = await res.json();

                    let silverRate = clean(raw.rate_silver || raw.sheet_time);
                    let dateVal = raw.sheet_date;

                    if (silverRate > 1000000 && clean(dateVal) < 10000) {
                        silverRate = clean(dateVal);
                        dateVal = new Date().toISOString();
                    }

                    this.data = {
                        date: dateVal || new Date().toISOString(),
                        rates: {
                            rate_22k: clean(raw.rate_22k),
                            rate_24k: clean(raw.rate_24k),
                            rate_18k: clean(raw.rate_18k),
                            rate_silver: silverRate
                        }
                    };
                    
                    this.status = 'SUCCESS';
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: this.data, timestamp: Date.now() }));
                    console.log('✅ Sync: Direct GSheet (Silver: ' + this.data.rates.rate_silver + ')');
                } catch (directErr) {
                    console.error('❌ Sync Failed:', directErr);
                    // Only show error if we don't already have cached data showing
                    if (this.status !== 'SUCCESS') {
                        this.errorMessage = "Sync Failed. Please check internet.";
                        this.status = 'ERROR';
                    }
                }
            }
        },

        formatCurrency(val) {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val));
        },

        jewelleryPriceString() {
            if (!this.data || !this.weight) return null;
            let val = String(this.weight).replace(/,/g, '.').trim();
            if (val === '.' || val === '-' || val === '') return null;
            const w = parseFloat(val);
            if (isNaN(w) || w <= 0) return null;
            const r = this.selectedKarat === '18KT' ? this.data.rates.rate_18k : this.data.rates.rate_22k;
            const making = MAKING_RANGES[this.makingType];
            const low = (r + (r * making.min)) * w * (1 + GST_RATE);
            const high = (r + (r * making.max)) * w * (1 + GST_RATE);
            return isNaN(low) ? '...' : this.formatCurrency(low) + ' – ' + this.formatCurrency(high);
        },

        coinPriceString() {
            if (!this.data || !this.data.rates.rate_24k) return '...';
            const b = this.coinWeight * this.data.rates.rate_24k;
            const f = (b + (b * COIN_MAKING_RATE)) * (1 + GST_RATE);
            return isNaN(f) ? '...' : this.formatCurrency(f);
        },

        silverPriceString() {
            const r = this.data?.rates?.rate_silver;
            if (!r) return '...';
            const b = this.silverWeight * r;
            const f = b * (1 + GST_RATE);
            return isNaN(f) ? '...' : this.formatCurrency(f);
        },

        getWhatsappUrl(message = '') {
            let price = '';
            let details = '';
            
            if (this.selectedKarat === '24KT') {
                price = this.coinPriceString();
                if (price === '...' || !price) return null;
                details = `Item: 24KT Gold Coin\nWeight: ${this.coinWeight}g`;
            } else if (this.selectedKarat === 'SILVER') {
                price = this.silverPriceString();
                if (price === '...' || !price) return null;
                details = `Item: Silver Coin\nWeight: ${this.silverWeight}g`;
            } else {
                price = this.jewelleryPriceString();
                if (price === '...' || !price) return null;
                details = `Karat: ${this.selectedKarat}\nWeight: ${this.weight}g\nMaking Type: ${this.makingType}`;
            }

            let text = message;
            return `https://wa.me/918291679495${text ? '?text=' + encodeURIComponent(text) : ''}`;
        },

        getFailureWhatsappUrl() {
            const text = "Hi Pravesh Gold Team,\n\nCalculator par live gold rate load nahi ho raha hai.\n\nPlease mujhe today’s gold rate aur jewellery quotation details share kijiye.";
            return `https://wa.me/918291679495?text=${encodeURIComponent(text)}`;
        }
    }
}

// Basic deterrent for casual inspection
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || 
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
       (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});
