import os
import logging
from datetime import datetime
from flask import Flask, render_template
from flask_login import LoginManager
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('txunajob')

# Importações dos módulos
from config import configure_app, security_checks
from auth import auth_routes
from professional_api import professional_api_routes
from admin_api import admin_api_routes
from models import User
from auth import create_default_admin
from models import get_all_collections

app = Flask(__name__)

# Variável global para acessar o app
_current_app = None

def get_app():
    return _current_app

# Configuração do Login Manager
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'

@login_manager.user_loader
def load_user(user_id):
    """Carrega usuário para o Flask-Login"""
    try:
        return User.get(user_id)
    except Exception as e:
        logger.error(f"Erro ao carregar usuário: {str(e)[:100]}...")
        return None

def init_app():
    """Inicializa a aplicação com todas as configurações"""
    global _current_app
    
    logger.info("Iniciando configuração da aplicação...")
    
    # Configurar app Flask
    configure_app(app)
    
    # Inicializar extensões
    login_manager.init_app(app)
    
    # Registrar middleware de segurança
    app.before_request(security_checks)
    
    # Registrar blueprints (rotas) COM PREFIXO
    app.register_blueprint(auth_routes, url_prefix='/auth')
    app.register_blueprint(professional_api_routes, url_prefix='/api')
    app.register_blueprint(admin_api_routes, url_prefix='/api/admin')
    
    # Configuração final
    with app.app_context():
        try:
            # Criar admin padrão se necessário
            collections = get_all_collections()
            # Verificação segura de modo manutenção
            if (collections['users'] is not None and 
                collections['clients'] is not None and 
                collections['professionals'] is not None):
                create_default_admin(collections)
                logger.info("Verificação de admin padrão concluída")
            else:
                logger.warning("Modo manutenção - Admin padrão não criado")
        except Exception as e:
            logger.error(f"Erro na inicialização do admin: {str(e)[:100]}...")
    
    _current_app = app
    logger.info("Aplicação inicializada com sucesso")
    return app

# =============================================
# ROTAS PRINCIPAIS
# =============================================

@app.route('/')
def index():
    """Página inicial"""
    return render_template('index.html')

@app.route('/dashboard/client')
def client_dashboard():
    """Dashboard do cliente"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('dashboards/client_dashboard.html')

@app.route('/dashboard/professional')
def professional_dashboard():
    """Dashboard do profissional"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('dashboards/professional_dashboard.html')

@app.route('/dashboard/admin')
def admin_dashboard():
    """Dashboard do administrador"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('dashboards/admin_dashboard.html')

@app.route('/services')
def services():
    """Lista de serviços"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('services/services.html')

@app.route('/services/<service_id>')
def service_detail(service_id):
    """Detalhes de um serviço específico"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('services/service_detail.html', service_id=service_id)

@app.route('/chat')
def chat():
    """Interface de chat"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('chat/chat.html')

@app.route('/profile')
def profile():
    """Página de perfil do usuário"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    return render_template('profile/profile.html')

# Rota para criar admin (apenas desenvolvimento)
@app.route('/create-admin')
def create_admin_route():
    """Rota para criar usuário admin (apenas desenvolvimento)"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    
    # Verificar se não está em produção
    if app.config.get('ENV') == 'production':
        return "Esta funcionalidade não está disponível em produção", 403
    
    try:
        collections = get_all_collections()
        if collections['users']:
            # Verificar se admin já existe
            existing_admin = collections['users'].find_one({'user_type': 'admin'})
            if existing_admin:
                return '''
                <h1>Admin já existe</h1>
                <p>Um usuário admin já está cadastrado no sistema.</p>
                <a href="/dashboard/admin">Ir para Dashboard Admin</a>
                '''
            
            # Criar admin
            from werkzeug.security import generate_password_hash
            from datetime import datetime
            
            admin_user = {
                'username': 'admin',
                'email': 'admin@txunajob.com',
                'user_type': 'admin',
                'password_hash': generate_password_hash('admin123'),
                'created_at': datetime.utcnow(),
                'full_name': 'Administrador do Sistema',
                'phone': '+258841234567',
                'location': 'Maputo'
            }
            
            result = collections['users'].insert_one(admin_user)
            
            # Criar perfil admin se necessário
            admin_profile = {
                'user_id': result.inserted_id,
                'role': 'super_admin',
                'permissions': ['all'],
                'created_at': datetime.utcnow()
            }
            collections['admins'].insert_one(admin_profile)
            
            return '''
            <h1>Admin criado com sucesso!</h1>
            <p><strong>Usuário:</strong> admin</p>
            <p><strong>Senha:</strong> admin123</p>
            <p><strong>Email:</strong> admin@txunajob.com</p>
            <br>
            <a href="/auth/login">Fazer Login</a> | 
            <a href="/dashboard/admin">Ir para Dashboard Admin</a>
            '''
        else:
            return "Erro: Database não disponível", 500
            
    except Exception as e:
        logger.error(f"Erro ao criar admin: {str(e)}")
        return f"Erro ao criar admin: {str(e)}", 500

