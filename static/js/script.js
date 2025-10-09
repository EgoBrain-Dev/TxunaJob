/**
 * TxunaJob - JavaScript Global
 * Sistemas essenciais para TODAS as páginas
 * Autor: EgoBrain-Dev
 * Versão: 2.0.0 - Limpo e Otimizado
 */

const AppState = {
    currentUser: null,
    theme: localStorage.getItem('txunajob_theme') || 'light',
    textSize: localStorage.getItem('txunajob_textSize') || 'normal',
    highContrast: localStorage.getItem('txunajob_highContrast') === 'true',
    reduceMotion: localStorage.getItem('txunajob_reduceMotion') === 'true'
};

// =============================================================================
// SISTEMA DE TEMA GLOBAL
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
// SISTEMA DE ACESSIBILIDADE GLOBAL
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
// SISTEMA DE MENU MOBILE GLOBAL
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
// SISTEMA DE NAVEGAÇÃO GLOBAL
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
                window.location.href = '/auth/register/client';
            });
        }
        
        if (professionalBtn) {
            professionalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auth/register/professional';
            });
        }
        
        document.querySelectorAll('.btn-register-client').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auth/register/client';
            });
        });
        
        document.querySelectorAll('.btn-register-professional').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auth/register/professional';
            });
        });
    }
    
    static setupAuthButtons() {
        document.querySelectorAll('.btn-login, [data-action="login"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auth/login';
            });
        });
        
        document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auth/logout';
            });
        });
    }
}

// =============================================================================
// SISTEMA DE NOTIFICAÇÕES GLOBAL (BÁSICO)
// =============================================================================

class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Fechar notificação
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());
        
        // Auto-remover após duração
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    }
    
    static getIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// =============================================================================
// INICIALIZAÇÃO PRINCIPAL GLOBAL
// =============================================================================

class TxunaJobApp {
    static init() {
        // Inicializar sistemas essenciais globais
        ThemeSystem.init();
        AccessibilitySystem.init();
        MobileMenuSystem.init();
        NavigationSystem.init();
        
        // Log de inicialização
        console.log('🚀 TxunaJob - Sistemas globais inicializados');
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    TxunaJobApp.init();
});

// Exportar para uso global
window.TxunaJobApp = TxunaJobApp;
window.ThemeSystem = ThemeSystem;
window.AccessibilitySystem = AccessibilitySystem;
window.MobileMenuSystem = MobileMenuSystem;
window.NavigationSystem = NavigationSystem;
window.NotificationSystem = NotificationSystem;