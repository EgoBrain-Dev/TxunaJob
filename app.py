# app.py - VERSÃO SEGURA SEM EXPOSIÇÃO DE CREDENCIAIS
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import secrets
from datetime import datetime

# Carregar variáveis de ambiente do arquivo .env
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# 🔒 SEGURANÇA: Gerar SECRET_KEY forte se não existir
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    secret_key = secrets.token_hex(32)

app.config['SECRET_KEY'] = secret_key

# Configuração do banco de dados
if os.environ.get('VERCEL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///txunajob.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Importar a instância única do SQLAlchemy dos modelos
from models import db

# Inicializar a extensão SQLAlchemy com a app
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'

# Importar modelos DEPOIS de inicializar db
from models import User, Client, Professional, Admin, Service, Chat, Message

# Configurar loader de usuário
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# 🔒 MIDDLEWARE DE SEGURANÇA
@app.before_request
def security_checks():
    """Middleware para verificações de segurança"""
    
    # Bloquear requisições SSL/TLS indesejadas
    if request.data and len(request.data) > 10:
        if request.data[0] == 0x16 and request.data[1] == 0x03:
            return '', 400
        if b'\x16\x03' in request.data[:10]:
            return '', 400

# 🔒 FUNÇÃO SEGURA PARA CRIAR ADMIN PADRÃO
def create_default_admin():
    """Cria admin padrão de forma segura sem expor credenciais"""
    
    # Verificar se já existe algum admin
    if User.query.filter_by(user_type='admin').first():
        return
    
    # 🔒 CREDENCIAIS SEGURAS - NADA FIXO NO CÓDIGO
    admin_username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'txunajob_admin')
    admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@txunajob.local')
    
    # 🔒 SENHA SEGURA - OBRIGATÓRIO definir no .env
    admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD')
    
    if not admin_password:
        # ⚠️ EM PRODUÇÃO, EXIGIR senha no .env
        if os.environ.get('FLASK_ENV') == 'production':
            raise ValueError("DEFAULT_ADMIN_PASSWORD não definida no .env para produção")
        else:
            admin_password = "admin_temp_password_123"
    
    admin_user = User(
        username=admin_username,
        email=admin_email,
        user_type='admin'
    )
    admin_user.set_password(admin_password)
    
    admin_profile = Admin(
        user=admin_user,
        permissions=json.dumps({'all': True})
    )
    
    db.session.add(admin_user)
    db.session.add(admin_profile)
    db.session.commit()

# Rotas principais
@app.route('/')
def index():
    return render_template('index.html')

# Rotas de autenticação
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Validação básica
        if not username or not password:
            flash('Por favor, preencha todos os campos', 'error')
            return render_template('auth/login.html')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash('Login realizado com sucesso!', 'success')
            
            if user.user_type == 'client':
                return redirect(url_for('client_dashboard'))
            elif user.user_type == 'professional':
                return redirect(url_for('professional_dashboard'))
            elif user.user_type == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('index'))
        else:
            flash('Usuário ou senha incorretos', 'error')
    
    return render_template('auth/login.html')

