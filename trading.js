// Trading Calculations and Analysis Module
class TradingManager {
    constructor() {
        this.accountData = {
            balance: 3000,
            startingBalance: 3000,
            trades: [],
            accountHistory: [3000]
        };
    }

    // Trade Analysis Functions
    analyzeTrade(tradeData) {
        const { currentPrice, shortStrike, longStrike, credit, tradeType } = tradeData;
        
        if (isNaN(currentPrice) || isNaN(shortStrike) || isNaN(longStrike) || isNaN(credit)) {
            throw new Error('Invalid trade parameters');
        }
        
        const strikeWidth = Math.abs(shortStrike - longStrike) * 100;
        const maxProfit = credit;
        const maxRisk = strikeWidth - credit;
        const returnPercent = (maxProfit / maxRisk * 100).toFixed(1);
        
        let breakeven;
        if (tradeType === 'bullPut') {
            breakeven = shortStrike - (credit / 100);
        } else {
            breakeven = shortStrike + (credit / 100);
        }
        
        return {
            maxProfit,
            maxRisk,
            returnPercent,
            breakeven: breakeven.toFixed(2),
            strikeWidth
        };
    }

    // Risk Management
    validateTradeRisk(maxRisk) {
        const maxAllowedRisk = this.accountData.balance * 0.15; // 15% rule
        return {
            isValid: maxRisk <= maxAllowedRisk,
            maxAllowed: maxAllowedRisk.toFixed(0),
            riskAmount: maxRisk
        };
    }

    // Add Trade
    addTrade(tradeParams) {
        const analysis = this.analyzeTrade(tradeParams);
        const riskValidation = this.validateTradeRisk(analysis.maxRisk);
        
        if (!riskValidation.isValid) {
            throw new Error(`Trade risk ($${analysis.maxRisk}) exceeds 15% of account. Maximum allowed: $${riskValidation.maxAllowed}`);
        }
        
        const trade = {
            id: Date.now(),
            type: tradeParams.tradeType === 'bullPut' ? 'Bull Put Spread' : 'Bear Call Spread',
            underlying: tradeParams.underlying,
            openDate: new Date().toLocaleDateString(),
            currentPrice: tradeParams.currentPrice,
            shortStrike: tradeParams.shortStrike,
            longStrike: tradeParams.longStrike,
            credit: tradeParams.credit,
            maxRisk: analysis.maxRisk,
            dte: tradeParams.dte,
            status: 'Open',
            pnl: 0,
            closeDate: null
        };
        
        this.accountData.trades.push(trade);
        return trade;
    }

    // Close Trade
    closeTrade(tradeId, pnl) {
        const trade = this.accountData.trades.find(t => t.id === tradeId);
        if (!trade) {
            throw new Error('Trade not found');
        }
        
        trade.status = 'Closed';
        trade.pnl = pnl;
        trade.closeDate = new Date().toLocaleDateString();
        this.accountData.balance += pnl;
        this.accountData.accountHistory.push(this.accountData.balance);
        
        return trade;
    }

