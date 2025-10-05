/**
 * TxunaJob - JavaScript Principal v3.0 - CORRIGIDO
 * Autor: EgoBrain-Dev
 * Versão: 3.1.0 - Sistema Completo Corrigido
 * 
 * Sistema completo com modais elegantes, WebSocket e integração total
 */

// =============================================================================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// =============================================================================

const API_BASE = 'http://localhost:5000/api';
const WS_URL = 'http://localhost:5000';

console.log('🚀 [TxunaJob] Inicializando aplicação v3.1 - Sistema Corrigido...');

// Sistema de autenticação
let currentUser = null;
let authToken = null;
let socket = null;
let currentChatId = null;

// =============================================================================
// SISTEMA DE MODAIS E INTERFACE
// =============================================================================

/**
 * Mostra modal de login elegante
 */
function showLoginModal() {
    console.log('🔐 [UI] Abrindo modal de login...');
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Fecha modal de login
 */
function closeLoginModal() {
    console.log('🔐 [UI] Fechando modal de login...');
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Limpar formulário
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    }
}

/**
 * Mostra modal de cadastro elegante
 */
function showRegisterModal() {
    console.log('📝 [UI] Abrindo modal de cadastro...');
    const modal = document.getElementById('registerModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Fecha modal de cadastro
 */
function closeRegisterModal() {
    console.log('📝 [UI] Fechando modal de cadastro...');
    const modal = document.getElementById('registerModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Limpar formulário
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.reset();
    }
}

/**
 * Mostra cadastro pre-selecionado para cliente
 */
function showClientRegister() {
    showRegisterModal();
    // Pre-seleciona cliente após o modal abrir
    setTimeout(() => {
        const userTypeSelect = document.getElementById('registerUserType');
        if (userTypeSelect) {
            userTypeSelect.value = 'client';
        }
    }, 100);
}

/**
 * Mostra cadastro pre-selecionado para profissional
 */
function showProfessionalRegister() {
    showRegisterModal();
    // Pre-seleciona profissional após o modal abrir
    setTimeout(() => {
        const userTypeSelect = document.getElementById('registerUserType');
        if (userTypeSelect) {
            userTypeSelect.value = 'professional';
        }
    }, 100);
}

/**
 * Mostra interface de chat
 */
function showChat() {
    console.log('💬 [UI] Abrindo interface de chat...');
    const chatInterface = document.getElementById('chatInterface');
    if (chatInterface) {
        chatInterface.classList.remove('hidden');
        
        // Conectar WebSocket se necessário
        if (authToken && !socket) {
            initializeWebSocket();
        }
        
        // Carregar conversas
        loadUserChats();
    }
}

/**
 * Fecha interface de chat
 */
function closeChat() {
    console.log('💬 [UI] Fechando interface de chat...');
    const chatInterface = document.getElementById('chatInterface');
    if (chatInterface) {
        chatInterface.classList.add('hidden');
        currentChatId = null;
    }
}

/**
 * Inicia novo chat
 */
function startNewChat() {
    if (!currentUser) {
        showNotification('Faça login para iniciar um chat', 'error');
        showLoginModal();
        return;
    }
    
    showNotification('Selecione um profissional para iniciar conversa', 'info');
}

// =============================================================================
// SISTEMA DE WEBSOCKET PARA CHAT
// =============================================================================

/**
 * Inicializa conexão WebSocket
 */
function initializeWebSocket() {
    console.log('🔗 [WS] Iniciando conexão WebSocket...');
    
    try {
        // Verificar se SocketIO está disponível
        if (typeof io === 'undefined') {
            console.error('❌ [WS] SocketIO não carregado');
            showNotification('Erro: SocketIO não carregado', 'error');
            return;
        }
        
        socket = io(WS_URL);
        
        socket.on('connect', () => {
            console.log('✅ [WS] Conectado ao servidor');
            updateChatStatus('Conectado');
            
            // Entrar nas salas dos chats existentes
            if (currentUser) {
                loadUserChats();
            }
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 [WS] Desconectado do servidor');
            updateChatStatus('Desconectado');
        });
        
        socket.on('connection_status', (data) => {
            console.log('📡 [WS] Status:', data.status);
        });
        
        socket.on('new_message', (data) => {
            console.log('💬 [WS] Nova mensagem recebida:', data);
            handleNewMessage(data);
        });
        
        socket.on('user_joined', (data) => {
            console.log('👤 [WS] Usuário entrou no chat:', data.user_id);
        });
        
        socket.on('error', (data) => {
            console.error('❌ [WS] Erro:', data.message);
            showNotification('Erro no chat: ' + data.message, 'error');
        });
        
    } catch (error) {
        console.error('❌ [WS] Erro ao conectar:', error);
        showNotification('Erro de conexão com o chat', 'error');
    }
}

/**
 * Atualiza status do chat na UI
 */
function updateChatStatus(status) {
    const statusElement = document.getElementById('chatStatus');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Adicionar classe baseada no status
        statusElement.className = 'chat-status';
        if (status === 'Conectado') {
            statusElement.classList.add('connected');
        } else if (status === 'Desconectado') {
            statusElement.classList.add('disconnected');
        }
    }
}

/**
 * Manipula nova mensagem recebida
 */
function handleNewMessage(messageData) {
    // Verificar se a mensagem é para o chat atual
    if (currentChatId && messageData.chat_id === currentChatId) {
        displayMessage(messageData);
    }
    
    // Atualizar lista de chats
    loadUserChats();
}

/**
 * Envia mensagem via WebSocket
 */
function sendChatMessage(content) {
    if (!socket || !currentChatId || !currentUser) {
        showNotification('Erro ao enviar mensagem', 'error');
        return;
    }
    
    console.log('📤 [WS] Enviando mensagem para chat:', currentChatId);
    
    socket.emit('send_message', {
        chat_id: currentChatId,
        sender_id: currentUser.id,
        content: content,
        message_type: 'text'
    });
}

// =============================================================================
// SISTEMA DE AUTENTICAÇÃO (ATUALIZADO)
// =============================================================================

/**
 * Faz login do usuário (versão com modal)
 */
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 [AUTH] Processando login...');
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }
    
    // Mostrar loading no botão
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Salvar token e dados do usuário
            authToken = data.token;
            currentUser = data.user;
            
            // Salvar no localStorage para persistência
            localStorage.setItem('txunajob_token', authToken);
            localStorage.setItem('txunajob_user', JSON.stringify(currentUser));
            
            console.log('✅ [AUTH] Login bem-sucedido:', currentUser.name);
            
            // Fechar modal e atualizar UI
            closeLoginModal();
            updateUIForLoggedInUser();
            showNotification(`Bem-vindo, ${currentUser.name}!`, 'success');
            
            // Inicializar WebSocket
            initializeWebSocket();
            
        } else {
            console.error('❌ [AUTH] Falha no login:', data.error);
            showNotification('Erro no login: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('❌ [AUTH] Erro de conexão no login:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Registra novo usuário (versão com modal)
 */
async function handleRegister(event) {
    event.preventDefault();
    console.log('📝 [AUTH] Processando registro...');
    
    const formData = {
        name: document.getElementById('registerName')?.value,
        email: document.getElementById('registerEmail')?.value,
        password: document.getElementById('registerPassword')?.value,
        user_type: document.getElementById('registerUserType')?.value,
        phone: document.getElementById('registerPhone')?.value || '',
        location: document.getElementById('registerLocation')?.value || ''
    };
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.password || !formData.user_type) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    // Mostrar loading no botão
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ [AUTH] Registro bem-sucedido:', data.user_id);
            showNotification('Conta criada com sucesso!', 'success');
            
            // Fechar modal e fazer login automático
            closeRegisterModal();
            
            // Fazer login automaticamente
            setTimeout(async () => {
                const loginResult = await loginUserDirect(formData.email, formData.password);
                if (!loginResult.success) {
                    showLoginModal();
                }
            }, 1000);
            
        } else {
            console.error('❌ [AUTH] Erro no registro:', data.error);
            showNotification('Erro no registro: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('❌ [AUTH] Erro de conexão no registro:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Login direto (para uso interno)
 */
async function loginUserDirect(email, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('txunajob_token', authToken);
            localStorage.setItem('txunajob_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            initializeWebSocket();
            return { success: true };
        }
        return { success: false, error: data.error };
    } catch (error) {
        return { success: false, error: 'Erro de conexão' };
    }
}

/**
 * Faz logout do usuário
 */
function logoutUser() {
    console.log('🔐 [AUTH] Iniciando processo de logout...');
    
    // Fechar conexão WebSocket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    authToken = null;
    currentUser = null;
    currentChatId = null;
    
    // Limpar localStorage
    localStorage.removeItem('txunajob_token');
    localStorage.removeItem('txunajob_user');
    
    updateUIForLoggedOutUser();
    showNotification('Logout realizado com sucesso!', 'success');
    console.log('✅ [AUTH] Logout concluído');
}

/**
 * Verifica se usuário está logado ao carregar a página
 */
function checkAuthStatus() {
    console.log('🔐 [AUTH] Verificando status de autenticação...');
    
    const savedToken = localStorage.getItem('txunajob_token');
    const savedUser = localStorage.getItem('txunajob_user');
    
    if (savedToken && savedUser) {
        try {
            authToken = savedToken;
            currentUser = JSON.parse(savedUser);
            console.log('✅ [AUTH] Usuário logado detectado:', currentUser.name);
            updateUIForLoggedInUser();
            return true;
        } catch (error) {
            console.error('❌ [AUTH] Erro ao parsear usuário:', error);
            localStorage.removeItem('txunajob_token');
            localStorage.removeItem('txunajob_user');
        }
    }
    
    console.log('🔐 [AUTH] Nenhum usuário logado detectado');
    return false;
}

/**
 * Atualiza a UI para usuário logado
 */
function updateUIForLoggedInUser() {
    console.log('🎨 [UI] Atualizando interface para usuário logado...');
    
    // Esconder botões de login/registro
    document.querySelectorAll('.auth-buttons').forEach(container => {
        container.style.display = 'none';
    });
    
    // Mostrar informações do usuário
    const userInfoElement = document.getElementById('userInfo') || createUserInfoElement();
    userInfoElement.innerHTML = `
        <div class="user-menu">
            <span class="user-greeting">Olá, <strong>${currentUser.name}</strong></span>
            <div class="user-dropdown">
                <button class="btn btn-outline" onclick="showUserProfile()">
                    <i class="fas fa-user"></i> Meu Perfil
                </button>
                <button class="btn btn-outline" onclick="showChat()">
                    <i class="fas fa-comments"></i> Chat
                </button>
                <button class="btn btn-outline" onclick="showUserDashboard()">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </button>
                <button class="btn btn-primary" onclick="logoutUser()">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            </div>
        </div>
    `;
    
    // Adicionar à header se não existir
    if (!document.getElementById('userInfo')) {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(userInfoElement);
        }
    }
    
    console.log('✅ [UI] Interface atualizada para usuário logado');
}

/**
 * Atualiza a UI para usuário deslogado
 */
function updateUIForLoggedOutUser() {
    console.log('🎨 [UI] Atualizando interface para usuário deslogado...');
    
    // Mostrar botões de login/registro
    document.querySelectorAll('.auth-buttons').forEach(container => {
        container.style.display = 'flex';
    });
    
    // Remover informações do usuário
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.remove();
    }
    
    console.log('✅ [UI] Interface atualizada para usuário deslogado');
}

