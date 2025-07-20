// Utility Functions Module
class Utils {
    // Color Functions
    static getTrendColor(trend) {
        switch(trend) {
            case 'Up': return '#38a169';
            case 'Down': return '#e53e3e';
            case 'Sideways': return '#667eea';
            default: return '#718096';
        }
    }

    static getStrengthColor(strength) {
        switch(strength) {
            case 'Strong': return '#e53e3e';
            case 'Moderate': return '#ed8936';
            case 'Weak': return '#38a169';
            default: return '#718096';
        }
    }

    static getTimingColor(rating) {
        switch(rating) {
            case 'EXCELLENT': return '#38a169';
            case 'GOOD': return '#38a169';
            case 'FAIR': return '#ed8936';
            case 'POOR': return '#e53e3e';
            case 'AVOID': return '#e53e3e';
            case 'CLOSED': return '#718096';
            default: return '#718096';
        }
    }

    static getScoreColor(score) {
        if (score === null || score === undefined || score === '--') return '#718096';
        if (score >= 80) return '#38a169';
        else if (score >= 60) return '#ed8936';
        else return '#e53e3e';
    }

    static getImpactColor(impact) {
        switch(impact) {
            case 'HIGH': return '#e53e3e';
            case 'MEDIUM': return '#ed8936';
            case 'LOW': return '#38a169';
            default: return '#718096';
        }
    }

    // Formatting Functions
    static formatCurrency(amount, includeSign = false) {
        const formatted = Math.abs(amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        if (includeSign && amount !== 0) {
            return amount > 0 ? `+${formatted}` : `-${formatted}`;
        }
        
        return formatted;
    }

    static formatPercentage(value, includeSign = false) {
        const formatted = Math.abs(value).toFixed(1) + '%';
        
        if (includeSign && value !== 0) {
            return value > 0 ? `+${formatted}` : `-${formatted}`;
        }
        
        return formatted;
    }

    static formatNumber(value, decimals = 0) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Date Functions
    static formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex] || 'Unknown';
    }

    static getMonthName(monthIndex) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthIndex] || 'Unknown';
    }

    // Validation Functions
    static isValidPrice(price) {
        return !isNaN(price) && price > 0 && price < 10000;
    }

    static isValidStrike(strike) {
        return !isNaN(strike) && strike > 0 && strike < 10000;
    }

    static isValidCredit(credit) {
        return !isNaN(credit) && credit > 0 && credit < 1000;
    }

    static isValidDTE(dte) {
        return !isNaN(dte) && dte >= 1 && dte <= 365;
    }

    static validateTradeInputs(inputs) {
        const errors = [];
        
        if (!this.isValidPrice(inputs.currentPrice)) {
            errors.push('Current price must be a valid number between 0 and 10,000');
        }
        
        if (!this.isValidStrike(inputs.shortStrike)) {
            errors.push('Short strike must be a valid number between 0 and 10,000');
        }
        
        if (!this.isValidStrike(inputs.longStrike)) {
            errors.push('Long strike must be a valid number between 0 and 10,000');
        }
        
        if (!this.isValidCredit(inputs.credit)) {
            errors.push('Credit must be a valid number between 0 and 1,000');
        }
        
        if (!this.isValidDTE(inputs.dte)) {
            errors.push('DTE must be between 1 and 365 days');
        }
        
        // Logical validations
        if (inputs.tradeType === 'bullPut') {
            if (inputs.shortStrike <= inputs.longStrike) {
                errors.push('For bull put spreads, short strike must be higher than long strike');
            }
        } else if (inputs.tradeType === 'bearCall') {
            if (inputs.shortStrike >= inputs.longStrike) {
                errors.push('For bear call spreads, short strike must be lower than long strike');
            }
        }
        
        return errors;
    }

    // DOM Manipulation Helpers
    static updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    static updateElementColor(elementId, color) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.color = color;
        }
    }

    static updateElementClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.className = className;
        }
    }

    static showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }

    static hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    // Array and Object Helpers
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Math Helpers
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static round(value, decimals = 2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    static calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    // Risk Calculations
    static calculatePositionSize(accountBalance, riskPercentage, maxRisk) {
        const maxAllowedRisk = accountBalance * (riskPercentage / 100);
        return Math.floor(maxAllowedRisk / maxRisk);
    }

    static calculateRiskReward(maxProfit, maxRisk) {
        if (maxRisk === 0) return 0;
        return maxProfit / maxRisk;
    }

    // Error Handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // You could extend this to send errors to a logging service
        return {
            message: error.message || 'An unknown error occurred',
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    // Local Storage Helpers
    static getLocalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    static formatStorageSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    // URL and Query Helpers
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    static updateQueryParam(param, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(param, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }

    // Animation Helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    // Performance Monitoring
    static measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Feature Detection
    static supportsLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    static supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch (e) {
            return false;
        }
    }

    // Browser Information
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        return {
            browser: browser,
            userAgent: ua,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    // Random Helpers
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Export for use in main app
window.Utils = Utils;
