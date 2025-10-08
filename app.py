# app.py - VERSÃO MONGODB SEGURA COM AMBIENTES SEPARADOS
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import secrets
import json
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

# 🔗 CONEXÃO MONGODB SEGURA COM AMBIENTES SEPARADOS
def get_mongo_connection():
    mongodb_password = os.environ.get('MONGODB_PASSWORD')
    flask_env = os.environ.get('FLASK_ENV', 'development')
    
    # 🛡️ DEFINIR DATABASE BASEADO NO AMBIENTE
    if flask_env == 'production':
        database_name = 'txunajob'
    else:
        database_name = 'txunajob_dev'
    
    if not mongodb_password:
        # MongoDB Local (fallback)
        try:
            client = MongoClient('mongodb://localhost:27017/')
            return client
        except Exception:
            return MongoClient('mongodb://localhost:27017/')
    
    # MongoDB Atlas
    try:
        MONGODB_URI = f"mongodb+srv://Egobrain-dev:{mongodb_password}@txunajob.r8q0ldm.mongodb.net/{database_name}?retryWrites=true&w=majority&appName=txunajob"
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        return client
    except Exception:
        # Fallback para MongoDB local
        try:
            client = MongoClient('mongodb://localhost:27017/')
            return client
        except:
            return MongoClient('mongodb://localhost:27017/')

# Inicializar conexão MongoDB
client = get_mongo_connection()
db = client.get_database()

# Coleções (equivalentes às tabelas)
users_collection = db.users
clients_collection = db.clients
professionals_collection = db.professionals
admins_collection = db.admins
services_collection = db.services
chats_collection = db.chats
messages_collection = db.messages

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'

# 🔒 MIDDLEWARE DE SEGURANÇA
@app.before_request
def security_checks():
    """Middleware para verificações de segurança"""
    if request.data and len(request.data) > 10:
        if request.data[0] == 0x16 and request.data[1] == 0x03:
            return '', 400
        if b'\x16\x03' in request.data[:10]:
            return '', 400

# 🔒 USER CLASS PARA FLASK-LOGIN
class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.user_type = user_data['user_type']
        self.phone = user_data.get('phone', '')
        self.location = user_data.get('location', '')
        self.password_hash = user_data['password_hash']
        self.created_at = user_data.get('created_at', datetime.utcnow())

    @staticmethod
    def get(user_id):
        try:
            user_data = users_collection.find_one({'_id': ObjectId(user_id)})
            return User(user_data) if user_data else None
        except:
            return None

    @staticmethod
    def find_by_username(username):
        user_data = users_collection.find_one({'username': username})
        return User(user_data) if user_data else None

    @staticmethod
    def find_by_email(email):
        user_data = users_collection.find_one({'email': email})
        return User(user_data) if user_data else None

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# CONFIGURAR LOADER DE USUÁRIO
@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# 🔒 FUNÇÃO SEGURA PARA CRIAR ADMIN PADRÃO
def create_default_admin():
    """Cria admin padrão de forma segura sem expor credenciais"""
    
    if users_collection.find_one({'user_type': 'admin'}):
        return
    
    admin_username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'txunajob_admin')
    admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@txunajob.local')
    admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'admin_temp_password_123')
    
    if users_collection.find_one({'username': admin_username}):
        return
    
    admin_user = {
        'username': admin_username,
        'email': admin_email,
        'password_hash': generate_password_hash(admin_password),
        'user_type': 'admin',
        'phone': '',
        'location': '',
        'created_at': datetime.utcnow()
    }
    
    try:
        user_id = users_collection.insert_one(admin_user).inserted_id
        
        admin_profile = {
            'user_id': user_id,
            'permissions': json.dumps({'all': True}),
            'created_at': datetime.utcnow()
        }
        
        admins_collection.insert_one(admin_profile)
    except Exception:
        pass

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
        
        if not username or not password:
            flash('Por favor, preencha todos os campos', 'error')
            return render_template('auth/login.html')
        
        user = User.find_by_username(username)
        
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
        
        if not all([username, email, password, full_name]):
            flash('Por favor, preencha todos os campos obrigatórios', 'error')
            return redirect(url_for('register_client'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('register_client'))
        
        if users_collection.find_one({'username': username}):
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_client'))
        
        if users_collection.find_one({'email': email}):
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_client'))
        
        user_data = {
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password),
            'user_type': 'client',
            'phone': phone or '',
            'location': location or '',
            'created_at': datetime.utcnow()
        }
        
        try:
            user_id = users_collection.insert_one(user_data).inserted_id
            
            client_data = {
                'user_id': user_id,
                'full_name': full_name,
                'preferences': ''
            }
            
            clients_collection.insert_one(client_data)
            
            flash('Conta de cliente criada com sucesso!', 'success')
            return redirect(url_for('login'))
        except Exception:
            flash('Erro ao criar conta. Tente novamente.', 'error')
            return redirect(url_for('register_client'))
    
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
        
        if not all([username, email, password, full_name, specialty]):
            flash('Por favor, preencha todos os campos obrigatórios', 'error')
            return redirect(url_for('register_professional'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('register_professional'))
        
        if users_collection.find_one({'username': username}):
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_professional'))
        
        if users_collection.find_one({'email': email}):
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_professional'))
        
        final_specialty = other_specialty if specialty == 'other' else specialty
        
        user_data = {
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password),
            'user_type': 'professional',
            'phone': phone or '',
            'location': location or '',
            'created_at': datetime.utcnow()
        }
        
        try:
            user_id = users_collection.insert_one(user_data).inserted_id
            
            professional_data = {
                'user_id': user_id,
                'full_name': full_name,
                'specialty': final_specialty,
                'experience': int(experience) if experience else 0,
                'description': description or '',
                'hourly_rate': 0.0,
                'is_verified': False
            }
            
            professionals_collection.insert_one(professional_data)
            
            flash('Conta de profissional criada com sucesso!', 'success')
            return redirect(url_for('login'))
        except Exception:
            flash('Erro ao criar conta. Tente novamente.', 'error')
            return redirect(url_for('register_professional'))
    
    return render_template('auth/register_pro.html')

