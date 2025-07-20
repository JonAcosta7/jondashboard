// Main Application Module (continued)
    updateTrendDisplay() {
        Utils.updateElementText('spyTrend', this.trendAnalysis.spyTrend || '--');
        Utils.updateElementColor('spyTrend', Utils.getTrendColor(this.trendAnalysis.spyTrend));
        
        Utils.updateElementText('qqqTrend', this.trendAnalysis.qqqTrend || '--');
        Utils.updateElementColor('qqqTrend', Utils.getTrendColor(this.trendAnalysis.qqqTrend));
        
        Utils.updateElementText('trendStrength', this.trendAnalysis.strength || '--');
        Utils.updateElementColor('trendStrength', Utils.getStrengthColor(this.trendAnalysis.strength));
        
        Utils.updateElementText('spreadFriendly', this.trendAnalysis.environment || '--');
        Utils.updateElementColor('spreadFriendly', this.trendAnalysis.color || '#718096');
        
        Utils.updateElementText('trendAnalysisText', this.trendAnalysis.analysis || 'Loading market trend data...');
    }

    updateTimingDisplay() {
        Utils.updateElementText('currentDay', this.timingAnalysis.currentDay || '--');
        
        const entryElement = document.getElementById('entryTiming');
        if (entryElement) {
            entryElement.textContent = this.timingAnalysis.entryRating || '--';
            entryElement.style.color = Utils.getTimingColor(this.timingAnalysis.entryRating);
        }
        
        Utils.updateElementText('optimalDTE', this.timingAnalysis.optimalDTE ? `${this.timingAnalysis.optimalDTE} days` : '--');
        Utils.updateElementText('weekStatus', this.timingAnalysis.weekStatus || '--');
        
        // Update daily scores
        const scores = this.timingAnalysis.dayScores || {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            const scoreElement = document.getElementById(day + 'Score');
            if (scoreElement) {
                scoreElement.textContent = `${day.substr(0,3)}: ${scores[day] || '--'}%`;
                scoreElement.style.color = Utils.getScoreColor(scores[day]);
            }
        });
        
        Utils.updateElementText('timingAnalysisText', this.timingAnalysis.analysis || 'Analyzing optimal entry timing...');
    }

    updateCalendarDisplay() {
        Utils.updateElementText('upcomingEvents', this.economicCalendar.events.length.toString());
        Utils.updateElementText('riskLevel', this.economicCalendar.riskLevel);
        Utils.updateElementColor('riskLevel', this.economicCalendar.color);
        Utils.updateElementText('tradingAdvice', this.economicCalendar.advice);
        Utils.updateElementColor('tradingAdvice', this.economicCalendar.color);
        
        const nextMajor = this.economicCalendar.events.find(e => e.impact === 'HIGH');
        Utils.updateElementText('nextMajorEvent', nextMajor ? nextMajor.name : 'None this week');
        
        // Events list
        const eventsContainer = document.getElementById('economicEvents');
        if (eventsContainer) {
            if (this.economicCalendar.events.length === 0) {
                eventsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #718096;">No major events this week - Good for trading!</div>';
            } else {
                const eventsHtml = this.economicCalendar.events.map(event => `
                    <div class="trade-item" style="grid-template-columns: 1fr 2fr 1fr 1fr;">
                        <div><strong>${Utils.formatDate(event.date)}</strong></div>
                        <div>${event.name}</div>
                        <div style="color: ${Utils.getImpactColor(event.impact)}">${event.impact}</div>
                        <div style="font-size: 0.8rem;">${event.time}</div>
                    </div>
                `).join('');
                eventsContainer.innerHTML = eventsHtml;
            }
        }
        
        Utils.updateElementText('calendarAnalysisText', this.economicCalendar.analysis);
    }

    updateSyncStatus() {
        const syncStatus = this.storageManager.getSyncStatus();
        
        Utils.updateElementText('syncStatus', 'Manual Mode');
        Utils.updateElementText('syncProvider', 'Export/Import');
        Utils.updateElementText('lastSync', syncStatus.lastSync || '--');
        Utils.updateElementText('currentDevice', syncStatus.deviceId);
    }

    // Trade Management
    closeTrade(tradeId, pnlInput) {
        try {
            const pnl = parseFloat(pnlInput);
            if (isNaN(pnl)) {
                this.showError('Invalid P&L value');
                return;
            }
            
            this.tradingManager.closeTrade(tradeId, pnl);
            this.debouncedSave();
            this.updateAllDisplays();
            
            this.showSuccess(`Trade closed with ${pnl >= 0 ? 'profit' : 'loss'} of ${Utils.formatCurrency(Math.abs(pnl))}`);
            
        } catch (error) {
            this.showError('Error closing trade: ' + error.message);
        }
    }

    // Data Management
    exportData() {
        try {
            const success = this.storageManager.exportData(this.tradingManager.accountData);
            if (success) {
                this.showSuccess('Data exported successfully');
            } else {
                this.showError('Failed to export data');
            }
        } catch (error) {
            this.showError('Error exporting data: ' + error.message);
        }
    }

    exportDataWithSync() {
        try {
            const result = this.storageManager.exportDataWithSync(this.tradingManager.accountData);
            if (result.success) {
                this.showSuccess('Data exported for device sync');
                this.updateSyncStatus();
            } else {
                this.showError('Failed to export sync data: ' + result.error);
            }
        } catch (error) {
            this.showError('Error exporting sync data: ' + error.message);
        }
    }

    async importData(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            const importedData = await this.storageManager.importData(file);
            
            if (confirm('This will replace all current data. Continue?')) {
                this.tradingManager.accountData = importedData;
                this.storageManager.saveData(importedData);
                this.updateAllDisplays();
                this.showSuccess('Data imported successfully');
            }
            
            // Clear the file input
            event.target.value = '';
            
        } catch (error) {
            this.showError('Error importing data: ' + error.message);
            event.target.value = '';
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all trade data? This cannot be undone.')) {
            const success = this.storageManager.clearAllData();
            if (success) {
                this.tradingManager.accountData = {
                    balance: 3000,
                    startingBalance: 3000,
                    trades: [],
                    accountHistory: [3000]
                };
                this.updateAllDisplays();
                this.showSuccess('All data cleared successfully');
            } else {
                this.showError('Failed to clear data');
            }
        }
    }

    // Error Handling
    handleVixError() {
        Utils.updateElementText('vixLevel', 'Error');
        Utils.updateElementText('vixEnvironment', 'Unable to load');
        Utils.updateElementText('vixRecommendation', 'Check connection');
        Utils.updateElementText('lastVixUpdate', 'Failed');
        Utils.updateElementText('vixAnalysisText', 'Unable to fetch VIX data. Check your internet connection and try refreshing.');
    }

    handleTrendError() {
        Utils.updateElementText('spyTrend', 'Error');
        Utils.updateElementColor('spyTrend', '#e53e3e');
        
        Utils.updateElementText('qqqTrend', 'Error');
        Utils.updateElementColor('qqqTrend', '#e53e3e');
        
        Utils.updateElementText('trendStrength', 'Failed');
        Utils.updateElementColor('trendStrength', '#e53e3e');
        
        Utils.updateElementText('spreadFriendly', 'Check Connection');
        Utils.updateElementColor('spreadFriendly', '#e53e3e');
        
        Utils.updateElementText('trendAnalysisText', 'Unable to fetch trend data. Check your internet connection and try refreshing.');
    }

    // User Feedback
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
        console.error('Application Error:', message);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #38a169, #48bb78)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Cleanup
    destroy() {
        this.chartManager.destroyCharts();
        this.isInitialized = false;
        console.log('Application destroyed');
    }
}

// Global app instance
let app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new CreditSpreadsApp();
    app.init().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app && app.isInitialized) {
        app.destroy();
    }
});

// Export for global access
window.CreditSpreadsApp = CreditSpreadsApp;
