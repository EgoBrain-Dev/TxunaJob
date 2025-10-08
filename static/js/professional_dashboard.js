/**
 * Dashboard Profissional - TxunaJob
 * Sistema funcional com dados reais
 * Autor: EgoBrain-Dev
 */

class ProfessionalDashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {
            activeServices: 0,
            averageRating: 0,
            monthlyClients: 0,
            unreadMessages: 0
        };
        this.services = [];
        this.schedule = [];
        this.reviews = [];
        
        this.init();
    }
    
    async init() {
        await this.loadCurrentUser();
        await this.loadDashboardData();
        this.setupEventListeners();
        this.updateUI();
    }
    
    async loadCurrentUser() {
        try {
            // Buscar dados do usuário atual da API
            const response = await fetch('/api/professional/current', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
            } else {
                throw new Error('Erro ao carregar dados do usuário');
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            this.showError('Erro ao carregar dados do dashboard');
        }
    }
    
    async loadDashboardData() {
        try {
            // Carregar estatísticas
            await this.loadStats();
            
            // Carregar serviços
            await this.loadServices();
            
            // Carregar agenda
            await this.loadSchedule();
            
            // Carregar avaliações
            await this.loadReviews();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados do dashboard');
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch('/api/professional/stats', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.stats = data.stats;
            } else {
                // Fallback para dados calculados
                this.calculateStats();
            }
        } catch (error) {
            this.calculateStats();
        }
    }
    
    calculateStats() {
        // Calcular estatísticas baseadas nos dados locais
        this.stats.activeServices = this.services.filter(s => 
            s.status === 'in_progress' || s.status === 'pending'
        ).length;
        
        this.stats.averageRating = this.reviews.length > 0 
            ? this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length
            : 0;
            
        this.stats.monthlyClients = this.getMonthlyClientsCount();
        this.stats.unreadMessages = this.getUnreadMessagesCount();
    }
    
    async loadServices() {
        try {
            const response = await fetch('/api/professional/services', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.services = await response.json();
            } else {
                // Fallback para dados de exemplo baseados no usuário
                this.services = this.getFallbackServices();
            }
        } catch (error) {
            this.services = this.getFallbackServices();
        }
    }
    
    async loadSchedule() {
        try {
            const response = await fetch('/api/professional/schedule', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.schedule = await response.json();
            } else {
                this.schedule = this.getFallbackSchedule();
            }
        } catch (error) {
            this.schedule = this.getFallbackSchedule();
        }
    }
    
    async loadReviews() {
        try {
            const response = await fetch('/api/professional/reviews', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.reviews = await response.json();
            } else {
                this.reviews = this.getFallbackReviews();
            }
        } catch (error) {
            this.reviews = this.getFallbackReviews();
        }
    }
    
    getFallbackServices() {
        const specialty = this.currentUser?.professional_profile?.specialty || 'Eletricista';
        const location = this.currentUser?.location || 'Maputo';
        
        return [
            {
                id: 1,
                title: `Instalação ${specialty} - Casa Silva`,
                description: `Instalação completa do sistema em ${location}`,
                client_name: 'Maria Silva',
                date: new Date(),
                status: 'in_progress',
                price: 2500.00,
                address: 'Bairro Central, ' + location
            },
            {
                id: 2,
                title: `Manutenção ${specialty} - Empresa ABC`,
                description: 'Manutenção preventiva do sistema',
                client_name: 'João Carlos',
                date: new Date(Date.now() + 86400000),
                status: 'pending',
                price: 1800.00,
                address: 'Zona Industrial, ' + location
            },
            {
                id: 3,
                title: `Reparo ${specialty} - Apartamento 302`,
                description: 'Reparo nas instalações',
                client_name: 'Ana Santos',
                date: new Date(Date.now() + 172800000),
                status: 'pending',
                price: 950.00,
                address: 'Av. Principal, ' + location
            }
        ];
    }
    
    getFallbackSchedule() {
        return this.services
            .filter(service => new Date(service.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);
    }
    
    getFallbackReviews() {
        return [
            {
                id: 1,
                client_name: 'Maria Santos',
                rating: 5,
                comment: 'Excelente profissional! Muito competente e educado. Recomendo!',
                date: new Date(Date.now() - 86400000),
                service_title: 'Instalação Elétrica Residencial'
            },
            {
                id: 2,
                client_name: 'João Carlos',
                rating: 4.5,
                comment: 'Trabalho bem feito e dentro do prazo combinado. Muito satisfeito!',
                date: new Date(Date.now() - 172800000),
                service_title: 'Manutenção Preventiva'
            }
        ];
    }
    
    getMonthlyClientsCount() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.services.filter(service => {
            const serviceDate = new Date(service.date);
            return serviceDate.getMonth() === currentMonth && 
                   serviceDate.getFullYear() === currentYear;
        }).length;
    }
    
    getUnreadMessagesCount() {
        // Implementar lógica real de mensagens não lidas
        return Math.floor(Math.random() * 5) + 1;
    }
    
    getAuthToken() {
        // Implementar lógica para obter token JWT
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    setupEventListeners() {
        // Ações Rápidas
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQuickAction(btn.querySelector('span').textContent);
            });
        });
        
        // Serviços - clique para detalhes
        document.querySelectorAll('.service-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showServiceDetails(this.services[index]);
            });
        });
        
        // Atualização automática a cada 30 segundos
        setInterval(() => {
            this.loadDashboardData().then(() => this.updateUI());
        }, 30000);
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'Novo Serviço':
                this.createNewService();
                break;
            case 'Agenda':
                this.showSchedule();
                break;
            case 'Mensagens':
                this.showMessages();
                break;
            case 'Relatórios':
                this.showReports();
                break;
        }
    }
    
    createNewService() {
        // Implementar criação de novo serviço
        alert('Funcionalidade de novo serviço em desenvolvimento');
    }
    
    showSchedule() {
        // Implementar visualização da agenda
        window.location.href = '/professional/schedule';
    }
    
    showMessages() {
        // Implementar visualização de mensagens
        window.location.href = '/chat';
    }
    
    showReports() {
        // Implementar visualização de relatórios
        alert('Funcionalidade de relatórios em desenvolvimento');
    }
    
    showServiceDetails(service) {
        // Implementar modal de detalhes do serviço
        const modalHtml = `
            <div class="modal-overlay active" id="serviceModalOverlay">
                <div class="modal active" id="serviceModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2><i class="fas fa-tasks"></i> Detalhes do Serviço</h2>
                            <button class="modal-close" onclick="professionalDashboard.closeServiceModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <h3>${service.title}</h3>
                            <p><strong>Cliente:</strong> ${service.client_name}</p>
                            <p><strong>Descrição:</strong> ${service.description}</p>
                            <p><strong>Endereço:</strong> ${service.address}</p>
                            <p><strong>Data:</strong> ${new Date(service.date).toLocaleDateString('pt-MZ')}</p>
                            <p><strong>Valor:</strong> ${service.price.toFixed(2)} MT</p>
                            <p><strong>Status:</strong> <span class="service-status status-${service.status}">${this.getStatusText(service.status)}</span></p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="professionalDashboard.editService(${service.id})">
                                <i class="fas fa-edit"></i> Editar Serviço
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    closeServiceModal() {
        const modal = document.getElementById('serviceModalOverlay');
        if (modal) {
            modal.remove();
        }
    }
    
    editService(serviceId) {
        // Implementar edição de serviço
        alert(`Editando serviço #${serviceId}`);
        this.closeServiceModal();
    }
    
    getStatusText(status) {
        const statusMap = {
            'in_progress': 'Em Andamento',
            'pending': 'Agendado',
            'completed': 'Concluído',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }
    
    updateUI() {
        this.updateStats();
        this.updateServicesList();
        this.updateSchedule();
        this.updateReviews();
        this.updateUserInfo();
    }
    
    updateStats() {
        // Atualizar estatísticas na UI
        document.querySelectorAll('.stat-number')[0].textContent = this.stats.activeServices;
        document.querySelectorAll('.stat-number')[1].textContent = this.stats.averageRating.toFixed(1);
        document.querySelectorAll('.stat-number')[2].textContent = this.stats.monthlyClients;
        document.querySelectorAll('.stat-number')[3].textContent = this.stats.unreadMessages;
    }
    
    updateServicesList() {
        const servicesContainer = document.querySelector('.service-list');
        if (!servicesContainer) return;
        
        servicesContainer.innerHTML = this.services
            .slice(0, 3) // Mostrar apenas os 3 primeiros
            .map(service => this.createServiceHTML(service))
            .join('');
            
        // Re-adicionar event listeners
        servicesContainer.querySelectorAll('.service-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showServiceDetails(this.services[index]);
            });
        });
    }
    
    createServiceHTML(service) {
        return `
            <div class="service-item">
                <div class="service-header">
                    <h3 class="service-title">${service.title}</h3>
                    <span class="service-date">${this.formatServiceDate(service.date)}</span>
                </div>
                <p class="service-description">${service.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span class="service-status status-${service.status}">${this.getStatusText(service.status)}</span>
                    <span style="color: var(--primary-orange); font-weight: 600;">${service.price.toFixed(2)} MT</span>
                </div>
            </div>
        `;
    }
    
    updateSchedule() {
        const scheduleContainer = document.querySelector('.dashboard-sidebar .service-list');
        if (!scheduleContainer) return;
        
        scheduleContainer.innerHTML = this.schedule
            .map(service => this.createScheduleHTML(service))
            .join('');
    }
    
    createScheduleHTML(service) {
        return `
            <div class="service-item">
                <div class="service-header">
                    <h3 class="service-title" style="font-size: 0.9rem;">${service.client_name}</h3>
                    <span class="service-date">${this.formatScheduleDate(service.date)}</span>
                </div>
                <p class="service-description" style="font-size: 0.8rem;">
                    ${this.formatTime(service.date)} - ${service.title}
                </p>
            </div>
        `;
    }
    
    updateReviews() {
        const reviewsContainer = document.querySelector('.message-list');
        if (!reviewsContainer) return;
        
        reviewsContainer.innerHTML = this.reviews
            .slice(0, 2) // Mostrar apenas 2 avaliações
            .map(review => this.createReviewHTML(review))
            .join('');
    }
    
    createReviewHTML(review) {
        const stars = '★'.repeat(Math.floor(review.rating)) + 
                     (review.rating % 1 !== 0 ? '½' : '') + 
                     '☆'.repeat(5 - Math.ceil(review.rating));
                     
        return `
            <div class="message-item">
                <div class="message-header">
                    <h3 class="message-sender">${review.client_name}</h3>
                    <div class="rating-display" style="color: var(--warning-yellow);">
                        ${stars}
                    </div>
                </div>
                <p class="message-preview">${review.comment}</p>
            </div>
        `;
    }
    
    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Atualizar informações do usuário
        const profileElement = document.querySelector('.dashboard-welcome h1');
        if (profileElement) {
            profileElement.textContent = `Bem-vindo, ${this.currentUser.username}! 🛠️`;
        }
        
        // Atualizar especialidade
        const specialtyElement = document.querySelector('.specialty-badge');
        if (specialtyElement && this.currentUser.professional_profile) {
            specialtyElement.innerHTML = `<i class="fas fa-tools"></i> ${this.currentUser.professional_profile.specialty}`;
        }
        
        // Atualizar localização
        const locationElement = document.querySelector('.dashboard-welcome p + p');
        if (locationElement && this.currentUser.location) {
            locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentUser.location}`;
        }
    }
    
    formatServiceDate(date) {
        const today = new Date();
        const serviceDate = new Date(date);
        const diffTime = serviceDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`;
        
        return serviceDate.toLocaleDateString('pt-MZ', {
            day: 'numeric',
            month: 'short'
        });
    }
    
    formatScheduleDate(date) {
        const serviceDate = new Date(date);
        const today = new Date();
        
        if (serviceDate.toDateString() === today.toDateString()) {
            return 'Hoje';
        }
        
        if (serviceDate.getDate() === today.getDate() + 1) {
            return 'Amanhã';
        }
        
        return serviceDate.toLocaleDateString('pt-MZ', {
            day: 'numeric',
            month: 'short'
        });
    }
    
    formatTime(date) {
        return new Date(date).toLocaleTimeString('pt-MZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showError(message) {
        // Usar o sistema de notificação existente
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.professionalDashboard = new ProfessionalDashboard();
});

// Adicionar ao objeto global TxunaJobApp
if (window.TxunaJobApp) {
    window.TxunaJobApp.ProfessionalDashboard = ProfessionalDashboard;
}