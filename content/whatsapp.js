// WhatsApp Web Content Script for Client Communication and Income Tracking
class WhatsAppClientTracker {
    constructor() {
        this.init();
        this.paymentKeywords = [
            'paid', 'payment', 'transferred', 'sent money', 'invoice', 'amount',
            'received payment', 'bank transfer', 'paypal', 'venmo', 'cashapp',
            'wire transfer', 'check', 'deposit', 'funds', 'money sent'
        ];
        this.clientKeywords = [
            'project', 'work', 'freelance', 'hire', 'contract', 'proposal',
            'quote', 'estimate', 'service', 'business', 'collaboration'
        ];
    }

    init() {
        this.waitForWhatsAppLoad();
    }

    waitForWhatsAppLoad() {
        const checkWhatsAppLoaded = setInterval(() => {
            const chatList = document.querySelector('[data-testid="chat-list"]') ||
                           document.querySelector('[data-asset-chat-list]') ||
                           document.querySelector('#pane-side');

            if (chatList) {
                clearInterval(checkWhatsAppLoaded);
                this.addWhatsAppHelper();
                this.setupMessageListener();
                this.observeChatChanges();
            }
        }, 1000);
    }

    addWhatsAppHelper() {
        const helperContainer = document.createElement('div');
        helperContainer.id = 'freelancer-whatsapp-helper';
        helperContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #128c7e;
            color: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: system-ui;
            font-size: 14px;
            min-width: 220px;
            max-width: 300px;
        `;

        helperContainer.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>🤖</span> Freelancer AI Toolkit
            </div>
            <button id="scan-payments-btn" style="width: 100%; padding: 8px; background: #25d366; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 6px; font-size: 12px; font-weight: 500;">
                💰 Scan for Payments
            </button>
            <button id="extract-clients-btn" style="width: 100%; padding: 8px; background: #34b7f1; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 6px; font-size: 12px; font-weight: 500;">
                👥 Extract Client Contacts
            </button>
            <button id="ai-reply-btn" style="width: 100%; padding: 8px; background: #ff6b6b; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 8px; font-size: 12px; font-weight: 500;">
                ✨ AI Quick Reply
            </button>
            <div id="whatsapp-status" style="font-size: 11px; opacity: 0.9; text-align: center;"></div>
        `;

        document.body.appendChild(helperContainer);

        // Add event listeners
        document.getElementById('scan-payments-btn').addEventListener('click', () => {
            this.scanForPayments();
        });

        document.getElementById('extract-clients-btn').addEventListener('click', () => {
            this.extractClientContacts();
        });

        document.getElementById('ai-reply-btn').addEventListener('click', () => {
            this.generateAIReply();
        });

        // Make it minimizable
        helperContainer.addEventListener('dblclick', () => {
            this.toggleMinimize(helperContainer);
        });
    }

    toggleMinimize(container) {
        const buttons = container.querySelectorAll('button');
        const isMinimized = buttons[0].style.display === 'none';

        buttons.forEach(button => {
            button.style.display = isMinimized ? 'block' : 'none';
        });

        if (isMinimized) {
            container.style.minWidth = '220px';
        } else {
            container.style.minWidth = '120px';
        }
    }

    async scanForPayments() {
        this.updateStatus('Scanning chats for payments...');

        try {
            const chats = this.getAllChats();
            const paymentEntries = [];

            for (const chat of chats.slice(0, 20)) { // Limit to recent chats
                await this.openChat(chat);
                await this.delay(500); // Wait for messages to load

                const payments = await this.analyzeMessagesForPayments();
                paymentEntries.push(...payments);
            }

            if (paymentEntries.length > 0) {
                chrome.runtime.sendMessage({
                    type: 'SYNC_INCOME',
                    data: paymentEntries
                });

                this.updateStatus(`Found ${paymentEntries.length} payment messages!`, 'success');
            } else {
                this.updateStatus('No payment messages found', 'info');
            }
        } catch (error) {
            this.updateStatus('Error scanning chats', 'error');
            console.error('WhatsApp scan error:', error);
        }
    }

    async extractClientContacts() {
        this.updateStatus('Extracting client contacts...');

        try {
            const chats = this.getAllChats();
            const clients = [];

            for (const chat of chats.slice(0, 30)) { // Check more chats for clients
                const clientData = await this.analyzeChat(chat);
                if (clientData) {
                    clients.push(clientData);
                }
            }

            if (clients.length > 0) {
                chrome.runtime.sendMessage({
                    type: 'ADD_CLIENTS_FROM_WHATSAPP',
                    data: clients
                });

                this.updateStatus(`Extracted ${clients.length} potential clients!`, 'success');
            } else {
                this.updateStatus('No client contacts found', 'info');
            }
        } catch (error) {
            this.updateStatus('Error extracting contacts', 'error');
            console.error('Contact extraction error:', error);
        }
    }

