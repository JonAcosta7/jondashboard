// API Module for External Data Fetching
class APIManager {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
    }

    // VIX Data Fetching
    async fetchVIXData() {
        try {
            console.log('Attempting to fetch VIX data...');
            
            let response;
            try {
                const proxyUrl = this.corsProxy + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX');
                response = await fetch(proxyUrl);
                console.log('Using CORS proxy for VIX data');
            } catch (proxyError) {
                console.log('CORS proxy failed, trying direct access...');
                response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const currentPrice = data.chart.result[0].meta.regularMarketPrice;
                console.log('Real VIX data retrieved:', currentPrice);
                return {
                    level: currentPrice.toFixed(2),
                    lastUpdate: new Date().toLocaleTimeString(),
                    isReal: true
                };
            }
            
            throw new Error('Invalid VIX data structure');
            
        } catch (error) {
            console.error('Error fetching real VIX data:', error);
            return this.getSimulatedVIX();
        }
    }

    getSimulatedVIX() {
        const baseVIX = 18;
        const volatility = (Math.random() - 0.5) * 10;
        const simulatedLevel = Math.max(12, Math.min(35, baseVIX + volatility));
        
        return {
            level: simulatedLevel.toFixed(2),
            lastUpdate: new Date().toLocaleTimeString(),
            isReal: false
        };
    }

    // Market Trend Analysis
    async fetchTickerData(symbol) {
        try {
            console.log(`Analyzing ${symbol}...`);
            
            let response;
            try {
                const proxyUrl = this.corsProxy + encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`);
                response = await fetch(proxyUrl);
                console.log(`Using CORS proxy for ${symbol} data`);
            } catch (proxyError) {
                console.log(`CORS proxy failed for ${symbol}, trying direct access...`);
                response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0]) {
                const result = data.chart.result[0];
                
                if (!result.indicators || !result.indicators.quote || !result.indicators.quote[0]) {
                    throw new Error('Missing quote data in API response');
                }
                
                const prices = result.indicators.quote[0].close.filter(price => price !== null);
                const timestamps = result.timestamp;
                
                if (prices.length < 10) {
                    throw new Error(`Insufficient price data: only ${prices.length} data points`);
                }
                
                const trend = this.calculateTrend(prices);
                const currentPrice = prices[prices.length - 1];
                
                return {
                    symbol: symbol,
                    trend: trend,
                    currentPrice: currentPrice,
                    chartData: {
                        prices: prices.slice(-10),
                        dates: timestamps.slice(-10).map(t => new Date(t * 1000))
                    },
                    isReal: true
                };
            } else {
                throw new Error('Invalid data structure from API');
            }
        } catch (error) {
            console.error(`Error analyzing ${symbol}:`, error);
            return this.getSimulatedTicker(symbol);
        }
    }

    calculateTrend(prices) {
        if (!prices || prices.length < 10) {
            return { direction: 'Unknown', strength: 'Unknown', change: '0.00' };
        }
        
        const recent = prices.slice(-5);
        const older = prices.slice(-10, -5);
        
        if (recent.length === 0 || older.length === 0) {
            return { direction: 'Unknown', strength: 'Unknown', change: '0.00' };
        }
        
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;
        
        if (olderAvg === 0) {
            return { direction: 'Unknown', strength: 'Unknown', change: '0.00' };
        }
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        let direction, strength;
        
        if (Math.abs(change) < 1) {
            direction = 'Sideways';
            strength = 'Weak';
        } else if (change > 0) {
            direction = 'Up';
            strength = change > 3 ? 'Strong' : change > 1.5 ? 'Moderate' : 'Weak';
        } else {
            direction = 'Down';
            strength = change < -3 ? 'Strong' : change < -1.5 ? 'Moderate' : 'Weak';
        }
        
        return { direction, strength, change: change.toFixed(2) };
    }

    getSimulatedTicker(symbol) {
        const trends = ['Up', 'Down', 'Sideways'];
        const strengths = ['Weak', 'Moderate', 'Strong'];
        
        const trend = {
            direction: trends[Math.floor(Math.random() * trends.length)],
            strength: strengths[Math.floor(Math.random() * strengths.length)],
            change: ((Math.random() - 0.5) * 6).toFixed(2)
        };
        
        return {
            symbol: symbol,
            trend: trend,
            currentPrice: symbol === 'SPY' ? 570 : 480,
            chartData: {
                prices: Array.from({length: 10}, () => Math.random() * 100 + 500),
                dates: Array.from({length: 10}, (_, i) => new Date(Date.now() - (9-i) * 24 * 60 * 60 * 1000))
            },
            isReal: false
        };
    }

    // Economic Calendar (Static/Simulated)
    generateEconomicCalendar() {
        const now = new Date();
        const events = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayEvents = this.getEventsForDate(date);
            events.push(...dayEvents);
        }
        
        return {
            events: events.sort((a, b) => a.date - b.date),
            lastUpdate: new Date().toLocaleTimeString()
        };
    }

    getEventsForDate(date) {
        const events = [];
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();
        
        const majorEvents = [
            { name: 'FOMC Meeting', impact: 'HIGH', probability: 0.15, description: 'Federal Reserve interest rate decision' },
            { name: 'Non-Farm Payrolls', impact: 'HIGH', probability: dayOfWeek === 5 && dayOfMonth <= 7 ? 0.9 : 0, description: 'Monthly jobs report' },
            { name: 'CPI Report', impact: 'HIGH', probability: dayOfWeek === 3 && dayOfMonth >= 10 && dayOfMonth <= 15 ? 0.8 : 0, description: 'Consumer Price Index' },
            { name: 'PPI Report', impact: 'MEDIUM', probability: dayOfWeek === 2 && dayOfMonth >= 8 && dayOfMonth <= 14 ? 0.7 : 0, description: 'Producer Price Index' },
            { name: 'Retail Sales', impact: 'MEDIUM', probability: dayOfWeek === 4 && dayOfMonth >= 12 && dayOfMonth <= 18 ? 0.6 : 0, description: 'Monthly retail sales data' },
            { name: 'Initial Jobless Claims', impact: 'LOW', probability: dayOfWeek === 4 ? 0.9 : 0, description: 'Weekly unemployment claims' },
            { name: 'GDP Report', impact: 'HIGH', probability: (dayOfMonth >= 25 || dayOfMonth <= 5) && dayOfWeek === 4 ? 0.3 : 0, description: 'Quarterly GDP data' },
            { name: 'Major Earnings', impact: 'MEDIUM', probability: this.isEarningsSeason(date) ? 0.6 : 0, description: 'S&P 500 company earnings' }
        ];
        
        majorEvents.forEach(event => {
            if (Math.random() < event.probability) {
                events.push({
                    date: date,
                    name: event.name,
                    impact: event.impact,
                    description: event.description,
                    time: this.getEventTime(event.name)
                });
            }
        });
        
        return events;
    }

    isEarningsSeason(date) {
        const month = date.getMonth();
        return [0, 1, 3, 4, 6, 7, 9, 10].includes(month);
    }

    getEventTime(eventName) {
        const times = {
            'FOMC Meeting': '2:00 PM ET',
            'Non-Farm Payrolls': '8:30 AM ET',
            'CPI Report': '8:30 AM ET',
            'PPI Report': '8:30 AM ET',
            'Retail Sales': '8:30 AM ET',
            'Initial Jobless Claims': '8:30 AM ET',
            'GDP Report': '8:30 AM ET',
            'Major Earnings': 'After Market Close'
        };
        return times[eventName] || '8:30 AM ET';
    }
}

// Export for use in main app
window.APIManager = APIManager;
