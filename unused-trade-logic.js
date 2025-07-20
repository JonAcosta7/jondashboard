// Trade Logic Module - handles trade calculations and analysis

import { CONFIG, TRADE_TYPES } from './config.js';

export class TradeCalculator {
    constructor() {
        this.currentAnalysis = null;
    }

    analyzeTrade(tradeData) {
        const { currentPrice, shortStrike, longStrike, credit, type } = tradeData;
        
        if (!this.validateInputs(currentPrice, shortStrike, longStrike, credit)) {
            throw new Error('Invalid trade parameters');
        }

        const strikeWidth = Math.abs(shortStrike - longStrike) * 100;
        const maxProfit = credit;
        const maxRisk = strikeWidth - credit;
        const returnPercent = (maxProfit / maxRisk * 100);
        
        let breakeven;
        if (type === TRADE_TYPES.BULL_PUT) {
            breakeven = shortStrike - (credit / 100);
        } else {
            breakeven = shortStrike + (credit / 100);
        }

        const analysis = {
            maxProfit,
            maxRisk,
            returnPercent: parseFloat(returnPercent.toFixed(1)),
            breakeven: parseFloat(breakeven.toFixed(2)),
            profitProbability: this.calculateProbability(currentPrice, shortStrike, type),
            riskReward: parseFloat((maxProfit / maxRisk).toFixed(2))
        };

        this.currentAnalysis = analysis;
        return analysis;
    }

    validateInputs(currentPrice, shortStrike, longStrike, credit) {
        return !isNaN(currentPrice) && 
               !isNaN(shortStrike) && 
               !isNaN(longStrike) && 
               !isNaN(credit) &&
               currentPrice > 0 &&
               shortStrike > 0 &&
               longStrike > 0 &&
               credit > 0;
    }

    calculateProbability(currentPrice, shortStrike, type) {
        // Simplified probability calculation based on distance from current price
        const distance = Math.abs(currentPrice - shortStrike);
        const percentDistance = (distance / currentPrice) * 100;
        
        // Basic probability model (should be enhanced with real options math)
        if (percentDistance > 10) return 85;
        if (percentDistance > 7) return 75;
        if (percentDistance > 5) return 65;
        if (percentDistance > 3) return 55;
        return 45;
    }

    validateRiskManagement(maxRisk, accountBalance) {
        const maxAllowedRisk = accountBalance * CONFIG.MAX_RISK_PERCENTAGE;
        return {
            isValid: maxRisk <= maxAllowedRisk,
            maxAllowed: maxAllowedRisk,
            riskPercentage: (maxRisk / accountBalance) * 100
        };
    }

    getCurrentAnalysis() {
        return this.currentAnalysis;
    }
}

export class TimingAnalyzer {
    constructor() {
        this.analysis = {
            currentDay: '',
            entryRating: '',
            optimalDTE: 30,
            weekStatus: '',
            dayScores: {},
            analysis: '',
            lastUpdate: null
        };
    }

    updateTimingAnalysis(targetDTE = CONFIG.DEFAULT_DTE) {
        this.analyzeCurrentTiming(targetDTE);
        this.calculateWeeklyScores();
        this.analysis.lastUpdate = new Date().toLocaleTimeString();
        return this.analysis;
    }

    analyzeCurrentTiming(targetDTE) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        this.analysis.currentDay = dayNames[dayOfWeek];
        this.analysis.optimalDTE = this.getOptimalDTE(targetDTE, dayOfWeek);
        
        const entryAnalysis = this.analyzeEntryDay(dayOfWeek, now);
        this.analysis.entryRating = entryAnalysis.rating;
        this.analysis.analysis = entryAnalysis.analysis;
        
