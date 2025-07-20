// Storage and Data Persistence Module
class StorageManager {
    constructor() {
        this.storageKey = 'creditSpreadsData';
        this.syncKey = 'creditSpreadsSync';
        this.deviceIdKey = 'deviceId';
        this.googleClientIdKey = 'googleClientId';
        this.googleAccessTokenKey = 'googleAccessToken';
        this.syncFileName = 'credit-spreads-data.json';
        this.isGoogleApiLoaded = false;
        this.googleAuthInstance = null;
    }

    // Core Data Persistence
    saveData(accountData) {
        try {
            const dataToSave = JSON.stringify(accountData);
            localStorage.setItem(this.storageKey, dataToSave);
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return null;
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.syncKey);
            console.log('All data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Export/Import Functions
    exportData(accountData) {
        try {
            const exportData = {
                ...accountData,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type:'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `credit-spreads-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data structure
                    if (!this.validateImportData(importedData)) {
                        reject(new Error('Invalid file format'));
                        return;
                    }
                    
                    resolve(importedData);
                } catch (error) {
                    reject(new Error('Error parsing file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        // Check if data has required structure
        return data && 
               typeof data.balance === 'number' &&
               typeof data.startingBalance === 'number' &&
               Array.isArray(data.trades) &&
               Array.isArray(data.accountHistory);
    }

    // Device Management
    getDeviceId() {
        let deviceId = localStorage.getItem(this.deviceIdKey);
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.deviceIdKey, deviceId);
        }
        return deviceId;
    }

    // Enhanced Export for Multi-Device Sync
    exportDataWithSync(accountData) {
        try {
            const syncData = {
                accountData: accountData,
                lastSync: new Date().toISOString(),
                deviceId: this.getDeviceId(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(syncData, null, 2);
            const dataBlob = new Blob([dataStr], {type:'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `credit-spreads-sync-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Also save sync marker locally
            localStorage.setItem(this.syncKey, JSON.stringify(syncData));
            
            return {
                success: true,
                lastSync: new Date().toLocaleString()
            };
        } catch (error) {
            console.error('Error exporting sync data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Import from other device
    importSyncData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const syncData = JSON.parse(e.target.result);
                    
                    // Validate sync data structure
                    if (!this.validateSyncData(syncData)) {
                        reject(new Error('Invalid sync file format'));
                        return;
                    }
                    
                    // Store sync data locally
                    localStorage.setItem(this.syncKey, JSON.stringify(syncData));
                    
                    resolve({
                        accountData: syncData.accountData,
                        lastSync: new Date(syncData.lastSync).toLocaleString(),
                        sourceDevice: syncData.deviceId
                    });
                } catch (error) {
                    reject(new Error('Error parsing sync file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading sync file'));
            };
            
            reader.readAsText(file);
        });
    }

    validateSyncData(data) {
        return data && 
               data.accountData &&
               data.lastSync &&
               data.deviceId &&
               this.validateImportData(data.accountData);
    }

    // Get sync status
    getSyncStatus() {
        try {
            const syncData = localStorage.getItem(this.syncKey);
            if (syncData) {
                const parsed = JSON.parse(syncData);
                return {
                    hasSync: true,
                    lastSync: new Date(parsed.lastSync).toLocaleString(),
                    deviceId: parsed.deviceId
                };
            }
        } catch (error) {
            console.error('Error getting sync status:', error);
        }
        
        return {
            hasSync: false,
            lastSync: null,
            deviceId: this.getDeviceId()
        };
    }

    // Settings Management
    saveSettings(settings) {
        try {
            localStorage.setItem('creditSpreadsSettings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('creditSpreadsSettings');
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        
        // Return default settings
        return {
            riskPercentage: 15,
            defaultDTE: 30,
            autoSave: true,
            notifications: true
        };
    }

    // Data Validation
    validateAccountData(data) {
        if (!data) return false;
        
        // Check required fields
        if (typeof data.balance !== 'number' || data.balance < 0) return false;
        if (typeof data.startingBalance !== 'number' || data.startingBalance <= 0) return false;
        if (!Array.isArray(data.trades)) return false;
        if (!Array.isArray(data.accountHistory)) return false;
        
        // Validate trades
        for (const trade of data.trades) {
            if (!this.validateTrade(trade)) return false;
        }
        
        return true;
    }

    validateTrade(trade) {
        const requiredFields = ['id', 'type', 'underlying', 'openDate', 'status'];
        for (const field of requiredFields) {
            if (!(field in trade)) return false;
        }
        
        // Validate trade types
        const validTypes = ['Bull Put Spread', 'Bear Call Spread'];
        if (!validTypes.includes(trade.type)) return false;
        
        // Validate status
        const validStatuses = ['Open', 'Closed'];
        if (!validStatuses.includes(trade.status)) return false;
        
        return true;
    }

    // Backup and Recovery
    createBackup(accountData) {
        try {
            const backup = {
                accountData: accountData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem('creditSpreadsBackup', JSON.stringify(backup));
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }

    restoreFromBackup() {
        try {
            const backup = localStorage.getItem('creditSpreadsBackup');
            if (backup) {
                const parsed = JSON.parse(backup);
                return parsed.accountData;
            }
        } catch (error) {
            console.error('Error restoring from backup:', error);
        }
        return null;
    }

    // Storage Info
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const sync = localStorage.getItem(this.syncKey);
            const backup = localStorage.getItem('creditSpreadsBackup');
            
            return {
                hasData: !!data,
                hasSync: !!sync,
                hasBackup: !!backup,
                dataSize: data ? data.length : 0,
                totalSize: (data?.length || 0) + (sync?.length || 0) + (backup?.length || 0)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    // Google Drive Cloud Sync Functions
    async initializeGoogleDrive(clientId) {
        try {
            console.log('Initializing Google Drive API...');
            
            // Store client ID
            localStorage.setItem(this.googleClientIdKey, clientId);
            
            return new Promise((resolve, reject) => {
                // Load Google APIs
                if (typeof gapi === 'undefined') {
                    reject(new Error('Google API not loaded. Please include the Google API script.'));
                    return;
                }
                
                gapi.load('auth2', () => {
                    gapi.auth2.init({
                        client_id: clientId,
                        scope: 'https://www.googleapis.com/auth/drive.file'
                    }).then((authInstance) => {
                        this.googleAuthInstance = authInstance;
                        this.isGoogleApiLoaded = true;
                        console.log('Google Drive API initialized successfully');
                        resolve(true);
                    }).catch(reject);
                });
            });
        } catch (error) {
            console.error('Error initializing Google Drive:', error);
            throw error;
        }
    }

    async signInToGoogle() {
        try {
            if (!this.googleAuthInstance) {
                throw new Error('Google API not initialized');
            }
            
            const user = await this.googleAuthInstance.signIn();
            const accessToken = user.getAuthResponse().access_token;
            
            // Store access token securely
            localStorage.setItem(this.googleAccessTokenKey, accessToken);
            
            console.log('Successfully signed in to Google');
            return {
                success: true,
                user: user.getBasicProfile().getEmail()
            };
        } catch (error) {
            console.error('Error signing in to Google:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async signOutFromGoogle() {
        try {
            if (this.googleAuthInstance) {
                await this.googleAuthInstance.signOut();
            }
            
            // Clear stored tokens
            localStorage.removeItem(this.googleAccessTokenKey);
            
            console.log('Successfully signed out from Google');
            return { success: true };
        } catch (error) {
            console.error('Error signing out from Google:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    isSignedInToGoogle() {
        if (!this.googleAuthInstance) return false;
        return this.googleAuthInstance.isSignedIn.get();
    }

    getGoogleUser() {
        if (!this.isSignedInToGoogle()) return null;
        const user = this.googleAuthInstance.currentUser.get();
        return {
            email: user.getBasicProfile().getEmail(),
            name: user.getBasicProfile().getName()
        };
    }

    async syncToGoogleDrive(accountData) {
        try {
            if (!this.isSignedInToGoogle()) {
                throw new Error('Not signed in to Google');
            }
            
            const accessToken = localStorage.getItem(this.googleAccessTokenKey);
            if (!accessToken) {
                throw new Error('No access token found');
            }
            
            const syncData = {
                accountData: accountData,
                lastSync: new Date().toISOString(),
                deviceId: this.getDeviceId(),
                version: '1.0'
            };
            
            // Check if file exists
            const existingFileId = await this.findGoogleDriveFile();
            
            let result;
            if (existingFileId) {
                // Update existing file
                result = await this.updateGoogleDriveFile(existingFileId, syncData, accessToken);
            } else {
                // Create new file
                result = await this.createGoogleDriveFile(syncData, accessToken);
            }
            
            // Update local sync status
            localStorage.setItem(this.syncKey, JSON.stringify({
                ...syncData,
                googleFileId: result.id,
                lastGoogleSync: new Date().toISOString()
            }));
            
            console.log('Successfully synced to Google Drive');
            return {
                success: true,
                fileId: result.id,
                lastSync: new Date().toLocaleString()
            };
        } catch (error) {
            console.error('Error syncing to Google Drive:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async syncFromGoogleDrive() {
        try {
            if (!this.isSignedInToGoogle()) {
                throw new Error('Not signed in to Google');
            }
            
            const accessToken = localStorage.getItem(this.googleAccessTokenKey);
            if (!accessToken) {
                throw new Error('No access token found');
            }
            
            const fileId = await this.findGoogleDriveFile();
            if (!fileId) {
                throw new Error('No sync file found in Google Drive');
            }
            
            const fileContent = await this.downloadGoogleDriveFile(fileId, accessToken);
            const syncData = JSON.parse(fileContent);
            
            // Validate data
            if (!this.validateSyncData(syncData)) {
                throw new Error('Invalid sync data from Google Drive');
            }
            
            // Update local sync status
            localStorage.setItem(this.syncKey, JSON.stringify({
                ...syncData,
                googleFileId: fileId,
                lastGoogleSync: new Date().toISOString()
            }));
            
            console.log('Successfully synced from Google Drive');
            return {
                success: true,
                accountData: syncData.accountData,
                lastSync: new Date(syncData.lastSync).toLocaleString(),
                sourceDevice: syncData.deviceId
            };
        } catch (error) {
            console.error('Error syncing from Google Drive:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async findGoogleDriveFile() {
        try {
            const accessToken = localStorage.getItem(this.googleAccessTokenKey);
            if (!accessToken) return null;
            
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${this.syncFileName}'`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Google Drive API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0].id : null;
        } catch (error) {
            console.error('Error finding Google Drive file:', error);
            return null;
        }
    }

    async createGoogleDriveFile(syncData, accessToken) {
        const metadata = {
            name: this.syncFileName,
            parents: ['appDataFolder'] // Store in app-specific folder
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', new Blob([JSON.stringify(syncData, null, 2)], {type: 'application/json'}));
        
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to create Google Drive file: ${response.status}`);
        }
        
        return await response.json();
    }

    async updateGoogleDriveFile(fileId, syncData, accessToken) {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(syncData, null, 2)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to update Google Drive file: ${response.status}`);
        }
        
        return await response.json();
    }

    async downloadGoogleDriveFile(fileId, accessToken) {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to download Google Drive file: ${response.status}`);
        }
        
        return await response.text();
    }

    // Enhanced sync status for Google Drive
    getGoogleSyncStatus() {
        try {
            const clientId = localStorage.getItem(this.googleClientIdKey);
            const syncData = localStorage.getItem(this.syncKey);
            const isSignedIn = this.isSignedInToGoogle();
            
            let status = {
                isConfigured: !!clientId,
                isSignedIn: isSignedIn,
                clientId: clientId,
                user: isSignedIn ? this.getGoogleUser() : null,
                hasLocalSync: !!syncData,
                lastSync: null,
                deviceId: this.getDeviceId()
            };
            
            if (syncData) {
                const parsed = JSON.parse(syncData);
                status.lastSync = parsed.lastGoogleSync ? 
                    new Date(parsed.lastGoogleSync).toLocaleString() : 
                    'Never';
            }
            
            return status;
        } catch (error) {
            console.error('Error getting Google sync status:', error);
            return {
                isConfigured: false,
                isSignedIn: false,
                error: error.message
            };
        }
    }

    clearGoogleSyncData() {
        try {
            localStorage.removeItem(this.googleClientIdKey);
            localStorage.removeItem(this.googleAccessTokenKey);
            localStorage.removeItem(this.syncKey);
            this.googleAuthInstance = null;
            this.isGoogleApiLoaded = false;
            return true;
        } catch (error) {
            console.error('Error clearing Google sync data:', error);
            return false;
        }
    }
}

// Export for use in main app
window.StorageManager = StorageManager;
