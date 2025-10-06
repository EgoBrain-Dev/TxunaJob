/**
 * TxunaJob - JavaScript Completo v5.0
 * Sistema completo com todas as funcionalidades
 * Autor: EgoBrain-Dev
 * Versão: 5.0.0
 */

// =============================================================================
// CONFIGURAÇÕES E CONSTANTES
// =============================================================================

const CONFIG = {
    API_BASE: window.location.origin + '/api',
    WS_URL: window.location.origin,
    DEBUG: true
};

// Estado global da aplicação
const AppState = {
    currentUser: null,
    authToken: null,
    socket: null,
    currentChatId: null,
    theme: localStorage.getItem('txunajob_theme') || 'light',
    textSize: localStorage.getItem('txunajob_textSize') || 'normal',
    highContrast: localStorage.getItem('txunajob_highContrast') === 'true',
    reduceMotion: localStorage.getItem('txunajob_reduceMotion') === 'true'
};

// =============================================================================
// SISTEMA DE LOGGING
// =============================================================================

class Logger {
    static log(module, message, data = null) {
        if (!CONFIG.DEBUG) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${module}: ${message}`;
        
        console.log(`%c${logMessage}`, 'color: #00BFFF; font-weight: bold;');
        
        if (data) {
            console.log('Data:', data);
        }
    }
    
    static error(module, message, error = null) {
        const timestamp = new Date().toLocaleTimeString();
        const errorMessage = `[${timestamp}] ${module}: ${message}`;
        
        console.error(`%c${errorMessage}`, 'color: #FF6347; font-weight: bold;');
        
        if (error) {
            console.error('Error details:', error);
        }
    }
    
    static warn(module, message) {
        const timestamp = new Date().toLocaleTimeString();
        console.warn(`%c[${timestamp}] ${module}: ${message}`, 'color: #FFA500;');
    }
}

// =============================================================================
// SISTEMA DE NOTIFICAÇÕES
// =============================================================================

class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        Logger.log('NOTIFICATION', `${type}: ${message}`);
        
        // Criar container se não existir
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icons[type]}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remover
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
        return notification;
    }
    
    static success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }
    
    static error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    static warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }
    
    static info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// =============================================================================
// SISTEMA DE TEMA
// =============================================================================

class ThemeSystem {
    static init() {
        Logger.log('THEME', 'Inicializando sistema de tema');
        this.applySavedTheme();
        this.setupThemeToggle();
    }
    
    static setupThemeToggle() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
            Logger.log('THEME', 'Botão de tema configurado');
        }
        
        // Também configurar por data-attribute
        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        });
    }
    
    static toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            AppState.theme = 'light';
            localStorage.setItem('txunajob_theme', 'light');
            Logger.log('THEME', 'Tema alterado para claro');
            NotificationSystem.info('Tema claro ativado');
        } else {
            body.classList.add('dark-theme');
            AppState.theme = 'dark';
            localStorage.setItem('txunajob_theme', 'dark');
            Logger.log('THEME', 'Tema alterado para escuro');
            NotificationSystem.info('Tema escuro ativado');
        }
    }
    
    static applySavedTheme() {
        if (AppState.theme === 'dark') {
            document.body.classList.add('dark-theme');
            Logger.log('THEME', 'Tema escuro aplicado do localStorage');
        }
    }
}

// =============================================================================
// SISTEMA DE ACESSIBILIDADE COMPLETO
// =============================================================================

class AccessibilitySystem {
    static init() {
        Logger.log('ACCESSIBILITY', 'Inicializando sistema de acessibilidade completo');
        this.setupTextSizeButtons();
        this.setupHighContrast();
        this.setupAnimationsToggle();
        this.setupSkipLinks();
        this.loadPreferences();
    }
    
    static setupTextSizeButtons() {
        const buttons = document.querySelectorAll('.text-size-btn, [data-text-size]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const size = btn.dataset.size || btn.dataset.textSize;
                this.adjustTextSize(size);
            });
        });
    }
    
    static adjustTextSize(size) {
        const body = document.body;
        
        // Remover classes anteriores
        body.classList.remove('text-sm', 'text-normal', 'text-lg', 'text-xl', 'text-2xl');
        
        // Aplicar nova classe
        if (size && size !== 'normal') {
            body.classList.add(`text-${size}`);
        }
        
        AppState.textSize = size;
        localStorage.setItem('txunajob_textSize', size);
        Logger.log('ACCESSIBILITY', `Tamanho do texto ajustado para: ${size}`);
        NotificationSystem.info(`Tamanho de texto: ${size}`);
    }
    
    static setupHighContrast() {
        const checkbox = document.getElementById('highContrast');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('high-contrast');
                    AppState.highContrast = true;
                } else {
                    document.body.classList.remove('high-contrast');
                    AppState.highContrast = false;
                }
                localStorage.setItem('txunajob_highContrast', e.target.checked);
                Logger.log('ACCESSIBILITY', `Alto contraste: ${e.target.checked}`);
            });
        }
    }
    
    static setupAnimationsToggle() {
        const checkbox = document.getElementById('reduceMotion');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('reduce-motion');
                    AppState.reduceMotion = true;
                } else {
                    document.body.classList.remove('reduce-motion');
                    AppState.reduceMotion = false;
                }
                localStorage.setItem('txunajob_reduceMotion', e.target.checked);
                Logger.log('ACCESSIBILITY', `Reduzir movimento: ${e.target.checked}`);
            });
        }
    }
    
    static setupSkipLinks() {
        // Adicionar skip link se não existir
        if (!document.getElementById('skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.id = 'skip-link';
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Ir para o conteúdo principal';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    }
    
    static loadPreferences() {
        // Tamanho do texto
        if (AppState.textSize && AppState.textSize !== 'normal') {
            this.adjustTextSize(AppState.textSize);
        }
        
        // Alto contraste
        if (AppState.highContrast) {
            document.body.classList.add('high-contrast');
            const checkbox = document.getElementById('highContrast');
            if (checkbox) checkbox.checked = true;
        }
        
        // Reduzir movimento
        if (AppState.reduceMotion) {
            document.body.classList.add('reduce-motion');
            const checkbox = document.getElementById('reduceMotion');
            if (checkbox) checkbox.checked = true;
        }
        
        Logger.log('ACCESSIBILITY', 'Preferências de acessibilidade carregadas');
    }
}

// =============================================================================
// SISTEMA DE PASSWORD TOGGLE
// =============================================================================

class PasswordToggleSystem {
    static init() {
        Logger.log('PASSWORD', 'Inicializando sistema de toggle de password');
        
        // Adicionar toggle a todos os campos de password
        document.querySelectorAll('input[type="password"]').forEach(input => {
            this.addToggleToPasswordField(input);
        });
    }
    
    static addToggleToPasswordField(passwordInput) {
        const wrapper = passwordInput.parentElement;
        
        // Verificar se já tem toggle
        if (wrapper.querySelector('.password-toggle')) {
            return;
        }
        
        // Criar botão de toggle
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.setAttribute('aria-label', 'Mostrar senha');
        toggleBtn.setAttribute('tabindex', '0');
        
        // Adicionar ao wrapper
        if (!wrapper.classList.contains('password-wrapper')) {
            wrapper.classList.add('password-wrapper');
        }
        wrapper.appendChild(toggleBtn);
        
        // Event listener para toggle
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePasswordVisibility(passwordInput, toggleBtn);
        });
        
        // Também funcionar com Enter
        toggleBtn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.togglePasswordVisibility(passwordInput, toggleBtn);
            }
        });
    }
    
    static togglePasswordVisibility(passwordInput, toggleBtn) {
        const isPassword = passwordInput.type === 'password';
        
        if (isPassword) {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            toggleBtn.setAttribute('aria-label', 'Ocultar senha');
            Logger.log('PASSWORD', 'Senha tornada visível');
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.setAttribute('aria-label', 'Mostrar senha');
            Logger.log('PASSWORD', 'Senha ocultada');
        }
        
        // Manter foco no input
        passwordInput.focus();
    }
}

// =============================================================================
// SISTEMA DE MENU MOBILE
// =============================================================================

class MobileMenuSystem {
    static init() {
        Logger.log('MOBILE', 'Inicializando menu mobile');
        
        this.setupMenuToggle();
        this.setupMenuClose();
        this.setupOverlay();
        this.setupMenuLinks();
    }
    
    static setupMenuToggle() {
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openMenu();
            });
        }
    }
    
    static setupMenuClose() {
        const menuClose = document.getElementById('mobileMenuClose');
        if (menuClose) {
            menuClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
            });
        }
    }
    
    static setupOverlay() {
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
            });
        }
    }
    
    static setupMenuLinks() {
        const menuLinks = document.querySelectorAll('#mobileMenu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });
    }
    
    static openMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileOverlay');
        
        if (mobileMenu) {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
            Logger.log('MOBILE', 'Menu mobile aberto');
        }
        
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    static closeMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileOverlay');
        
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            Logger.log('MOBILE', 'Menu mobile fechado');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}

// =============================================================================
// SISTEMA DE PROFISSIONAIS COMPLETO
// =============================================================================

class ProfessionalsSystem {
    static init() {
        Logger.log('PROFESSIONALS', 'Inicializando sistema de profissionais');
        
        const grid = document.getElementById('professionalsGrid');
        if (grid) {
            this.load();
        } else {
            Logger.log('PROFESSIONALS', 'Elemento professionalsGrid não encontrado');
        }
        
        this.setupCategoryFilters();
    }
    
    static setupCategoryFilters() {
        const categoryButtons = document.querySelectorAll('.category-btn, .category-filter, [data-category]');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryClick(btn);
            });
        });
        
        Logger.log('PROFESSIONALS', `${categoryButtons.length} filtros de categoria configurados`);
    }
    
    static handleCategoryClick(button) {
        // Remover active de todos os botões
        document.querySelectorAll('.category-btn, .category-filter, [data-category]').forEach(btn => {
            btn.classList.remove('active', 'selected');
        });
        
        // Adicionar active ao botão clicado
        button.classList.add('active', 'selected');
        
        const category = button.dataset.category || button.textContent.trim();
        Logger.log('PROFESSIONALS', `Categoria selecionada: ${category}`);
        
        this.filterByCategory(category);
    }
    
    static filterByCategory(category) {
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        // Mostrar loading
        grid.innerHTML = this.createLoadingState(`Filtrando por: ${category}`);
        
        // Simular filtro
        setTimeout(() => {
            if (category === 'all' || category === 'Todas' || category === 'Todos') {
                this.load();
            } else {
                grid.innerHTML = this.createCategoryResults(category);
            }
        }, 1000);
    }
    
    static async load() {
        Logger.log('PROFESSIONALS', 'Carregando profissionais...');
        
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        grid.innerHTML = this.createLoadingState('Carregando profissionais...');
        
        try {
            // Simular delay de rede
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const professionals = await this.fetchProfessionals();
            this.displayProfessionals(professionals);
            Logger.log('PROFESSIONALS', `${professionals.length} profissionais carregados`);
            
        } catch (error) {
            Logger.error('PROFESSIONALS', 'Erro ao carregar profissionais', error);
            this.displayError();
        }
    }
    
    static createLoadingState(message = 'Carregando...') {
        return `
            <div class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }
    
