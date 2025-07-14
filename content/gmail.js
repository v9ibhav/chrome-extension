// Gmail Content Script for Income Tracking
class GmailIncomeTracker {
    constructor() {
        this.init();
        this.paymentKeywords = [
            'payment received', 'invoice paid', 'paypal', 'stripe', 'payment confirmation',
            'upwork payment', 'fiverr payment', 'freelancer payment', 'funds transferred',
            'payment processed', 'money received', 'invoice payment', 'client payment',
            'project payment', 'freelance payment', 'consultation fee', 'service payment'
        ];
        this.clientKeywords = [
            'new project', 'project inquiry', 'work request', 'freelance opportunity',
            'business proposal', 'collaboration', 'contract', 'hire', 'outsource'
        ];
    }

    init() {
        this.addGmailHelper();
        this.setupMessageListener();
        this.observeEmailChanges();
        this.scanExistingEmails();
    }

    addGmailHelper() {
        // Wait for Gmail to load
        const checkGmailLoaded = setInterval(() => {
            const composeButton = document.querySelector('[data-tooltip="Compose"]');
            if (composeButton) {
                clearInterval(checkGmailLoaded);
                this.injectGmailUI();
            }
        }, 1000);
    }

    injectGmailUI() {
        // Add AI helper to Gmail interface
        const helperContainer = document.createElement('div');
        helperContainer.id = 'freelancer-gmail-helper';
        helperContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 300px;
            background: white;
            border: 1px solid #dadce0;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            z-index: 1000;
            font-family: 'Google Sans', sans-serif;
            font-size: 13px;
            min-width: 200px;
        `;

        helperContainer.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 8px; color: #1a73e8;">
                🤖 Freelancer AI Toolkit
            </div>
            <button id="scan-income-btn" style="width: 100%; padding: 6px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 4px; font-size: 12px;">
                💰 Scan for Income
            </button>
            <button id="extract-clients-btn" style="width: 100%; padding: 6px; background: #34a853; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 4px; font-size: 12px;">
                👥 Extract Clients
            </button>
            <button id="generate-reply-btn" style="width: 100%; padding: 6px; background: #ea4335; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                ✉️ AI Reply
            </button>
            <div id="scan-status" style="margin-top: 8px; font-size: 11px; color: #5f6368;"></div>
        `;

        document.body.appendChild(helperContainer);

        // Add event listeners
        document.getElementById('scan-income-btn').addEventListener('click', () => {
            this.scanForIncome();
        });

        document.getElementById('extract-clients-btn').addEventListener('click', () => {
            this.extractClientEmails();
        });

        document.getElementById('generate-reply-btn').addEventListener('click', () => {
            this.generateAIReply();
        });

        // Make it draggable
        this.makeDraggable(helperContainer);
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    async scanForIncome() {
        this.updateStatus('Scanning emails for income...');

        try {
            const emails = this.getAllEmailElements();
            const incomeEntries = [];

            for (const email of emails) {
                const incomeData = await this.analyzeEmailForIncome(email);
                if (incomeData) {
                    incomeEntries.push(incomeData);
                }
            }

            if (incomeEntries.length > 0) {
                // Send to background script
                chrome.runtime.sendMessage({
                    type: 'SYNC_INCOME',
                    data: incomeEntries
                });

                this.updateStatus(`Found ${incomeEntries.length} income entries!`, 'success');
            } else {
                this.updateStatus('No income emails found in current view', 'info');
            }
        } catch (error) {
            this.updateStatus('Error scanning emails', 'error');
            console.error('Gmail scan error:', error);
        }
    }

    async extractClientEmails() {
        this.updateStatus('Extracting client information...');

        try {
            const emails = this.getAllEmailElements();
            const clients = [];

            for (const email of emails) {
                const clientData = await this.analyzeEmailForClient(email);
                if (clientData) {
                    clients.push(clientData);
                }
            }

            if (clients.length > 0) {
                chrome.runtime.sendMessage({
                    type: 'ADD_CLIENTS_FROM_EMAIL',
                    data: clients
                });

                this.updateStatus(`Extracted ${clients.length} potential clients!`, 'success');
            } else {
                this.updateStatus('No client emails found in current view', 'info');
            }
        } catch (error) {
            this.updateStatus('Error extracting clients', 'error');
            console.error('Client extraction error:', error);
        }
    }

    generateAIReply() {
        const selectedEmail = this.getSelectedEmail();
        if (!selectedEmail) {
            this.updateStatus('Please select an email first', 'error');
            return;
        }

        const emailContent = this.extractEmailContent(selectedEmail);
        if (emailContent) {
            chrome.runtime.sendMessage({
                type: 'GENERATE_EMAIL_REPLY',
                data: emailContent
            });

            this.updateStatus('Generating AI reply...', 'info');
        }
    }

    getAllEmailElements() {
        // Get all email elements in the current Gmail view
        const emailSelectors = [
            '[data-thread-id]',
            '.zA',
            '[role="listitem"]',
            '.aDP'
        ];

        let emails = [];
        for (const selector of emailSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                emails = Array.from(elements);
                break;
            }
        }

        return emails;
    }