/**
 * Cria elemento de informações do usuário
 */
function createUserInfoElement() {
    const userInfo = document.createElement('div');
    userInfo.id = 'userInfo';
    userInfo.className = 'user-info';
    return userInfo;
}

// =============================================================================
// SISTEMA DE CHAT - API INTEGRATION
// =============================================================================

/**
 * Carrega conversas do usuário
 */
async function loadUserChats() {
    if (!currentUser || !authToken) return;
    
    console.log('💬 [CHAT] Carregando conversas...');
    
    try {
        const response = await fetch(`${API_BASE}/chats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayChatsList(data.chats);
            console.log(`✅ [CHAT] ${data.chats.length} conversas carregadas`);
        } else {
            console.error('❌ [CHAT] Erro ao carregar conversas:', data.error);
            displayChatsList([]);
        }
    } catch (error) {
        console.error('❌ [CHAT] Erro de conexão:', error);
        displayChatsList([]);
    }
}

/**
 * Exibe lista de conversas na sidebar
 */
function displayChatsList(chats) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    
    if (!chats || chats.length === 0) {
        chatList.innerHTML = `
            <div class="chat-list-empty">
                <i class="fas fa-comments"></i>
                <p>Nenhuma conversa</p>
                <button class="btn btn-sm btn-outline" onclick="startNewChat()">
                    Iniciar conversa
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    chats.forEach(chat => {
        const lastMessage = chat.last_message || 'Nenhuma mensagem ainda';
        const unreadCount = chat.unread_count > 0 ? `<span class="unread-badge">${chat.unread_count}</span>` : '';
        const otherUser = currentUser.user_type === 'client' ? chat.professional_name : chat.client_name;
        
        html += `
            <div class="chat-list-item" onclick="openChat(${chat.id})">
                <div class="chat-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${otherUser}</div>
                    <div class="chat-last-message">${lastMessage}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${formatChatTime(chat.last_message_at)}</div>
                    ${unreadCount}
                </div>
            </div>
        `;
    });
    
    chatList.innerHTML = html;
}

/**
 * Abre um chat específico
 */
async function openChat(chatId) {
    console.log(`💬 [CHAT] Abrindo chat ${chatId}...`);
    currentChatId = chatId;
    
    // Entrar na sala do chat via WebSocket
    if (socket && currentUser) {
        socket.emit('join_chat', {
            chat_id: chatId,
            user_id: currentUser.id
        });
    }
    
    // Carregar mensagens
    await loadChatMessages(chatId);
    
    // Ativar área de mensagens
    activateChatArea();
}

/**
 * Carrega mensagens de um chat específico
 */
async function loadChatMessages(chatId) {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages);
            console.log(`✅ [CHAT] ${data.messages.length} mensagens carregadas`);
        } else {
            console.error('❌ [CHAT] Erro ao carregar mensagens:', data.error);
            displayMessages([]);
        }
    } catch (error) {
        console.error('❌ [CHAT] Erro de conexão:', error);
        displayMessages([]);
    }
}