    static async fetchProfessionals() {
        // Dados de exemplo - em produção viria da API
        return [
            {
                id: 1,
                name: "João Eletricista",
                category: "Eletricista",
                rating: 4.8,
                reviews: 47,
                location: "Maputo",
                skills: ["Instalação elétrica", "Manutenção", "Reparação", "Quadros elétricos"],
                hourly_rate: "350.00",
                description: "Especialista em instalações elétricas residenciais e comerciais com 8 anos de experiência.",
                verified: true,
                image: null
            },
            {
                id: 2,
                name: "Maria Encanadora", 
                category: "Encanadora",
                rating: 4.9,
                reviews: 32,
                location: "Matola",
                skills: ["Encanamento", "Desentupimento", "Instalação", "Manutenção"],
                hourly_rate: "300.00",
                description: "Profissional com 5 anos de experiência em encanamento residencial e comercial.",
                verified: true,
                image: null
            },
            {
                id: 3,
                name: "Carlos Pintor",
                category: "Pintura",
                rating: 4.7,
                reviews: 28,
                location: "Maputo",
                skills: ["Pintura residencial", "Pintura comercial", "Texturização", "Preparação de superfícies"],
                hourly_rate: "280.00",
                description: "Especialista em pintura interna e externa com foco em qualidade e durabilidade.",
                verified: false,
                image: null
            },
            {
                id: 4,
                name: "Ana Jardineira",
                category: "Jardinagem",
                rating: 4.6,
                reviews: 19,
                location: "Matola",
                skills: ["Paisagismo", "Manutenção de jardins", "Plantio", "Podas"],
                hourly_rate: "250.00",
                description: "Especialista em criação e manutenção de jardins residenciais e comerciais.",
                verified: true,
                image: null
            }
        ];
    }
    
