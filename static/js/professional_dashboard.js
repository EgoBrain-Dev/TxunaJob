/**
 * TxunaJob - Dashboard Profissional
 * Sistema funcional com dados reais do MongoDB
 * Autor: EgoBrain-Dev
 * Versão: 1.1.0 - Com funcionalidade de Novo Serviço
 */

class ProfessionalDashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {};
        this.services = [];
        this.reviews = [];
        this.schedule = [];
        this.categories = [];
        
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        await this.loadDashboardData();
        await this.loadCategories();
        this.setupEventListeners();
        this.setupModalHandlers();
        this.updateUI();
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/professional/current', {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data;
            } else {
                console.error('Erro ao carregar dados do usuário');
                this.showError('Erro ao carregar dados do perfil');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            this.showError('Erro de conexão ao carregar perfil');
        }
    }

    async loadDashboardData() {
        try {
            // Carregar todos os dados em paralelo
            const [statsResponse, servicesResponse, reviewsResponse, scheduleResponse] = await Promise.all([
                fetch('/api/professional/stats', { credentials: 'include' }),
                fetch('/api/professional/services', { credentials: 'include' }),
                fetch('/api/professional/reviews', { credentials: 'include' }),
                fetch('/api/professional/schedule', { credentials: 'include' })
            ]);

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.stats = statsData.stats || {};
            }

            if (servicesResponse.ok) {
                this.services = await servicesResponse.json();
            }

            if (reviewsResponse.ok) {
                this.reviews = await reviewsResponse.json();
            }

            if (scheduleResponse.ok) {
                this.schedule = await scheduleResponse.json();
            }

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            this.showError('Erro ao carregar dados. Tente recarregar a página.');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/professional/categories', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.categories = await response.json();
                this.populateCategories();
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    populateCategories() {
        const categorySelect = document.getElementById('servicoCategoria');
        if (!categorySelect) return;

        // Limpar opções existentes (exceto a primeira)
        while (categorySelect.children.length > 1) {
            categorySelect.removeChild(categorySelect.lastChild);
        }

        // Adicionar categorias
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Ações rápidas
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQuickAction(btn);
            });
        });

        // Serviços - ações
        document.addEventListener('click', (e) => {
            if (e.target.closest('.service-action')) {
                const action = e.target.closest('.service-action');
                this.handleServiceAction(action);
            }
        });

        // Atualização automática a cada 30 segundos
        setInterval(() => {
            this.loadDashboardData().then(() => this.updateUI());
        }, 30000);

        // Prevenir comportamento padrão de links
        document.querySelectorAll('a[href="#"]').forEach(link => {
            link.addEventListener('click', (e) => e.preventDefault());
        });
    }

    setupModalHandlers() {
        // Elementos do modal
        const novoServicoBtn = document.getElementById('novoServicoBtn');
        const novoServicoModal = document.getElementById('novoServicoModal');
        const closeModal = document.querySelector('.close');
        const cancelarBtn = document.getElementById('cancelarServico');
        const novoServicoForm = document.getElementById('novoServicoForm');
        const successModal = document.getElementById('successModal');
        const fecharSuccessModal = document.getElementById('fecharSuccessModal');

        // Abrir modal
        if (novoServicoBtn) {
            novoServicoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirModalNovoServico();
            });
        }

        // Fechar modal
        if (closeModal) {
            closeModal.addEventListener('click', () => this.fecharModal());
        }

        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', () => this.fecharModal());
        }

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target === novoServicoModal) {
                this.fecharModal();
            }
            if (e.target === successModal) {
                this.fecharSuccessModal();
            }
        });

        // Submissão do formulário
        if (novoServicoForm) {
            novoServicoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.criarNovoServico();
            });
        }

        // Fechar modal de sucesso
        if (fecharSuccessModal) {
            fecharSuccessModal.addEventListener('click', () => this.fecharSuccessModal());
        }
    }

    abrirModalNovoServico() {
        const novoServicoModal = document.getElementById('novoServicoModal');
        if (novoServicoModal) {
            novoServicoModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Preencher localização padrão
            const locationInput = document.getElementById('servicoLocalizacao');
            if (locationInput && this.currentUser && this.currentUser.location) {
                locationInput.value = this.currentUser.location;
            }
        }
    }

    fecharModal() {
        const novoServicoModal = document.getElementById('novoServicoModal');
        if (novoServicoModal) {
            novoServicoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.limparFormulario();
        }
    }

    fecharSuccessModal() {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    limparFormulario() {
        const form = document.getElementById('novoServicoForm');
        if (form) {
            form.reset();
            
            // Restaurar localização padrão
            const locationInput = document.getElementById('servicoLocalizacao');
            if (locationInput && this.currentUser && this.currentUser.location) {
                locationInput.value = this.currentUser.location;
            }
        }
    }

    async criarNovoServico() {
        const form = document.getElementById('novoServicoForm');
        const criarBtn = document.getElementById('criarServicoBtn');
        
        if (!form) return;

        // Validar campos obrigatórios
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--error-color)';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            this.showError('Preencha todos os campos obrigatórios');
            return;
        }

        // Coletar dados do formulário
        const formData = new FormData(form);
        const serviceData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            location: formData.get('location'),
            duration: formData.get('duration'),
            tags: formData.get('tags')
        };

        // Validar preço
        if (serviceData.price <= 0) {
            this.showError('O preço deve ser maior que zero');
            return;
        }

        try {
            // Desabilitar botão durante a requisição
            if (criarBtn) {
                criarBtn.disabled = true;
                criarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
            }

            const response = await fetch('/api/professional/services/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(serviceData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Sucesso
                this.fecharModal();
                this.mostrarSucesso(result.message || 'Serviço criado com sucesso!');
                
                // Recarregar dados do dashboard
                await this.loadDashboardData();
                this.updateUI();
            } else {
                // Erro
                this.showError(result.error || 'Erro ao criar serviço');
            }

        } catch (error) {
            console.error('Erro ao criar serviço:', error);
            this.showError('Erro de conexão ao criar serviço');
        } finally {
            // Reabilitar botão
            if (criarBtn) {
                criarBtn.disabled = false;
                criarBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Serviço';
            }
        }
    }

    mostrarSucesso(mensagem) {
        const successModal = document.getElementById('successModal');
        const successMessage = document.getElementById('successMessage');
        
        if (successModal && successMessage) {
            successMessage.textContent = mensagem;
            successModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            this.showSuccess(mensagem);
        }
    }

    handleQuickAction(button) {
        const action = button.querySelector('span').textContent;
        
        switch(action) {
            case 'Novo Serviço':
                this.abrirModalNovoServico();
                break;
            case 'Agenda':
                this.showSchedule();
                break;
            case 'Mensagens':
                this.openMessages();
                break;
            case 'Relatórios':
                this.showReports();
                break;
            default:
                console.log('Ação não implementada:', action);
        }
    }

    handleServiceAction(actionElement) {
        const serviceId = actionElement.dataset.serviceId;
        const action = actionElement.dataset.action;
        
        switch(action) {
            case 'accept':
                this.acceptService(serviceId);
                break;
            case 'reject':
                this.rejectService(serviceId);
                break;
            case 'complete':
                this.completeService(serviceId);
                break;
            case 'details':
                this.showServiceDetails(serviceId);
                break;
            default:
                console.log('Ação de serviço não implementada:', action);
        }
    }

    updateUI() {
        this.updateStats();
        this.updateServices();
        this.updateReviews();
        this.updateSchedule();
        this.updateProfileInfo();
    }

    updateStats() {
        // Atualizar cards de estatísticas
        const stats = this.stats || {};
        
        document.querySelectorAll('.stat-card').forEach(card => {
            const label = card.querySelector('.stat-label').textContent;
            const numberElement = card.querySelector('.stat-number');
            
            switch(label) {
                case 'Serviços Ativos':
                    numberElement.textContent = stats.activeServices || 0;
                    break;
                case 'Avaliação Média':
                    numberElement.textContent = stats.averageRating || '0.0';
                    break;
                case 'Clientes Este Mês':
                    numberElement.textContent = stats.monthlyClients || 0;
                    break;
                case 'Mensagens':
                    numberElement.textContent = stats.unreadMessages || 0;
                    break;
            }
        });
    }

    updateServices() {
        const container = document.getElementById('servicesList');
        if (!container) return;

        if (!this.services || this.services.length === 0) {
            container.innerHTML = this.createEmptyServicesState();
            return;
        }

        container.innerHTML = this.services.map(service => this.createServiceItem(service)).join('');
    }

    createServiceItem(service) {
        const statusClass = this.getStatusClass(service.status);
        const statusText = this.getStatusText(service.status);
        const formattedDate = this.formatDate(service.date || service.created_at);
        const formattedPrice = this.formatPrice(service.price);

        return `
            <div class="service-item" data-service-id="${service.id}">
                <div class="service-header">
                    <h3 class="service-title">${service.title}</h3>
                    <span class="service-date">${formattedDate}</span>
                </div>
                <p class="service-description">${service.description}</p>
                <div class="service-client">
                    <i class="fas fa-user"></i>
                    <span>${service.client_name}</span>
                </div>
                <div class="service-actions">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span class="service-status ${statusClass}">${statusText}</span>
                        <span style="color: var(--primary-orange); font-weight: 600;">${formattedPrice}</span>
                    </div>
                    ${this.createServiceActions(service)}
                </div>
            </div>
        `;
    }

    createServiceActions(service) {
        let actions = '';
        
        switch(service.status) {
            case 'pending':
                actions = `
                    <div class="service-action-buttons" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                        <button class="btn btn-success btn-sm service-action" data-service-id="${service.id}" data-action="accept">
                            <i class="fas fa-check"></i> Aceitar
                        </button>
                        <button class="btn btn-danger btn-sm service-action" data-service-id="${service.id}" data-action="reject">
                            <i class="fas fa-times"></i> Recusar
                        </button>
                    </div>
                `;
                break;
            case 'accepted':
            case 'in_progress':
                actions = `
                    <div class="service-action-buttons" style="margin-top: 0.5rem;">
                        <button class="btn btn-primary btn-sm service-action" data-service-id="${service.id}" data-action="complete">
                            <i class="fas fa-check-circle"></i> Concluir
                        </button>
                    </div>
                `;
                break;
            case 'confirmed':
                actions = `
                    <div class="service-action-buttons" style="margin-top: 0.5rem;">
                        <button class="btn btn-primary btn-sm service-action" data-service-id="${service.id}" data-action="start">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                    </div>
                `;
                break;
        }
        
        return actions;
    }

    updateReviews() {
        const container = document.getElementById('reviewsList');
        if (!container) return;

        if (!this.reviews || this.reviews.length === 0) {
            container.innerHTML = this.createEmptyReviewsState();
            return;
        }

        container.innerHTML = this.reviews.map(review => this.createReviewItem(review)).join('');
    }

    createReviewItem(review) {
        const stars = this.createStarRating(review.rating);
        
        return `
            <div class="message-item">
                <div class="message-header">
                    <h3 class="message-sender">${review.client_name}</h3>
                    <div class="rating-display">
                        ${stars}
                    </div>
                </div>
                <p class="message-preview">${review.comment}</p>
                <small style="color: var(--dark-text); opacity: 0.7;">
                    ${this.formatDate(review.date)}
                </small>
            </div>
        `;
    }

    updateSchedule() {
        const container = document.getElementById('scheduleList');
        if (!container) return;

        if (!this.schedule || this.schedule.length === 0) {
            container.innerHTML = this.createEmptyScheduleState();
            return;
        }

        container.innerHTML = this.schedule.map(item => this.createScheduleItem(item)).join('');
    }

    createScheduleItem(schedule) {
        return `
            <div class="service-item">
                <div class="service-header">
                    <h3 class="service-title" style="font-size: 0.9rem;">${schedule.client_name}</h3>
                    <span class="service-date">${this.formatDate(schedule.date, true)}</span>
                </div>
                <p class="service-description" style="font-size: 0.8rem;">
                    ${this.formatTime(schedule.date)} - ${schedule.title}
                </p>
            </div>
        `;
    }

    updateProfileInfo() {
        // Atualizar informações do perfil se disponíveis
        if (this.currentUser) {
            const profile = this.currentUser.professional_profile || {};
            
            // Atualizar nome e especialidade no perfil card
            const nameElement = document.querySelector('.dashboard-card h3');
            if (nameElement && profile.full_name) {
                nameElement.textContent = profile.full_name;
            }
            
            // Atualizar especialidade
            const specialtyElement = document.querySelector('.specialty-badge');
            if (specialtyElement && profile.specialty) {
                specialtyElement.innerHTML = `<i class="fas fa-tools"></i> ${profile.specialty}`;
            }

            // Atualizar localização
            const locationElement = document.querySelector('.dashboard-card .fa-map-marker-alt').parentElement;
            if (locationElement && this.currentUser.location) {
                locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentUser.location}`;
            }

            // Atualizar avaliação se disponível nos stats
            const ratingElement = document.querySelector('.rating-display span');
            if (ratingElement && this.stats.averageRating) {
                ratingElement.innerHTML = `${this.stats.averageRating} (avaliações)`;
            }
        }
    }

    // Métodos utilitários (mantidos da versão anterior)
    getStatusClass(status) {
        const statusMap = {
            'pending': 'status-pending',
            'accepted': 'status-confirmed',
            'in_progress': 'status-in-progress',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled',
            'confirmed': 'status-confirmed'
        };
        return statusMap[status] || 'status-pending';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'accepted': 'Aceito',
            'in_progress': 'Em Andamento',
            'completed': 'Concluído',
            'cancelled': 'Cancelado',
            'confirmed': 'Confirmado'
        };
        return statusMap[status] || 'Pendente';
    }

    createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    formatDate(dateString, short = false) {
        if (!dateString) return 'Data não definida';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = date - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Amanhã';
            if (diffDays === -1) return 'Ontem';
            if (diffDays < 7 && diffDays > -7) {
                return short ? `${Math.abs(diffDays)} dias` : `Em ${Math.abs(diffDays)} dias`;
            }
            
            return date.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: short ? 'short' : 'long',
                year: short ? undefined : 'numeric'
            });
        } catch (error) {
            return 'Data inválida';
        }
    }

    formatTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (error) {
            return '';
        }
    }

    formatPrice(price) {
        if (!price) return 'Preço não definido';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'MZN'
        }).format(price);
    }

    // Estados vazios
    createEmptyServicesState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-tasks"></i>
                </div>
                <h3>Nenhum serviço encontrado</h3>
                <p>Quando receber solicitações, elas aparecerão aqui.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    Recarregar
                </button>
            </div>
        `;
    }

    createEmptyReviewsState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3>Nenhuma avaliação</h3>
                <p>Suas avaliações aparecerão aqui quando clientes avaliarem seus serviços.</p>
            </div>
        `;
    }

    createEmptyScheduleState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-calendar"></i>
                </div>
                <h3>Nada agendado</h3>
                <p>Seus próximos agendamentos aparecerão aqui.</p>
            </div>
        `;
    }

    showError(message) {
        // Sistema de notificação simples
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Métodos de ação
    async acceptService(serviceId) {
        try {
            const response = await fetch(`/api/professional/services/${serviceId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                await this.loadDashboardData();
                this.updateUI();
                this.showSuccess('Serviço aceito com sucesso!');
            } else {
                this.showError('Erro ao aceitar serviço');
            }
        } catch (error) {
            this.showError('Erro de conexão');
        }
    }

    async rejectService(serviceId) {
        if (!confirm('Tem certeza que deseja recusar este serviço?')) return;
        
        try {
            const response = await fetch(`/api/professional/services/${serviceId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                await this.loadDashboardData();
                this.updateUI();
                this.showSuccess('Serviço recusado.');
            } else {
                this.showError('Erro ao recusar serviço');
            }
        } catch (error) {
            this.showError('Erro de conexão');
        }
    }

    async completeService(serviceId) {
        if (!confirm('Confirmar conclusão deste serviço?')) return;
        
        try {
            const response = await fetch(`/api/professional/services/${serviceId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                await this.loadDashboardData();
                this.updateUI();
                this.showSuccess('Serviço marcado como concluído!');
            } else {
                this.showError('Erro ao concluir serviço');
            }
        } catch (error) {
            this.showError('Erro de conexão');
        }
    }

    showServiceDetails(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            alert(`Detalhes do Serviço:\n\nTítulo: ${service.title}\nCliente: ${service.client_name}\nStatus: ${this.getStatusText(service.status)}\nPreço: ${this.formatPrice(service.price)}\nDescrição: ${service.description}`);
        }
    }

    showSchedule() {
        window.location.href = '/professional/schedule';
    }

    openMessages() {
        window.location.href = '/chat';
    }

    showReports() {
        window.location.href = '/professional/reports';
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    new ProfessionalDashboard();
});

// Adicionar CSS para notificações
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    }
    
    .notification.success {
        background: var(--success-color, #28a745);
    }
    
    .notification.error {
        background: var(--error-color, #dc3545);
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

// Adicionar estilos ao documento
if (!document.querySelector('#notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

// Exportar para uso global
window.ProfessionalDashboard = ProfessionalDashboard;