        this.analysis.weekStatus = this.analyzeWeekStatus(now);
    }

    analyzeEntryDay(dayOfWeek, currentDate) {
        const isHoliday = this.checkHolidayWeek(currentDate);
        const isExpirationWeek = this.checkExpirationWeek(currentDate);
        
        if (isHoliday) {
            return {
                rating: 'AVOID',
                analysis: 'Holiday week detected. Reduced trading volume and unpredictable theta decay.',
                color: '#e53e3e'
            };
        }
        
        if (isExpirationWeek) {
            return {
                rating: 'CAUTION',
                analysis: 'Options expiration week. Increased volatility and gamma risk.',
                color: '#ed8936'
            };
        }
        
        const dayAnalysis = {
            1: { rating: 'EXCELLENT', analysis: 'Monday optimal for opening credit spreads. Full week of theta decay ahead.', color: '#38a169' },
            2: { rating: 'GOOD', analysis: 'Tuesday very good for entries. Strong theta decay potential.', color: '#38a169' },
            3: { rating: 'FAIR', analysis: 'Wednesday entries acceptable but not optimal.', color: '#ed8936' },
            4: { rating: 'POOR', analysis: 'Thursday entries face weekend theta inefficiency.', color: '#e53e3e' },
            5: { rating: 'AVOID', analysis: 'Friday entries suboptimal due to weekend pause.', color: '#e53e3e' },
            0: { rating: 'CLOSED', analysis: 'Markets closed. Plan entries for Monday/Tuesday.', color: '#718096' },
            6: { rating: 'CLOSED', analysis: 'Markets closed. Plan entries for Monday/Tuesday.', color: '#718096' }
        };
        
        return dayAnalysis[dayOfWeek] || dayAnalysis[0];
    }

    calculateWeeklyScores() {
        const baseScores = {
            monday: 100,
            tuesday: 85,
            wednesday: 65,
            thursday: 40,
            friday: 20
        };
        
        const now = new Date();
        let adjustmentFactor = 1.0;
        
        if (this.checkHolidayWeek(now)) adjustmentFactor = 0.6;
        else if (this.checkExpirationWeek(now)) adjustmentFactor = 0.8;
        
        this.analysis.dayScores = {
            monday: Math.round(baseScores.monday * adjustmentFactor),
            tuesday: Math.round(baseScores.tuesday * adjustmentFactor),
            wednesday: Math.round(baseScores.wednesday * adjustmentFactor),
            thursday: Math.round(baseScores.thursday * adjustmentFactor),
            friday: Math.round(baseScores.friday * adjustmentFactor)
        };
    }

    getOptimalDTE(targetDTE, dayOfWeek) {
        switch(dayOfWeek) {
            case 1:
            case 2:
                return targetDTE;
            case 3:
                return Math.max(targetDTE - 2, 21);
            case 4:
            case 5:
                return Math.max(targetDTE - 5, 14);
            default:
                return targetDTE;
        }
    }

    analyzeWeekStatus(currentDate) {
        if (this.checkHolidayWeek(currentDate)) return 'HOLIDAY WEEK';
        if (this.checkExpirationWeek(currentDate)) return 'EXPIRATION WEEK';
        if (this.checkEarningsWeek(currentDate)) return 'EARNINGS HEAVY';
        return 'NORMAL';
    }

    checkHolidayWeek(date) {
        // Simplified holiday detection
        const month = date.getMonth();
        const dayOfMonth = date.getDate();
        
        // Major holidays that affect trading
        const holidays = [
            { month: 0, day: 1 },   // New Year
            { month: 6, day: 4 },   // Independence Day
            { month: 11, day: 25 }  // Christmas
        ];
        
        return holidays.some(holiday => 
            month === holiday.month && Math.abs(dayOfMonth - holiday.day) <= 3
        );
    }

    checkExpirationWeek(date) {
        // Third Friday of the month
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const firstFriday = new Date(year, month, 1 + (5 - firstDay.getDay() + 7) % 7);
        const thirdFriday = new Date(firstFriday.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        const currentWeek = Math.floor((date.getDate() - 1) / 7);
        const expirationWeek = Math.floor((thirdFriday.getDate() - 1) / 7);
        
        return currentWeek === expirationWeek;
    }

    checkEarningsWeek(date) {
        const month = date.getMonth();
        const dayOfMonth = date.getDate();
        const earningsMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
        
        return earningsMonths.includes(month) && dayOfMonth >= 15;
    }

    getAnalysis() {
        return this.analysis;
    }
}
