TxunaJob/
│
├── README.md                # Documentação do projeto
├── LICENSE.md               # Licença do projeto
├── .env                     # Variáveis de ambiente (ex.: SECRET_KEY, DB_PATH)
│
├── frontend/                # Tudo relacionado ao frontend
│   ├── index.html           # Página principal
│   ├── login.html           # Tela de login
│   ├── register.html        # Tela de registro
│   ├── css/
│   │   └── style.css        # Todos os estilos (já tem seu CSS)
│   ├── js/
│   │   └── script.js        # Toda a lógica JS da interface
│   ├── assets/              # Imagens, ícones, fontes
│   │   ├── images/
│   │   └── fonts/
│   └── components/          # Fragmentos HTML reutilizáveis (header, footer, modais)
│       ├── header.html
│       └── footer.html
│
├── backend/                 # Backend Flask + banco de dados
│   ├── app.py               # Arquivo principal Flask
│   ├── config.py            # Configurações do Flask e DB
│   ├── routes/              # Rotas do Flask
│   │   ├── auth_routes.py   # Login, registro, logout
│   │   ├── main_routes.py   # Rotas da página inicial, features, etc
│   │   └── api_routes.py    # APIs para AJAX / chat / notificações
│   ├── models/              # Modelos do banco de dados
│   │   └── user.py          # Ex.: tabela de usuários
│   ├── static/              # Flask precisa dessa pasta para servir CSS/JS/assets
│   │   ├── css/             # link para frontend/css
│   │   ├── js/              # link para frontend/js
│   │   └── images/          # link para frontend/assets/images
│   └── database/
│       └── txunajob.db      # Banco de dados SQLite
│
└── requirements.txt         # Dependências Python (Flask, Flask-Login, etc)