// Chart Management Module
class ChartManager {
    constructor() {
        this.charts = {};
    }

    initializeCharts() {
        this.initAccountChart();
        this.initRiskChart();
        this.initPerformanceChart();
        this.initTrendChart();
    }

    initAccountChart() {
        const accountCtx = document.getElementById('accountChart').getContext('2d');
        this.charts.account = new Chart(accountCtx, {
            type: 'line',
            data: {
                labels: ['Start'],
                datasets: [{
                    label: 'Account Value',
                    data: [3000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initRiskChart() {
        const riskCtx = document.getElementById('riskChart').getContext('2d');
        this.charts.risk = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Available Capital', 'Capital at Risk'],
                datasets: [{
                    data: [3000, 0],
                    backgroundColor: ['#38a169', '#e53e3e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    initPerformanceChart() {
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Trade P&L',
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    initTrendChart() {
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        this.charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: '% Change'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateAccountChart(accountHistory) {
        if (!this.charts.account) return;
        
        const labels = accountHistory.map((_, index) => `Day ${index + 1}`);
        this.charts.account.data.labels = labels;
        this.charts.account.data.datasets[0].data = accountHistory;
        this.charts.account.update();
    }

    updateRiskChart(availableCapital, capitalAtRisk) {
        if (!this.charts.risk) return;
        
        this.charts.risk.data.datasets[0].data = [availableCapital, capitalAtRisk];
        this.charts.risk.update();
    }

    updatePerformanceChart(trades) {
        if (!this.charts.performance) return;
        
        const closedTrades = trades.filter(t => t.status === 'Closed');
        const labels = closedTrades.map((t, i) => `Trade ${i + 1}`);
        const data = closedTrades.map(t => t.pnl);
        const colors = data.map(pnl => pnl >= 0 ? '#38a169' : '#e53e3e');
        
        this.charts.performance.data.labels = labels;
        this.charts.performance.data.datasets[0].data = data;
        this.charts.performance.data.datasets[0].backgroundColor = colors;
        this.charts.performance.update();
    }

    updateTrendChart(trendData) {
        if (!this.charts.trend || !trendData || trendData.length === 0) return;
        
        const spyData = trendData.find(d => d.symbol === 'SPY');
        const qqqData = trendData.find(d => d.symbol === 'QQQ');
        
        if (spyData && qqqData && spyData.prices && qqqData.prices) {
            try {
                const spyNormalized = this.normalizeToPercentage(spyData.prices);
                const qqqNormalized = this.normalizeToPercentage(qqqData.prices);
                
                this.charts.trend.data.labels = spyData.dates.map(d => 
                    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                );
                this.charts.trend.data.datasets = [
                    {
                        label: 'SPY',
                        data: spyNormalized,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'QQQ',
                        data: qqqNormalized,
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        borderWidth: 2,
                        fill: false
                    }
                ];
                this.charts.trend.update();
            } catch (error) {
                console.error('Error updating trend chart:', error);
            }
        }
    }

    normalizeToPercentage(prices) {
        if (!prices || prices.length === 0) return [];
        const firstPrice = prices[0];
        if (firstPrice === 0) return prices.map(() => 0);
        return prices.map(price => ((price - firstPrice) / firstPrice) * 100);
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Export for use in main app
window.ChartManager = ChartManager;
