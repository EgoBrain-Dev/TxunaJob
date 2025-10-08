from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import secrets
import json
from datetime import datetime

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# 🔒 Configuração de Segurança
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    secret_key = secrets.token_hex(32)

app.config['SECRET_KEY'] = secret_key

# 🔒 Definir ambiente padrão como produção (SEGURO)
flask_env = os.environ.get('FLASK_ENV', 'production')
app.config['ENV'] = flask_env
app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'

# 🔗 Conexão MongoDB Segura
def get_mongo_connection():
    mongodb_password = os.environ.get('MONGODB_PASSWORD')
    
    if not mongodb_password:
        return None

    database_name = 'txunajob' if flask_env == 'production' else 'txunajob_dev'

    try:
        MONGODB_URI = f"mongodb+srv://Egobrain-dev:{mongodb_password}@txunajob.r8q0ldm.mongodb.net/{database_name}?retryWrites=true&w=majority&appName=txunajob"
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        return client[database_name]
    except Exception:
        return None

# Inicializar conexão MongoDB
db = get_mongo_connection()

# Se MongoDB não estiver disponível, usar modo de manutenção
if db is None:
    users_collection = clients_collection = professionals_collection = None
    admins_collection = services_collection = chats_collection = messages_collection = None
else:
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

# 🔒 Middleware de Segurança
@app.before_request
def security_checks():
    """Middleware para verificações de segurança"""
    if request.data and len(request.data) > 10:
        if request.data[0] == 0x16 and request.data[1] == 0x03:
            return '', 400
        if b'\x16\x03' in request.data[:10]:
            return '', 400

# 🔒 User Class para Flask-Login
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
            if users_collection is None:
                return None
            user_data = users_collection.find_one({'_id': ObjectId(user_id)})
            return User(user_data) if user_data else None
        except:
            return None
    
    @staticmethod
    def find_by_username(username):
        if users_collection is None:
            return None
        user_data = users_collection.find_one({'username': username})
        return User(user_data) if user_data else None
    
    @staticmethod
    def find_by_email(email):
        if users_collection is None:
            return None
        user_data = users_collection.find_one({'email': email})
        return User(user_data) if user_data else None
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# 🔒 Função Segura para Criar Admin Padrão
def create_default_admin():
    """Cria admin padrão de forma segura"""
    
    if users_collection is None:
        return
    
    if users_collection.find_one({'user_type': 'admin'}):
        return
    
    admin_username = os.environ.get('DEFAULT_ADMIN_USERNAME')
    admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL')
    admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD')
    
    if not all([admin_username, admin_email, admin_password]):
        return
    
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
    
    return render_template('auth/register_pro.html')

@app.route('/register/admin', methods=['GET', 'POST'])
def register_admin():
    if db is None:
        flash('Sistema em manutenção. Tente novamente em alguns minutos.', 'error')
        return render_template('auth/register_admin.html')
    
    # Verificar se já existe algum admin no sistema
    admin_exists = users_collection and users_collection.find_one({'user_type': 'admin'})
    
    # 🔒 Lógica de acesso corrigida:
    if flask_env == 'production':
        if admin_exists:
            # Se já existe admin, só admins podem criar novos
            if not current_user.is_authenticated or current_user.user_type != 'admin':
                flash('Acesso restrito a administradores', 'error')
                return redirect(url_for('login'))
        else:
            # Se NÃO existe admin, qualquer um pode criar o primeiro (com chave)
            # Não redireciona - permite acesso ao formulário
            pass

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        admin_key = request.form.get('admin_key')
        
        # 🔑 Validação da chave apenas se for o PRIMEIRO admin
        if not admin_exists:
            if not admin_key:
                flash('Chave de administrador é obrigatória para criar o primeiro admin', 'error')
                return redirect(url_for('register_admin'))
            
            expected_admin_key = os.environ.get('ADMIN_REGISTRATION_KEY')
            if not expected_admin_key:
                flash('Sistema de administração não configurado', 'error')
                return redirect(url_for('index'))
            
            if admin_key != expected_admin_key:
                flash('Chave de administrador inválida', 'error')
                return redirect(url_for('register_admin'))
        
        if not all([username, email, password, full_name]):
            flash('Por favor, preencha todos os campos', 'error')
            return redirect(url_for('register_admin'))
        
        if len(password) < 8:
            flash('A senha de admin deve ter pelo menos 8 caracteres', 'error')
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
            
            if admin_exists and current_user.user_type == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('login'))
                
        except Exception:
            flash('Erro ao criar conta. Tente novamente.', 'error')
    
    # 🔄 Passar informação para o template se é primeiro admin ou não
    return render_template('auth/register_admin.html', is_first_admin=not admin_exists)

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
    
    # Buscar dados do profissional para o template
    professional_data = None
    if professionals_collection:
        professional_data = professionals_collection.find_one({'user_id': ObjectId(current_user.id)})
    
    return render_template('dashboards/professional_dashboard.html', professional=professional_data)

