// Configuration constants for the Credit Spreads Dashboard

export const CONFIG = {
    // Account settings
    STARTING_BALANCE: 3000,
    MAX_RISK_PERCENTAGE: 0.15, // 15% max risk per trade
    
    // Chart settings
    CHART_COLORS: {
        primary: '#667eea',
        secondary: '#ed8936',
        success: '#38a169',
        danger: '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1'
    },
    
    // API settings
    API_ENDPOINTS: {
        yahoo_finance: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        cors_proxy: 'https://api.allorigins.win/raw?url='
    },
    
    // Trading settings
    DEFAULT_DTE: 30,
    MIN_DTE: 7,
    MAX_DTE: 60,
    
    // VIX thresholds
    VIX_THRESHOLDS: {
        very_low: 12,
        low: 15,
        ideal_min: 15,
        ideal_max: 20,
        moderate_max: 25,
        high_max: 30
    },
    
    // Economic calendar impact levels
    IMPACT_LEVELS: {
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
    },
    
    // Data storage keys
    STORAGE_KEYS: {
        account_data: 'creditSpreadsData',
        sync_data: 'creditSpreadsSync',
        device_id: 'deviceId',
        google_client_id: 'googleClientId'
    },
    
    // Update intervals (in milliseconds)
    UPDATE_INTERVALS: {
        auto_save: 5000,
        market_data: 300000, // 5 minutes
        economic_calendar: 3600000 // 1 hour
    }
};

export const MARKET_SYMBOLS = {
    SPY: 'SPY',
    QQQ: 'QQQ',
    IWM: 'IWM',
    VIX: '^VIX'
};

export const TRADE_TYPES = {
    BULL_PUT: 'Bull Put Spread',
    BEAR_CALL: 'Bear Call Spread'
};

export const TRADE_STATUS = {
    OPEN: 'Open',
    CLOSED: 'Closed'
};
