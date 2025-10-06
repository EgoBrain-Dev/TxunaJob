/**
 * TxunaJob - Sistema de Registro
 * Para páginas de registro de cliente e profissional
 * Autor: EgoBrain-Dev
 * Versão: 1.0.0
 */

class RegisterSystem {
    static init() {
        this.setupPasswordToggle();
        this.setupFormValidation();
        this.setupSpecialtyField();
        this.setupPhoneMask();
    }
    
    static setupPasswordToggle() {
        // Toggle para campos de password nos formulários de registro
        document.querySelectorAll('input[type="password"]').forEach(input => {
            const wrapper = input.parentElement;
            
            if (wrapper.querySelector('.password-toggle')) return;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.setAttribute('aria-label', 'Mostrar senha');
            
            wrapper.classList.add('password-wrapper');
            wrapper.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                toggleBtn.innerHTML = isPassword ? 
                    '<i class="fas fa-eye-slash"></i>' : 
                    '<i class="fas fa-eye"></i>';
                toggleBtn.setAttribute('aria-label', 
                    isPassword ? 'Ocultar senha' : 'Mostrar senha');
            });
        });
    }
    
    static setupFormValidation() {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        this.showFieldError(field, 'Este campo é obrigatório');
                    } else {
                        this.clearFieldError(field);
                    }
                });
                
                // Validação específica para email
                const emailField = document.getElementById('email');
                if (emailField && emailField.value) {
                    if (!this.isValidEmail(emailField.value)) {
                        isValid = false;
                        this.showFieldError(emailField, 'Por favor, insira um email válido');
                    }
                }
                
                // Validação específica para password
                const passwordField = document.getElementById('password');
                if (passwordField && passwordField.value) {
                    if (passwordField.value.length < 6) {
                        isValid = false;
                        this.showFieldError(passwordField, 'A senha deve ter pelo menos 6 caracteres');
                    }
                }
                
                if (!isValid) {
                    e.preventDefault();
                    this.showError('Por favor, corrija os erros no formulário');
                } else {
                    this.showLoading();
                }
            });
        }
    }
    
    static setupSpecialtyField() {
        const specialtySelect = document.getElementById('specialty');
        if (specialtySelect) {
            specialtySelect.addEventListener('change', (e) => {
                if (e.target.value === 'Outro') {
                    this.showOtherSpecialtyField();
                } else {
                    this.hideOtherSpecialtyField();
                }
            });
        }
    }
    
    static showOtherSpecialtyField() {
        let otherField = document.getElementById('otherSpecialtyField');
        
        if (!otherField) {
            const specialtyGroup = document.querySelector('.form-group:has(#specialty)');
            if (specialtyGroup) {
                otherField = document.createElement('div');
                otherField.id = 'otherSpecialtyField';
                otherField.className = 'form-group';
                otherField.innerHTML = `
                    <label for="other_specialty">
                        <i class="fas fa-pen"></i>
                        Especifique sua especialidade:
                    </label>
                    <input type="text" 
                           id="other_specialty" 
                           name="other_specialty" 
                           placeholder="Ex: Jardineiro, Pintor, Carpinteiro..."
                           required
                           class="form-input">
                `;
                
                specialtyGroup.parentNode.insertBefore(otherField, specialtyGroup.nextSibling);
            }
        }
    }
    
    static hideOtherSpecialtyField() {
        const otherField = document.getElementById('otherSpecialtyField');
        if (otherField) {
            otherField.remove();
        }
    }
    
    static setupPhoneMask() {
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 0) {
                    if (!value.startsWith('258')) {
                        value = '258' + value;
                    }
                    
                    // Formatar: +258 84 123 4567
                    let formatted = '+';
                    if (value.length > 3) formatted += value.substring(0, 3) + ' ';
                    if (value.length > 5) formatted += value.substring(3, 5) + ' ';
                    if (value.length > 8) formatted += value.substring(5, 8) + ' ';
                    if (value.length > 11) formatted += value.substring(8, 12);
                    else if (value.length > 8) formatted += value.substring(8);
                    
                    e.target.value = formatted;
                }
            });
        }
    }
    
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
            submitBtn.disabled = true;
            
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
    RegisterSystem.init();
});

// Adicionar CSS específico para registro
const registerStyles = `
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

.field-error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.form-input.error {
    border-color: #dc3545;
}

.btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
}

.btn:disabled:hover {
    background-color: var(--primary-orange) !important;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = registerStyles;
document.head.appendChild(styleSheet);