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

        optHaptic() {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(50); } catch (e) {}
            }
        },

        init() { this.fetchRates(); },

        async fetchRates() {
            this.status = 'INITIALIZING';
            this.errorMessage = '';
            console.log('🚀 Sync Version: 2.3 - Production');

            const clean = (val) => {
                if (val === undefined || val === null) return 0;
                const n = parseFloat(val.toString().replace(/[^\d.]/g, ''));
                return isNaN(n) ? 0 : n;
            };

            try {
                const res = await fetch('/api/rates');
                if (!res.ok) throw new Error('API_OFFLINE');
                const body = await res.json();

                // If silver rate is missing, force direct fallback
                if (this.selectedKarat === 'SILVER' && (!body.rates || !body.rates.rate_silver)) {
                    throw new Error('SILVER_DATA_INCOMPLETE');
                }

                this.data = body;
                this.status = 'SUCCESS';
                console.log('✅ Sync: API (Live)');
            } catch (err) {
                console.warn('⚠️ Sync Fallback:', err.message);
                try {
                    const GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbxwLcOb1AeVbLdnaZ0OG6tncb91K5wCuneNk06fq_dQnAxlF4AYsbrq53mIGcO3lk27/exec';
                    const res = await fetch(GOOGLE_URL, { redirect: 'follow' });
                    const raw = await res.json();

                    // Smart Sync: Detect which cell is the price and which is the date
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
                    console.log('✅ Sync: Direct GSheet (Silver: ' + this.data.rates.rate_silver + ')');
                } catch (directErr) {
                    console.error('❌ Sync Failed:', directErr);
                    this.errorMessage = "Sync Failed. Please check internet.";
                    this.status = 'ERROR';
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

        getWhatsappUrl() {
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

            const text = `Hello Pravesh Gold!\nI used your online calculator and would like to inquire about the following:\n\n${details}\nEstimated Price: ${price}\n\nCan you please assist me further?`;
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