    static displayProfessionals(professionals) {
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        if (!professionals || professionals.length === 0) {
            grid.innerHTML = this.createEmptyState();
            return;
        }
        
        grid.innerHTML = professionals.map(pro => this.createProfessionalCard(pro)).join('');
    }
    
    static createProfessionalCard(professional) {
        const skills = professional.skills.slice(0, 3).join(' • ');
        const ratingStars = '⭐'.repeat(Math.floor(professional.rating)) + '☆'.repeat(5 - Math.floor(professional.rating));
        
        return `
            <div class="professional-card" data-category="${professional.category.toLowerCase()}">
                <div class="card-header">
                    <div class="professional-avatar">
                        <i class="fas fa-user-tie"></i>
                        ${professional.verified ? '<span class="verified-badge" title="Profissional Verificado"><i class="fas fa-check-circle"></i></span>' : ''}
                    </div>
                    <div class="professional-info">
                        <h3 class="professional-name">${professional.name}</h3>
                        <span class="professional-category">${professional.category}</span>
                        <div class="professional-rating">
                            <span class="stars">${ratingStars}</span>
                            <span class="rating">${professional.rating}</span>
                            <span class="reviews">(${professional.reviews} avaliações)</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="professional-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${professional.location}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${professional.hourly_rate} MT/hora</span>
                        </div>
                    </div>
                    
                    <div class="professional-skills">
                        <strong>Habilidades:</strong>
                        <p>${skills}</p>
                    </div>
                    
                    <div class="professional-description">
                        <p>${professional.description}</p>
                    </div>
                </div>
                
                <div class="card-footer">
                    <button class="btn btn-primary btn-contact" onclick="ProfessionalsSystem.contactProfessional(${professional.id})">
                        <i class="fas fa-envelope"></i>
                        Contactar
                    </button>
                    <button class="btn btn-outline btn-profile" onclick="ProfessionalsSystem.viewProfile(${professional.id})">
                        <i class="fas fa-eye"></i>
                        Ver Perfil
                    </button>
                </div>
            </div>
        `;
    }
    
