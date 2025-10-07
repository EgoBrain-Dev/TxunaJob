/**
 * register_client.js - JavaScript específico para registro de cliente
 * Validações e interações do formulário de cadastro de cliente
 * Autor: EgoBrain-Dev
 * Versão: 1.1.0
 */

class RegisterClientSystem {
    static init() {
        this.setupFormValidation();
        this.setupPasswordStrength();
        this.setupPasswordToggle();
        this.setupPasswordMatch();
        this.setupRealTimeValidation();
        this.setupLicenseToggle();
        this.setupTermsValidation();
    }

    /**
     * Configura validação do formulário
     */
    static setupFormValidation() {
        const form = document.getElementById('registrationForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showNotification('Por favor, corrija os erros no formulário antes de enviar.', 'error');
            }
        });
    }

    /**
     * Configura toggle de visibilidade da senha
     */
    static setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }

        if (confirmPasswordToggle && confirmPasswordInput) {
            confirmPasswordToggle.addEventListener('click', () => {
                const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordInput.setAttribute('type', type);
                confirmPasswordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
    }

    /**
     * Configura validação de correspondência de senhas
     */
    static setupPasswordMatch() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        const passwordMatch = document.getElementById('passwordMatch');

        if (passwordInput && confirmPasswordInput && passwordMatch) {
            const checkPasswords = () => {
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword === '') {
                    passwordMatch.className = 'password-match';
                    passwordMatch.innerHTML = '<span class="match-text">As senhas devem coincidir</span>';
                    return;
                }

                if (password === confirmPassword) {
                    passwordMatch.className = 'password-match valid';
                    passwordMatch.innerHTML = '<span class="match-text"><i class="fas fa-check-circle"></i> Senhas coincidem</span>';
                } else {
                    passwordMatch.className = 'password-match invalid';
                    passwordMatch.innerHTML = '<span class="match-text"><i class="fas fa-times-circle"></i> Senhas não coincidem</span>';
                }
            };

            passwordInput.addEventListener('input', checkPasswords);
            confirmPasswordInput.addEventListener('input', checkPasswords);
        }
    }

    /**
     * Configura validação de força da senha
     */
    static setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    /**
     * Configura toggle da licença
     */
    static setupLicenseToggle() {
        const toggleBtn = document.getElementById('toggleLicense');
        const licenseContent = document.getElementById('licenseContent');
        const toggleText = document.getElementById('licenseToggleText');
        const toggleIcon = document.getElementById('licenseToggleIcon');

        if (toggleBtn && licenseContent) {
            toggleBtn.addEventListener('click', () => {
                licenseContent.classList.toggle('hidden');
                toggleText.textContent = licenseContent.classList.contains('hidden') ? 'Mostrar termos' : 'Ocultar termos';
                toggleIcon.className = licenseContent.classList.contains('hidden') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            });
        }
    }

    /**
     * Configura validação dos termos
     */
    static setupTermsValidation() {
        const termsCheckbox = document.getElementById('agree_terms');
        const submitBtn = document.getElementById('submitBtn');

        if (termsCheckbox && submitBtn) {
            termsCheckbox.addEventListener('change', (e) => {
                submitBtn.disabled = !e.target.checked;
            });
        }
    }

    /**
     * Configura validação em tempo real
     */
    static setupRealTimeValidation() {
        // Validação de email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => {
                this.validateEmail(e.target.value);
            });
        }

        // Validação de telefone
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', (e) => {
                this.validatePhone(e.target.value);
            });
        }

        // Validação de nome de usuário
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', (e) => {
                this.validateUsername(e.target.value);
            });
        }
    }

    /**
     * Atualiza indicador de força da senha
     */
    static updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let feedback = '';
        let strengthClass = '';

        // Critérios de força mais detalhados
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;

        // Atualizar visualização
        strengthBar.className = 'strength-bar';
        strengthBar.innerHTML = '<div class="strength-bar-inner"></div>';
        const innerBar = strengthBar.querySelector('.strength-bar-inner');

        switch (true) {
            case password.length === 0:
                feedback = 'Digite sua senha';
                strengthClass = '';
                break;
            case password.length < 8:
                strengthBar.classList.add('weak');
                feedback = 'Muito curta';
                strengthClass = 'weak';
                break;
            case strength <= 2:
                strengthBar.classList.add('weak');
                feedback = 'Fraca';
                strengthClass = 'weak';
                break;
            case strength <= 4:
                strengthBar.classList.add('medium');
                feedback = 'Média';
                strengthClass = 'medium';
                break;
            case strength <= 5:
                strengthBar.classList.add('good');
                feedback = 'Boa';
                strengthClass = 'good';
                break;
            case strength === 6:
                strengthBar.classList.add('strong');
                feedback = 'Forte';
                strengthClass = 'strong';
                break;
            default:
                strengthBar.classList.add('excellent');
                feedback = 'Excelente';
                strengthClass = 'excellent';
        }

        strengthText.textContent = feedback;
        strengthText.className = `strength-text ${strengthClass}`;
    }

    /**
     * Validação de email
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        this.toggleFieldValidation('email', isValid, 'Por favor, insira um email válido.');
        return isValid;
    }

    /**
     * Validação de telefone
     */
    static validatePhone(phone) {
        // Formato moçambicano: +258 XX XXX XXXX ou 8X XXX XXXX
        const phoneRegex = /^(\+258\s?)?8[2-7][\s\-]?[0-9]{3}[\s\-]?[0-9]{3,4}$/;
        const cleanPhone = phone.replace(/[\s\-]/g, '');
        const isValid = phoneRegex.test(phone) && cleanPhone.length >= 9;
        
        this.toggleFieldValidation('phone', isValid, 'Por favor, insira um número de telefone válido (ex: +258 84 123 4567)');
        return isValid;
    }

    /**
     * Validação de nome de usuário
     */
    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const isValid = usernameRegex.test(username);
        
        this.toggleFieldValidation('username', isValid, 'Nome de usuário deve ter entre 3-20 caracteres (apenas letras, números e underscore)');
        return isValid;
    }

    /**
     * Alterna estado de validação do campo
     */
    static toggleFieldValidation(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove estados anteriores
        field.classList.remove('is-valid', 'is-invalid');
        
        // Remove mensagens de erro existentes
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid && field.value.trim() !== '') {
            field.classList.add('is-invalid');
            
            // Adiciona mensagem de erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = errorMessage;
            field.parentNode.appendChild(errorDiv);
        } else if (isValid && field.value.trim() !== '') {
            field.classList.add('is-valid');
        }
    }

    /**
     * Validação completa do formulário
     */
    static validateForm() {
        const requiredFields = [
            'username', 'email', 'full_name', 'password', 'confirm_password'
        ];

        let isValid = true;

        // Valida campos obrigatórios
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                this.toggleFieldValidation(fieldId, false, 'Este campo é obrigatório.');
                isValid = false;
            }
        });

        // Valida correspondência de senhas
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        if (password !== confirmPassword) {
            this.showNotification('As senhas não coincidem. Por favor, verifique.', 'error');
            isValid = false;
        }

        // Valida força da senha
        if (password.length < 8) {
            this.showNotification('A senha deve ter pelo menos 8 caracteres.', 'warning');
            isValid = false;
        }

        // Valida termos
        const termsCheckbox = document.getElementById('agree_terms');
        if (termsCheckbox && !termsCheckbox.checked) {
            this.showNotification('Você deve aceitar os termos e condições para continuar.', 'error');
            isValid = false;
        }

        // Validações específicas
        if (!this.validateEmail(document.getElementById('email').value)) {
            isValid = false;
        }

        if (!this.validatePhone(document.getElementById('phone').value)) {
            isValid = false;
        }

        if (!this.validateUsername(document.getElementById('username').value)) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Mostra notificação
     */
    static showNotification(message, type = 'info') {
        // Usa o sistema de notificação global se disponível
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        // Fallback simples com estilos
        this.showSimpleNotification(message, type);
    }

    /**
     * Notificação simples fallback
     */
    static showSimpleNotification(message, type = 'info') {
        // Remove notificações existentes
        const existingNotifications = document.querySelectorAll('.simple-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `simple-notification simple-notification-${type}`;
        notification.innerHTML = `
            <div class="simple-notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="simple-notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Retorna ícone baseado no tipo de notificação
     */
    static getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    /**
     * Verifica disponibilidade de username
     */
    static async checkUsernameAvailability(username) {
        if (username.length < 3) return;

        try {
            // Simulação de verificação - implementar chamada API real
            const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            
            this.toggleFieldValidation('username', data.available, data.message || 'Nome de usuário já está em uso.');
        } catch (error) {
            console.error('Erro ao verificar username:', error);
        }
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    RegisterClientSystem.init();
});

// Adicionar estilos para validação e notificações
const enhancedStyles = `
    .is-valid {
        border-color: var(--success-green) !important;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
    }
    
    .is-invalid {
        border-color: var(--alert-red) !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }
    
    .invalid-feedback {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: var(--alert-red);
    }
    
    .strength-bar.weak .strength-bar-inner {
        background: var(--alert-red) !important;
        width: 25% !important;
    }
    
    .strength-bar.medium .strength-bar-inner {
        background: var(--warning-yellow) !important;
        width: 50% !important;
    }
    
    .strength-bar.good .strength-bar-inner {
        background: #00bfff !important;
        width: 75% !important;
    }
    
    .strength-bar.strong .strength-bar-inner {
        background: var(--success-green) !important;
        width: 100% !important;
    }
    
    .strength-bar.excellent .strength-bar-inner {
        background: #00ff88 !important;
        width: 100% !important;
    }

    /* Notificações simples */
    .simple-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    }
    
    .simple-notification-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
    }
    
    .simple-notification-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
    }
    
    .simple-notification-warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
    }
    
    .simple-notification-info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
        border-radius: 8px;
    }
    
    .simple-notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px 20px;
    }
    
    .simple-notification-content i:first-child {
        font-size: 18px;
        flex-shrink: 0;
    }
    
    .simple-notification-content span {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .simple-notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.3s;
        flex-shrink: 0;
    }
    
    .simple-notification-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Utilitários */
    .hidden {
        display: none !important;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);