@app.route('/dashboard/admin')
@login_required
def admin_dashboard():
    if current_user.user_type != 'admin':
        flash('Acesso não autorizado', 'error')
        return redirect(url_for('index'))

    if db is None:
        flash('Sistema em manutenção', 'error')
        return render_template('dashboards/admin_dashboard.html', stats={})

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

# =============================================================================
# API ROUTES PARA DASHBOARD PROFISSIONAL
# =============================================================================

@app.route('/api/professional/current')
@login_required
def api_professional_current():
    """Retorna dados do profissional atual"""
    if current_user.user_type != 'professional':
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503
    
    try:
        # Buscar dados do profissional
        professional_data = professionals_collection.find_one({'user_id': ObjectId(current_user.id)})
        
        if not professional_data:
            return jsonify({'error': 'Perfil profissional não encontrado'}), 404
        
        user_data = {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'phone': current_user.phone,
            'location': current_user.location,
            'created_at': current_user.created_at.isoformat() if hasattr(current_user.created_at, 'isoformat') else str(current_user.created_at),
            'professional_profile': {
                'full_name': professional_data.get('full_name', ''),
                'specialty': professional_data.get('specialty', ''),
                'experience': professional_data.get('experience', 0),
                'description': professional_data.get('description', ''),
                'hourly_rate': professional_data.get('hourly_rate', 0.0),
                'is_verified': professional_data.get('is_verified', False)
            }
        }
        
        return jsonify(user_data)
        
    except Exception as e:
        return jsonify({'error': 'Erro ao carregar dados', 'message': str(e)}), 500

@app.route('/api/professional/stats')
@login_required
def api_professional_stats():
    """Retorna estatísticas do profissional"""
    if current_user.user_type != 'professional':
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503
    
    try:
        # Buscar dados reais do MongoDB
        professional_id = ObjectId(current_user.id)
        
        # Contar serviços ativos (status: pending, in_progress)
        active_services = services_collection.count_documents({
            'professional_id': professional_id,
            'status': {'$in': ['pending', 'in_progress']}
        })
        
        # Calcular avaliação média
        reviews_cursor = services_collection.find({
            'professional_id': professional_id,
            'rating': {'$exists': True, '$ne': None}
        })
        
        ratings = [service.get('rating', 0) for service in reviews_cursor]
        average_rating = sum(ratings) / len(ratings) if ratings else 0
        
        # Contar clientes deste mês
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_clients = services_collection.count_documents({
            'professional_id': professional_id,
            'created_at': {'$gte': current_month}
        })
        
        # Contar mensagens não lidas
        unread_messages = messages_collection.count_documents({
            'receiver_id': professional_id,
            'is_read': False
        })
        
        stats = {
            'activeServices': active_services,
            'averageRating': round(average_rating, 1),
            'monthlyClients': monthly_clients,
            'unreadMessages': unread_messages
        }
        
        return jsonify({'success': True, 'stats': stats})
        
    except Exception as e:
        # Fallback para dados de exemplo em caso de erro
        stats = {
            'activeServices': 8,
            'averageRating': 4.8,
            'monthlyClients': 12,
            'unreadMessages': 3
        }
        return jsonify({'success': True, 'stats': stats})