    static createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Nenhum profissional encontrado</h3>
                <p>Não encontramos profissionais que correspondam aos seus critérios.</p>
                <button class="btn btn-primary" onclick="ProfessionalsSystem.load()">
                    <i class="fas fa-redo"></i>
                    Recarregar
                </button>
            </div>
        `;
    }
    
    static createCategoryResults(category) {
        return `
            <div class="category-results">
                <div class="results-header">
                    <h3>Filtro: ${category}</h3>
                    <p>Esta funcionalidade de filtro estará disponível em breve!</p>
                </div>
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="ProfessionalsSystem.load()">
                        <i class="fas fa-eye"></i>
                        Ver Todos os Profissionais
                    </button>
                </div>
            </div>
        `;
    }
    
    static displayError() {
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-wifi-slash"></i>
                </div>
                <h3>Erro de Conexão</h3>
                <p>Não foi possível carregar os profissionais. Verifique sua conexão e tente novamente.</p>
                <button class="btn btn-primary" onclick="ProfessionalsSystem.load()">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
        
        NotificationSystem.error('Erro ao carregar profissionais');
    }
    
    static contactProfessional(professionalId) {
        Logger.log('PROFESSIONALS', `Contactando profissional: ${professionalId}`);
        
        if (!AppState.currentUser) {
            const shouldLogin = confirm('Para contactar profissionais, é necessário fazer login. Deseja fazer login agora?');
            if (shouldLogin) {
                window.location.href = '/login';
            }
            return;
        }
        
        NotificationSystem.info(`Iniciando conversa com profissional #${professionalId}`);
        // Em produção, isso abriria o chat
    }
    
    static viewProfile(professionalId) {
        Logger.log('PROFESSIONALS', `Vendo perfil: ${professionalId}`);
        NotificationSystem.info(`Abrindo perfil do profissional #${professionalId}`);
        // Em produção, isso redirecionaria para o perfil
    }
}