/**
 * Exibe mensagens na área de chat
 */
function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-comments"></i>
                <h3>Nenhuma mensagem ainda</h3>
                <p>Seja o primeiro a enviar uma mensagem!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(message => {
        const isOwn = message.sender_id === currentUser.id;
        const messageClass = isOwn ? 'message own' : 'message other';
        
        html += `
            <div class="${messageClass}">
                <div class="message-content">
                    <div class="message-text">${message.content}</div>
                    <div class="message-time">${formatMessageTime(message.created_at)}</div>
                </div>
            </div>
        `;
    });
    
    chatMessages.innerHTML = html;
    
    // Scroll para baixo
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Exibe uma única mensagem
 */
function displayMessage(messageData) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Remover mensagem de boas-vindas se existir
    const welcomeMsg = chatMessages.querySelector('.chat-welcome');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const isOwn = messageData.sender_id === currentUser.id;
    const messageClass = isOwn ? 'message own' : 'message other';
    
    const messageElement = document.createElement('div');
    messageElement.className = messageClass;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${messageData.content}</div>
            <div class="message-time">${formatMessageTime(messageData.created_at)}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll para baixo
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Ativa área de mensagens para um chat
 */
function activateChatArea() {
    const messageInput = document.getElementById('chatMessageInput');
    const sendButton = document.getElementById('sendMessageBtn');
    
    if (messageInput && sendButton) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// =============================================================================
// SISTEMA DE PROFISSIONAIS - CORRIGIDO
// =============================================================================

/**
 * Carrega profissionais com fallback robusto
 */
async function loadProfessionals() {
    console.log('👷 [API] Buscando profissionais...');
    
    const professionalsGrid = document.getElementById('professionalsGrid');
    if (!professionalsGrid) {
        console.error('❌ [API] Elemento professionalsGrid não encontrado');
        return;
    }

    try {
        // Mostrar loading
        professionalsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando profissionais...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE}/professionals`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ [API] ${data.professionals.length} profissionais carregados`);
            displayProfessionals(data.professionals);
        } else {
            throw new Error(data.error || 'Erro desconhecido na API');
        }
        
    } catch (error) {
        console.error('❌ [API] Erro ao carregar profissionais:', error);
        // Fallback para dados de demonstração
        loadFallbackProfessionals();
    }
}