    // Performance Calculations
    calculatePerformanceMetrics() {
        const closedTrades = this.accountData.trades.filter(t => t.status === 'Closed');
        
        if (closedTrades.length === 0) {
            return {
                totalReturn: 0,
                monthlyReturn: 0,
                winRate: 0,
                avgReturn: 0,
                bestTrade: 0,
                worstTrade: 0,
                sharpeRatio: 0
            };
        }
        
        const totalReturn = ((this.accountData.balance - this.accountData.startingBalance) / this.accountData.startingBalance * 100).toFixed(1);
        const winningTrades = closedTrades.filter(t => t.pnl > 0);
        const winRate = ((winningTrades.length / closedTrades.length) * 100).toFixed(1);
        const avgReturn = (closedTrades.reduce((sum, t) => sum + t.pnl, 0) / closedTrades.length).toFixed(0);
        const bestTrade = Math.max(...closedTrades.map(t => t.pnl));
        const worstTrade = Math.min(...closedTrades.map(t => t.pnl));
        
        // Simplified Sharpe ratio calculation
        const returns = closedTrades.map(t => (t.pnl / t.maxRisk) * 100);
        const avgReturnPct = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturnPct, 2), 0) / returns.length;
        const returnStdDev = Math.sqrt(returnVariance);
        const sharpeRatio = returnStdDev > 0 ? (avgReturnPct / returnStdDev).toFixed(2) : '0.00';
        
        return {
            totalReturn,
            monthlyReturn: totalReturn, // Simplified for now
            winRate,
            avgReturn,
            bestTrade,
            worstTrade,
            sharpeRatio
        };
    }

    // Position Management
    getActivePositions() {
        const openTrades = this.accountData.trades.filter(t => t.status === 'Open');
        const capitalAtRisk = openTrades.reduce((sum, t) => sum + t.maxRisk, 0);
        const maxLoss = capitalAtRisk;
        
        return {
            count: openTrades.length,
            capitalAtRisk,
            maxLoss,
            availableCapital: this.accountData.balance - capitalAtRisk
        };
    }

    // Risk Level Assessment
    getRiskLevel() {
        const positions = this.getActivePositions();
        const riskPercentage = (positions.capitalAtRisk / this.accountData.balance) * 100;
        
        if (riskPercentage < 10) return { level: 'Low Risk', class: 'risk-low' };
        if (riskPercentage < 25) return { level: 'Medium Risk', class: 'risk-medium' };
        return { level: 'High Risk', class: 'risk-high' };
    }

    // Time Decay Optimization
    analyzeTimingEfficiency() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const currentDay = dayNames[dayOfWeek];
        const entryAnalysis = this.analyzeEntryDay(dayOfWeek, now);
        const weekStatus = this.analyzeWeekStatus(now);
        const dayScores = this.calculateWeeklyScores(now);
        const optimalDTE = this.getOptimalDTE(30, dayOfWeek);
        
        return {
            currentDay,
            entryRating: entryAnalysis.rating,
            analysis: entryAnalysis.analysis,
            weekStatus,
            dayScores,
            optimalDTE,
            lastUpdate: new Date().toLocaleTimeString()
        };
    }

    analyzeEntryDay(dayOfWeek, currentDate) {
        const isHoliday = this.checkHolidayWeek(currentDate);
        const isExpirationWeek = this.checkExpirationWeek(currentDate);
        
        let rating, analysis;
        
        if (isHoliday) {
            rating = 'AVOID';
            analysis = 'Holiday week detected. Reduced trading volume and unpredictable theta decay.';
        } else if (isExpirationWeek) {
            rating = 'CAUTION';
            analysis = 'Options expiration week. Increased volatility and gamma risk.';
        } else {
            switch(dayOfWeek) {
                case 1: // Monday
                    rating = 'EXCELLENT';
                    analysis = 'Monday is optimal for opening credit spreads. Full week of theta decay ahead.';
                    break;
                case 2: // Tuesday  
                    rating = 'GOOD';
                    analysis = 'Tuesday is very good for entries. Strong theta decay potential.';
                    break;
                case 3: // Wednesday
                    rating = 'FAIR';
                    analysis = 'Wednesday entries are acceptable but not optimal.';
                    break;
                case 4: // Thursday
                    rating = 'POOR';
                    analysis = 'Thursday entries face weekend theta inefficiency.';
                    break;
                case 5: // Friday
                    rating = 'AVOID';
                    analysis = 'Friday entries are suboptimal due to weekend pause.';
                    break;
                default: // Weekend
                    rating = 'CLOSED';
                    analysis = 'Markets are closed. Plan entries for Monday or Tuesday.';
            }
        }
        
        return { rating, analysis };
    }

    calculateWeeklyScores(currentDate) {
        const baseScores = {
            monday: 100,
            tuesday: 85,
            wednesday: 65,
            thursday: 40,
            friday: 20
        };
        
        const isHoliday = this.checkHolidayWeek(currentDate);
        const isExpiration = this.checkExpirationWeek(currentDate);
        
        let adjustmentFactor = 1.0;
        if (isHoliday) adjustmentFactor = 0.6;
        else if (isExpiration) adjustmentFactor = 0.8;
        
        return {
            monday: Math.round(baseScores.monday * adjustmentFactor),
            tuesday: Math.round(baseScores.tuesday * adjustmentFactor),
            wednesday: Math.round(baseScores.wednesday * adjustmentFactor),
            thursday: Math.round(baseScores.thursday * adjustmentFactor),
            friday: Math.round(baseScores.friday * adjustmentFactor)
        };
    }

    analyzeWeekStatus(currentDate) {
        if (this.checkHolidayWeek(currentDate)) return 'HOLIDAY WEEK';
        if (this.checkExpirationWeek(currentDate)) return 'EXPIRATION WEEK';
        if (this.checkEarningsWeek(currentDate)) return 'EARNINGS HEAVY';
        return 'NORMAL';
    }

    getOptimalDTE(targetDTE, dayOfWeek) {
        let optimalDTE = targetDTE;
        
        switch(dayOfWeek) {
            case 1: // Monday
            case 2: // Tuesday
                optimalDTE = targetDTE;
                break;
            case 3: // Wednesday
                optimalDTE = Math.max(targetDTE - 2, 21);
                break;
            case 4: // Thursday
            case 5: // Friday
                optimalDTE = Math.max(targetDTE - 5, 14);
                break;
        }
        
        return optimalDTE;
    }

    checkHolidayWeek(date) {
        // Simplified holiday check - would need full implementation
        const month = date.getMonth();
        const day = date.getDate();
        
        // Major holidays
        if (month === 0 && day === 1) return true; // New Year
        if (month === 6 && day === 4) return true; // July 4th
        if (month === 11 && day === 25) return true; // Christmas
        
        return false;
    }

    checkExpirationWeek(date) {
        // Options expire on 3rd Friday of each month
        const year = date.getFullYear();
        const month = date.getMonth();
        const thirdFriday = this.getNthWeekdayOfMonth(year, month, 5, 3);
        return this.getWeekNumber(date) === this.getWeekNumber(thirdFriday);
    }

    checkEarningsWeek(date) {
        const month = date.getMonth();
        const earningsMonths = [0, 3, 6, 9];
        return earningsMonths.includes(month) && date.getDate() >= 15;
    }

    getNthWeekdayOfMonth(year, month, weekday, n) {
        const firstDay = new Date(year, month, 1);
        const firstWeekday = new Date(year, month, 1 + (weekday - firstDay.getDay() + 7) % 7);
        return new Date(firstWeekday.getTime() + (n - 1) * 7 * 24 * 60 * 60 * 1000);
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // VIX Environment Analysis
    analyzeVixEnvironment(vixLevel) {
        let environment, recommendation, analysis, color;
        
        if (vixLevel < 12) {
            environment = 'Very Low';
            recommendation = 'AVOID';
            analysis = `VIX at ${vixLevel} indicates extremely low volatility. Credit spread premiums will be poor.`;
            color = '#e53e3e';
        } else if (vixLevel < 15) {
            environment = 'Low';
            recommendation = 'CAUTION';
            analysis = `VIX at ${vixLevel} shows low volatility. Credit spreads may offer limited premiums.`;
            color = '#ed8936';
        } else if (vixLevel < 20) {
            environment = 'Ideal';
            recommendation = 'FAVORABLE';
            analysis = `VIX at ${vixLevel} is in the sweet spot for credit spreads. Good premium collection with manageable risk.`;
            color = '#38a169';
        } else if (vixLevel < 25) {
            environment = 'Moderate';
            recommendation = 'GOOD';
            analysis = `VIX at ${vixLevel} indicates moderate volatility. Credit spreads can work well.`;
            color = '#38a169';
        } else if (vixLevel < 30) {
            environment = 'High';
            recommendation = 'CAUTION';
            analysis = `VIX at ${vixLevel} shows elevated volatility. Credit spreads face higher risk.`;
            color = '#ed8936';
        } else {
            environment = 'Very High';
            recommendation = 'AVOID';
            analysis = `VIX at ${vixLevel} indicates extreme volatility. Credit spreads are very risky.`;
            color = '#e53e3e';
        }
        
        return { environment, recommendation, analysis, color };
    }

    // Market Trend Analysis
    analyzeOverallTrend(spyData, qqqData) {
        if (!spyData || !qqqData) {
            return {
                strength: 'Unknown',
                environment: 'Loading...',
                analysis: 'Insufficient trend data available.',
                color: '#718096'
            };
        }
        
        const spyTrend = spyData.trend.direction;
        const qqqTrend = qqqData.trend.direction;
        const spyStrength = spyData.trend.strength;
        const qqqStrength = qqqData.trend.strength;
        
        let overallStrength;
        if ((spyStrength === 'Strong' || qqqStrength === 'Strong') && spyTrend === qqqTrend) {
            overallStrength = 'Strong';
        } else if (spyStrength === 'Moderate' || qqqStrength === 'Moderate') {
            overallStrength = 'Moderate';
        } else {
            overallStrength = 'Weak';
        }
        
        let environment, analysis, color;
        
        if (spyTrend === 'Sideways' && qqqTrend === 'Sideways') {
            environment = 'EXCELLENT';
            analysis = 'Both SPY and QQQ in sideways trend. Ideal environment for credit spreads.';
            color = '#38a169';
        } else if (overallStrength === 'Weak' && (spyTrend !== qqqTrend || spyTrend === 'Sideways' || qqqTrend === 'Sideways')) {
            environment = 'GOOD';
            analysis = 'Weak trending or mixed signals. Good environment for credit spreads.';
            color = '#38a169';
        } else if (overallStrength === 'Moderate') {
            environment = 'CAUTION';
            analysis = `Moderate ${spyTrend.toLowerCase()} trend detected. Credit spreads face higher risk.`;
            color = '#ed8936';
        } else if (overallStrength === 'Strong') {
            environment = 'AVOID';
            analysis = `Strong ${spyTrend.toLowerCase()} trend in progress. High risk for credit spreads.`;
            color = '#e53e3e';
        } else {
            environment = 'MIXED';
            analysis = 'Conflicting trends between SPY and QQQ. Exercise caution.';
            color = '#ed8936';
        }
        
        return { strength: overallStrength, environment, analysis, color };
    }

    // Economic Calendar Risk Analysis
    analyzeCalendarRisk(events) {
        const highImpactEvents = events.filter(e => e.impact === 'HIGH');
        const mediumImpactEvents = events.filter(e => e.impact === 'MEDIUM');
        
        let riskLevel, advice, analysis, color;
        
        if (highImpactEvents.length >= 2) {
            riskLevel = 'HIGH';
            advice = 'AVOID TRADING';
            analysis = `${highImpactEvents.length} high-impact events this week. Avoid opening new credit spreads.`;
            color = '#e53e3e';
        } else if (highImpactEvents.length === 1) {
            riskLevel = 'MEDIUM';
            advice = 'TRADE WITH CAUTION';
            analysis = `1 high-impact event this week (${highImpactEvents[0].name}). Be very selective with new positions.`;
            color = '#ed8936';
        } else if (mediumImpactEvents.length >= 3) {
            riskLevel = 'MEDIUM';
            advice = 'TRADE WITH CAUTION';
            analysis = `${mediumImpactEvents.length} medium-impact events this week. Monitor positions closely.`;
            color = '#ed8936';
        } else {
            riskLevel = 'LOW';
            advice = 'FAVORABLE';
            analysis = `Light economic calendar this week. Good environment for opening new credit spread positions.`;
            color = '#38a169';
        }
        
        return { riskLevel, advice, analysis, color };
    }
}

// Export for use in main app
window.TradingManager = TradingManager;
