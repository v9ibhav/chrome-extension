// Freelancer Productivity AI Toolkit - Enhanced Main Popup Script
class FreelancerAIToolkit {
    constructor() {
        this.currentTab = 'proposals';
        this.aiApiKey = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.setupTabNavigation();
        this.setupEventListeners();
        await this.loadStoredData();
        this.checkAIStatus();
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showInfo('Welcome to Freelancer AI Toolkit! Start by generating your first proposal.');
        }, 1000);
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
                
                // Load tab-specific data
                this.loadTabData(tabId);
            });
        });
    }

    async loadTabData(tabId) {
        switch(tabId) {
            case 'income':
                await this.updateIncomeDisplay();
                break;
            case 'crm':
                await this.updateClientsDisplay();
                break;
        }
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

        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    // AI Proposal Generation using free AI API
    async generateProposal() {
        const jobDescription = document.getElementById('job-description').value.trim();
        const skills = document.getElementById('skills-input').value.trim();
        const platform = document.getElementById('platform-select').value;
        const tone = document.getElementById('tone-select').value;

        if (!jobDescription) {
            this.showError('Please enter a job description');
            return;
        }

        const button = document.getElementById('generate-proposal');
        const output = document.getElementById('proposal-output');

        this.setLoading(button, true);

        try {
            const proposal = await this.generateProposalContent(jobDescription, skills, platform, tone);
            
            output.textContent = proposal;
            output.classList.add('show');

            // Store for future reference
            await this.storeProposal(proposal, platform);
            this.showSuccess('Proposal generated successfully!');

        } catch (error) {
            this.showError('Failed to generate proposal. Please try again.');
            console.error('Proposal generation error:', error);
        } finally {
            this.setLoading(button, false);
        }
    }

    async generateProposalContent(jobDescription, skills, platform, tone) {
        // Enhanced proposal generation with better templates
        const templates = {
            upwork: this.getUpworkProposalTemplate(jobDescription, skills, tone),
            fiverr: this.getFiverrProposalTemplate(jobDescription, skills, tone),
            freelancer: this.getFreelancerProposalTemplate(jobDescription, skills, tone),
            custom: this.getCustomProposalTemplate(jobDescription, skills, tone)
        };

        return templates[platform] || templates.custom;
    }

    getUpworkProposalTemplate(jobDescription, skills, tone) {
        const toneStyles = {
            professional: {
                greeting: "Dear Client,",
                closing: "I look forward to the opportunity to work with you.\n\nBest regards,"
            },
            friendly: {
                greeting: "Hi there!",
                closing: "I'm excited about the possibility of working together!\n\nCheers,"
            },
            confident: {
                greeting: "Hello,",
                closing: "I'm confident I can deliver exceptional results for your project.\n\nBest,"
            },
            creative: {
                greeting: "Greetings!",
                closing: "Let's create something amazing together!\n\nCreatively yours,"
            }
        };

        const style = toneStyles[tone] || toneStyles.professional;

        return `${style.greeting}

Thank you for posting this project. I've carefully reviewed your requirements and I'm excited about the opportunity to work with you.

🎯 MY UNDERSTANDING:
${this.extractKeyRequirements(jobDescription)}

💡 MY APPROACH:
1. Initial consultation to clarify all requirements
2. Detailed project planning and timeline creation
3. Regular progress updates and milestone deliveries
4. Quality assurance and testing
5. Final delivery with documentation and support

🚀 WHY CHOOSE ME:
${this.formatSkills(skills)}
• Proven track record with similar projects
• Clear communication throughout the project
• 100% on-time delivery guarantee
• Post-project support included

📋 NEXT STEPS:
I'd love to discuss your project in more detail. I'm available for a quick call to clarify any questions and ensure we're perfectly aligned on your vision.

${style.closing}`;
    }

    getFiverrProposalTemplate(jobDescription, skills, tone) {
        return `Hi there! 👋

I'm excited about your project and I believe I'm the perfect fit for what you need.

✨ WHAT I UNDERSTAND:
${this.extractKeyRequirements(jobDescription)}

🎯 WHAT I BRING:
${this.formatSkills(skills)}

🚀 MY PROCESS:
• Quick turnaround without compromising quality
• Unlimited revisions until you're 100% satisfied
• Regular updates throughout the project
• Professional communication

💬 LET'S CHAT:
I'd love to discuss your project further. Feel free to message me with any questions!

Looking forward to working together! 🌟`;
    }

    getFreelancerProposalTemplate(jobDescription, skills, tone) {
        return `Hello,

I'm interested in your project and would like to submit my proposal.

PROJECT UNDERSTANDING:
${this.extractKeyRequirements(jobDescription)}

MY QUALIFICATIONS:
${this.formatSkills(skills)}

PROPOSED APPROACH:
1. Requirements analysis and planning
2. Development/execution phase
3. Testing and quality assurance
4. Delivery and support

I'm committed to delivering high-quality work within your timeline and budget.

Please feel free to contact me for any clarifications.

Best regards,`;
    }

    getCustomProposalTemplate(jobDescription, skills, tone) {
        return `Dear Client,

Thank you for considering my services for your project.

PROJECT OVERVIEW:
${this.extractKeyRequirements(jobDescription)}

MY EXPERTISE:
${this.formatSkills(skills)}

DELIVERY APPROACH:
• Thorough understanding of requirements
• Strategic planning and execution
• Regular communication and updates
• Quality delivery within timeline

I'm confident in my ability to deliver exceptional results for your project.

Looking forward to working with you.

Best regards,`;
    }

    extractKeyRequirements(description) {
        // Simple extraction of key points from job description
        const sentences = description.split('.').filter(s => s.trim().length > 10);
        return sentences.slice(0, 3).map(s => `• ${s.trim()}`).join('\n');
    }

    formatSkills(skills) {
        if (!skills) return '• Experienced professional ready to tackle your project';
        
        const skillList = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return skillList.map(skill => `• ${skill}`).join('\n');
    }

    // AI Price Estimation
    async estimatePrice() {
        const projectType = document.getElementById('project-type').value;
        const complexity = document.getElementById('complexity').value;
        const experience = document.getElementById('experience-level').value;
        const description = document.getElementById('project-description').value.trim();

        const button = document.getElementById('estimate-price');
        const output = document.getElementById('price-output');

        this.setLoading(button, true);

        try {
            const estimate = this.generatePriceEstimate(projectType, complexity, experience, description);
            
            output.textContent = estimate;
            output.classList.add('show');
            this.showSuccess('Price estimate generated!');

        } catch (error) {
            this.showError('Failed to estimate price. Please try again.');
            console.error('Price estimation error:', error);
        } finally {
            this.setLoading(button, false);
        }
    }

    generatePriceEstimate(projectType, complexity, experience, description) {
        const baseRates = {
            'web-development': { 
                simple: { min: 500, max: 1500, hours: '20-40' },
                medium: { min: 2000, max: 5000, hours: '80-120' },
                complex: { min: 8000, max: 20000, hours: '200-400' }
            },
            'mobile-app': { 
                simple: { min: 1000, max: 3000, hours: '40-80' },
                medium: { min: 5000, max: 15000, hours: '150-300' },
                complex: { min: 15000, max: 50000, hours: '400-800' }
            },
            'design': { 
                simple: { min: 300, max: 800, hours: '10-20' },
                medium: { min: 1500, max: 4000, hours: '40-80' },
                complex: { min: 5000, max: 15000, hours: '100-200' }
            },
            'writing': { 
                simple: { min: 200, max: 600, hours: '8-16' },
                medium: { min: 800, max: 2500, hours: '25-50' },
                complex: { min: 3000, max: 8000, hours: '60-120' }
            },
            'marketing': { 
                simple: { min: 400, max: 1200, hours: '15-30' },
                medium: { min: 1800, max: 5000, hours: '50-100' },
                complex: { min: 6000, max: 18000, hours: '120-250' }
            },
            'data-entry': { 
                simple: { min: 100, max: 400, hours: '5-15' },
                medium: { min: 500, max: 1500, hours: '20-50' },
                complex: { min: 2000, max: 6000, hours: '60-150' }
            },
            'other': { 
                simple: { min: 300, max: 900, hours: '12-25' },
                medium: { min: 1200, max: 3500, hours: '35-75' },
                complex: { min: 4000, max: 12000, hours: '80-200' }
            }
        };

        const experienceMultipliers = {
            'beginner': 0.7,
            'intermediate': 1.0,
            'expert': 1.4
        };

        const rates = baseRates[projectType]?.[complexity] || baseRates.other[complexity];
        const multiplier = experienceMultipliers[experience] || 1.0;

        const minPrice = Math.round(rates.min * multiplier);
        const maxPrice = Math.round(rates.max * multiplier);

        return `💰 PRICE ESTIMATE ANALYSIS

📊 RECOMMENDED PRICE RANGE: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}

⏱️ ESTIMATED TIME: ${rates.hours} hours

📋 PROJECT BREAKDOWN:
• Planning & Research: 15% ($${Math.round(minPrice * 0.15)} - $${Math.round(maxPrice * 0.15)})
• Development/Execution: 60% ($${Math.round(minPrice * 0.6)} - $${Math.round(maxPrice * 0.6)})
• Testing & Revisions: 15% ($${Math.round(minPrice * 0.15)} - $${Math.round(maxPrice * 0.15)})
• Project Management: 10% ($${Math.round(minPrice * 0.1)} - $${Math.round(maxPrice * 0.1)})

🎯 PRICING STRATEGY:
• Start with: $${Math.round((minPrice + maxPrice) / 2).toLocaleString()} (middle range)
• Minimum acceptable: $${minPrice.toLocaleString()}
• Premium pricing: $${maxPrice.toLocaleString()}

⚡ FACTORS AFFECTING PRICE:
• Project scope and complexity
• Timeline requirements (rush jobs +20-50%)
• Number of revisions included
• Additional features or integrations
• Client budget and market positioning

💡 RECOMMENDATIONS:
• Always start with a detailed scope document
• Consider offering package deals for ongoing work
• Include 2-3 revision rounds in base price
• Discuss payment milestones (50% upfront recommended)
• Add 10-20% buffer for unexpected changes

📈 MARKET INSIGHTS:
Based on current ${projectType} market rates and your ${experience} experience level.
Consider your local market conditions and client budget when finalizing.`;
    }

    // AI Reply Generation
    async generateReply() {
        const clientMessage = document.getElementById('client-message').value.trim();
        const replyType = document.getElementById('reply-type').value;
        const context = document.getElementById('reply-context').value.trim();

        if (!clientMessage) {
            this.showError('Please enter the client message');
            return;
        }

        const button = document.getElementById('generate-reply');
        const output = document.getElementById('reply-output');

        this.setLoading(button, true);

        try {
            const reply = this.generateReplyContent(clientMessage, replyType, context);
            
            output.textContent = reply;
            output.classList.add('show');
            this.showSuccess('Reply generated successfully!');

        } catch (error) {
            this.showError('Failed to generate reply. Please try again.');
            console.error('Reply generation error:', error);
        } finally {
            this.setLoading(button, false);
        }
    }

    generateReplyContent(clientMessage, replyType, context) {
        const templates = {
            'initial-response': `Hi there!

Thank you for reaching out about your project. I've carefully read through your requirements and I'm excited about the opportunity to work with you.

Based on your message: "${clientMessage.substring(0, 100)}..."

I have extensive experience in this area and I'm confident I can deliver exactly what you're looking for. 

I'll prepare a detailed proposal and get back to you within 24 hours with:
• A clear project timeline
• Detailed cost breakdown  
• Portfolio examples relevant to your needs
• Any clarifying questions

${context ? `Additional notes: ${context}` : ''}

Looking forward to discussing this further!

Best regards,`,

            'follow-up': `Hi again!

I wanted to follow up on our previous conversation about your project.

I'm still very interested in working with you and wanted to see if you had any additional questions about my proposal or if there's anything else I can clarify.

${context ? `Regarding: ${context}` : ''}

I'm available for a quick call this week if that would be helpful to discuss the project details further.

Please let me know your thoughts when you have a moment.

Best regards,`,

            'project-update': `Hi!

I wanted to provide you with an update on your project progress.

📊 CURRENT STATUS:
• Completed: [List completed milestones]
• In Progress: [Current work]
• Next Steps: [Upcoming tasks]

⏰ TIMELINE:
We're currently on track for delivery as scheduled. 

${context ? `Additional notes: ${context}` : ''}

If you have any questions or feedback on the current progress, please don't hesitate to reach out.

Best regards,`,

            'deadline-request': `Hi!

Thank you for your message regarding the timeline.

I understand the importance of meeting your deadline, and I want to ensure we can deliver quality work within your timeframe.

Based on the current scope, I can prioritize your project and deliver by [DATE]. To ensure the best quality output, I may need to:
• Adjust my current schedule
• Focus exclusively on your project
• Potentially bring in additional resources if needed

${context ? `Considerations: ${context}` : ''}

Please confirm if this timeline works for you, and I'll immediately adjust my schedule accordingly.

Best regards,`,

            'payment-reminder': `Hi!

I hope you're happy with the work delivered so far.

This is a friendly reminder that payment for [PROJECT/MILESTONE] is now due. The invoice was sent on [DATE] for the amount of $[AMOUNT].

Invoice details:
• Invoice #: [NUMBER]
• Amount: $[AMOUNT]
• Due Date: [DATE]

${context ? `Additional details: ${context}` : ''}

Please let me know if you need any clarification or if there are any issues with the invoice.

Thank you for your business!

Best regards,`,

            'project-completion': `Hi!

I'm pleased to inform you that your project has been completed and delivered! 🎉

📦 DELIVERABLES INCLUDED:
• [List all deliverables]
• Source files and documentation
• Usage instructions/guidelines

✅ WHAT'S NEXT:
• Please review all deliverables
• Let me know if you need any adjustments
• I'm available for post-project support

${context ? `Additional notes: ${context}` : ''}

It's been a pleasure working with you on this project. I hope the results exceed your expectations!

Please don't hesitate to reach out if you need any future assistance.

Best regards,`
        };

        return templates[replyType] || templates['initial-response'];
    }

    // Income Tracking Functions
    async syncGmail() {
        try {
            this.showInfo('Opening Gmail for income sync...');
            
            // Check if Gmail is already open
            const tabs = await chrome.tabs.query({ url: '*://mail.google.com/*' });
            
            if (tabs.length > 0) {
                // Switch to existing Gmail tab
                await chrome.tabs.update(tabs[0].id, { active: true });
                await chrome.windows.update(tabs[0].windowId, { focused: true });
            } else {
                // Open new Gmail tab
                await chrome.tabs.create({ url: 'https://mail.google.com' });
            }
            
            this.showSuccess('Gmail opened! The extension will automatically scan for income data.');
        } catch (error) {
            this.showError('Failed to open Gmail. Please try again.');
            console.error('Gmail sync error:', error);
        }
    }

    async syncWhatsApp() {
        try {
            this.showInfo('Opening WhatsApp Web for income sync...');
            
            const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
            
            if (tabs.length > 0) {
                await chrome.tabs.update(tabs[0].id, { active: true });
                await chrome.windows.update(tabs[0].windowId, { focused: true });
            } else {
                await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
            }
            
            this.showSuccess('WhatsApp Web opened! The extension will scan for payment messages.');
        } catch (error) {
            this.showError('Failed to open WhatsApp Web. Please try again.');
            console.error('WhatsApp sync error:', error);
        }
    }

    showIncomeModal() {
        document.getElementById('income-modal').classList.add('show');
        document.getElementById('income-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('income-client').focus();
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
        const client = document.getElementById('income-client').value.trim();
        const amount = parseFloat(document.getElementById('income-amount').value);
        const date = document.getElementById('income-date').value;
        const description = document.getElementById('income-description').value.trim();

        if (!client || !amount || !date) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (amount <= 0) {
            this.showError('Amount must be greater than 0');
            return;
        }

        const entry = {
            id: Date.now().toString(),
            client,
            amount,
            date,
            description: description || `Payment from ${client}`,
            source: 'manual',
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
        
        if (entries.length === 0) {
            recentList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No income entries yet. Add your first entry!</div>';
            return;
        }
        
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
        document.getElementById('client-name').focus();
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
        const name = document.getElementById('client-name').value.trim();
        const email = document.getElementById('client-email').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        const company = document.getElementById('client-company').value.trim();
        const status = document.getElementById('client-status').value;
        const notes = document.getElementById('client-notes').value.trim();

        if (!name || !email) {
            this.showError('Name and email are required');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
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
        
        if (clients.length === 0) {
            clientsList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No clients yet. Add your first client!</div>';
            return;
        }
        
        clients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-name">${client.name}</div>
                <div class="client-email">${client.email}</div>
                ${client.company ? `<div style="font-size: 12px; color: #888; margin-bottom: 8px;">${client.company}</div>` : ''}
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
            (client.company && client.company.toLowerCase().includes(query.toLowerCase()))
        );
        
        const clientsList = document.getElementById('clients-list');
        clientsList.innerHTML = '';
        
        if (filtered.length === 0) {
            clientsList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No clients found matching your search.</div>';
            return;
        }
        
        filtered.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-name">${client.name}</div>
                <div class="client-email">${client.email}</div>
                ${client.company ? `<div style="font-size: 12px; color: #888; margin-bottom: 8px;">${client.company}</div>` : ''}
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
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `freelancer-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
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
        const isVisible = templates.style.display !== 'none';
        templates.style.display = isVisible ? 'none' : 'grid';
    }

    async generateInvoice(templateType) {
        try {
            const invoiceHTML = this.createInvoiceHTML(templateType);
            
            const invoiceWindow = window.open('', '_blank', 'width=800,height=600');
            invoiceWindow.document.write(invoiceHTML);
            invoiceWindow.document.close();
            
            this.showSuccess('Invoice template opened in new window');
        } catch (error) {
            this.showError('Failed to generate invoice');
            console.error('Invoice generation error:', error);
        }
    }

    createInvoiceHTML(templateType) {
        const templates = {
            basic: this.getBasicInvoiceTemplate(),
            professional: this.getProfessionalInvoiceTemplate(),
            creative: this.getCreativeInvoiceTemplate()
        };

        return templates[templateType] || templates.basic;
    }

    getBasicInvoiceTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice Template</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    background: white;
                    color: black;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #000; 
                    padding-bottom: 20px; 
                    margin-bottom: 40px; 
                }
                .invoice-details { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 40px; 
                    margin-bottom: 40px; 
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 30px;
                }
                .items-table th, .items-table td { 
                    border: 1px solid #000; 
                    padding: 12px; 
                    text-align: left; 
                }
                .items-table th {
                    background: #000;
                    color: white;
                }
                .total { 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 18px; 
                    margin-top: 20px; 
                }
                .terms {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #000;
                }
                @media print { 
                    body { margin: 0; padding: 20px; } 
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INVOICE</h1>
                <p><strong>Invoice #:</strong> [INVOICE_NUMBER]</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="invoice-details">
                <div>
                    <h3>From:</h3>
                    <p><strong>[YOUR_NAME]</strong><br>
                    [YOUR_ADDRESS]<br>
                    [YOUR_EMAIL]<br>
                    [YOUR_PHONE]</p>
                </div>
                <div>
                    <h3>To:</h3>
                    <p><strong>[CLIENT_NAME]</strong><br>
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
                        <td>$[RATE]</td>
                        <td>$[AMOUNT]</td>
                    </tr>
                </tbody>
            </table>

            <div class="total">
                <p>Subtotal: $[SUBTOTAL]</p>
                <p>Tax (if applicable): $[TAX]</p>
                <p><strong>Total: $[TOTAL]</strong></p>
            </div>

            <div class="terms">
                <h3>Payment Terms:</h3>
                <p>Payment is due within 30 days of invoice date.</p>
                <p>Late payments may incur additional fees.</p>
                <p>Thank you for your business!</p>
            </div>
        </body>
        </html>
        `;
    }

    getProfessionalInvoiceTemplate() {
        return this.getBasicInvoiceTemplate().replace(
            '<style>',
            '<style>body { background: #f5f5f5; } .container { background: white; padding: 60px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }'
        ).replace('<body>', '<body><div class="container">').replace('</body>', '</div></body>');
    }

    getCreativeInvoiceTemplate() {
        return this.getBasicInvoiceTemplate().replace(
            'border-bottom: 2px solid #000;',
            'border-bottom: 3px solid #4f46e5; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-radius: 8px;'
        );
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
        const statusIndicator = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');

        statusIndicator.textContent = '🤖';
        statusText.textContent = 'AI Ready';
    }

    openSettings() {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            this.isLoading = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            this.isLoading = false;
        }
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
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
}

// Initialize the toolkit when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new FreelancerAIToolkit();
});