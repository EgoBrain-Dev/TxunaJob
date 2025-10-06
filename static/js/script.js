/**
 * TxunaJob - JavaScript Global
 * Sistemas essenciais para todas as páginas
 * Autor: EgoBrain-Dev
 * Versão: 1.0.0
 */

const AppState = {
    currentUser: null,
    theme: localStorage.getItem('txunajob_theme') || 'light',
    textSize: localStorage.getItem('txunajob_textSize') || 'normal',
    highContrast: localStorage.getItem('txunajob_highContrast') === 'true',
    reduceMotion: localStorage.getItem('txunajob_reduceMotion') === 'true'
};

// =============================================================================
// SISTEMA DE TEMA
// =============================================================================

class ThemeSystem {
    static init() {
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
        }
        
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
        } else {
            body.classList.add('dark-theme');
            AppState.theme = 'dark';
            localStorage.setItem('txunajob_theme', 'dark');
        }
    }
    
    static applySavedTheme() {
        if (AppState.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
}

// =============================================================================
// SISTEMA DE ACESSIBILIDADE
// =============================================================================

class AccessibilitySystem {
    static init() {
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
        body.classList.remove('text-sm', 'text-normal', 'text-lg', 'text-xl', 'text-2xl');
        
        if (size && size !== 'normal') {
            body.classList.add(`text-${size}`);
        }
        
        AppState.textSize = size;
        localStorage.setItem('txunajob_textSize', size);
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
            });
        }
    }
    
    static setupSkipLinks() {
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
        if (AppState.textSize && AppState.textSize !== 'normal') {
            this.adjustTextSize(AppState.textSize);
        }
        
        if (AppState.highContrast) {
            document.body.classList.add('high-contrast');
            const checkbox = document.getElementById('highContrast');
            if (checkbox) checkbox.checked = true;
        }
        
        if (AppState.reduceMotion) {
            document.body.classList.add('reduce-motion');
            const checkbox = document.getElementById('reduceMotion');
            if (checkbox) checkbox.checked = true;
        }
    }
}

// =============================================================================
// SISTEMA DE MENU MOBILE
// =============================================================================

class MobileMenuSystem {
    static init() {
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
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}

// =============================================================================
// SISTEMA DE PROFISSIONAIS
// =============================================================================

class ProfessionalsSystem {
    static init() {
        const grid = document.getElementById('professionalsGrid');
        if (grid) {
            this.load();
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
    }
    
    static handleCategoryClick(button) {
        document.querySelectorAll('.category-btn, .category-filter, [data-category]').forEach(btn => {
            btn.classList.remove('active', 'selected');
        });
        
        button.classList.add('active', 'selected');
        
        const category = button.dataset.category || button.textContent.trim();
        this.filterByCategory(category);
    }
    
    static filterByCategory(category) {
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        grid.innerHTML = this.createLoadingState(`Filtrando por: ${category}`);
        
        setTimeout(() => {
            if (category === 'all' || category === 'Todas' || category === 'Todos') {
                this.load();
            } else {
                grid.innerHTML = this.createCategoryResults(category);
            }
        }, 1000);
    }
    
    static async load() {
        const grid = document.getElementById('professionalsGrid');
        if (!grid) return;
        
        grid.innerHTML = this.createLoadingState('Carregando profissionais...');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const professionals = await this.fetchProfessionals();
            this.displayProfessionals(professionals);
        } catch (error) {
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
                <p>Tente novamente mais tarde.</p>
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
                        Ver Todos
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
                <p>Não foi possível carregar os profissionais.</p>
                <button class="btn btn-primary" onclick="ProfessionalsSystem.load()">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
    }
    
    static contactProfessional(professionalId) {
        if (!AppState.currentUser) {
            const shouldLogin = confirm('Para contactar profissionais, é necessário fazer login. Deseja fazer login agora?');
            if (shouldLogin) {
                window.location.href = '/login';
            }
            return;
        }
        alert(`Contactando profissional #${professionalId}`);
    }
}

// =============================================================================
// SISTEMA DE NAVEGAÇÃO
// =============================================================================

class NavigationSystem {
    static init() {
        this.setupRegisterButtons();
        this.setupAuthButtons();
    }
    
    static setupRegisterButtons() {
        const clientBtn = document.getElementById('clientBtn');
        const professionalBtn = document.getElementById('professionalBtn');
        
        if (clientBtn) {
            clientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/register/client';
            });
        }
        
        if (professionalBtn) {
            professionalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/register/professional';
            });
        }
        
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
        document.querySelectorAll('.btn-login, [data-action="login"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/login';
            });
        });
        
        document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/logout';
            });
        });
    }
}

// =============================================================================
// INICIALIZAÇÃO PRINCIPAL
// =============================================================================

class TxunaJobApp {
    static init() {
        // Inicializar sistemas essenciais
        ThemeSystem.init();
        AccessibilitySystem.init();
        
        // Inicializar sistemas de UI
        MobileMenuSystem.init();
        NavigationSystem.init();
        
        // Inicializar sistemas de conteúdo
        ProfessionalsSystem.init();
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    TxunaJobApp.init();
});

// Exportar para uso global
window.TxunaJobApp = TxunaJobApp;
window.ProfessionalsSystem = ProfessionalsSystem;


// Funções para os modais
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('modalOverlay').classList.add('hidden');
}

function showRegisterOptions() {
    document.getElementById('registerOptionsModal').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeRegisterOptions() {
    document.getElementById('registerOptionsModal').classList.add('hidden');
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Fechar modais clicando no overlay
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeLoginModal();
            closeRegisterOptions();
        });
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLoginModal();
            closeRegisterOptions();
        }
    });
});