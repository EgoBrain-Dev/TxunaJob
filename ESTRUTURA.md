txunajob/
├──app.py                 # Aplicação Flask principal
├──requirements.txt       # Dependências Python
├──vercel.json           # Configuração Vercel
├──wsgi.py               # WSGI entry point
├──static/
│├── css/
││   ├── styles.css    # Estilos principais
││   ├── auth.css      # Páginas de autenticação
││   ├── dashboard.css # Dashboards
││   ├── services.css  # Páginas de serviços
││   ├── profile.css   # Perfil do usuário
││   └── chat.css      # Interface de chat
│└── js/
│├── script.js     # JavaScript principal
│├── auth.js       # Autenticação
│└── chat.js       # Sistema de chat
├──templates/
│├── base.html         # Template base
│├── index.html        # Página inicial
│├── auth/             # Autenticação
││   ├── login.html
││   ├── register_client.html
││   └── register_pro.html
│├── dashboards/       # Dashboards
││   ├── client_dashboard.html
││   └── professional_dashboard.html
│├── services/         # Serviços
││   ├── services.html
││   └── service_detail.html
│├── chat/             # Chat
││   └── chat.html
│└── profile/          # Perfil
│└── profile.html
├──models/
│└── init.py       # Modelos de dados
└──instance/
└── app.db           # Database SQLite