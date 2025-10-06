/**
 * TxunaJob - Sistema de Chat
 * Autor: EgoBrain-Dev  
 * Versão: 1.0.0
 */

class ChatSystem {
    static init() {
        Logger.log('CHAT', 'Inicializando sistema de chat');
        
        // Configurar event listeners do chat
        this.setupEventListeners();
        
        // Carregar estado inicial se usuário estiver logado
        if (AuthSystem.isLoggedIn()) {
            this.loadInitialState();
        }
    }
    
    static setupEventListeners() {
        // Input de mensagem
        const messageInput = document.getElementById('chatMessageInput');
        const sendButton = document.getElementById('sendMessageBtn');
        
        if (messageInput && sendButton) {
            // Enviar com Enter
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
            
            // Enviar com botão
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Fechar chat
        const closeBtn = document.querySelector('.chat-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
    }
    
    static async loadInitialState() {
        try {
            // Carregar conversas
            await this.loadConversations();
            
            // Simular conexão WebSocket
            this.simulateWebSocketConnection();
            
        } catch (error) {
            Logger.error('CHAT', 'Erro ao carregar estado inicial', error);
        }
    }
    
    static async loadConversations() {
        // Simular carregamento de conversas
        const conversations = await this.getMockConversations();
        this.displayConversations(conversations);
    }
    
    static async getMockConversations() {
        await Utils.sleep(1000); // Simular delay
        
        return [
            {
                id: 1,
                otherUser: 'João Eletricista',
                lastMessage: 'Olá! Posso começar o serviço amanhã às 9h...',
                timestamp: new Date(Date.now() - 300000), // 5 minutos atrás
                unread: 3,
                userType: 'professional'
            },
            {
                id: 2, 
                otherUser: 'Maria Encanadora',
                lastMessage: 'O material já chegou, podemos marcar...',
                timestamp: new Date(Date.now() - 86400000), // 1 dia atrás
                unread: 0,
                userType: 'professional'
            },
            {
                id: 3,
                otherUser: 'Carlos Cliente',
                lastMessage: 'Preciso verificar o orçamento...',
                timestamp: new Date(Date.now() - 172800000), // 2 dias atrás
                unread: 1,
                userType: 'client'
            }
        ];
    }
    
    static displayConversations(conversations) {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;
        
        if (!conversations || conversations.length === 0) {
            chatList.innerHTML = this.getEmptyConversationsHTML();
            return;
        }
        
        chatList.innerHTML = conversations.map(conv => this.getConversationHTML(conv)).join('');
        
        // Adicionar event listeners para as conversas
        this.setupConversationListeners();
    }
    
    static getConversationHTML(conversation) {
        const time = Utils.formatTime(conversation.timestamp);
        const unreadBadge = conversation.unread > 0 ? 
            `<span class="unread-badge">${conversation.unread}</span>` : '';
        
        return `
            <div class="conversation-item" data-chat-id="${conversation.id}">
                <div class="conversation-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <h3>${conversation.otherUser}</h3>
                        <span class="conversation-time">${time}</span>
                    </div>
                    <p class="conversation-preview">${conversation.lastMessage}</p>
                    ${unreadBadge}
                </div>
            </div>
        `;
    }
    
    static getEmptyConversationsHTML() {
        return `
            <div class="chat-list-empty">
                <i class="fas fa-comments"></i>
                <p>Nenhuma conversa</p>
                <button class="btn btn-sm btn-outline" onclick="ChatSystem.startNewConversation()">
                    Iniciar conversa
                </button>
            </div>
        `;
    }
    
    static setupConversationListeners() {
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                this.openConversation(chatId);
            });
        });
    }
    
    static async openConversation(chatId) {
        Logger.log('CHAT', `Abrindo conversa ${chatId}`);
        
        // Marcar como ativa
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
        
        // Carregar mensagens
        await this.loadMessages(chatId);
        
        // Ativar área de mensagens
        this.activateChatArea();
    }
    
    static async loadMessages(chatId) {
        // Simular carregamento de mensagens
        const messages = await this.getMockMessages(chatId);
        this.displayMessages(messages);
    }
    
    static async getMockMessages(chatId) {
        await Utils.sleep(800); // Simular delay
        
        const currentUser = AuthSystem.getCurrentUser();
        
        return [
            {
                id: 1,
                content: 'Olá! Gostaria de saber se você está disponível para um serviço de instalação elétrica.',
                sender_id: currentUser.id === 2 ? 2 : 1,
                created_at: new Date(Date.now() - 3600000) // 1 hora atrás
            },
            {
                id: 2,
                content: 'Bom dia! Sim, estou disponível. Pode me dar mais detalhes sobre o serviço?',
                sender_id: currentUser.id === 2 ? 1 : 2,
                created_at: new Date(Date.now() - 3540000) // 59 minutos atrás
            },
            {
                id: 3,
                content: 'Preciso instalar o quadro elétrico e pontos de luz na minha nova casa. São 3 quartos, sala e cozinha.',
                sender_id: currentUser.id === 2 ? 2 : 1,
                created_at: new Date(Date.now() - 3480000) // 58 minutos atrás
            },
            {
                id: 4,
                content: 'Perfeito! Posso fazer uma visita técnica hoje à tarde para ver o local e passar o orçamento.',
                sender_id: currentUser.id === 2 ? 1 : 2,
                created_at: new Date(Date.now() - 3420000) // 57 minutos atrás
            }
        ];
    }
    
    static displayMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = this.getWelcomeMessageHTML();
            return;
        }
        
        const currentUser = AuthSystem.getCurrentUser();
        const messagesHTML = messages.map(msg => 
            this.getMessageHTML(msg, currentUser.id)
        ).join('');
        
        chatMessages.innerHTML = messagesHTML;
        
        // Scroll para baixo
        this.scrollToBottom();
    }
    
    static getMessageHTML(message, currentUserId) {
        const isOwn = message.sender_id === currentUserId;
        const messageClass = isOwn ? 'message own' : 'message other';
        const time = Utils.formatTime(message.created_at);
        
        return `
            <div class="${messageClass}">
                <div class="message-content">
                    <div class="message-text">${message.content}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }
    
    static getWelcomeMessageHTML() {
        return `
            <div class="chat-welcome">
                <i class="fas fa-comments"></i>
                <h3>Nenhuma mensagem ainda</h3>
                <p>Seja o primeiro a enviar uma mensagem!</p>
            </div>
        `;
    }
    
    static activateChatArea() {
        const messageInput = document.getElementById('chatMessageInput');
        const sendButton = document.getElementById('sendMessageBtn');
        
        if (messageInput && sendButton) {
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }
    
    static sendMessage() {
        const messageInput = document.getElementById('chatMessageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Adicionar mensagem localmente
        this.addMessageToChat(message, true);
        
        // Limpar input
        messageInput.value = '';
        
        // Simular resposta após delay
        setTimeout(() => {
            this.simulateReply();
        }, 1000 + Math.random() * 2000);
    }
    
    static addMessageToChat(content, isOwn = true) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        // Remover mensagem de boas-vindas se existir
        const welcomeMsg = chatMessages.querySelector('.chat-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        const currentUser = AuthSystem.getCurrentUser();
        const message = {
            id: Date.now(),
            content: content,
            sender_id: isOwn ? currentUser.id : (currentUser.id === 2 ? 1 : 2),
            created_at: new Date()
        };
        
        const messageHTML = this.getMessageHTML(message, currentUser.id);
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // Scroll para baixo
        this.scrollToBottom();
    }
    
    static simulateReply() {
        const replies = [
            'Entendi! Posso ajudar com isso.',
            'Que ótimo! Quando você gostaria de agendar?',
            'Preciso de mais algumas informações para orçar o serviço.',
            'Posso verificar isso e retorno em breve.',
            'Excelente! Vamos combinar os detalhes.'
        ];
        
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        this.addMessageToChat(randomReply, false);
    }
    
    static scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    static simulateWebSocketConnection() {
        // Simular status de conexão
        const statusElement = document.getElementById('chatStatus');
        if (statusElement) {
            statusElement.textContent = 'Conectado';
            statusElement.className = 'chat-status connected';
        }
    }
    
    static startNewConversation() {
        NotificationSystem.info('Funcionalidade de nova conversa em desenvolvimento');
    }
    
    static open() {
        if (!AuthSystem.isLoggedIn()) {
            NotificationSystem.warning('Faça login para usar o chat');
            ModalSystem.open('loginModal');
            return;
        }
        
        const chatInterface = document.getElementById('chatInterface');
        if (chatInterface) {
            chatInterface.classList.remove('hidden');
            this.loadInitialState();
        }
    }
    
    static close() {
        const chatInterface = document.getElementById('chatInterface');
        if (chatInterface) {
            chatInterface.classList.add('hidden');
        }
    }
}

// Inicializar chat quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    ChatSystem.init();
});

// Funções globais para HTML
window.showChat = () => ChatSystem.open();
window.closeChat = () => ChatSystem.close();
window.startNewChat = () => ChatSystem.startNewConversation();