@app.route('/register/admin', methods=['GET', 'POST'])
def register_admin():
    if os.environ.get('FLASK_ENV') == 'production':
        flash('Registro de administrador desativado em produção', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        admin_key = request.form.get('admin_key')
        
        if not all([username, email, password, full_name, admin_key]):
            flash('Por favor, preencha todos os campos', 'error')
            return redirect(url_for('register_admin'))
        
        if len(password) < 8:
            flash('A senha de admin deve ter pelo menos 8 caracteres', 'error')
            return redirect(url_for('register_admin'))
        
        expected_admin_key = os.environ.get('ADMIN_KEY')
        if not expected_admin_key:
            flash('Sistema de administração não configurado', 'error')
            return redirect(url_for('index'))
        
        if admin_key != expected_admin_key:
            flash('Chave de administrador inválida', 'error')
            return redirect(url_for('register_admin'))
        
        if users_collection.find_one({'username': username}):
            flash('Nome de usuário já existe', 'error')
            return redirect(url_for('register_admin'))
        
        if users_collection.find_one({'email': email}):
            flash('Email já está em uso', 'error')
            return redirect(url_for('register_admin'))
        
        user_data = {
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password),
            'user_type': 'admin',
            'phone': '',
            'location': '',
            'created_at': datetime.utcnow()
        }
        
        try:
            user_id = users_collection.insert_one(user_data).inserted_id
            
            admin_data = {
                'user_id': user_id,
                'permissions': json.dumps({'all': True}),
                'created_at': datetime.utcnow()
            }
            
            admins_collection.insert_one(admin_data)
            
            flash('Conta de administrador criada com sucesso!', 'success')
            return redirect(url_for('login'))
        except Exception:
            flash('Erro ao criar conta. Tente novamente.', 'error')
            return redirect(url_for('register_admin'))
    
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
    
    stats = {
        'total_users': users_collection.count_documents({}),
        'total_clients': clients_collection.count_documents({}),
        'total_professionals': professionals_collection.count_documents({}),
        'total_services': services_collection.count_documents({}),
        'pending_verifications': professionals_collection.count_documents({'is_verified': False})
    }
    
    return render_template('dashboards/admin_dashboard.html', stats=stats)

# Serviços
@app.route('/services')
def services():
    return render_template('services/services.html')

@app.route('/services/<service_id>')
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
        'total_users': users_collection.count_documents({}),
        'total_clients': clients_collection.count_documents({}),
        'total_professionals': professionals_collection.count_documents({}),
        'total_services': services_collection.count_documents({}),
        'pending_verifications': professionals_collection.count_documents({'is_verified': False})
    }
    
    return jsonify({'success': True, 'stats': stats})

# Inicializar banco de dados
def init_db():
    create_default_admin()

if __name__ == '__main__':
    init_db()
    app.run(debug=os.environ.get('FLASK_ENV') != 'production', host='0.0.0.0', port=5000)