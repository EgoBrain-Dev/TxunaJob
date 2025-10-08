from flask import Flask, render_template, request
from flask_login import LoginManager
import os

# Importações dos novos módulos
from config import configure_app, security_checks
from auth import auth_routes
from professional_api import professional_api_routes
from models import User

app = Flask(__name__)
configure_app(app)

# Configuração do Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# Middleware de segurança
app.before_request(security_checks)

# Registrar rotas
app.register_blueprint(auth_routes)
app.register_blueprint(professional_api_routes)

# Rotas principais
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard/client')
def client_dashboard():
    return render_template('dashboards/client_dashboard.html')

@app.route('/dashboard/professional')
def professional_dashboard():
    return render_template('dashboards/professional_dashboard.html')

@app.route('/dashboard/admin')
def admin_dashboard():
    return render_template('dashboards/admin_dashboard.html')

@app.route('/services')
def services():
    return render_template('services/services.html')

@app.route('/services/<service_id>')
def service_detail(service_id):
    return render_template('services/service_detail.html', service_id=service_id)

@app.route('/chat')
def chat():
    return render_template('chat/chat.html')

@app.route('/profile')
def profile():
    return render_template('profile/profile.html')

@app.route('/health')
def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

def init_app():
    """Inicializa a aplicação"""
    with app.app_context():
        # Criar admin padrão se necessário
        from auth import create_default_admin
        from models import get_all_collections
        
        collections = get_all_collections()
        create_default_admin(collections)
    
    return app

if __name__ == '__main__':
    app = init_app()
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)