/**
 * Fallback com dados de demonstração
 */
function loadFallbackProfessionals() {
    console.log('🔄 [FALLBACK] Carregando dados de demonstração...');
    
    const fallbackProfessionals = [
        {
            "id": 1,
            "name": "João Eletricista",
            "category": "Eletricista",
            "rating": 4.8,
            "location": "Maputo",
            "skills": ["Instalação elétrica", "Manutenção", "Reparação"],
            "hourly_rate": "350.00"
        },
        {
            "id": 2,
            "name": "Maria Encanadora", 
            "category": "Encanadora",
            "rating": 4.9,
            "location": "Matola",
            "skills": ["Encanamento", "Desentupimento", "Instalação"],
            "hourly_rate": "300.00"
        },
        {
            "id": 3,
            "name": "Carlos Pintor",
            "category": "Pintor",
            "rating": 4.7,
            "location": "Maputo",
            "skills": ["Pintura residencial", "Pintura comercial"],
            "hourly_rate": "250.00"
        },
        {
            "id": 4,
            "name": "Ana Pedreira",
            "category": "Pedreira", 
            "rating": 4.6,
            "location": "Matola",
            "skills": ["Assentamento", "Acabamento", "Revestimento"],
            "hourly_rate": "280.00"
        }
    ];
    
    displayProfessionals(fallbackProfessionals);
    showNotification('Usando dados de demonstração', 'info');
}

