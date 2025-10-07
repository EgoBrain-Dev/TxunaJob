/**
 * TxunaJob - Sistema de Login
 * Gerencia funcionalidades do formulário de login
 */

class LoginSystem {
    static init() {
        this.setupPasswordToggle();
        this.setupFormValidation();
        this.setupForgotPassword();
    }

    static setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
    }

    static setupFormValidation() {
        const form = document.querySelector('.auth-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            const username = document.getElementById('username');
            const password = document.getElementById('password');

            // Validação de campos obrigatórios
            if (!username?.value.trim() || !password?.value.trim()) {
                e.preventDefault();
                this.showError('Por favor, preencha todos os campos obrigatórios');
                return;
            }

            // Validação de comprimento da senha
            if (password.value.length < 6) {
                e.preventDefault();
                this.showError('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            // Mostrar estado de carregamento
            this.showLoading();
        });

        // Validação em tempo real
        this.setupRealTimeValidation();
    }

    static setupRealTimeValidation() {
        const inputs = document.querySelectorAll('#username, #password');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearMessages();
            });
        });
    }

    static setupForgotPassword() {
        const forgotLink = document.querySelector('.forgot-password');
        if (!forgotLink) return;

        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/forgot-password';
        });
    }

    static showError(message) {
        this.clearMessages();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'flash-message error';
        errorDiv.innerHTML = `
            <div class="flash-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;

        const form = document.querySelector('.auth-form');
        const flashContainer = document.querySelector('.flash-messages');
        
        if (flashContainer) {
            flashContainer.appendChild(errorDiv);
        } else if (form) {
            form.parentNode.insertBefore(errorDiv, form);
        }

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    static showLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;

        // Timeout de segurança
        setTimeout(() => {
            if (submitBtn.disabled) {
                this.restoreSubmitButton(submitBtn, originalText);
            }
        }, 10000);
    }

    static restoreSubmitButton(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    static clearMessages() {
        const flashMessages = document.querySelector('.flash-messages');
        if (flashMessages) {
            const errorMessages = flashMessages.querySelectorAll('.error');
            errorMessages.forEach(msg => msg.remove());
        }
        
        // Remove mensagens de erro dinâmicas
        document.querySelectorAll('.flash-message.error').forEach(msg => {
            if (!msg.closest('.flash-messages')) {
                msg.remove();
            }
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    LoginSystem.init();
});