// =============================================================================
// SISTEMA DE FORMULÁRIOS DINÂMICOS
// =============================================================================

class FormSystem {
    static init() {
        Logger.log('FORM', 'Inicializando sistema de formulários dinâmicos');
        
        this.initProfessionalForm();
        this.initFormValidations();
    }
    
    static initProfessionalForm() {
        const specialtySelect = document.getElementById('specialty');
        if (specialtySelect) {
            specialtySelect.addEventListener('change', (e) => {
                this.handleSpecialtyChange(e.target.value);
            });
            
            // Verificar valor inicial
            if (specialtySelect.value === 'other') {
                this.showOtherSpecialtyField();
            }
        }
    }
    
    static handleSpecialtyChange(specialty) {
        Logger.log('FORM', `Especialidade selecionada: ${specialty}`);
        
        if (specialty === 'other') {
            this.showOtherSpecialtyField();
        } else {
            this.hideOtherSpecialtyField();
        }
    }
    
    static showOtherSpecialtyField() {
        let otherField = document.getElementById('otherSpecialtyField');
        
        if (!otherField) {
            const specialtyGroup = document.querySelector('.form-group:has(#specialty)');
            if (specialtyGroup) {
                otherField = document.createElement('div');
                otherField.id = 'otherSpecialtyField';
                otherField.className = 'form-group other-specialty-field';
                otherField.innerHTML = `
                    <label for="other_specialty">
                        <i class="fas fa-pen"></i>
                        Especifique o seu serviço:
                    </label>
                    <input type="text" 
                           id="other_specialty" 
                           name="other_specialty" 
                           placeholder="Ex: Jardineiro, Pintor, Carpinteiro, Marceneiro..."
                           required
                           class="form-input"
                           aria-required="true">
                    <small class="form-help">Descreva o serviço que você oferece</small>
                `;
                
                specialtyGroup.parentNode.insertBefore(otherField, specialtyGroup.nextSibling);
                
                // Animação suave
                setTimeout(() => {
                    otherField.classList.add('visible');
                }, 10);
            }
        }
        
        Logger.log('FORM', 'Campo "Outros" mostrado');
    }
    
    static hideOtherSpecialtyField() {
        const otherField = document.getElementById('otherSpecialtyField');
        if (otherField) {
            otherField.classList.remove('visible');
            setTimeout(() => {
                if (otherField.parentNode) {
                    otherField.parentNode.removeChild(otherField);
                }
            }, 300);
            Logger.log('FORM', 'Campo "Outros" ocultado');
        }
    }
    
    static initFormValidations() {
        // Validação de email em tempo real
        document.addEventListener('blur', (e) => {
            if (e.target.type === 'email' && e.target.value) {
                this.validateEmail(e.target);
            }
        }, true);
        
        // Validação de password em tempo real
        document.addEventListener('blur', (e) => {
            if (e.target.type === 'password' && e.target.value) {
                this.validatePassword(e.target);
            }
        }, true);
    }
    
    static validateEmail(emailInput) {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(emailInput, 'Por favor, insira um email válido');
            return false;
        } else {
            this.clearFieldError(emailInput);
            return true;
        }
    }
    
    static validatePassword(passwordInput) {
        const password = passwordInput.value;
        
        if (password && password.length < 6) {
            this.showFieldError(passwordInput, 'A senha deve ter pelo menos 6 caracteres');
            return false;
        } else {
            this.clearFieldError(passwordInput);
            return true;
        }
    }
    
    static showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        input.parentNode.appendChild(errorElement);
    }
    
    static clearFieldError(input) {
        input.classList.remove('error');
        
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
}

