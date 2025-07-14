// Content script for freelance platforms (Upwork, Fiverr, etc.)
class FreelancePlatformHelper {
    constructor() {
        this.platform = this.detectPlatform();
        this.init();
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        if (hostname.includes('upwork.com')) return 'upwork';
        if (hostname.includes('fiverr.com')) return 'fiverr';
        if (hostname.includes('freelancer.com')) return 'freelancer';
        return 'unknown';
    }

    init() {
        this.addAIHelper();
        this.setupMessageListener();
        this.observePageChanges();
        this.injectHelperButtons();
    }

    addAIHelper() {
        // Create floating AI helper button
        const aiButton = document.createElement('div');
        aiButton.id = 'freelancer-ai-helper';
        aiButton.innerHTML = '🤖 AI Helper';
        aiButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            z-index: 10000;
            font-family: system-ui;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
            transition: all 0.3s ease;
        `;

        aiButton.addEventListener('mouseenter', () => {
            aiButton.style.transform = 'scale(1.05)';
            aiButton.style.boxShadow = '0 6px 25px rgba(79, 70, 229, 0.4)';
        });

        aiButton.addEventListener('mouseleave', () => {
            aiButton.style.transform = 'scale(1)';
            aiButton.style.boxShadow = '0 4px 20px rgba(79, 70, 229, 0.3)';
        });

        aiButton.addEventListener('click', () => {
            this.showAIHelperModal();
        });

        document.body.appendChild(aiButton);
    }

    showAIHelperModal() {
        const modal = document.createElement('div');
        modal.id = 'ai-helper-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #1e293b;">🤖 AI Assistant</h2>
            <div style="margin-bottom: 15px;">
                <button id="generate-proposal-btn" style="width: 100%; padding: 12px; margin-bottom: 10px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    📝 Generate Proposal for This Job
                </button>
                <button id="estimate-price-btn" style="width: 100%; padding: 12px; margin-bottom: 10px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    💰 Estimate Project Price
                </button>
                <button id="extract-client-btn" style="width: 100%; padding: 12px; margin-bottom: 10px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    👥 Extract Client Info
                </button>
                <button id="close-modal-btn" style="width: 100%; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    ❌ Close
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('generate-proposal-btn').addEventListener('click', () => {
            this.generateProposalForCurrentJob();
            modal.remove();
        });

        document.getElementById('estimate-price-btn').addEventListener('click', () => {
            this.estimatePriceForCurrentJob();
            modal.remove();
        });

        document.getElementById('extract-client-btn').addEventListener('click', () => {
            this.extractClientInfo();
            modal.remove();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    generateProposalForCurrentJob() {
        const jobData = this.extractJobData();
        if (jobData) {
            // Send to extension
            chrome.runtime.sendMessage({
                type: 'GENERATE_PROPOSAL_FROM_PAGE',
                data: jobData
            });
            this.showNotification('Generating AI proposal...', 'info');
        } else {
            this.showNotification('Could not extract job data from this page', 'error');
        }
    }

    estimatePriceForCurrentJob() {
        const jobData = this.extractJobData();
        if (jobData) {
            chrome.runtime.sendMessage({
                type: 'ESTIMATE_PRICE_FROM_PAGE',
                data: jobData
            });
            this.showNotification('Generating price estimate...', 'info');
        } else {
            this.showNotification('Could not extract job data from this page', 'error');
        }
    }

    extractClientInfo() {
        const clientData = this.extractClientData();
        if (clientData) {
            chrome.runtime.sendMessage({
                type: 'ADD_CLIENT_FROM_PAGE',
                data: clientData
            });
            this.showNotification('Client info extracted!', 'success');
        } else {
            this.showNotification('Could not extract client info from this page', 'error');
        }
    }

    extractJobData() {
        if (this.platform === 'upwork') {
            return this.extractUpworkJobData();
        } else if (this.platform === 'fiverr') {
            return this.extractFiverrJobData();
        }
        return null;
    }

    extractUpworkJobData() {
        try {
            const title = document.querySelector('h1, .job-title, [data-test="job-title"]')?.textContent?.trim();
            const description = document.querySelector('.description, .job-description, [data-test="job-description"]')?.textContent?.trim();
            const budget = document.querySelector('.budget, .job-budget, [data-test="budget"]')?.textContent?.trim();
            const skills = Array.from(document.querySelectorAll('.skill, .skills span, [data-test="skill"]')).map(el => el.textContent.trim());
            const clientInfo = document.querySelector('.client-info, .client-name')?.textContent?.trim();

            return {
                platform: 'upwork',
                title,
                description,
                budget,
                skills,
                clientInfo,
                url: window.location.href
            };
        } catch (error) {
            console.error('Error extracting Upwork job data:', error);
            return null;
        }
    }

    extractFiverrJobData() {
        try {
            const title = document.querySelector('h1, .gig-title')?.textContent?.trim();
            const description = document.querySelector('.description, .gig-description')?.textContent?.trim();
            const price = document.querySelector('.price, .gig-price')?.textContent?.trim();
            const category = document.querySelector('.category, .breadcrumb')?.textContent?.trim();

            return {
                platform: 'fiverr',
                title,
                description,
                price,
                category,
                url: window.location.href
            };
        } catch (error) {
            console.error('Error extracting Fiverr job data:', error);
            return null;
        }
    }

    extractClientData() {
        if (this.platform === 'upwork') {
            return this.extractUpworkClientData();
        } else if (this.platform === 'fiverr') {
            return this.extractFiverrClientData();
        }
        return null;
    }

    extractUpworkClientData() {
        try {
            const name = document.querySelector('.client-name, .client-header h1')?.textContent?.trim();
            const location = document.querySelector('.client-location')?.textContent?.trim();
            const memberSince = document.querySelector('.member-since')?.textContent?.trim();
            const totalSpent = document.querySelector('.total-spent')?.textContent?.trim();
            const jobsPosted = document.querySelector('.jobs-posted')?.textContent?.trim();

            return {
                name,
                location,
                memberSince,
                totalSpent,
                jobsPosted,
                platform: 'upwork',
                extractedFrom: window.location.href
            };
        } catch (error) {
            console.error('Error extracting Upwork client data:', error);
            return null;
        }
    }

    extractFiverrClientData() {
        try {
            const name = document.querySelector('.username, .buyer-name')?.textContent?.trim();
            const country = document.querySelector('.country, .user-country')?.textContent?.trim();
            const memberSince = document.querySelector('.member-since, .joined-date')?.textContent?.trim();

            return {
                name,
                country,
                memberSince,
                platform: 'fiverr',
                extractedFrom: window.location.href
            };
        } catch (error) {
            console.error('Error extracting Fiverr client data:', error);
            return null;
        }
    }

    injectHelperButtons() {
        // Add helper buttons to specific elements
        if (this.platform === 'upwork') {
            this.injectUpworkHelpers();
        } else if (this.platform === 'fiverr') {
            this.injectFiverrHelpers();
        }
    }

    injectUpworkHelpers() {
        // Add proposal helper to job posting pages
        const proposalBox = document.querySelector('.proposal-box, [data-test="proposal-box"]');
        if (proposalBox) {
            const aiButton = document.createElement('button');
            aiButton.textContent = '🤖 Generate AI Proposal';
            aiButton.style.cssText = `
                background: #4f46e5;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin: 10px 0;
                font-weight: 500;
            `;

            aiButton.addEventListener('click', () => {
                this.generateProposalForCurrentJob();
            });

            proposalBox.insertBefore(aiButton, proposalBox.firstChild);
        }
    }

    injectFiverrHelpers() {
        // Add helpers for Fiverr gig creation/management
        const gigForm = document.querySelector('.gig-form, .create-gig-form');
        if (gigForm) {
            const aiButton = document.createElement('button');
            aiButton.textContent = '🤖 AI Description Helper';
            aiButton.style.cssText = `
                background: #1dbf73;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin: 10px 0;
                font-weight: 500;
            `;

            gigForm.appendChild(aiButton);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'EXTRACT_JOB_DATA':
                    const jobData = this.extractJobData();
                    sendResponse({ success: true, data: jobData });
                    break;

                case 'EXTRACT_CLIENT_DATA':
                    const clientData = this.extractClientData();
                    sendResponse({ success: true, data: clientData });
                    break;

                case 'SYNC_INCOME':
                    this.extractIncomeData().then(incomeData => {
                        sendResponse({ success: true, data: incomeData });
                    });
                    return true; // Keep message channel open

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        });
    }

    async extractIncomeData() {
        // Extract income/payment data from the platform
        const incomeData = [];

        if (this.platform === 'upwork') {
            // Look for earnings, completed jobs, etc.
            const earningsElements = document.querySelectorAll('.earnings, .payment-amount, .job-total');
            earningsElements.forEach(element => {
                const amount = this.parseAmount(element.textContent);
                if (amount > 0) {
                    incomeData.push({
                        amount,
                        source: 'upwork',
                        description: element.closest('.job-item, .payment-item')?.querySelector('.job-title, .payment-description')?.textContent?.trim(),
                        extractedAt: new Date().toISOString()
                    });
                }
            });
        } else if (this.platform === 'fiverr') {
            // Look for order completions, earnings, etc.
            const earningsElements = document.querySelectorAll('.earnings, .order-total, .gig-earnings');
            earningsElements.forEach(element => {
                const amount = this.parseAmount(element.textContent);
                if (amount > 0) {
                    incomeData.push({
                        amount,
                        source: 'fiverr',
                        description: element.closest('.order-item, .gig-item')?.querySelector('.order-title, .gig-title')?.textContent?.trim(),
                        extractedAt: new Date().toISOString()
                    });
                }
            });
        }

        return incomeData;
    }

    parseAmount(text) {
        // Extract numeric amount from text
        const match = text.match(/\$?([\d,]+\.?\d*)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    }

    observePageChanges() {
        // Watch for page changes (SPA navigation)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Re-inject helpers if page content changed
                    setTimeout(() => {
                        if (!document.getElementById('freelancer-ai-helper')) {
                            this.addAIHelper();
                        }
                        this.injectHelperButtons();
                    }, 1000);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10002;
            font-family: system-ui;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize the helper when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FreelancePlatformHelper();
    });
} else {
    new FreelancePlatformHelper();
}
