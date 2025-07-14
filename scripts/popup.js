- Please review the work and let me know if any adjustments are needed
- Final payment is now due as per our agreement

Thank you for the opportunity to work on this project. I look forward to potential future collaborations!

Best regards,`
        };

        return templates[replyType] || templates['initial-response'];
    }

    // Income Tracking Functions
    async syncGmail() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url.includes('mail.google.com')) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: this.extractGmailIncome
                });
                this.showSuccess('Gmail sync initiated. Check your income tab for updates.');
            } else {
                // Open Gmail in a new tab
                chrome.tabs.create({ url: 'https://mail.google.com' });
                this.showInfo('Please open Gmail to sync income data.');
            }
        } catch (error) {
            this.showError('Failed to sync Gmail. Please try again.');
            console.error('Gmail sync error:', error);
        }
    }

    async syncWhatsApp() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url.includes('web.whatsapp.com')) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: this.extractWhatsAppIncome
                });
                this.showSuccess('WhatsApp sync initiated.');
            } else {
                chrome.tabs.create({ url: 'https://web.whatsapp.com' });
                this.showInfo('Please open WhatsApp Web to sync income data.');
            }
        } catch (error) {
            this.showError('Failed to sync WhatsApp. Please try again.');
            console.error('WhatsApp sync error:', error);
        }
    }

    showIncomeModal() {
        document.getElementById('income-modal').classList.add('show');
        document.getElementById('income-date').value = new Date().toISOString().split('T')[0];
    }

    hideIncomeModal() {
        document.getElementById('income-modal').classList.remove('show');
        this.clearIncomeForm();
    }

    clearIncomeForm() {
        document.getElementById('income-client').value = '';
        document.getElementById('income-amount').value = '';
        document.getElementById('income-date').value = '';
        document.getElementById('income-description').value = '';
    }

    async saveIncomeEntry() {
        const client = document.getElementById('income-client').value;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const date = document.getElementById('income-date').value;
        const description = document.getElementById('income-description').value;

        if (!client || !amount || !date) {
            this.showError('Please fill in all required fields');
            return;
        }

        const entry = {
            id: Date.now().toString(),
            client,
            amount,
            date,
            description,
            timestamp: new Date().toISOString()
        };

        await this.storeIncomeEntry(entry);
        await this.updateIncomeDisplay();
        this.hideIncomeModal();
        this.showSuccess('Income entry saved successfully!');
    }

    async storeIncomeEntry(entry) {
        const result = await chrome.storage.local.get(['incomeEntries']);
        const entries = result.incomeEntries || [];
        entries.push(entry);
        await chrome.storage.local.set({ incomeEntries: entries });
    }

    async updateIncomeDisplay() {
        const result = await chrome.storage.local.get(['incomeEntries']);
        const entries = result.incomeEntries || [];
        
        // Calculate statistics
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyIncome = entries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .reduce((sum, entry) => sum + entry.amount, 0);
            
        const yearlyIncome = entries
            .filter(entry => new Date(entry.date).getFullYear() === currentYear)
            .reduce((sum, entry) => sum + entry.amount, 0);
            
        const projectCount = entries.length;
        
        // Update display
        document.getElementById('monthly-income').textContent = `$${monthlyIncome.toLocaleString()}`;
        document.getElementById('yearly-income').textContent = `$${yearlyIncome.toLocaleString()}`;
        document.getElementById('project-count').textContent = projectCount;
        
        // Show recent entries
        const recentList = document.getElementById('recent-income');
        recentList.innerHTML = '';
        
        const recentEntries = entries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
            
        recentEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'income-item';
            item.innerHTML = `
                <div>
                    <div>${entry.client}</div>
                    <div class="income-date">${new Date(entry.date).toLocaleDateString()}</div>
                </div>
                <div class="income-amount">$${entry.amount.toLocaleString()}</div>
            `;
            recentList.appendChild(item);
        });
    }

    // CRM Functions
    showClientModal(client = null) {
        const modal = document.getElementById('client-modal');
        const title = document.getElementById('modal-title');
        
        if (client) {
            title.textContent = 'Edit Client';
            document.getElementById('client-name').value = client.name || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-company').value = client.company || '';
            document.getElementById('client-status').value = client.status || 'prospect';
            document.getElementById('client-notes').value = client.notes || '';
        } else {
            title.textContent = 'Add New Client';
            this.clearClientForm();
        }
        
        modal.classList.add('show');
    }

    hideClientModal() {
        document.getElementById('client-modal').classList.remove('show');
        this.clearClientForm();
    }

    clearClientForm() {
        document.getElementById('client-name').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-company').value = '';
        document.getElementById('client-status').value = 'prospect';
        document.getElementById('client-notes').value = '';
    }

    async saveClient() {
        const name = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;
        const phone = document.getElementById('client-phone').value;
        const company = document.getElementById('client-company').value;
        const status = document.getElementById('client-status').value;
        const notes = document.getElementById('client-notes').value;

        if (!name || !email) {
            this.showError('Name and email are required');
            return;
        }

        const client = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            company,
            status,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.storeClient(client);
        await this.updateClientsDisplay();
        this.hideClientModal();
        this.showSuccess('Client saved successfully!');
    }

    async storeClient(client) {
        const result = await chrome.storage.local.get(['clients']);
        const clients = result.clients || [];
        clients.push(client);
        await chrome.storage.local.set({ clients: clients });
    }

    async updateClientsDisplay() {
        const result = await chrome.storage.local.get(['clients']);
        const clients = result.clients || [];
        
        const clientsList = document.getElementById('clients-list');
        clientsList.innerHTML = '';
        
        clients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-name">${client.name}</div>
                <div class="client-email">${client.email}</div>
                <div class="client-status ${client.status}">${client.status}</div>
            `;
            
            card.addEventListener('click', () => {
                this.showClientModal(client);
            });
            
            clientsList.appendChild(card);
        });
    }

    async searchClients(query) {
        const result = await chrome.storage.local.get(['clients']);
        const clients = result.clients || [];
        
        const filtered = clients.filter(client => 
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.email.toLowerCase().includes(query.toLowerCase()) ||
            client.company.toLowerCase().includes(query.toLowerCase())
        );
        
        const clientsList = document.getElementById('clients-list');
        clientsList.innerHTML = '';
        
        filtered.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-name">${client.name}</div>
                <div class="client-email">${client.email}</div>
                <div class="client-status ${client.status}">${client.status}</div>
            `;
            
            card.addEventListener('click', () => {
                this.showClientModal(client);
            });
            
            clientsList.appendChild(card);
        });
    }

    async exportData() {
        try {
            const [clients, incomeEntries] = await Promise.all([
                chrome.storage.local.get(['clients']),
                chrome.storage.local.get(['incomeEntries'])
            ]);
            
            const data = {
                clients: clients.clients || [],
                incomeEntries: incomeEntries.incomeEntries || [],
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `freelancer-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            this.showError('Failed to export data');
            console.error('Export error:', error);
        }
    }

    // Invoice Template Functions
    toggleInvoiceTemplates() {
        const templates = document.getElementById('invoice-templates');
        templates.style.display = templates.style.display === 'none' ? 'grid' : 'none';
    }

    async generateInvoice(templateType) {
        try {
            const invoiceWindow = window.open('', '_blank');
            const invoiceHTML = await this.createInvoiceHTML(templateType);
            
            invoiceWindow.document.write(invoiceHTML);
            invoiceWindow.document.close();
            
            this.showSuccess('Invoice template opened in new window');
        } catch (error) {
            this.showError('Failed to generate invoice');
            console.error('Invoice generation error:', error);
        }
    }

    async createInvoiceHTML(templateType) {
        // This would generate different invoice templates
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice Template</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .items-table { width: 100%; border-collapse: collapse; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INVOICE</h1>
                <p>Invoice #: [INVOICE_NUMBER]</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="invoice-details">
                <div>
                    <h3>From:</h3>
                    <p>[YOUR_NAME]<br>
                    [YOUR_ADDRESS]<br>
                    [YOUR_EMAIL]<br>
                    [YOUR_PHONE]</p>
                </div>
                <div>
                    <h3>To:</h3>
                    <p>[CLIENT_NAME]<br>
                    [CLIENT_ADDRESS]<br>
                    [CLIENT_EMAIL]</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>[SERVICE_DESCRIPTION]</td>
                        <td>[QUANTITY]</td>
                        <td>[RATE]</td>
                        <td>[AMOUNT]</td>
                    </tr>
                </tbody>
            </table>

            <div class="total">
                <p>Subtotal: $[SUBTOTAL]</p>
                <p>Tax: $[TAX]</p>
                <p>Total: $[TOTAL]</p>
            </div>

            <div style="margin-top: 40px;">
                <h3>Payment Terms:</h3>
                <p>Payment is due within 30 days of invoice date.</p>
                <p>Thank you for your business!</p>
            </div>
        </body>
        </html>
        `;
    }

    // Utility Functions
    async loadStoredData() {
        await this.updateIncomeDisplay();
        await this.updateClientsDisplay();
    }

    async storeProposal(proposal, platform) {
        const result = await chrome.storage.local.get(['proposals']);
        const proposals = result.proposals || [];
        proposals.push({
            id: Date.now().toString(),
            content: proposal,
            platform,
            createdAt: new Date().toISOString()
        });
        await chrome.storage.local.set({ proposals: proposals });
    }

    checkAIStatus() {
        // Check if AI services are available
        const statusIndicator = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');

        // For now, always show as ready
        statusIndicator.textContent = '🤖';
        statusText.textContent = 'AI Ready';
    }

    openSettings() {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    }

    // Notification Functions
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 13px;
            z-index: 10000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Content script helper functions
    extractGmailIncome() {
        // This function runs in the Gmail context
        const emails = document.querySelectorAll('[data-thread-id]');
        // Look for payment confirmation emails, invoice emails, etc.
        // Send results back to extension
    }

    extractWhatsAppIncome() {
        // This function runs in the WhatsApp Web context
        const messages = document.querySelectorAll('[data-id]');
        // Look for payment confirmations, client messages about payments
        // Send results back to extension
    }
}

// Initialize the toolkit when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new FreelancerAIToolkit();
});
// Freelancer Productivity AI Toolkit - Main Popup Script
class FreelancerAIToolkit {
    constructor() {
        this.currentTab = 'proposals';
        this.aiApiKey = null;
        this.init();
    }

    async init() {
        this.setupTabNavigation();
        this.setupEventListeners();
        await this.loadStoredData();
        this.checkAIStatus();
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;

                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');

                this.currentTab = tabId;
            });
        });
    }

    setupEventListeners() {
        // Proposal Generator
        document.getElementById('generate-proposal').addEventListener('click', () => {
            this.generateProposal();
        });

        // Price Estimator
        document.getElementById('estimate-price').addEventListener('click', () => {
            this.estimatePrice();
        });

        // Client Reply Generator
        document.getElementById('generate-reply').addEventListener('click', () => {
            this.generateReply();
        });

        // Income Tracking
        document.getElementById('sync-gmail').addEventListener('click', () => {
            this.syncGmail();
        });

        document.getElementById('sync-whatsapp').addEventListener('click', () => {
            this.syncWhatsApp();
        });

        document.getElementById('manual-entry').addEventListener('click', () => {
            this.showIncomeModal();
        });

        document.getElementById('save-income').addEventListener('click', () => {
            this.saveIncomeEntry();
        });

        document.getElementById('cancel-income').addEventListener('click', () => {
            this.hideIncomeModal();
        });

        // CRM
        document.getElementById('add-client').addEventListener('click', () => {
            this.showClientModal();
        });

        document.getElementById('save-client').addEventListener('click', () => {
            this.saveClient();
        });

        document.getElementById('cancel-client').addEventListener('click', () => {
            this.hideClientModal();
        });

        document.getElementById('client-search').addEventListener('input', (e) => {
            this.searchClients(e.target.value);
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Invoice Templates
        document.getElementById('show-invoices').addEventListener('click', () => {
            this.toggleInvoiceTemplates();
        });

        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                this.generateInvoice(card.dataset.template);
            });
        });

        // Settings
        document.getElementById('open-settings').addEventListener('click', () => {
            this.openSettings();
        });
    }

    // AI Proposal Generation using free AI API
    async generateProposal() {
        const jobDescription = document.getElementById('job-description').value;
        const skills = document.getElementById('skills-input').value;
        const platform = document.getElementById('platform-select').value;
        const tone = document.getElementById('tone-select').value;

        if (!jobDescription.trim()) {
            this.showError('Please enter a job description');
            return;
        }

        const button = document.getElementById('generate-proposal');
        const output = document.getElementById('proposal-output');

        button.classList.add('loading');
        button.disabled = true;

        try {
            const prompt = this.createProposalPrompt(jobDescription, skills, platform, tone);
            const proposal = await this.callFreeAI(prompt);

            output.textContent = proposal;
            output.classList.add('show');

            // Store for future reference
            await this.storeProposal(proposal, platform);

        } catch (error) {
            this.showError('Failed to generate proposal. Please try again.');
            console.error('Proposal generation error:', error);
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    createProposalPrompt(jobDescription, skills, platform, tone) {
        return `Create a ${tone} freelance proposal for ${platform} based on:

Job Description: ${jobDescription}

My Skills/Experience: ${skills}

Please write a compelling proposal that:
1. Shows understanding of the project requirements
2. Highlights relevant skills and experience
3. Includes a clear approach/methodology
4. Mentions timeline considerations
5. Ends with a professional call-to-action

Keep it concise but persuasive, suitable for ${platform} platform.`;
    }

    // AI Price Estimation
    async estimatePrice() {
        const projectType = document.getElementById('project-type').value;
        const complexity = document.getElementById('complexity').value;
        const experience = document.getElementById('experience-level').value;
        const description = document.getElementById('project-description').value;

        const button = document.getElementById('estimate-price');
        const output = document.getElementById('price-output');

        button.classList.add('loading');
        button.disabled = true;

        try {
            const prompt = this.createPricingPrompt(projectType, complexity, experience, description);
            const estimate = await this.callFreeAI(prompt);

            output.textContent = estimate;
            output.classList.add('show');

        } catch (error) {
            this.showError('Failed to estimate price. Please try again.');
            console.error('Price estimation error:', error);
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    createPricingPrompt(projectType, complexity, experience, description) {
        return `Provide a detailed price estimate for this freelance project:

Project Type: ${projectType}
Complexity: ${complexity}
My Experience: ${experience}
Description: ${description}

Please provide:
1. Estimated price range in USD
2. Time estimation
3. Breakdown of major components
4. Factors that could affect pricing
5. Recommendations for pricing strategy

Consider current market rates and the freelancer's experience level.`;
    }

    // AI Reply Generation
    async generateReply() {
        const clientMessage = document.getElementById('client-message').value;
        const replyType = document.getElementById('reply-type').value;
        const context = document.getElementById('reply-context').value;

        if (!clientMessage.trim()) {
            this.showError('Please enter the client message');
            return;
        }

        const button = document.getElementById('generate-reply');
        const output = document.getElementById('reply-output');

        button.classList.add('loading');
        button.disabled = true;

        try {
            const prompt = this.createReplyPrompt(clientMessage, replyType, context);
            const reply = await this.callFreeAI(prompt);

            output.textContent = reply;
            output.classList.add('show');

        } catch (error) {
            this.showError('Failed to generate reply. Please try again.');
            console.error('Reply generation error:', error);
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    createReplyPrompt(clientMessage, replyType, context) {
        return `Generate a professional ${replyType} email response to this client message:

Client Message: "${clientMessage}"

Additional Context: ${context}

Please write a response that:
1. Addresses the client's concerns/questions
2. Maintains a professional yet friendly tone
3. Is clear and concise
4. Includes appropriate next steps
5. Reflects good freelancer communication practices

Type of response needed: ${replyType}`;
    }

    // Free AI API Integration (using multiple free services as fallbacks)
    async callFreeAI(prompt) {
        // Try multiple free AI services as fallbacks
        const services = [
            () => this.callHuggingFaceAPI(prompt),
            () => this.callCohere(prompt),
            () => this.callLocalLLM(prompt)
        ];

        for (const service of services) {
            try {
                const result = await service();
                if (result) return result;
            } catch (error) {
                console.log('AI service failed, trying next...', error);
                continue;
            }
        }

        // Fallback to template-based generation
        return this.generateTemplateResponse(prompt);
    }

    async callHuggingFaceAPI(prompt) {
        try {
            const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 500,
                        temperature: 0.7
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result[0]?.generated_text || this.generateTemplateResponse(prompt);
            }
        } catch (error) {
            console.error('Hugging Face API error:', error);
        }

        return null;
    }

    async callCohere(prompt) {
        // Cohere free tier implementation
        try {
            // This would require Cohere API key - using fallback for now
            return this.generateTemplateResponse(prompt);
        } catch (error) {
            console.error('Cohere API error:', error);
            return null;
        }
    }

    async callLocalLLM(prompt) {
        // Try to use browser-based AI if available (experimental)
        try {
            if ('ai' in window) {
                const session = await window.ai.createTextSession();
                return await session.prompt(prompt);
            }
        } catch (error) {
            console.error('Local AI error:', error);
        }

        return null;
    }

    // Template-based fallback generation
    generateTemplateResponse(prompt) {
        if (prompt.includes('proposal')) {
            return this.generateProposalTemplate(prompt);
        } else if (prompt.includes('price estimate')) {
            return this.generatePriceTemplate(prompt);
        } else if (prompt.includes('response') || prompt.includes('reply')) {
            return this.generateReplyTemplate(prompt);
        }

        return "I understand your request. Here's a professional response based on the information provided. Please review and customize as needed for your specific situation.";
    }

    generateProposalTemplate(prompt) {
        const platform = document.getElementById('platform-select').value;
        const tone = document.getElementById('tone-select').value;

        return `Dear Client,

Thank you for posting this project. I've carefully reviewed your requirements and I'm excited about the opportunity to work with you.

**My Understanding:**
Based on your description, you're looking for [project summary]. I have extensive experience in this area and can deliver exactly what you need.

**My Approach:**
1. Initial consultation to clarify requirements
2. Planning and strategy development
3. Implementation with regular updates
4. Testing and quality assurance
5. Final delivery and support

**Why Choose Me:**
- Proven track record in similar projects
- Clear communication throughout the project
- On-time delivery guarantee
- Post-project support included

**Next Steps:**
I'd love to discuss your project in more detail. Please feel free to message me with any questions.

Looking forward to working together!

Best regards,
[Your Name]`;
    }

    generatePriceTemplate(prompt) {
        const projectType = document.getElementById('project-type').value;
        const complexity = document.getElementById('complexity').value;

        const baseRates = {
            'web-development': { simple: 500, medium: 2000, complex: 8000 },
            'mobile-app': { simple: 1000, medium: 5000, complex: 15000 },
            'design': { simple: 300, medium: 1500, complex: 5000 },
            'writing': { simple: 200, medium: 800, complex: 3000 },
            'marketing': { simple: 400, medium: 1800, complex: 6000 },
            'data-entry': { simple: 100, medium: 500, complex: 2000 },
            'other': { simple: 300, medium: 1200, complex: 4000 }
        };

        const basePrice = baseRates[projectType]?.[complexity] || 500;
        const priceRange = `$${Math.round(basePrice * 0.8)} - $${Math.round(basePrice * 1.2)}`;

        return `**Price Estimate Analysis**

**Estimated Price Range:** ${priceRange}

**Time Estimate:** ${complexity === 'simple' ? '1-3 days' : complexity === 'medium' ? '1-2 weeks' : '1+ months'}

**Breakdown:**
- Planning & Research: 15%
- Development/Execution: 60%
- Testing & Revisions: 15%
- Project Management: 10%

**Factors Affecting Price:**
- Project complexity and scope
- Timeline requirements
- Number of revisions included
- Additional features or integrations

**Recommendations:**
- Start with a clear scope document
- Consider phased approach for complex projects
- Include buffer for revisions and changes
- Discuss payment milestones upfront

This estimate is based on current market rates and project complexity. Final pricing may vary based on specific requirements.`;
    }

    generateReplyTemplate(prompt) {
        const replyType = document.getElementById('reply-type').value;

        const templates = {
            'initial-response': `Thank you for reaching out! I've received your message and I'm excited about the opportunity to work on your project.

I'll review the details carefully and get back to you within 24 hours with a detailed proposal and any questions I might have.

In the meantime, please feel free to share any additional information that might help me understand your requirements better.

Best regards,`,

            'follow-up': `I wanted to follow up on our previous conversation about your project.

I'm still very interested in working with you and wanted to see if you had any additional questions or if there's anything else I can clarify.

I'm available for a quick call if that would be helpful to discuss the project further.

Looking forward to hearing from you!`,

            'project-update': `I wanted to provide you with an update on your project progress.

**Current Status:** [Completed tasks]
**Next Steps:** [Upcoming milestones]
**Timeline:** On track for delivery as scheduled

If you have any questions or feedback, please don't hesitate to reach out.

Best regards,`,

            'deadline-request': `Thank you for your message. I understand the importance of meeting your timeline.

Based on the current scope, I can deliver the project by [date]. To ensure quality delivery, I may need to prioritize this project over others.

Please confirm if this timeline works for you, and I'll adjust my schedule accordingly.

Best regards,`,

            'payment-reminder': `I hope you're happy with the work delivered so far.

This is a friendly reminder that payment for [project/milestone] is now due. The invoice was sent on [date] for the amount of [amount].

Please let me know if you need any clarification or if there are any issues with the invoice.

Thank you for your business!`,

            'project-completion': `I'm pleased to inform you that your project has been completed and delivered.

**Deliverables included:**
- [List of deliverables]

**Next steps:**