// =============================================================================
// SISTEMA DE NAVEGAÇÃO INTELIGENTE
// =============================================================================

class NavigationSystem {
    static init() {
        Logger.log('NAVIGATION', 'Inicializando sistema de navegação');
        
        this.setupRegisterButtons();
        this.setupAuthButtons();
        this.setupDashboardLinks();
    }
    
    static setupRegisterButtons() {
        // Botões específicos
        const clientBtn = document.getElementById('clientBtn');
        const professionalBtn = document.getElementById('professionalBtn');
        
        if (clientBtn) {
            clientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Logger.log('NAVIGATION', 'Redirecionando para registro de cliente');
                window.location.href = '/register/client';
            });
        }
        
        if (professionalBtn) {
            professionalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Logger.log('NAVIGATION', 'Redirecionando para registro de profissional');
                window.location.href = '/register/professional';
            });
        }
        
        // Botões por classe
        document.querySelectorAll('.btn-register-client').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/register/client';
            });
        });
        
        document.querySelectorAll('.btn-register-professional').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/register/professional';
            });
        });
    }
    
    static setupAuthButtons() {
        // Botões de login
        document.querySelectorAll('.btn-login, [data-action="login"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/login';
            });
        });
        
        // Botões de logout
        document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/logout';
            });
        });
    }
    
    static setupDashboardLinks() {
        // Links para dashboards
        document.querySelectorAll('[href="/dashboard"], [data-dashboard]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (!AppState.currentUser) {
                    e.preventDefault();
                    NotificationSystem.warning('Faça login para acessar o dashboard');
                    window.location.href = '/login';
                }
            });
        });
    }
}

// =============================================================================
// INICIALIZAÇÃO PRINCIPAL
// =============================================================================

class TxunaJobApp {
    static async init() {
        Logger.log('APP', '🚀 Inicializando TxunaJob v5.0...');
        
        try {
            // Inicializar sistemas essenciais primeiro
            ThemeSystem.init();
            PasswordToggleSystem.init();
            AccessibilitySystem.init();
            
            // Inicializar sistemas de UI
            MobileMenuSystem.init();
            NavigationSystem.init();
            
            // Inicializar sistemas de conteúdo
            ProfessionalsSystem.init();
            FormSystem.init();
            
            // Configurar handlers globais
            this.setupGlobalHandlers();
            
            Logger.log('APP', '✅ TxunaJob inicializado com sucesso!');
            Logger.log('APP', '🎯 Todos os sistemas ativos e funcionando');
            
            // Notificação de boas-vindas
            setTimeout(() => {
                NotificationSystem.success('Sistema TxunaJob carregado com sucesso!');
            }, 1000);
            
        } catch (error) {
            Logger.error('APP', 'Erro na inicialização', error);
            NotificationSystem.error('Erro ao inicializar a aplicação');
        }
    }
    
    static setupGlobalHandlers() {
        // Handler para links externos
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.target === '_blank') {
                Logger.log('NAVIGATION', `Abrindo link externo: ${link.href}`);
            }
        });
        
        // Handler para forms (apenas para debug)
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.method === 'post') {
                Logger.log('FORM', `Form submetido: ${form.action || '#'}`);
            }
        });
    }
}

// =============================================================================
// INICIALIZAÇÃO E EXPORTAÇÕES
// =============================================================================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 DOM Carregado - Iniciando TxunaJob...');
    TxunaJobApp.init();
});

// Exportar para uso global
window.TxunaJobApp = TxunaJobApp;
window.NotificationSystem = NotificationSystem;
window.ProfessionalsSystem = ProfessionalsSystem;

// Log inicial
console.log('📄 TxunaJob JavaScript v5.0 carregado');
console.log('✅ Sistemas: Tema | Acessibilidade | Password | Menu | Profissionais | Formulários');
console.log('🎯 Navegação livre | Eventos funcionando | Sem bloqueios');