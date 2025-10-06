/**
 * TxunaJob - Sistema de Autenticação
 * Autor: EgoBrain-Dev
 * Versão: 1.0.0
 */

class AuthSystem {
    static async login(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Salvar texto original do botão
        const originalText = submitBtn.innerHTML;
        
        try {
            // Mostrar loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            submitBtn.disabled = true;
            
            // Simular login (em produção, seria uma chamada API real)
            await this.simulateLogin(formData);
            
            NotificationSystem.success('Login realizado com sucesso!');
            ModalSystem.close('loginModal');
            
            // Recarregar a página para atualizar estado
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            NotificationSystem.error(error.message);
            Logger.error('AUTH', 'Erro no login', error);
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    static async simulateLogin(formData) {
        // Simular delay de rede
        await Utils.sleep(1500);
        
        const username = formData.get('username');
        const password = formData.get('password');
        
        // Validação básica
        if (!username || !password) {
            throw new Error('Preencha todos os campos');
        }
        
        // Simular credenciais (em produção, verificar no backend)
        const validCredentials = {
            'admin': 'admin123',
            'cliente': 'cliente123', 
            'profissional': 'profissional123'
        };
        
        if (validCredentials[username] && validCredentials[username] === password) {
            // Simular dados do usuário baseado no username
            const userData = this.getUserDataByUsername(username);
            this.setUserSession(userData);
            return userData;
        } else {
            throw new Error('Credenciais inválidas');
        }
    }
    
    static getUserDataByUsername(username) {
        const users = {
            'admin': {
                id: 1,
                username: 'admin',
                name: 'Administrador TxunaJob',
                email: 'admin@txunajob.com',
                user_type: 'admin',
                location: 'Maputo'
            },
            'cliente': {
                id: 2,
                username: 'cliente',
                name: 'Maria Cliente',
                email: 'cliente@email.com',
                user_type: 'client',
                location: 'Matola'
            },
            'profissional': {
                id: 3,
                username: 'profissional',
                name: 'João Profissional',
                email: 'profissional@email.com',
                user_type: 'professional',
                location: 'Maputo',
                specialty: 'Eletricista'
            }
        };
        
        return users[username] || null;
    }
    
    static setUserSession(userData) {
        if (!userData) return;
        
        // Salvar no localStorage
        localStorage.setItem('txunajob_user', JSON.stringify(userData));
        localStorage.setItem('txunajob_token', 'simulated-token-' + Date.now());
        
        Logger.log('AUTH', `Usuário ${userData.name} logado com sucesso`);
    }
    
    static logout() {
        // Limpar localStorage
        localStorage.removeItem('txunajob_user');
        localStorage.removeItem('txunajob_token');
        
        NotificationSystem.success('Logout realizado com sucesso!');
        Logger.log('AUTH', 'Usuário deslogado');
        
        // Recarregar página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    
    static getCurrentUser() {
        try {
            const userData = localStorage.getItem('txunajob_user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            Logger.error('AUTH', 'Erro ao obter usuário atual', error);
            return null;
        }
    }
    
    static isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
    
    static updateUIForAuth() {
        const user = this.getCurrentUser();
        
        if (user) {
            this.showAuthenticatedUI(user);
        } else {
            this.showUnauthenticatedUI();
        }
    }
    
    static showAuthenticatedUI(user) {
        // Esconder botões de login/registro
        document.querySelectorAll('.auth-buttons').forEach(container => {
            container.style.display = 'none';
        });
        
        // Criar ou atualizar info do usuário
        this.createUserInfoElement(user);
        
        Logger.log('AUTH', `UI atualizada para usuário: ${user.name}`);
    }
    
    static showUnauthenticatedUI() {
        // Mostrar botões de login/registro
        document.querySelectorAll('.auth-buttons').forEach(container => {
            container.style.display = 'flex';
        });
        
        // Remover info do usuário
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.remove();
        }
        
        Logger.log('AUTH', 'UI atualizada para usuário não logado');
    }
    
    static createUserInfoElement(user) {
        // Remover elemento existente
        const existingInfo = document.getElementById('userInfo');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Criar novo elemento
        const userInfo = document.createElement('div');
        userInfo.id = 'userInfo';
        userInfo.className = 'user-info';
        userInfo.innerHTML = this.getUserInfoHTML(user);
        
        // Adicionar ao header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(userInfo);
        }
    }
    
    static getUserInfoHTML(user) {
        const userTypeIcons = {
            'admin': 'shield-alt',
            'client': 'user',
            'professional': 'briefcase'
        };
        
        const userTypeLabels = {
            'admin': 'Administrador',
            'client': 'Cliente',
            'professional': 'Profissional'
        };
        
        return `
            <div class="user-menu">
                <span class="user-greeting">
                    <i class="fas fa-${userTypeIcons[user.user_type]}"></i>
                    Olá, <strong>${user.name.split(' ')[0]}</strong>
                </span>
                <div class="user-dropdown">
                    <div class="user-dropdown-header">
                        <strong>${user.name}</strong>
                        <span class="user-type-badge">${userTypeLabels[user.user_type]}</span>
                    </div>
                    <a href="/dashboard/${user.user_type}" class="dropdown-item">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                    <a href="/profile" class="dropdown-item">
                        <i class="fas fa-user"></i> Meu Perfil
                    </a>
                    <a href="/chat" class="dropdown-item">
                        <i class="fas fa-comments"></i> Mensagens
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout-btn" onclick="AuthSystem.logout()">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </button>
                </div>
            </div>
        `;
    }
    
    static init() {
        Logger.log('AUTH', 'Inicializando sistema de autenticação');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Atualizar UI baseado no estado de autenticação
        this.updateUIForAuth();
    }
    
    static setupEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.login(e));
        }
        
        // Formulários de registro
        const registerForms = document.querySelectorAll('form[action*="register"]');
        registerForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleRegister(e));
        });
    }
    
    static async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
            submitBtn.disabled = true;
            
            // Simular registro
            await Utils.sleep(2000);
            
            NotificationSystem.success('Conta criada com sucesso!');
            ModalSystem.closeAll();
            
            // Redirecionar para login
            setTimeout(() => {
                ModalSystem.open('loginModal');
            }, 1500);
            
        } catch (error) {
            NotificationSystem.error('Erro ao criar conta: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Inicializar auth quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    AuthSystem.init();
});