/**
 * Exibe os profissionais na grid
 */
function displayProfessionals(professionals) {
    const professionalsGrid = document.getElementById('professionalsGrid');
    if (!professionalsGrid) return;

    if (!professionals || professionals.length === 0) {
        professionalsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhum profissional encontrado</h3>
                <p>Tente novamente mais tarde.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    professionals.forEach(professional => {
        const skills = Array.isArray(professional.skills) ? 
            professional.skills.join(', ') : 
            (professional.skills || 'Habilidades diversas');
            
        html += `
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h3>${professional.name}</h3>
                <p><strong>Categoria:</strong> ${professional.category}</p>
                <p><strong>Localização:</strong> ${professional.location || 'Não informada'}</p>
                <p><strong>Avaliação:</strong> ${professional.rating || 'N/A'} ⭐</p>
                <p><strong>Habilidades:</strong> ${skills}</p>
                <p><strong>Taxa horária:</strong> ${professional.hourly_rate || 'A combinar'} MT</p>
                <button class="btn btn-primary" onclick="contactProfessional(${professional.id})">
                    <i class="fas fa-envelope"></i> Contactar
                </button>
            </div>
        `;
    });

    professionalsGrid.innerHTML = html;
    console.log('🎨 [UI] Profissionais exibidos na grid');
}

/**
 * Contacta um profissional
 */
async function contactProfessional(professionalId) {
    console.log(`📞 [CONTATO] Iniciando contato com profissional ID: ${professionalId}`);
    
    // Verificar se usuário está logado
    if (!currentUser) {
        const shouldLogin = confirm('Para contactar profissionais, é necessário fazer login. Deseja fazer login agora?');
        if (shouldLogin) {
            showLoginModal();
        }
        return;
    }
    
    const message = prompt('Digite sua mensagem para o profissional:');
    if (!message) {
        console.log('📞 [CONTATO] Mensagem cancelada pelo usuário');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professional_id: professionalId,
                message: message,
                client_name: currentUser.name
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Mensagem enviada com sucesso!', 'success');
            console.log('✅ [CONTATO] Mensagem enviada');
        } else {
            showNotification('Erro ao enviar mensagem: ' + data.error, 'error');
            console.error('❌ [CONTATO] Erro na API:', data.error);
        }
    } catch (error) {
        console.error('❌ [CONTATO] Erro de conexão:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    }
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Formata tempo para exibição no chat
 */
function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        
        return date.toLocaleDateString('pt-PT', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        return '';
    }
}

/**
 * Formata tempo para lista de chats
 */
function formatChatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias`;
        
        return date.toLocaleDateString('pt-PT');
    } catch (error) {
        return '';
    }
}

/**
 * Mostra notificação elegante
 */
function showNotification(message, type = 'info') {
    console.log(`📢 [NOTIFICATION] ${type}: ${message}`);
    
    const container = document.getElementById('notificationContainer');
    if (!container) {
        console.error('❌ [NOTIFICATION] Container não encontrado');
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Mostrar animação
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// =============================================================================
// FUNÇÕES DE UI (COMPATIBILIDADE)
// =============================================================================

function showUserProfile() {
    console.log('👤 [UI] Solicitando perfil do usuário...');
    if (!currentUser) {
        showNotification('Faça login para ver seu perfil', 'error');
        return;
    }
    
    alert(`Perfil de ${currentUser.name}\n\nEmail: ${currentUser.email}\nTipo: ${currentUser.user_type === 'professional' ? 'Profissional' : 'Cliente'}\nLocalização: ${currentUser.location || 'Não informada'}\nTelefone: ${currentUser.phone || 'Não informado'}`);
}

function showUserDashboard() {
    console.log('📊 [UI] Solicitando dashboard...');
    if (!currentUser) {
        showNotification('Faça login para acessar o dashboard', 'error');
        return;
    }
    
    const userType = currentUser.user_type === 'professional' ? 'Profissional' : 'Cliente';
    const features = currentUser.user_type === 'professional' 
        ? ['Ver serviços solicitados', 'Gerenciar agenda', 'Atualizar perfil']
        : ['Buscar profissionais', 'Solicitar serviços', 'Ver histórico'];
        
    const actions = currentUser.user_type === 'professional'
        ? ['Completar perfil', 'Definir disponibilidade']
        : ['Encontrar profissional', 'Ver serviços anteriores'];
    
    alert(`Dashboard - Bem-vindo, ${currentUser.name}!\n\nTipo: ${userType}\n\nFuncionalidades:\n- ${features.join('\n- ')}\n\nAções Rápidas:\n- ${actions.join('\n- ')}`);
}

// =============================================================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================================================

/**
 * Configura event listeners para formulários e interações
 */
function initializeEventListeners() {
    console.log('🔧 [EVENTS] Configurando event listeners...');
    
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form conectado');
    } else {
        console.error('❌ Login form não encontrado');
    }
    
    // Formulário de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        console.log('✅ Register form conectado');
    } else {
        console.error('❌ Register form não encontrado');
    }
    
    // Overlay para fechar modais
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeLoginModal();
            closeRegisterModal();
        });
        console.log('✅ Modal overlay conectado');
    }
    
    // Chat
    const messageInput = document.getElementById('chatMessageInput');
    const sendButton = document.getElementById('sendMessageBtn');
    
    if (messageInput && sendButton) {
        // Enviar mensagem com Enter
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
        
        // Enviar mensagem com botão
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                sendChatMessage(message);
                messageInput.value = '';
            }
        });
        console.log('✅ Chat inputs conectados');
    }
}

/**
 * Configura event listeners globais
 */
function initializeGlobalEventListeners() {
    console.log('🔧 [GLOBAL] Configurando listeners globais...');
    
    // Botões de autenticação que não têm onclick
    document.querySelectorAll('.btn').forEach(button => {
        if (!button.hasAttribute('onclick')) {
            button.addEventListener('click', function(e) {
                // Ignorar botões com funcionalidades específicas
                if (this.classList.contains('mobile-menu-close') || 
                    this.id === 'mobileMenuBtn' || 
                    this.classList.contains('text-size-btn') ||
                    this.id === 'accessibilityToggle' ||
                    this.id === 'themeSwitcher') {
                    return;
                }
                
                // Botões de autenticação genéricos
                if (this.textContent.includes('Registar') || this.textContent.includes('Registrar')) {
                    e.preventDefault();
                    showRegisterModal();
                } else if (this.textContent.includes('Entrar') || this.textContent.includes('Login')) {
                    e.preventDefault();
                    showLoginModal();
                }
            });
        }
    });
}

// =============================================================================
// FUNÇÕES DE ACESSIBILIDADE E TEMA (MANTIDAS)
// =============================================================================

function initializeAccessibility() {
    console.log('♿ [Acessibilidade] Configurando recursos...');
    // ... (mantenha as funções originais de acessibilidade)
}

function initializeMobileMenu() {
    console.log('📱 [Mobile] Configurando menu mobile...');
    // ... (mantenha as funções originais do menu mobile)
}

function toggleTheme() {
    // ... (mantenha a função original)
}

function adjustTextSize(size) {
    // ... (mantenha a função original)
}

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================

/**
 * Função principal de inicialização
 */
function initializeApp() {
    console.log('🚀 [TxunaJob] Inicializando aplicação v3.1...');
    
    // Verificar autenticação primeiro
    checkAuthStatus();
    
    // Inicializar outras funcionalidades
    initializeAccessibility();
    initializeMobileMenu();
    initializeEventListeners();
    initializeGlobalEventListeners();
    
    // Carregar profissionais
    loadProfessionals();
    
    console.log('✅ [TxunaJob] Aplicação v3.1 inicializada com sucesso!');
}

// =============================================================================
// EVENTO DE CARREGAMENTO DA PÁGINA
// =============================================================================

document.addEventListener('DOMContentLoaded', initializeApp);

console.log('📄 [Script] JavaScript v3.1 carregado - Sistema corrigido pronto!');