    async analyzeEmailForIncome(emailElement) {
        try {
            const subject = this.getEmailSubject(emailElement);
            const content = this.getEmailContent(emailElement);
            const sender = this.getEmailSender(emailElement);
            const date = this.getEmailDate(emailElement);

            if (!subject && !content) return null;

            const fullText = `${subject} ${content}`.toLowerCase();

            // Check if email contains payment keywords
            const hasPaymentKeywords = this.paymentKeywords.some(keyword =>
                fullText.includes(keyword.toLowerCase())
            );

            if (!hasPaymentKeywords) return null;

            // Extract amount from email
            const amount = this.extractAmountFromText(fullText);
            if (!amount || amount < 1) return null;

            // Extract client name
            const clientName = this.extractClientName(sender, subject, content);

            return {
                id: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                client: clientName,
                amount: amount,
                date: date || new Date().toISOString().split('T')[0],
                description: subject,
                source: 'gmail',
                emailSender: sender,
                extractedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error analyzing email for income:', error);
            return null;
        }
    }

    async analyzeEmailForClient(emailElement) {
        try {
            const subject = this.getEmailSubject(emailElement);
            const content = this.getEmailContent(emailElement);
            const sender = this.getEmailSender(emailElement);
            const date = this.getEmailDate(emailElement);

            if (!subject && !content) return null;

            const fullText = `${subject} ${content}`.toLowerCase();

            // Check if email contains client/project keywords
            const hasClientKeywords = this.clientKeywords.some(keyword =>
                fullText.includes(keyword.toLowerCase())
            );

            if (!hasClientKeywords) return null;

            const senderEmail = this.extractEmailFromText(sender);
            const senderName = this.extractNameFromSender(sender);

            if (!senderEmail) return null;

            return {
                id: `gmail_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: senderName,
                email: senderEmail,
                status: 'prospect',
                notes: `Extracted from Gmail: ${subject}`,
                source: 'gmail',
                extractedAt: new Date().toISOString(),
                firstContact: date
            };
        } catch (error) {
            console.error('Error analyzing email for client:', error);
            return null;
        }
    }

    getEmailSubject(emailElement) {
        const subjectSelectors = [
            '[data-thread-id] .bog',
            '.bog',
            '[data-tooltip-contained="true"]',
            '.y6 span',
            '.ao4 .bog'
        ];

        for (const selector of subjectSelectors) {
            const element = emailElement.querySelector(selector);
            if (element) {
                return element.textContent?.trim();
            }
        }

        return '';
    }

    getEmailContent(emailElement) {
        const contentSelectors = [
            '.ii.gt .a3s',
            '.a3s.aiL',
            '.ii.gt div[dir="ltr"]',
            '.adn.ads .a3s'
        ];

        for (const selector of contentSelectors) {
            const element = emailElement.querySelector(selector);
            if (element) {
                return element.textContent?.trim();
            }
        }

        return '';
    }

    getEmailSender(emailElement) {
        const senderSelectors = [
            '.yX .yW span[email]',
            '.go .g2',
            '.yW span',
            '.yX .yW',
            '.bA4 .yW'
        ];

        for (const selector of senderSelectors) {
            const element = emailElement.querySelector(selector);
            if (element) {
                return element.textContent?.trim() || element.getAttribute('email');
            }
        }

        return '';
    }

    getEmailDate(emailElement) {
        const dateSelectors = [
            '.g3',
            '.xY .g3',
            '[data-tooltip-contained="true"] .g3',
            '.zu .g3'
        ];

        for (const selector of dateSelectors) {
            const element = emailElement.querySelector(selector);
            if (element) {
                const dateText = element.textContent?.trim();
                return this.parseEmailDate(dateText);
            }
        }

        return null;
    }

    parseEmailDate(dateText) {
        try {
            // Gmail shows dates in various formats
            if (dateText.includes(':')) {
                // Time format (today)
                return new Date().toISOString().split('T')[0];
            } else if (dateText.includes('/')) {
                // Date format
                return new Date(dateText).toISOString().split('T')[0];
            } else {
                // Other formats, default to today
                return new Date().toISOString().split('T')[0];
            }
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    extractAmountFromText(text) {
        // Look for currency amounts
        const patterns = [
            /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/gi,
            /amount[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /paid[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /received[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
        ];

        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const amount = parseFloat(match.replace(/[^0-9.]/g, ''));
                    if (amount >= 1) {
                        return amount;
                    }
                }
            }
        }

        return 0;
    }

    extractEmailFromText(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const match = text.match(emailRegex);
        return match ? match[0] : null;
    }

    extractNameFromSender(sender) {
        // Extract name from "Name <email>" format or just "Name"
        const nameMatch = sender.match(/^([^<]+)(?:\s*<.*>)?$/);
        if (nameMatch) {
            return nameMatch[1].trim();
        }
        return sender.split('@')[0]; // Fallback to email username
    }

    extractClientName(sender, subject, content) {
        // Try to extract a meaningful client name
        const senderName = this.extractNameFromSender(sender);

        // If sender name looks like a real name, use it
        if (senderName && senderName.includes(' ') && !senderName.includes('@')) {
            return senderName;
        }

        // Look for company names in subject or content
        const companyPatterns = [
            /from\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Company))/i,
            /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Company))/i
        ];

        for (const pattern of companyPatterns) {
            const match = (subject + ' ' + content).match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return senderName || 'Unknown Client';
    }

    getSelectedEmail() {
        // Get currently selected/open email
        const selectedSelectors = [
            '.h7.M7.adO',
            '.adn.ads',
            '[role="main"] .adn'
        ];

        for (const selector of selectedSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return null;
    }

    extractEmailContent(emailElement) {
        const subject = this.getEmailSubject(emailElement);
        const content = this.getEmailContent(emailElement);
        const sender = this.getEmailSender(emailElement);

        return {
            subject,
            content,
            sender,
            url: window.location.href
        };
    }

    observeEmailChanges() {
        // Watch for Gmail navigation and new emails
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new emails were loaded
                    const hasNewEmails = Array.from(mutation.addedNodes).some(node => {
                        return node.nodeType === 1 &&
                               (node.matches('[data-thread-id]') ||
                                node.querySelector('[data-thread-id]'));
                    });

                    if (hasNewEmails) {
                        // Auto-scan new emails if enabled
                        setTimeout(() => {
                            this.autoScanNewEmails();
                        }, 1000);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async autoScanNewEmails() {
        // Auto-scan functionality (can be enabled/disabled in settings)
        const settings = await this.getSettings();
        if (settings.autoScanGmail) {
            this.scanForIncome();
        }
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || { autoScanGmail: false });
            });
        });
    }

    scanExistingEmails() {
        // Initial scan when script loads
        setTimeout(() => {
            this.autoScanNewEmails();
        }, 3000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'SCAN_GMAIL_INCOME':
                    this.scanForIncome().then(() => {
                        sendResponse({ success: true });
                    });
                    return true;

                case 'EXTRACT_GMAIL_CLIENTS':
                    this.extractClientEmails().then(() => {
                        sendResponse({ success: true });
                    });
                    return true;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        });
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('scan-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = type === 'success' ? '#34a853' :
                                       type === 'error' ? '#ea4335' : '#5f6368';

            // Clear status after 5 seconds
            setTimeout(() => {
                statusElement.textContent = '';
            }, 5000);
        }
    }
}

// Initialize Gmail tracker when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GmailIncomeTracker();
    });
} else {
    new GmailIncomeTracker();
}
