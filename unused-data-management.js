// Data Management Module - handles localStorage, export/import, and sync functionality

import { CONFIG } from './config.js';

export class DataManager {
    constructor() {
        this.accountData = this.loadData() || {
            balance: CONFIG.STARTING_BALANCE,
            startingBalance: CONFIG.STARTING_BALANCE,
            trades: [],
            accountHistory: [CONFIG.STARTING_BALANCE]
        };
        
        this.cloudSync = {
            enabled: false,
            provider: null,
            lastSync: null,
            status: 'Not configured',
            clientId: null,
            accessToken: null
        };
    }

    // Data persistence functions
    saveData() {
        try {
            const dataToSave = JSON.stringify(this.accountData);
            localStorage.setItem(CONFIG.STORAGE_KEYS.account_data, dataToSave);
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem(CONFIG.STORAGE_KEYS.account_data);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return null;
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all trade data? This cannot be undone.')) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.account_data);
            this.accountData = {
                balance: CONFIG.STARTING_BALANCE,
                startingBalance: CONFIG.STARTING_BALANCE,
                trades: [],
                accountHistory: [CONFIG.STARTING_BALANCE]
            };
            return true;
        }
        return false;
    }

    exportData() {
        const dataStr = JSON.stringify(this.accountData, null, 2);
        const dataBlob = new Blob([dataStr], {type:'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `credit-spreads-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (confirm('This will replace all current data. Continue?')) {
                        this.accountData = importedData;
                        this.saveData();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    reject(new Error('Invalid file format'));
                }
            };
            reader.readAsText(file);
        });
    }

    // Trade management
    addTrade(trade) {
        trade.id = Date.now();
        trade.openDate = new Date().toLocaleDateString();
        trade.status = 'Open';
        trade.pnl = 0;
        trade.closeDate = null;
        
        this.accountData.trades.push(trade);
        this.saveData();
        return trade;
    }

    closeTrade(tradeId, pnl) {
        const trade = this.accountData.trades.find(t => t.id === tradeId);
        if (trade) {
            trade.status = 'Closed';
            trade.pnl = pnl;
            trade.closeDate = new Date().toLocaleDateString();
            this.accountData.balance += pnl;
            this.accountData.accountHistory.push(this.accountData.balance);
            this.saveData();
            return true;
        }
        return false;
    }

    getAccountData() {
        return this.accountData;
    }

    updateBalance(newBalance) {
        this.accountData.balance = newBalance;
        this.accountData.accountHistory.push(newBalance);
        this.saveData();
    }

    // Cloud sync functions (simplified)
    exportDataWithSync() {
        const syncData = {
            accountData: this.accountData,
            lastSync: new Date().toISOString(),
            deviceId: this.getDeviceId(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(syncData, null, 2);
        const dataBlob = new Blob([dataStr], {type:'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `credit-spreads-sync-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.cloudSync.lastSync = new Date().toLocaleString();
    }

    getDeviceId() {
        let deviceId = localStorage.getItem(CONFIG.STORAGE_KEYS.device_id);
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(CONFIG.STORAGE_KEYS.device_id, deviceId);
        }
        return deviceId;
    }

    getSyncStatus() {
        return {
            status: this.cloudSync.status || 'Manual Mode',
            provider: this.cloudSync.provider || 'Export/Import',
            lastSync: this.cloudSync.lastSync || '--',
            deviceId: this.getDeviceId()
        };
    }
}