@app.route('/health')
def health_check():
    """Endpoint de health check para monitoramento"""
    health_status = {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": "connected" if get_app().mongo_client else "disconnected",
        "environment": app.config.get('ENV', 'unknown'),
        "version": "1.0.0"
    }
    
    # Verificar conexão com database se disponível
    if get_app().mongo_client:
        try:
            get_app().mongo_client.admin.command('ping')
            health_status["database"] = "connected"
            
            # Verificar collections principais (sem detalhes sensíveis)
            collections = get_all_collections()
            health_status["collections_available"] = all([
                collections['users'] is not None,
                collections['professionals'] is not None,
                collections['clients'] is not None
            ])
            
        except Exception as e:
            health_status["database"] = "error"
            health_status["status"] = "degraded"
            logger.error(f"Health check database error")
    
    return health_status

# Rota para informações do sistema (admin)
@app.route('/system/info')
def system_info():
    """Informações do sistema (apenas admin)"""
    if not get_app().mongo_client:
        return render_template('maintenance.html'), 503
    
    # Verificar se usuário é admin
    from flask_login import current_user
    if not current_user.is_authenticated or current_user.user_type != 'admin':
        return "Acesso não autorizado", 403
    
    system_info = {
        "python_version": os.sys.version.split()[0],  # Apenas versão principal
        "environment": app.config.get('ENV', 'unknown'),
        "debug": app.config.get('DEBUG', False),
        "database_connected": get_app().mongo_client is not None,
        "startup_time": datetime.utcnow().isoformat() + "Z"
    }
    
    return system_info

@app.errorhandler(404)
def not_found_error(error):
    """Handler para páginas não encontradas"""
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Handler para erros internos do servidor"""
    logger.error(f"Erro interno do servidor")
    return render_template('errors/500.html'), 500

@app.errorhandler(503)
def service_unavailable(error):
    """Handler para serviço indisponível (manutenção)"""
    return render_template('maintenance.html'), 503

# Error handler para acesso não autorizado
@app.errorhandler(403)
def forbidden_error(error):
    """Handler para acesso não autorizado"""
    return render_template('errors/403.html'), 403

if __name__ == '__main__':
    # Inicializar aplicação
    app = init_app()
    
    # Obter configurações do servidor
    host = app.config.get('HOST', '0.0.0.0')
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', False)
    env = app.config.get('ENV', 'unknown')
    
    # Log de inicialização SEGURO (sem informações sensíveis)
    logger.info(f"Iniciando servidor TxunaJob")
    logger.info(f"Ambiente: {env}")
    logger.info(f"Debug: {'ativo' if debug else 'inativo'}")
    logger.info(f"Database: {'conectado' if app.mongo_client else 'desconectado'}")
    
    # Informações adicionais apenas em desenvolvimento
    if debug and env != 'production':
        logger.info("=== MODO DESENVOLVIMENTO ===")
        logger.info("Dashboard Admin disponível em /dashboard/admin")
        logger.info("Health Check disponível em /health")
        logger.info("=== ===================== ===")
    
    # Iniciar servidor
    app.run(
        debug=debug,
        host=host,
        port=port
    )