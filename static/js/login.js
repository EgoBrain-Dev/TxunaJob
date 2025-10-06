/**
 * TxunaJob - Sistema de Login REAL
 * Autor: EgoBrain-Dev
 * Versão: 1.0.0
 */

class LoginSystem {
    static init() {
        this.setupPasswordToggle();
        this.setupFormValidation();
        this.setupForgotPassword();
    }
    
    static setupPasswordToggle() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            const wrapper = passwordInput.parentElement;
            
            // Criar botão de toggle
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.setAttribute('aria-label', 'Mostrar senha');
            
            wrapper.classList.add('password-wrapper');
            wrapper.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? 
                    '<i class="fas fa-eye-slash"></i>' : 
                    '<i class="fas fa-eye"></i>';
                toggleBtn.setAttribute('aria-label', 
                    isPassword ? 'Ocultar senha' : 'Mostrar senha');
            });
        }
    }
    
    static setupFormValidation() {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                const username = document.getElementById('username');
                const password = document.getElementById('password');
                
                if (!username.value.trim() || !password.value.trim()) {
                    e.preventDefault();
                    this.showError('Por favor, preencha todos os campos');
                    return;
                }
                
                // Validação básica de comprimento
                if (password.value.length < 6) {
                    e.preventDefault();
                    this.showError('A senha deve ter pelo menos 6 caracteres');
                    return;
                }
                
                this.showLoading();
            });
        }
    }
    
    static setupForgotPassword() {
        const forgotLink = document.querySelector('.forgot-password');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Redireciona para página real de recuperação
                window.location.href = '/forgot-password';
            });
        }
    }
    
    static showError(message) {
        this.clearMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
    
    static showLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            submitBtn.disabled = true;
            
            // Restaurar se a página não redirecionar (fallback)
            setTimeout(() => {
                if (submitBtn.disabled) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }, 5000);
        }
    }
    
    static clearMessages() {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    LoginSystem.init();
});

// Adicionar CSS específico para login
const loginStyles = `
.password-wrapper {
    position: relative;
}

.password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.password-toggle:hover {
    background: #f0f0f0;
    color: var(--primary-blue);
}

.alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.alert-success {
    background: #d1edff;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
}

.btn:disabled:hover {
    background-color: var(--primary-orange) !important;
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = loginStyles;
document.head.appendChild(styleSheet);