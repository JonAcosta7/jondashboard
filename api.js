// API Module for External Data Fetching
class APIManager {
    constructor() {
        this.apiKey = null; // Will be set via configuration
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.requestCount = 0;
        this.requestWindow = 60000; // 1 minute
        this.maxRequestsPerWindow = 50; // Conservative limit (under 60)
        this.requestTimestamps = [];
    }

    // Set API key for Finnhub
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // Check if API key is configured
    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }

    // Rate limiting protection
    canMakeRequest() {
        const now = Date.now();
        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < this.requestWindow);
        return this.requestTimestamps.length < this.maxRequestsPerWindow;
    }

    // Record a new request
    recordRequest() {
        this.requestTimestamps.push(Date.now());
    }

    // Safe fetch with rate limiting
    async safeFetch(url) {
        if (!this.canMakeRequest()) {
            console.warn('Rate limit approaching, delaying request');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
        
        this.recordRequest();
        return fetch(url);
    }

    // VIX Data Fetching from Finnhub
    async fetchVIXData() {
        try {
            if (!this.isConfigured()) {
                return {
                    level: 'API Key Required',
                    lastUpdate: 'Not configured',
                    isReal: false,
                    error: true,
                    needsApiKey: true
                };
            }

            console.log('Fetching VIX data from Finnhub...');
            
            const response = await this.safeFetch(
                `${this.baseUrl}/quote?symbol=VIX&token=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.c !== undefined) {
                console.log('Real VIX data retrieved from Finnhub:', data.c);
                return {
                    level: data.c.toFixed(2),
                    lastUpdate: new Date().toLocaleTimeString(),
                    isReal: true,
                    change: data.d,
                    changePercent: data.dp
                };
            }
            
            throw new Error('Invalid VIX data structure from Finnhub');
            
        } catch (error) {
            console.error('Error fetching VIX data from Finnhub:', error);
            return {
                level: 'Data Unavailable',
                lastUpdate: 'Failed to connect',
                isReal: false,
                error: true
            };
        }
    }

    // Market Trend Analysis from Finnhub
    async fetchTickerData(symbol) {
        try {
            if (!this.isConfigured()) {
                return {
                    symbol: symbol,
                    trend: { direction: 'API Key Required', strength: 'Not configured', change: '0.00' },
                    currentPrice: 'API Key Required',
                    chartData: { symbol: symbol, prices: [], dates: [] },
                    isReal: false,
                    error: true,
                    needsApiKey: true
                };
            }

            console.log(`Fetching ${symbol} data from Finnhub...`);
            
            // Get current quote
            const quoteResponse = await this.safeFetch(
                `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
            );
            
            if (!quoteResponse.ok) {
                throw new Error(`HTTP error fetching quote! status: ${quoteResponse.status}`);
            }
            
            const quote = await quoteResponse.json();
            
            // Get historical data (30 days)
            const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
            const now = Math.floor(Date.now() / 1000);
            
            const historyResponse = await this.safeFetch(
                `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=D&from=${thirtyDaysAgo}&to=${now}&token=${this.apiKey}`
            );
            
            if (!historyResponse.ok) {
                throw new Error(`HTTP error fetching history! status: ${historyResponse.status}`);
            }
            
            const history = await historyResponse.json();
            
            if (quote.c !== undefined && history.c && history.c.length >= 10) {
                const prices = history.c; // closing prices
                const timestamps = history.t; // timestamps
                const trend = this.calculateTrend(prices);
                
                console.log(`Real ${symbol} data retrieved from Finnhub`);
                
                return {
                    symbol: symbol,
                    trend: trend,
                    currentPrice: quote.c,
                    chartData: {
                        symbol: symbol,
                        prices: prices.slice(-10),
                        dates: timestamps.slice(-10).map(t => new Date(t * 1000))
                    },
                    isReal: true
                };
            } else {
                throw new Error(`Insufficient data for ${symbol} from Finnhub`);
            }
        } catch (error) {
            console.error(`Error fetching ${symbol} data from Finnhub:`, error);
            return {
                symbol: symbol,
                trend: { direction: 'Data Unavailable', strength: 'Data Unavailable', change: '0.00' },
                currentPrice: 'Data Unavailable',
                chartData: {
                    symbol: symbol,
                    prices: [],
                    dates: []
                },
                isReal: false,
                error: true
            };
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

    // Economic Calendar from Finnhub
    async fetchEconomicCalendar() {
        try {
            if (!this.isConfigured()) {
                return {
                    events: [],
                    lastUpdate: 'API Key Required',
                    error: true,
                    needsApiKey: true
                };
            }

            console.log('Fetching economic calendar from Finnhub...');
            
            const today = new Date();
            const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const formatDate = (date) => {
                return date.toISOString().split('T')[0];
            };
            
            const response = await this.safeFetch(
                `${this.baseUrl}/calendar/economic?from=${formatDate(today)}&to=${formatDate(oneWeekLater)}&token=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle multiple possible response formats from Finnhub
            let eventsArray = [];
            
            if (data.economicCalendar && Array.isArray(data.economicCalendar)) {
                eventsArray = data.economicCalendar;
            } else if (Array.isArray(data)) {
                eventsArray = data;
            } else if (data.events && Array.isArray(data.events)) {
                eventsArray = data.events;
            } else {
                // Fallback: create empty array
                console.log('Unexpected economic calendar response format:', data);
                eventsArray = [];
            }
            
            const events = eventsArray.map(event => {
                try {
                    return {
                        date: new Date(event.time || event.date || event.datetime),
                        name: event.event || event.name || event.title || 'Economic Event',
                        impact: this.mapImpactLevel(event.impact || event.importance || event.level),
                        country: event.country || event.region || 'US',
                        time: new Date(event.time || event.date || event.datetime).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'America/New_York'
                        })
                    };
                } catch (eventError) {
                    console.warn('Error parsing economic event:', event, eventError);
                    return null;
                }
            }).filter(event => event !== null); // Remove failed parsing attempts
            
            console.log(`Retrieved ${events.length} economic events from Finnhub`);
            
            return {
                events: events,
                lastUpdate: new Date().toLocaleTimeString()
            };
            
        } catch (error) {
            console.error('Error fetching economic calendar from Finnhub:', error);
            return {
                events: [],
                lastUpdate: 'Failed to connect',
                error: true
            };
        }
    }

    // Map Finnhub impact levels to our system
    mapImpactLevel(impact) {
        if (!impact) return 'LOW';
        
        const level = impact.toString().toLowerCase();
        if (level.includes('high') || level === '3') return 'HIGH';
        if (level.includes('medium') || level === '2') return 'MEDIUM';
        return 'LOW';
    }

    // Test API key validity
    async testApiKey(apiKey) {
        try {
            const testResponse = await fetch(
                `${this.baseUrl}/quote?symbol=SPY&token=${apiKey}`
            );
            
            if (!testResponse.ok) {
                if (testResponse.status === 401 || testResponse.status === 403) {
                    return { valid: false, error: 'Invalid API key' };
                }
                return { valid: false, error: `API error: ${testResponse.status}` };
            }
            
            const data = await testResponse.json();
            
            if (data.error) {
                return { valid: false, error: data.error };
            }
            
            if (data.c !== undefined) {
                return { valid: true, message: 'API key is working correctly' };
            }
            
            return { valid: false, error: 'Unexpected API response format' };
            
        } catch (error) {
            return { valid: false, error: `Connection error: ${error.message}` };
        }
    }
}

// Export for use in main app
window.APIManager = APIManager;
