txunajob/
├── app.py                 # Main reduzido
├── requirements.txt      
├── vercel.json           
├── wsgi.py               
├── config.py             # ✅ NOVO: Configurações
├── auth.py               # ✅ NOVO: Rotas de autenticação
├── professional_api.py   # ✅ NOVO: APIs do dashboard
├── models/
│   └── __init__py       # ✅ MODIFICADO: Para MongoDB
├── static/
│   ├── css/
│   │   ├── styles.css    
│   │   ├── auth.css      
│   │   ├── dashboard.css 
│   │   ├── services.css  
│   │   ├── profile.css   
│   │   └── chat.css      
│   └── js/
│       ├── script.js     
│       ├── auth.js       
│       └── chat.js       
└── templates/
    ├── base.html         
    ├── index.html        
    ├── auth/             
    │   ├── login.html
    │   ├── register_client.html
    │   └── register_pro.html
    ├── dashboards/       
    │   ├── client_dashboard.html
    │   └── professional_dashboard.html
    ├── services/         
    │   ├── services.html
    │   └── service_detail.html
    ├── chat/             
    │   └── chat.html
    └── profile/          
        └── profile.html