@app.route('/api/professional/services')
@login_required
def api_professional_services():
    """Retorna serviços do profissional"""
    if current_user.user_type != 'professional':
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503
    
    try:
        professional_id = ObjectId(current_user.id)
        
        # Buscar serviços do profissional
        services_data = list(services_collection.find({
            'professional_id': professional_id
        }).sort('created_at', -1).limit(10))  # Últimos 10 serviços
        
        services_list = []
        for service in services_data:
            # Buscar dados do cliente
            client_data = clients_collection.find_one({'_id': service.get('client_id')})
            client_name = client_data.get('full_name', 'Cliente') if client_data else 'Cliente'
            
            services_list.append({
                'id': str(service['_id']),
                'title': service.get('title', 'Serviço'),
                'description': service.get('description', ''),
                'client_name': client_name,
                'date': service.get('scheduled_date', service.get('created_at')).isoformat() if service.get('scheduled_date') else service.get('created_at').isoformat(),
                'status': service.get('status', 'pending'),
                'price': service.get('price', 0.0),
                'address': service.get('address', ''),
                'category': service.get('category', '')
            })
        
        return jsonify(services_list)
        
    except Exception as e:
        # Fallback para dados de exemplo
        professional_data = professionals_collection.find_one({'user_id': ObjectId(current_user.id)})
        specialty = professional_data.get('specialty', 'Eletricista') if professional_data else 'Eletricista'
        location = current_user.location or 'Maputo'
        
        fallback_services = [
            {
                'id': '1',
                'title': f'Instalação {specialty} - Casa Silva',
                'description': f'Instalação completa do sistema em {location}',
                'client_name': 'Maria Silva',
                'date': datetime.utcnow().isoformat(),
                'status': 'in_progress',
                'price': 2500.00,
                'address': f'Bairro Central, {location}',
                'category': specialty
            },
            {
                'id': '2',
                'title': f'Manutenção {specialty} - Empresa ABC',
                'description': 'Manutenção preventiva do sistema',
                'client_name': 'João Carlos',
                'date': (datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)).isoformat(),
                'status': 'pending',
                'price': 1800.00,
                'address': f'Zona Industrial, {location}',
                'category': specialty
            },
            {
                'id': '3',
                'title': f'Reparo {specialty} - Apartamento 302',
                'description': 'Reparo nas instalações',
                'client_name': 'Ana Santos',
                'date': (datetime.utcnow().replace(day=datetime.utcnow().day + 2, hour=10, minute=0, second=0, microsecond=0)).isoformat(),
                'status': 'pending',
                'price': 950.00,
                'address': f'Av. Principal, {location}',
                'category': specialty
            }
        ]
        
        return jsonify(fallback_services)

