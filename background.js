// Background Service Worker for Freelancer AI Toolkit
class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupContextMenus();
        this.setupAlarms();
    }

    setupEventListeners() {
        // Extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate();
            }
        });

        // Message handling from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Tab updates for platform detection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleTabUpdate(tabId, tab);
            }
        });

        // Storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.handleStorageChange(changes, namespace);
        });
    }

    setupContextMenus() {
        chrome.contextMenus.removeAll(() => {
            // Add context menu for selected text
            chrome.contextMenus.create({
                id: 'generate-proposal',
                title: 'Generate AI Proposal from Selection',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'estimate-price',
                title: 'Get Price Estimate for Selection',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'generate-reply',
                title: 'Generate Client Reply',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'separator-1',
                type: 'separator',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'add-to-crm',
                title: 'Add to CRM',
                contexts: ['selection']
            });
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    setupAlarms() {
        // Set up periodic syncing and reminders
        chrome.alarms.create('dailySync', {
            delayInMinutes: 1,
            periodInMinutes: 24 * 60 // Daily
        });

        chrome.alarms.create('weeklyReport', {
            delayInMinutes: 60,
            periodInMinutes: 7 * 24 * 60 // Weekly
        });

        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    async handleFirstInstall() {
        // Initialize default settings and data
        const defaultSettings = {
            aiProvider: 'huggingface',
            autoSync: true,
            notifications: true,
            theme: 'light',
            currency: 'USD',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        await chrome.storage.local.set({
            settings: defaultSettings,
            clients: [],
            incomeEntries: [],
            proposals: [],
            templates: this.getDefaultTemplates()
        });

        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
    }

    async handleUpdate() {
        // Handle extension updates
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};

        // Migrate settings if needed
        if (!settings.version || settings.version < '1.0.0') {
            await this.migrateData();
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'EXTRACT_GMAIL_DATA':
                    const gmailData = await this.extractGmailData(message.data);
                    sendResponse({ success: true, data: gmailData });
                    break;

                case 'EXTRACT_WHATSAPP_DATA':
                    const whatsappData = await this.extractWhatsAppData(message.data);
                    sendResponse({ success: true, data: whatsappData });
                    break;

                case 'SYNC_INCOME':
                    await this.syncIncomeData(message.data);
                    sendResponse({ success: true });
                    break;

                case 'GENERATE_INVOICE':
                    const invoice = await this.generateInvoice(message.data);
                    sendResponse({ success: true, invoice });
                    break;

                case 'BACKUP_DATA':
                    const backup = await this.createBackup();
                    sendResponse({ success: true, backup });
                    break;

                case 'RESTORE_DATA':
                    await this.restoreBackup(message.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleTabUpdate(tabId, tab) {
        if (!tab.url) return;

        // Detect freelance platforms and inject helpers
        if (tab.url.includes('upwork.com')) {
            await this.injectUpworkHelpers(tabId);
        } else if (tab.url.includes('fiverr.com')) {
            await this.injectFiverrHelpers(tabId);
        } else if (tab.url.includes('mail.google.com')) {
            await this.injectGmailHelpers(tabId);
        } else if (tab.url.includes('web.whatsapp.com')) {
            await this.injectWhatsAppHelpers(tabId);
        }
    }

    async handleContextMenuClick(info, tab) {
        const selectedText = info.selectionText;

        switch (info.menuItemId) {
            case 'generate-proposal':
                await this.contextGenerateProposal(selectedText, tab);
                break;
            case 'estimate-price':
                await this.contextEstimatePrice(selectedText, tab);
                break;
            case 'generate-reply':
                await this.contextGenerateReply(selectedText, tab);
                break;
            case 'add-to-crm':
                await this.contextAddToCRM(selectedText, tab);
                break;
        }
    }

    async handleAlarm(alarm) {
        switch (alarm.name) {
            case 'dailySync':
                await this.performDailySync();
                break;
            case 'weeklyReport':
                await this.generateWeeklyReport();
                break;
        }
    }

    async handleStorageChange(changes, namespace) {
        // React to storage changes
        if (changes.incomeEntries) {
            await this.updateIncomeStats();
        }

        if (changes.clients) {
            await this.updateCRMStats();
        }
    }

    // Platform-specific injection methods
    async injectUpworkHelpers(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/freelance-platforms.js']
            });
        } catch (error) {
            console.error('Failed to inject Upwork helpers:', error);
        }
    }

    async injectFiverrHelpers(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/freelance-platforms.js']
            });
        } catch (error) {
            console.error('Failed to inject Fiverr helpers:', error);
        }
    }

    async injectGmailHelpers(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/gmail.js']
            });
        } catch (error) {
            console.error('Failed to inject Gmail helpers:', error);
        }
    }

    async injectWhatsAppHelpers(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/whatsapp.js']
            });
        } catch (error) {
            console.error('Failed to inject WhatsApp helpers:', error);
        }
    }

    // Context menu actions
    async contextGenerateProposal(selectedText, tab) {
        const data = {
            text: selectedText,
            url: tab.url,
            title: tab.title
        };

        // Send to popup or create notification
        chrome.action.openPopup();

        // Store the context for use in popup
        await chrome.storage.local.set({
            contextData: {
                type: 'proposal',
                data: data,
                timestamp: Date.now()
            }
        });
    }

    async contextEstimatePrice(selectedText, tab) {
        const data = {
            text: selectedText,
            url: tab.url,
            title: tab.title
        };

        chrome.action.openPopup();

        await chrome.storage.local.set({
            contextData: {
                type: 'pricing',
                data: data,
                timestamp: Date.now()
            }
        });
    }

    async contextGenerateReply(selectedText, tab) {
        const data = {
            text: selectedText,
            url: tab.url,
            title: tab.title
        };

        chrome.action.openPopup();

        await chrome.storage.local.set({
            contextData: {
                type: 'reply',
                data: data,
                timestamp: Date.now()
            }
        });
    }

    async contextAddToCRM(selectedText, tab) {
        // Try to extract contact information from selected text
        const contactInfo = this.extractContactInfo(selectedText);

        await chrome.storage.local.set({
            contextData: {
                type: 'crm',
                data: contactInfo,
                timestamp: Date.now()
            }
        });

        chrome.action.openPopup();
    }

    extractContactInfo(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

        const emails = text.match(emailRegex) || [];
        const phones = text.match(phoneRegex) || [];
        const names = text.match(nameRegex) || [];

        return {
            email: emails[0] || '',
            phone: phones[0] || '',
            name: names[0] || '',
            originalText: text
        };
    }

    // Data processing methods
    async extractGmailData(data) {
        // Process Gmail data for income tracking
        const incomeKeywords = [
            'payment received', 'invoice paid', 'paypal', 'stripe',
            'upwork payment', 'fiverr payment', 'freelancer payment'
        ];

        const entries = [];

        // This would process actual Gmail data
        // For now, return mock data structure
        return {
            entries: entries,
            totalFound: entries.length
        };
    }

    async extractWhatsAppData(data) {
        // Process WhatsApp messages for income/client info
        const paymentKeywords = [
            'paid', 'payment', 'transferred', 'sent money', 'invoice'
        ];

        const entries = [];

        // This would process actual WhatsApp data
        return {
            entries: entries,
            totalFound: entries.length
        };
    }

    async syncIncomeData(data) {
        const result = await chrome.storage.local.get(['incomeEntries']);
        const existingEntries = result.incomeEntries || [];

        // Merge new data with existing, avoiding duplicates
        const newEntries = data.filter(entry =>
            !existingEntries.some(existing =>
                existing.id === entry.id ||
                (existing.amount === entry.amount && existing.date === entry.date)
            )
        );

        if (newEntries.length > 0) {
            await chrome.storage.local.set({
                incomeEntries: [...existingEntries, ...newEntries]
            });

            // Show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Income Synced',
                message: `Added ${newEntries.length} new income entries`
            });
        }
    }

    async generateInvoice(data) {
        // Generate invoice based on template and data
        const template = this.getInvoiceTemplate(data.templateType);

        return template.replace(/\[([^\]]+)\]/g, (match, key) => {
            return data[key.toLowerCase()] || match;
        });
    }

    getInvoiceTemplate(type) {
        const templates = {
            basic: `
                INVOICE #[INVOICE_NUMBER]
                Date: [DATE]
                
                From: [FROM_NAME]
                To: [TO_NAME]
                
                Description: [DESCRIPTION]
                Amount: $[AMOUNT]
                
                Total: $[TOTAL]
                
                Payment due within 30 days.
            `,
            professional: `
                <!-- Professional invoice template would go here -->
            `,
            creative: `
                <!-- Creative invoice template would go here -->
            `
        };

        return templates[type] || templates.basic;
    }

    async performDailySync() {
        // Perform daily background sync
        try {
            // Check for new emails, messages, etc.
            const tabs = await chrome.tabs.query({});

            for (const tab of tabs) {
                if (tab.url.includes('mail.google.com')) {
                    chrome.tabs.sendMessage(tab.id, { type: 'SYNC_INCOME' });
                } else if (tab.url.includes('web.whatsapp.com')) {
                    chrome.tabs.sendMessage(tab.id, { type: 'SYNC_INCOME' });
                }
            }
        } catch (error) {
            console.error('Daily sync error:', error);
        }
    }

    async generateWeeklyReport() {
        const result = await chrome.storage.local.get(['incomeEntries', 'clients']);
        const incomeEntries = result.incomeEntries || [];
        const clients = result.clients || [];

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyIncome = incomeEntries
            .filter(entry => new Date(entry.date) >= weekAgo)
            .reduce((sum, entry) => sum + entry.amount, 0);

        const newClients = clients
            .filter(client => new Date(client.createdAt) >= weekAgo)
            .length;

        // Create notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Weekly Report',
            message: `This week: $${weeklyIncome} earned, ${newClients} new clients`
        });
    }

    async updateIncomeStats() {
        // Update badge with current month income
        const result = await chrome.storage.local.get(['incomeEntries']);
        const entries = result.incomeEntries || [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyIncome = entries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === currentMonth &&
                       entryDate.getFullYear() === currentYear;
            })
            .reduce((sum, entry) => sum + entry.amount, 0);

        // Update badge
        const badgeText = monthlyIncome > 0 ? `$${Math.round(monthlyIncome/1000)}k` : '';
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
    }

    async updateCRMStats() {
        // Update extension state based on CRM changes
        const result = await chrome.storage.local.get(['clients']);
        const clients = result.clients || [];

        const activeClients = clients.filter(client => client.status === 'active').length;

        // Store stats for quick access
        await chrome.storage.local.set({
            stats: {
                activeClients,
                totalClients: clients.length,
                lastUpdated: new Date().toISOString()
            }
        });
    }

    async createBackup() {
        const data = await chrome.storage.local.get(null);
        return {
            ...data,
            backupDate: new Date().toISOString(),
            version: chrome.runtime.getManifest().version
        };
    }

    async restoreBackup(backupData) {
        // Validate backup data before restoring
        if (backupData.version && backupData.backupDate) {
            delete backupData.version;
            delete backupData.backupDate;

            await chrome.storage.local.clear();
            await chrome.storage.local.set(backupData);
        } else {
            throw new Error('Invalid backup data');
        }
    }

    getDefaultTemplates() {
        return {
            proposals: {
                upwork: "Dear Client,\n\nThank you for posting this project...",
                fiverr: "Hi there!\n\nI'm excited about your project...",
                general: "Hello,\n\nI would love to help with your project..."
            },
            emails: {
                followUp: "Hi [CLIENT_NAME],\n\nI wanted to follow up...",
                projectUpdate: "Hi [CLIENT_NAME],\n\nProject update...",
                completion: "Hi [CLIENT_NAME],\n\nI'm pleased to inform you..."
            }
        };
    }

    async migrateData() {
        // Handle data migration for updates
        const result = await chrome.storage.local.get(null);

        // Add version to settings
        const settings = result.settings || {};
        settings.version = '1.0.0';

        await chrome.storage.local.set({ settings });
    }
}

// Initialize the background service
new BackgroundService();