    generateAIReply() {
        const currentChat = this.getCurrentChatMessages();
        if (!currentChat || currentChat.length === 0) {
            this.updateStatus('Please open a chat first', 'error');
            return;
        }

        const lastMessage = currentChat[currentChat.length - 1];
        if (!lastMessage || lastMessage.isFromMe) {
            this.updateStatus('No client message to reply to', 'error');
            return;
        }

        chrome.runtime.sendMessage({
            type: 'GENERATE_WHATSAPP_REPLY',
            data: {
                message: lastMessage.text,
                context: currentChat.slice(-5), // Last 5 messages for context
                chatName: this.getCurrentChatName()
            }
        });

        this.updateStatus('Generating AI reply...', 'info');
    }

    getAllChats() {
        const chatSelectors = [
            '[data-testid="chat-list"] > div',
            '[data-asset-chat-list] > div',
            '#pane-side [role="listitem"]',
            '._2nY6U > div'
        ];

        for (const selector of chatSelectors) {
            const chats = document.querySelectorAll(selector);
            if (chats.length > 0) {
                return Array.from(chats);
            }
        }

        return [];
    }

    async openChat(chatElement) {
        chatElement.click();
        await this.delay(300);
    }

    async analyzeChat(chatElement) {
        try {
            const nameElement = chatElement.querySelector('[title]') ||
                               chatElement.querySelector('span[title]') ||
                               chatElement.querySelector('._8nE1Y');

            const lastMessageElement = chatElement.querySelector('._1Gy50') ||
                                      chatElement.querySelector('._3B3wI') ||
                                      chatElement.querySelector('span[title]');

            const name = nameElement?.getAttribute('title') || nameElement?.textContent?.trim();
            const lastMessage = lastMessageElement?.textContent?.trim() || '';

            if (!name) return null;

            // Check if this looks like a business contact
            const isBusinessContact = this.isBusinessContact(name, lastMessage);
            if (!isBusinessContact) return null;

            // Extract phone number if possible
            const phone = this.extractPhoneFromChat(chatElement);

            return {
                id: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name,
                phone: phone,
                status: 'prospect',
                notes: `Extracted from WhatsApp. Last message: ${lastMessage.substring(0, 100)}...`,
                source: 'whatsapp',
                extractedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error analyzing chat:', error);
            return null;
        }
    }

    isBusinessContact(name, lastMessage) {
        const businessIndicators = [
            ...this.clientKeywords,
            'business', 'company', 'professional', 'services',
            'website', 'design', 'development', 'marketing'
        ];

        const text = `${name} ${lastMessage}`.toLowerCase();
        return businessIndicators.some(indicator => text.includes(indicator));
    }

    extractPhoneFromChat(chatElement) {
        // Try to extract phone number from chat element or attributes
        const phonePatterns = [
            /\+\d{1,3}\s?\d{10,14}/,
            /\d{3}[-.]?\d{3}[-.]?\d{4}/
        ];

        const text = chatElement.textContent || '';
        for (const pattern of phonePatterns) {
            const match = text.match(pattern);
            if (match) return match[0];
        }

        return '';
    }

    async analyzeMessagesForPayments() {
        const messages = this.getCurrentChatMessages();
        const payments = [];

        for (const message of messages) {
            if (message.isFromMe) continue; // Skip own messages

            const paymentData = this.extractPaymentFromMessage(message);
            if (paymentData) {
                payments.push(paymentData);
            }
        }

        return payments;
    }

    getCurrentChatMessages() {
        const messageSelectors = [
            '[data-testid="msg-container"]',
            '._3_7SH',
            '.message-in, .message-out',
            '._12pGw'
        ];

        for (const selector of messageSelectors) {
            const messageElements = document.querySelectorAll(selector);
            if (messageElements.length > 0) {
                return Array.from(messageElements).map(el => {
                    const isFromMe = el.classList.contains('message-out') ||
                                   el.querySelector('[data-testid="msg-meta"]') ||
                                   el.closest('._1Gy50');

                    return {
                        text: el.textContent?.trim() || '',
                        isFromMe: !!isFromMe,
                        timestamp: this.extractMessageTimestamp(el)
                    };
                });
            }
        }

        return [];
    }

    extractPaymentFromMessage(message) {
        const text = message.text.toLowerCase();

        // Check if message contains payment keywords
        const hasPaymentKeywords = this.paymentKeywords.some(keyword =>
            text.includes(keyword)
        );

        if (!hasPaymentKeywords) return null;

        // Extract amount
        const amount = this.extractAmountFromText(text);
        if (!amount || amount < 1) return null;

        // Get chat name as client name
        const clientName = this.getCurrentChatName();

        return {
            id: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            client: clientName,
            amount: amount,
            date: this.formatDate(message.timestamp || new Date()),
            description: `WhatsApp payment: ${message.text.substring(0, 50)}...`,
            source: 'whatsapp',
            extractedAt: new Date().toISOString()
        };
    }

    extractAmountFromText(text) {
        const patterns = [
            /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?|bucks?)/gi,
            /paid[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /sent[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /transferred[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
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

    getCurrentChatName() {
        const nameSelectors = [
            '[data-testid="conversation-header"] span[title]',
            '._3l6x1 span[title]',
            '.l7jjieqr span',
            '._3ko75 span'
        ];

        for (const selector of nameSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.getAttribute('title') || element.textContent?.trim();
            }
        }

        return 'Unknown Contact';
    }

    extractMessageTimestamp(messageElement) {
        const timeSelectors = [
            '[data-testid="msg-meta"] span',
            '._3EFt_',
            '.message-time',
            '._315-i'
        ];

        for (const selector of timeSelectors) {
            const timeElement = messageElement.querySelector(selector);
            if (timeElement) {
                return this.parseWhatsAppTime(timeElement.textContent);
            }
        }

        return new Date();
    }

    parseWhatsAppTime(timeText) {
        try {
            // WhatsApp shows times like "10:30 AM" or "Yesterday"
            if (timeText.includes(':')) {
                const today = new Date();
                const [time, period] = timeText.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);

                if (period && period.toLowerCase() === 'pm' && hour24 !== 12) {
                    hour24 += 12;
                } else if (period && period.toLowerCase() === 'am' && hour24 === 12) {
                    hour24 = 0;
                }

                today.setHours(hour24, parseInt(minutes), 0, 0);
                return today;
            } else if (timeText.toLowerCase().includes('yesterday')) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return yesterday;
            }
        } catch (error) {
            console.error('Error parsing WhatsApp time:', error);
        }

        return new Date();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    observeChatChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if new messages were added
                    const hasNewMessages = Array.from(mutation.addedNodes).some(node => {
                        return node.nodeType === 1 &&
                               (node.matches('[data-testid="msg-container"]') ||
                                node.querySelector('[data-testid="msg-container"]'));
                    });

                    if (hasNewMessages) {
                        this.autoAnalyzeNewMessages();
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async autoAnalyzeNewMessages() {
        // Auto-analyze new messages for payments (if enabled)
        const settings = await this.getSettings();
        if (settings.autoScanWhatsApp) {
            setTimeout(() => {
                this.checkNewMessagesForPayments();
            }, 1000);
        }
    }

    async checkNewMessagesForPayments() {
        const messages = this.getCurrentChatMessages();
        const recentMessages = messages.slice(-3); // Check last 3 messages

        for (const message of recentMessages) {
            if (!message.isFromMe) {
                const paymentData = this.extractPaymentFromMessage(message);
                if (paymentData) {
                    // Found a payment in new messages
                    chrome.runtime.sendMessage({
                        type: 'NEW_PAYMENT_DETECTED',
                        data: paymentData
                    });

                    this.showPaymentDetectedNotification(paymentData);
                }
            }
        }
    }

    showPaymentDetectedNotification(paymentData) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #25d366;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1001;
            font-family: system-ui;
            font-size: 14px;
            max-width: 300px;
        `;

        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">💰 Payment Detected!</div>
            <div>Amount: $${paymentData.amount}</div>
            <div>From: ${paymentData.client}</div>
            <button onclick="this.parentElement.remove()" style="margin-top: 8px; background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || { autoScanWhatsApp: false });
            });
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'SCAN_WHATSAPP_PAYMENTS':
                    this.scanForPayments().then(() => {
                        sendResponse({ success: true });
                    });
                    return true;

                case 'EXTRACT_WHATSAPP_CLIENTS':
                    this.extractClientContacts().then(() => {
                        sendResponse({ success: true });
                    });
                    return true;

                case 'INSERT_AI_REPLY':
                    this.insertAIReply(message.data.reply);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        });
    }

    insertAIReply(replyText) {
        const inputSelectors = [
            '[data-testid="compose-box-input"]',
            '._13NKt',
            '[contenteditable="true"]',
            '._1Plpp'
        ];

        for (const selector of inputSelectors) {
            const inputElement = document.querySelector(selector);
            if (inputElement) {
                inputElement.focus();
                inputElement.textContent = replyText;

                // Trigger input event to notify WhatsApp
                const inputEvent = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(inputEvent);

                this.updateStatus('AI reply inserted!', 'success');
                return;
            }
        }

        this.updateStatus('Could not find message input', 'error');
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('whatsapp-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = type === 'success' ? '#25d366' :
                                       type === 'error' ? '#ff6b6b' : 'rgba(255,255,255,0.9)';

            setTimeout(() => {
                statusElement.textContent = '';
            }, 5000);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize WhatsApp tracker when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WhatsAppClientTracker();
    });
} else {
    new WhatsAppClientTracker();
}