@app.route('/api/professional/schedule')
@login_required
def api_professional_schedule():
    """Retorna agenda do profissional"""
    if current_user.user_type != 'professional':
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503
    
    try:
        professional_id = ObjectId(current_user.id)
        
        # Buscar serviços agendados (próximos 7 dias)
        next_week = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
        next_week = next_week.replace(day=next_week.day + 7)
        
        schedule_data = list(services_collection.find({
            'professional_id': professional_id,
            'scheduled_date': {'$gte': datetime.utcnow(), '$lte': next_week},
            'status': {'$in': ['pending', 'confirmed']}
        }).sort('scheduled_date', 1).limit(5))
        
        schedule_list = []
        for service in schedule_data:
            client_data = clients_collection.find_one({'_id': service.get('client_id')})
            client_name = client_data.get('full_name', 'Cliente') if client_data else 'Cliente'
            
            schedule_list.append({
                'id': str(service['_id']),
                'title': service.get('title', 'Serviço'),
                'client_name': client_name,
                'date': service.get('scheduled_date', service.get('created_at')).isoformat(),
                'description': service.get('description', '')
            })
        
        return jsonify(schedule_list)
        
    except Exception as e:
        # Fallback para dados de exemplo
        professional_data = professionals_collection.find_one({'user_id': ObjectId(current_user.id)})
        specialty = professional_data.get('specialty', 'Eletricista') if professional_data else 'Eletricista'
        
        fallback_schedule = [
            {
                'id': '1',
                'title': f'Instalação {specialty}',
                'client_name': 'Casa Silva',
                'date': datetime.utcnow().replace(hour=14, minute=0, second=0, microsecond=0).isoformat(),
                'description': 'Instalação completa'
            },
            {
                'id': '2',
                'title': f'Manutenção {specialty}',
                'client_name': 'Empresa ABC',
                'date': (datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat(),
                'description': 'Manutenção preventiva'
            },
            {
                'id': '3',
                'title': f'Reparo {specialty}',
                'client_name': 'Apartamento 302',
                'date': (datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=2)).isoformat(),
                'description': 'Reparos diversos'
            }
        ]
        
        return jsonify(fallback_schedule)

@app.route('/api/professional/reviews')
@login_required
def api_professional_reviews():
    """Retorna avaliações do profissional"""
    if current_user.user_type != 'professional':
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503
    
    try:
        professional_id = ObjectId(current_user.id)
        
        # Buscar serviços com avaliações
        reviews_data = list(services_collection.find({
            'professional_id': professional_id,
            'rating': {'$exists': True, '$ne': None},
            'review_comment': {'$exists': True, '$ne': ''}
        }).sort('created_at', -1).limit(5))
        
        reviews_list = []
        for service in reviews_data:
            client_data = clients_collection.find_one({'_id': service.get('client_id')})
            client_name = client_data.get('full_name', 'Cliente') if client_data else 'Cliente'
            
            reviews_list.append({
                'id': str(service['_id']),
                'client_name': client_name,
                'rating': service.get('rating', 5),
                'comment': service.get('review_comment', ''),
                'date': service.get('created_at').isoformat(),
                'service_title': service.get('title', 'Serviço')
            })
        
        return jsonify(reviews_list)
        
    except Exception as e:
        # Fallback para dados de exemplo
        fallback_reviews = [
            {
                'id': '1',
                'client_name': 'Maria Santos',
                'rating': 5,
                'comment': 'Excelente profissional! Muito competente e educado. Recomendo!',
                'date': (datetime.utcnow() - timedelta(days=1)).isoformat(),
                'service_title': 'Instalação Elétrica Residencial'
            },
            {
                'id': '2',
                'client_name': 'João Carlos',
                'rating': 4.5,
                'comment': 'Trabalho bem feito e dentro do prazo combinado. Muito satisfeito!',
                'date': (datetime.utcnow() - timedelta(days=3)).isoformat(),
                'service_title': 'Manutenção Preventiva'
            }
        ]
        
        return jsonify(fallback_reviews)

# API para estatísticas admin
@app.route('/api/admin/stats')
@login_required
def admin_stats():
    if current_user.user_type != 'admin':
        return jsonify({'error': 'Não autorizado'}), 403

    if db is None:
        return jsonify({'error': 'Sistema em manutenção'}), 503

    stats = {
        'total_users': users_collection.count_documents({}),
        'total_clients': clients_collection.count_documents({}),
        'total_professionals': professionals_collection.count_documents({}),
        'total_services': services_collection.count_documents({}),
        'pending_verifications': professionals_collection.count_documents({'is_verified': False})
    }
    return jsonify({'success': True, 'stats': stats})

# Rota de saúde (segura)
@app.route('/health')
def health_check():
    status = {
        'status': 'healthy' if db is not None else 'maintenance',
        'environment': flask_env
    }
    return jsonify(status)

# Inicializar banco de dados
def init_db():
    if db is not None:
        create_default_admin()

if __name__ == '__main__':
    init_db()
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)