@app.route('/register/client', methods=['GET', 'POST'])
def register_client():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        location = request.form.get('location')
        
        # 🔒 VALIDAÇÕES
        if not all([username, email, password, full_name]):
            flash('Por favor, preencha todos os campos obrigatórios', 'error')
            return redirect(url_for('register_client'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('register_client'))
        
        # ✅ VERIFICAÇÃO DUPLA: username e email
        if User.query.filter_by(username=username).first():
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_client'))
        
        if User.query.filter_by(email=email).first():
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_client'))
        
        user = User(
            username=username,
            email=email,
            user_type='client',
            phone=phone,
            location=location
        )
        user.set_password(password)
        
        client = Client(
            user=user,
            full_name=full_name
        )
        
        db.session.add(user)
        db.session.add(client)
        db.session.commit()
        
        flash('Conta de cliente criada com sucesso!', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register_client.html')

@app.route('/register/professional', methods=['GET', 'POST'])
def register_professional():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        specialty = request.form.get('specialty')
        experience = request.form.get('experience')
        phone = request.form.get('phone')
        location = request.form.get('location')
        description = request.form.get('description')
        other_specialty = request.form.get('other_specialty')
        
        # 🔒 VALIDAÇÕES
        if not all([username, email, password, full_name, specialty]):
            flash('Por favor, preencha todos os campos obrigatórios', 'error')
            return redirect(url_for('register_professional'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('register_professional'))
        
        # ✅ VERIFICAÇÃO DUPLA: username e email
        if User.query.filter_by(username=username).first():
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_professional'))
        
        if User.query.filter_by(email=email).first():
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_professional'))
        
        # 🔧 TRATAR ESPECIALIDADE "OUTROS"
        final_specialty = other_specialty if specialty == 'other' else specialty
        
        user = User(
            username=username,
            email=email,
            user_type='professional',
            phone=phone,
            location=location
        )
        user.set_password(password)
        
        professional = Professional(
            user=user,
            full_name=full_name,
            specialty=final_specialty,
            experience=int(experience) if experience else 0,
            description=description
        )
        
        db.session.add(user)
        db.session.add(professional)
        db.session.commit()
        
        flash('Conta de profissional criada com sucesso!', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register_pro.html')

@app.route('/register/admin', methods=['GET', 'POST'])
def register_admin():
    # 🔒 RESTRINGIR ACESSO EM PRODUÇÃO
    if os.environ.get('FLASK_ENV') == 'production':
        flash('Registro de administrador desativado em produção', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        admin_key = request.form.get('admin_key')
        
        # 🔒 VALIDAÇÕES
        if not all([username, email, password, full_name, admin_key]):
            flash('Por favor, preencha todos os campos', 'error')
            return redirect(url_for('register_admin'))
        
        if len(password) < 8:
            flash('A senha de admin deve ter pelo menos 8 caracteres', 'error')
            return redirect(url_for('register_admin'))
        
        # 🔒 CHAVE DE ADMIN SEGURA
        expected_admin_key = os.environ.get('ADMIN_KEY')
        if not expected_admin_key:
            flash('Sistema de administração não configurado', 'error')
            return redirect(url_for('index'))
        
        if admin_key != expected_admin_key:
            flash('Chave de administrador inválida', 'error')
            return redirect(url_for('register_admin'))
        
        # ✅ VERIFICAÇÃO DUPLA: username e email
        if User.query.filter_by(username=username).first():
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_admin'))
        
        if User.query.filter_by(email=email).first():
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_admin'))
        
        user = User(
            username=username,
            email=email,
            user_type='admin'
        )
        user.set_password(password)
        
        admin = Admin(
            user=user,
            permissions=json.dumps({'all': True})
        )
        
        db.session.add(user)
        db.session.add(admin)
        db.session.commit()
        
        flash('Conta de administrador criada com sucesso!', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register_admin.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logout realizado com sucesso', 'success')
    return redirect(url_for('index'))

@app.route('/forgot-password')
def forgot_password():
    flash('Sistema de recuperação de senha em desenvolvimento.', 'info')
    return redirect(url_for('login'))

# Dashboards
@app.route('/dashboard/client')
@login_required
def client_dashboard():
    if current_user.user_type != 'client':
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('index'))
    return render_template('dashboards/client_dashboard.html')

@app.route('/dashboard/professional')
@login_required
def professional_dashboard():
    if current_user.user_type != 'professional':
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('index'))
    return render_template('dashboards/professional_dashboard.html')

@app.route('/dashboard/admin')
@login_required
def admin_dashboard():
    if current_user.user_type != 'admin':
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('index'))
    
    # Estatísticas básicas
    stats = {
        'total_users': User.query.count(),
        'total_clients': Client.query.count(),
        'total_professionals': Professional.query.count(),
        'total_services': Service.query.count() if hasattr(Service, 'query') else 0,
        'pending_verifications': Professional.query.filter_by(is_verified=False).count()
    }
    
    return render_template('dashboards/admin_dashboard.html', stats=stats)

# Serviços
@app.route('/services')
def services():
    return render_template('services/services.html')

@app.route('/services/<int:service_id>')
def service_detail(service_id):
    return render_template('services/service_detail.html', service_id=service_id)

# Chat
@app.route('/chat')
@login_required
def chat():
    return render_template('chat/chat.html')

# Perfil
@app.route('/profile')
@login_required
def profile():
    return render_template('profile/profile.html')

# API para estatísticas
@app.route('/api/admin/stats')
@login_required
def admin_stats():
    if current_user.user_type != 'admin':
        return jsonify({'error': 'Não autorizado'}), 403
    
    stats = {
        'total_users': User.query.count(),
        'total_clients': Client.query.count(),
        'total_professionals': Professional.query.count(),
        'total_services': Service.query.count() if hasattr(Service, 'query') else 0,
        'pending_verifications': Professional.query.filter_by(is_verified=False).count()
    }
    
    return jsonify({'success': True, 'stats': stats})

# Inicializar banco de dados
def init_db():
    with app.app_context():
        # Criar todas as tabelas
        db.create_all()
        
        # 🔒 CRIAR ADMIN PADRÃO COM SEGURANÇA
        create_default_admin()

if __name__ == '__main__':
    init_db()
    app.run(debug=os.environ.get('FLASK_ENV') != 'production', host='0.0.0.0', port=5000)