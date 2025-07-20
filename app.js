// Main Application Module
class CreditSpreadsApp {
    constructor() {
        this.tradingManager = new TradingManager();
        this.chartManager = new ChartManager();
        this.apiManager = new APIManager();
        this.storageManager = new StorageManager();
        
        this.activeTab = 'bullPut';
        this.isInitialized = false;
        
        // Data states
        this.vixData = { level: null, lastUpdate: null, environment: 'Unknown' };
        this.economicCalendar = { events: [], riskLevel: 'Unknown', advice: 'Loading...', lastUpdate: null };
        this.trendAnalysis = { spyTrend: 'Unknown', qqqTrend: 'Unknown', strength: 'Unknown', environment: 'Unknown', data: [], lastUpdate: null };
        this.timingAnalysis = { currentDay: '', entryRating: '', optimalDTE: 30, weekStatus: '', dayScores: {}, analysis: '', lastUpdate: null };
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing Credit Spreads Dashboard...');
            
            // Load saved data
            this.loadSavedData();
            
            // Initialize charts
            this.chartManager.initializeCharts();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initial data updates
            await this.performInitialDataLoad();
            
            // Update all displays
            this.updateAllDisplays();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Load saved data from storage
    loadSavedData() {
        const savedData = this.storageManager.loadData();
        if (savedData && this.storageManager.validateAccountData(savedData)) {
            this.tradingManager.accountData = savedData;
            console.log('Loaded saved account data');
        } else {
            console.log('No valid saved data found, using defaults');
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Tab switching
        this.setupTabListeners();
        
        // Form submissions
        this.setupFormListeners();
        
        // Button clicks
        this.setupButtonListeners();
        
        // File inputs
        this.setupFileListeners();
        
        // Auto-save on data changes
        this.setupAutoSave();
    }

    setupTabListeners() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.textContent.includes('Bull') ? 'bullPut' : 'bearCall');
            });
        });
    }

    setupFormListeners() {
        // Replace onclick handlers with proper event listeners
        this.replaceOnclickHandler('analyzeTrade()', () => this.analyzeTrade());
        this.replaceOnclickHandler('addTrade()', () => this.addTrade());
    }

    setupButtonListeners() {
        // Update buttons
        this.replaceOnclickHandler('updateTimingAnalysis()', () => this.updateTimingAnalysis());
        this.replaceOnclickHandler('updateTrendAnalysis()', () => this.updateTrendAnalysis());
        this.replaceOnclickHandler('updateEconomicCalendar()', () => this.updateEconomicCalendar());
        this.replaceOnclickHandler('updateVixData()', () => this.updateVixData());
        
        // Data management buttons
        this.replaceOnclickHandler('exportData()', () => this.exportData());
        this.replaceOnclickHandler('exportDataWithSync()', () => this.exportDataWithSync());
        this.replaceOnclickHandler('clearAllData()', () => this.clearAllData());
        
        // Google Drive sync buttons
        this.replaceOnclickHandler('setupGoogleSync()', () => this.setupGoogleSync());
        this.replaceOnclickHandler('syncToCloud()', () => this.syncToCloud());
        this.replaceOnclickHandler('syncFromCloud()', () => this.syncFromCloud());
    }

    replaceOnclickHandler(onclickValue, handler) {
        const btn = document.querySelector(`button[onclick="${onclickValue}"]`);
        if (btn) {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handler);
        }
    }

    setupFileListeners() {
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e));
        }
    }

    setupAutoSave() {
        // Debounced auto-save function
        this.debouncedSave = Utils.debounce(() => {
            this.storageManager.saveData(this.tradingManager.accountData);
            
            // Auto-sync to Google Drive if enabled and signed in
            if (this.storageManager.isSignedInToGoogle()) {
                this.autoSyncToCloud();
            }
        }, 1000);
    }

    async autoSyncToCloud() {
        try {
            // Debounced auto-sync to prevent too frequent API calls
            if (!this.autoSyncDebounced) {
                this.autoSyncDebounced = Utils.debounce(async () => {
                    console.log('Auto-syncing to Google Drive...');
                    const result = await this.storageManager.syncToGoogleDrive(this.tradingManager.accountData);
                    if (result.success) {
                        console.log('Auto-sync completed successfully');
                        this.updateSyncStatus();
                    } else {
                        console.error('Auto-sync failed:', result.error);
                    }
                }, 5000); // Auto-sync after 5 seconds of inactivity
            }
            
            this.autoSyncDebounced();
        } catch (error) {
            console.error('Error in auto-sync:', error);
        }
    }

    // Initial data loading
    async performInitialDataLoad() {
        const loadPromises = [
            this.updateVixData(),
            this.updateTrendAnalysis(),
            this.updateEconomicCalendar(),
            this.updateTimingAnalysis()
        ];
        
        // Don't wait for all to complete, let them load asynchronously
        Promise.allSettled(loadPromises).then(results => {
            console.log('Initial data load completed:', results);
        });
    }

    // Tab Management
    switchTab(tabName) {
        this.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        const activeTabElement = tabName === 'bullPut' ? 
            document.querySelector('.tab:first-child') : 
            document.querySelector('.tab:last-child');
        if (activeTabElement) {
            activeTabElement.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // Trade Analysis
    analyzeTrade() {
        try {
            const tradeData = this.getTradeInputs();
            const analysis = this.tradingManager.analyzeTrade(tradeData);
            
            this.displayTradeAnalysis(analysis);
            this.updateInsights(analysis, tradeData);
            
        } catch (error) {
            this.showError('Error analyzing trade: ' + error.message);
        }
    }

    getTradeInputs() {
        const suffix = this.activeTab === 'bullPut' ? '1' : '2';
        
        return {
            underlying: document.getElementById(`underlying${suffix}`).value,
            currentPrice: parseFloat(document.getElementById(`currentPrice${suffix}`).value),
            shortStrike: parseFloat(document.getElementById(`shortStrike${suffix}`).value),
            longStrike: parseFloat(document.getElementById(`longStrike${suffix}`).value),
            credit: parseFloat(document.getElementById(`creditReceived${suffix}`).value),
            dte: parseInt(document.getElementById(`dte${suffix}`).value),
            tradeType: this.activeTab
        };
    }

    displayTradeAnalysis(analysis) {
        Utils.updateElementText('maxProfit', Utils.formatCurrency(analysis.maxProfit));
        Utils.updateElementText('maxRisk', Utils.formatCurrency(analysis.maxRisk));
        Utils.updateElementText('returnPercent', `${analysis.returnPercent}%`);
        Utils.updateElementText('breakeven', `$${analysis.breakeven}`);
        
        Utils.showElement('tradeAnalysis');
    }

    updateInsights(analysis, tradeData) {
        const riskValidation = this.tradingManager.validateTradeRisk(analysis.maxRisk);
        const vixAnalysis = this.tradingManager.analyzeVixEnvironment(parseFloat(this.vixData.level) || 20);
        
        let insight = `💡 Trade Analysis: ${analysis.returnPercent}% return potential with $${analysis.maxRisk} max risk. `;
        
        if (!riskValidation.isValid) {
            insight += `⚠️ Risk exceeds 15% account limit (max: $${riskValidation.maxAllowed}). `;
        }
        
        insight += vixAnalysis.analysis;
        
        // Update insights panel (if it exists)
        const insightsElement = document.querySelector('#insights .insight-item:first-child');
        if (insightsElement) {
            insightsElement.innerHTML = `<strong>📊 Current Trade Analysis:</strong> ${insight}`;
        }
    }

    // Trade Management
    addTrade() {
        try {
            const tradeData = this.getTradeInputs();
            
            // Validate inputs
            const validationErrors = Utils.validateTradeInputs(tradeData);
            if (validationErrors.length > 0) {
                this.showError('Validation errors:\n' + validationErrors.join('\n'));
                return;
            }
            
            const trade = this.tradingManager.addTrade(tradeData);
            
            this.debouncedSave();
            this.updateAllDisplays();
            this.clearTradeForm();
            
            this.showSuccess('Trade added successfully!');
            
        } catch (error) {
            this.showError('Error adding trade: ' + error.message);
        }
    }

    clearTradeForm() {
        const suffix = this.activeTab === 'bullPut' ? '1' : '2';
        
        ['currentPrice', 'shortStrike', 'longStrike', 'creditReceived', 'dte'].forEach(field => {
            const element = document.getElementById(field + suffix);
            if (element) element.value = '';
        });
        
        Utils.hideElement('tradeAnalysis');
    }

    // Data Updates
    async updateVixData() {
        try {
            const vixResult = await this.apiManager.fetchVIXData();
            this.vixData = {
                ...vixResult,
                ...this.tradingManager.analyzeVixEnvironment(parseFloat(vixResult.level))
            };
            
            this.updateVixDisplay();
            
        } catch (error) {
            console.error('Error updating VIX data:', error);
            this.handleVixError();
        }
    }

    async updateTrendAnalysis() {
        try {
            this.trendAnalysis.data = [];
            
            const results = await Promise.allSettled([
                this.apiManager.fetchTickerData('SPY'),
                this.apiManager.fetchTickerData('QQQ')
            ]);
            
            let spyData = null, qqqData = null;
            
            if (results[0].status === 'fulfilled') {
                spyData = results[0].value;
                this.trendAnalysis.spyTrend = spyData.trend.direction;
                this.trendAnalysis.data.push(spyData.chartData);
            }
            
            if (results[1].status === 'fulfilled') {
                qqqData = results[1].value;
                this.trendAnalysis.qqqTrend = qqqData.trend.direction;
                this.trendAnalysis.data.push(qqqData.chartData);
            }
            
            if (!spyData && !qqqData) {
                throw new Error('No ticker data available');
            }
            
            const overallAnalysis = this.tradingManager.analyzeOverallTrend(spyData, qqqData);
            this.trendAnalysis = { ...this.trendAnalysis, ...overallAnalysis };
            
            this.updateTrendDisplay();
            this.chartManager.updateTrendChart(this.trendAnalysis.data);
            
        } catch (error) {
            console.error('Error updating trend analysis:', error);
            this.handleTrendError();
        }
    }

    updateEconomicCalendar() {
        try {
            const calendarData = this.apiManager.generateEconomicCalendar();
            this.economicCalendar = {
                ...calendarData,
                ...this.tradingManager.analyzeCalendarRisk(calendarData.events)
            };
            
            this.updateCalendarDisplay();
            
        } catch (error) {
            console.error('Error updating economic calendar:', error);
        }
    }

    updateTimingAnalysis() {
        try {
            const targetDTE = parseInt(document.getElementById('targetDTE')?.value) || 30;
            this.timingAnalysis = this.tradingManager.analyzeTimingEfficiency();
            this.updateTimingDisplay();
            
        } catch (error) {
            console.error('Error updating timing analysis:', error);
        }
    }

    // Display Updates
    updateAllDisplays() {
        this.updateAccountMetrics();
        this.updatePositionMetrics();
        this.updatePerformanceMetrics();
        this.updateTradeHistory();
        this.updateCharts();
        this.updateSyncStatus();
    }

    updateAccountMetrics() {
        const metrics = this.tradingManager.calculatePerformanceMetrics();
        const balance = this.tradingManager.accountData.balance;
        
        Utils.updateElementText('accountValue', Utils.formatCurrency(balance));
        Utils.updateElementText('totalReturn', Utils.formatPercentage(parseFloat(metrics.totalReturn), true));
        Utils.updateElementText('monthlyReturn', Utils.formatPercentage(parseFloat(metrics.monthlyReturn), true));
        Utils.updateElementText('winRate', `${metrics.winRate}%`);
        
        // Color coding for returns
        const totalReturnElement = document.getElementById('totalReturn');
        const monthlyReturnElement = document.getElementById('monthlyReturn');
        
        if (totalReturnElement) {
            totalReturnElement.style.color = parseFloat(metrics.totalReturn) >= 0 ? '#38a169' : '#e53e3e';
        }
        if (monthlyReturnElement) {
            monthlyReturnElement.style.color = parseFloat(metrics.monthlyReturn) >= 0 ? '#38a169' : '#e53e3e';
        }
    }

    updatePositionMetrics() {
        const positions = this.tradingManager.getActivePositions();
        const riskLevel = this.tradingManager.getRiskLevel();
        
        Utils.updateElementText('activePositions', positions.count.toString());
        Utils.updateElementText('capitalAtRisk', Utils.formatCurrency(positions.capitalAtRisk));
        Utils.updateElementText('maxLoss', Utils.formatCurrency(positions.maxLoss));
        
        const riskElement = document.getElementById('riskLevel');
        if (riskElement) {
            riskElement.textContent = riskLevel.level;
            riskElement.className = `risk-indicator ${riskLevel.class}`;
        }
    }

    updatePerformanceMetrics() {
        const metrics = this.tradingManager.calculatePerformanceMetrics();
        
        Utils.updateElementText('avgReturn', Utils.formatPercentage(parseFloat(metrics.avgReturn)));
        Utils.updateElementText('bestTrade', Utils.formatCurrency(metrics.bestTrade));
        Utils.updateElementText('worstTrade', Utils.formatCurrency(metrics.worstTrade));
        Utils.updateElementText('sharpeRatio', metrics.sharpeRatio);
    }

    updateTradeHistory() {
        const historyContainer = document.getElementById('tradeHistory');
        if (!historyContainer) return;
        
        const trades = this.tradingManager.accountData.trades;
        
        if (trades.length === 0) {
            historyContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #718096;">No trades yet. Add your first trade to get started!</div>';
            return;
        }
        
        const tradesHtml = trades.slice(-10).reverse().map(trade => `
            <div class="trade-item ${trade.status === 'Open' ? 'status-open' : 'status-closed'}">
                <div><strong>${trade.underlying}</strong></div>
                <div>${trade.type}</div>
                <div>${trade.openDate}</div>
                <div>${trade.status}</div>
                <div style="color: ${trade.pnl >= 0 ? '#38a169' : '#e53e3e'}">${Utils.formatCurrency(trade.pnl, true)}</div>
                ${trade.status === 'Open' ? `<button onclick="app.closeTrade(${trade.id}, prompt('Enter P&L:'))" style="font-size: 0.8rem; padding: 5px 10px;">Close</button>` : ''}
            </div>
        `).join('');
        
        historyContainer.innerHTML = tradesHtml;
    }

    updateCharts() {
        const accountData = this.tradingManager.accountData;
        const positions = this.tradingManager.getActivePositions();
        
        this.chartManager.updateAccountChart(accountData.accountHistory);
        this.chartManager.updateRiskChart(positions.availableCapital, positions.capitalAtRisk);
        this.chartManager.updatePerformanceChart(accountData.trades);
    }

    updateVixDisplay() {
        Utils.updateElementText('vixLevel', this.vixData.level || '--');
        Utils.updateElementText('vixEnvironment', this.vixData.environment);
        Utils.updateElementColor('vixEnvironment', this.vixData.color || '#2d3748');
        Utils.updateElementText('vixRecommendation', this.vixData.recommendation || '--');
        Utils.updateElementColor('vixRecommendation', this.vixData.color || '#2d3748');
        Utils.updateElementText('lastVixUpdate', this.vixData.lastUpdate || '--');
        Utils.updateElementText('vixAnalysisText', this.vixData.analysis || 'Loading market data...');
    }

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
        const googleStatus = this.storageManager.getGoogleSyncStatus();
        
        if (googleStatus.isSignedIn) {
            Utils.updateElementText('syncStatus', 'Google Drive');
            Utils.updateElementText('syncProvider', googleStatus.user.email);
            Utils.updateElementText('lastSync', googleStatus.lastSync || '--');
        } else if (googleStatus.isConfigured) {
            Utils.updateElementText('syncStatus', 'Configured (Not Signed In)');
            Utils.updateElementText('syncProvider', 'Google Drive');
            Utils.updateElementText('lastSync', '--');
        } else {
            Utils.updateElementText('syncStatus', 'Manual Mode');
            Utils.updateElementText('syncProvider', 'Export/Import');
            const syncStatus = this.storageManager.getSyncStatus();
            Utils.updateElementText('lastSync', syncStatus.lastSync || '--');
        }
        
        Utils.updateElementText('currentDevice', googleStatus.deviceId);
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

    // Google Drive Sync Functions
    async setupGoogleSync() {
        try {
            const modal = this.createGoogleSyncModal();
            document.body.appendChild(modal);
        } catch (error) {
            this.showError('Error setting up Google sync: ' + error.message);
        }
    }

    createGoogleSyncModal() {
        const modal = document.createElement('div');
        modal.className = 'sync-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; color: #4a5568;">🔐 Google Drive Sync Setup</h3>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #4285f4;">
                    <strong>🔒 Privacy Guarantee:</strong> Your trading data will be stored securely in YOUR private Google Drive only. 
                    No one else can access it, including the developers. The data is encrypted and stored in your app-specific folder.
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: #f0fff4; border-radius: 8px; border-left: 4px solid #38a169;">
                    <strong>✨ Benefits:</strong>
                    <ul style="margin: 10px 0 0 20px; color: #4a5568;">
                        <li>Automatic sync across all your devices</li>
                        <li>Secure cloud backup of your trading data</li>
                        <li>Access your dashboard from anywhere</li>
                        <li>Never lose your trading history again</li>
                    </ul>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #4a5568;">
                        📋 Step 1: Enter your Google Client ID:
                    </label>
                    <input type="text" id="clientIdInput" placeholder="123456789012-abcdefghijklmnop.apps.googleusercontent.com" 
                           style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 0.9rem; margin-bottom: 10px;">
                    <div style="font-size: 0.85rem; color: #718096; margin-bottom: 10px;">
                        Don't have one? <a href="#" onclick="app.showGoogleSetupInstructions()" style="color: #4285f4; text-decoration: none;">📖 Get your Client ID here</a>
                    </div>
                    <div style="font-size: 0.8rem; color: #e53e3e;">
                        ⚠️ Must end with .apps.googleusercontent.com
                    </div>
                </div>

                <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="app.enableGoogleDriveSync()" style="background: #4285f4; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 200px;">
                        ✅ Enable Google Drive Sync
                    </button>
                    <button onclick="app.useManualSyncOnly()" style="background: #718096; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 200px;">
                        📱 Use Manual Export/Import
                    </button>
                </div>
                
                <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                    <button onclick="app.closeModal()" style="background: #e2e8f0; color: #4a5568; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1;">
                        Cancel
                    </button>
                </div>

                <div style="font-size: 0.85rem; color: #4a5568; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <strong>🔐 Security Note:</strong> Your Client ID is safe to share - it's like a public phone number that identifies your app but doesn't grant access to your data. 
                    Only you can authorize access to your Google Drive through the secure OAuth flow.
                </div>
            </div>
        `;

        return modal;
    }

    showGoogleSetupInstructions() {
        const instructions = `
🚀 How to get your Google Client ID:

1. Go to: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the "Google Drive API":
   • Go to "APIs & Services" → "Library"
   • Search for "Google Drive API" and enable it
4. Create credentials:
   • Go to "APIs & Services" → "Credentials"
   • Click "Create Credentials" → "OAuth client ID"
   • Choose "Web application"
   • Add your GitHub Pages URL to "Authorized JavaScript origins"
     (e.g., https://yourusername.github.io)
5. Copy the Client ID (ends with .apps.googleusercontent.com)

🔒 This is completely safe - the Client ID is public configuration, not a secret!

💡 Tip: Make sure to add both your GitHub Pages URL and localhost for testing.
        `;
        
        alert(instructions);
    }

    async enableGoogleDriveSync() {
        try {
            const clientId = document.getElementById('clientIdInput').value.trim();
            
            if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
                this.showError('Please enter a valid Google Client ID ending with .apps.googleusercontent.com');
                return;
            }

            // Initialize Google Drive API
            await this.storageManager.initializeGoogleDrive(clientId);
            
            // Sign in to Google
            const signInResult = await this.storageManager.signInToGoogle();
            
            if (signInResult.success) {
                this.closeModal();
                this.updateSyncStatus();
                this.showSuccess(`✅ Google Drive sync enabled successfully!\n\nSigned in as: ${signInResult.user}\n\nYour trading data will now sync automatically across all your devices.`);
            } else {
                this.showError('Failed to sign in to Google: ' + signInResult.error);
            }
        } catch (error) {
            console.error('Google Drive setup error:', error);
            
            let errorMessage = '❌ Failed to set up Google Drive sync.\n\n';
            
            if (error.message.includes('popup')) {
                errorMessage += 'Issue: Popup blocked or failed to load.\n\n';
                errorMessage += 'Solutions:\n';
                errorMessage += '• Allow popups for this site\n';
                errorMessage += '• Try in incognito/private browser window\n';
                errorMessage += '• Make sure you\'re on HTTPS (GitHub Pages URL)';
            } else if (error.message.includes('invalid_client')) {
                errorMessage += 'Issue: Invalid Client ID\n\n';
                errorMessage += 'Solutions:\n';
                errorMessage += '• Double-check your Client ID format\n';
                errorMessage += '• Ensure it ends with .apps.googleusercontent.com\n';
                errorMessage += '• Verify the Client ID is from the correct Google project';
            } else {
                errorMessage += `Error: ${error.message}\n\n`;
                errorMessage += 'Check the browser console for more details.';
            }
            
            this.showError(errorMessage);
        }
    }

    useManualSyncOnly() {
        this.closeModal();
        this.updateSyncStatus();
        this.showSuccess('📱 Manual sync mode selected.\n\nUse the Export/Import buttons to transfer data between devices.');
    }

    closeModal() {
        const modal = document.querySelector('.sync-modal');
        if (modal && modal.parentNode) {
            document.body.removeChild(modal);
        }
    }

    async syncToCloud() {
        try {
            if (!this.storageManager.isSignedInToGoogle()) {
                this.showError('Please set up Google Drive sync first.');
                return;
            }

            const result = await this.storageManager.syncToGoogleDrive(this.tradingManager.accountData);
            
            if (result.success) {
                this.updateSyncStatus();
                this.showSuccess(`✅ Data synced to Google Drive successfully!\n\nLast sync: ${result.lastSync}`);
            } else {
                this.showError('Failed to sync to Google Drive: ' + result.error);
            }
        } catch (error) {
            this.showError('Error syncing to cloud: ' + error.message);
        }
    }

    async syncFromCloud() {
        try {
            if (!this.storageManager.isSignedInToGoogle()) {
                this.showError('Please set up Google Drive sync first.');
                return;
            }

            const result = await this.storageManager.syncFromGoogleDrive();
            
            if (result.success) {
                const syncDate = result.lastSync;
                const sourceDevice = result.sourceDevice;
                
                if (confirm(`Found synced data from ${syncDate}\nSource device: ${sourceDevice}\n\nReplace current data with synced version?`)) {
                    this.tradingManager.accountData = result.accountData;
                    this.storageManager.saveData(this.tradingManager.accountData);
                    this.updateAllDisplays();
                    this.updateSyncStatus();
                    
                    this.showSuccess('✅ Data successfully synced from Google Drive!');
                } else {
                    this.showSuccess('Sync cancelled. Your current data was not changed.');
                }
            } else {
                this.showError('Failed to sync from Google Drive: ' + result.error);
            }
        } catch (error) {
            this.showError('Error syncing from cloud: ' + error.message);
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
