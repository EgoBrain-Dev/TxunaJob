import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import json
import os
from datetime import datetime
from models import User, get_all_collections

# Configurar logging
logger = logging.getLogger('txunajob')

auth_routes = Blueprint('auth', __name__)

def create_default_admin(collections):
    """Cria admin padrão se não existir"""
    # CORREÇÃO: Verificação segura de modo manutenção
    if (collections['users'] is None or 
        collections['clients'] is None or 
        collections['professionals'] is None):
        logger.warning("Modo manutenção - Admin padrão não criado")
        return
    
    # Verificar se já existe admin
    try:
        existing_admin = collections['users'].find_one({'user_type': 'admin'})
        if existing_admin:
            logger.info("Admin já existe no sistema")
            return
    except Exception as e:
        logger.error(f"Erro ao verificar admin existente: {str(e)[:100]}...")
        return
    
    admin_username = os.environ.get('DEFAULT_ADMIN_USERNAME')
    admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL')
    admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD')
    
    if not all([admin_username, admin_email, admin_password]):
        logger.warning("Credenciais de admin padrão incompletas")
        return
    
    # Verificar se o usuário já existe
    try:
        if collections['users'].find_one({'username': admin_username}):
            logger.info(f"Usuário {admin_username} já existe")
            return
    except Exception as e:
        logger.error(f"Erro ao verificar usuário existente: {str(e)[:100]}...")
        return
    
    user_data = {
        'username': admin_username,
        'email': admin_email,
        'password_hash': generate_password_hash(admin_password),
        'user_type': 'admin',
        'phone': '',
        'location': '',
        'created_at': datetime.utcnow()
    }
    
    try:
        user_id = collections['users'].insert_one(user_data).inserted_id
        admin_data = {
            'user_id': user_id,
            'permissions': json.dumps({'all': True}),
            'created_at': datetime.utcnow()
        }
        if collections['admins'] is not None:
            collections['admins'].insert_one(admin_data)
        logger.info("Admin padrão criado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao criar admin padrão: {str(e)[:100]}...")

@auth_routes.route('/login', methods=['GET', 'POST'])
def login():
    collections = get_all_collections()
    
    # CORREÇÃO: Verificação segura de modo manutenção
    if (collections['users'] is None or 
        collections['clients'] is None or 
        collections['professionals'] is None):
        flash('Sistema em manutenção. Tente novamente em alguns minutos.', 'error')
        return render_template('auth/login.html')
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            flash('Por favor, preencha todos os campos', 'error')
            return render_template('auth/login.html')
        
        user = User.find_by_username(username)
        if user and user.check_password(password):
            login_user(user)
            logger.info(f"Login bem-sucedido: {username} ({user.user_type})")
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
            logger.warning(f"Tentativa de login falhou para usuário: {username}")
            flash('Usuário ou senha incorretos', 'error')
    
    return render_template('auth/login.html')

@auth_routes.route('/register/client', methods=['GET', 'POST'])
def register_client():
    collections = get_all_collections()
    
    # CORREÇÃO: Verificação segura de modo manutenção
    if (collections['users'] is None or 
        collections['clients'] is None or 
        collections['professionals'] is None):
        flash('Sistema em manutenção. Tente novamente em alguns minutos.', 'error')
        return render_template('auth/register_client.html')
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        location = request.form.get('location')

        if not all([username, email, password, full_name]):
            flash('Por favor, preencha todos os campos obrigatórios', 'error')
            return redirect(url_for('auth.register_client'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('auth.register_client'))
        
        # CORREÇÃO: Verificações seguras
        try:
            if collections['users'].find_one({'username': username}):
                flash('Nome de usuário já existe', 'error')
                return redirect(url_for('auth.register_client'))
            
            if collections['users'].find_one({'email': email}):
                flash('Email já está em uso', 'error')
                return redirect(url_for('auth.register_client'))
        except Exception as e:
            logger.error(f"Erro ao verificar usuário existente: {str(e)[:100]}...")
            flash('Erro no sistema. Tente novamente.', 'error')
            return redirect(url_for('auth.register_client'))
        
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
            user_id = collections['users'].insert_one(user_data).inserted_id
            client_data = {
                'user_id': user_id,
                'full_name': full_name,
                'preferences': ''
            }
            if collections['clients'] is not None:
                collections['clients'].insert_one(client_data)
            logger.info(f"Novo cliente registrado: {username}")
            flash('Conta de cliente criada com sucesso!', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            logger.error(f"Erro ao criar cliente: {str(e)[:100]}...")
            flash('Erro ao criar conta. Tente novamente.', 'error')
    
    return render_template('auth/register_client.html')

@auth_routes.route('/register/professional', methods=['GET', 'POST'])
def register_professional():
    collections = get_all_collections()
    
    # CORREÇÃO: Verificação segura de modo manutenção
    if (collections['users'] is None or 
        collections['clients'] is None or 
        collections['professionals'] is None):
        flash('Sistema em manutenção. Tente novamente em alguns minutos.', 'error')
        return render_template('auth/register_pro.html')
    
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
            return redirect(url_for('auth.register_professional'))
        
        if len(password) < 6:
            flash('A senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(url_for('auth.register_professional'))
        
        # CORREÇÃO: Verificações seguras
        try:
            if collections['users'].find_one({'username': username}):
                flash('Nome de usuário já existe', 'error')
                return redirect(url_for('auth.register_professional'))
            
            if collections['users'].find_one({'email': email}):
                flash('Email já está em uso', 'error')
                return redirect(url_for('auth.register_professional'))
        except Exception as e:
            logger.error(f"Erro ao verificar usuário existente: {str(e)[:100]}...")
            flash('Erro no sistema. Tente novamente.', 'error')
            return redirect(url_for('auth.register_professional'))
        
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
            user_id = collections['users'].insert_one(user_data).inserted_id
            professional_data = {
                'user_id': user_id,
                'full_name': full_name,
                'specialty': final_specialty,
                'experience': int(experience) if experience else 0,
                'description': description or '',
                'hourly_rate': 0.0,
                'is_verified': False
            }
            if collections['professionals'] is not None:
                collections['professionals'].insert_one(professional_data)
            logger.info(f"Novo profissional registrado: {username} - {final_specialty}")
            flash('Conta de profissional criada com sucesso!', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            logger.error(f"Erro ao criar profissional: {str(e)[:100]}...")
            flash('Erro ao criar conta. Tente novamente.', 'error')
    
    return render_template('auth/register_pro.html')

@auth_routes.route('/register/admin', methods=['GET', 'POST'])
def register_admin():
    collections = get_all_collections()
    
    # CORREÇÃO: Verificação segura de modo manutenção
    if (collections['users'] is None or 
        collections['clients'] is None or 
        collections['professionals'] is None):
        flash('Sistema em manutenção. Tente novamente em alguns minutos.', 'error')
        return render_template('auth/register_admin.html')
    
    # Verificar se já existe algum admin no sistema
    try:
        admin_exists = collections['users'].find_one({'user_type': 'admin'})
    except Exception as e:
        logger.error(f"Erro ao verificar admins: {str(e)[:100]}...")
        flash('Erro no sistema. Tente novamente.', 'error')
        return render_template('auth/register_admin.html')
    
    # Lógica de acesso
    flask_env = os.environ.get('FLASK_ENV', 'production')
    if flask_env == 'production':
        if admin_exists:
            if not current_user.is_authenticated or current_user.user_type != 'admin':
                logger.warning(f"Acesso não autorizado ao registro de admin: {current_user}")
                flash('Acesso restrito a administradores', 'error')
                return redirect(url_for('auth.login'))

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        admin_key = request.form.get('admin_key')
        
        # Validação da chave apenas se for o PRIMEIRO admin
        if not admin_exists:
            if not admin_key:
                flash('Chave de administrador é obrigatória para criar o primeiro admin', 'error')
                return redirect(url_for('auth.register_admin'))
            
            expected_admin_key = os.environ.get('ADMIN_REGISTRATION_KEY')
            if not expected_admin_key:
                logger.error("ADMIN_REGISTRATION_KEY não configurada")
                flash('Sistema de administração não configurado', 'error')
                return redirect(url_for('index'))
            
            if admin_key != expected_admin_key:
                logger.warning("Tentativa com chave de admin inválida")
                flash('Chave de administrador inválida', 'error')
                return redirect(url_for('auth.register_admin'))
        
        if not all([username, email, password, full_name]):
            flash('Por favor, preencha todos os campos', 'error')
            return redirect(url_for('auth.register_admin'))
        
        if len(password) < 8:
            flash('A senha de admin deve ter pelo menos 8 caracteres', 'error')
            return redirect(url_for('auth.register_admin'))
        
        # CORREÇÃO: Verificações seguras
        try:
            if collections['users'].find_one({'username': username}):
                flash('Nome de usuário já existe', 'error')
                return redirect(url_for('auth.register_admin'))
            
            if collections['users'].find_one({'email': email}):
                flash('Email já está em uso', 'error')
                return redirect(url_for('auth.register_admin'))
        except Exception as e:
            logger.error(f"Erro ao verificar usuário: {str(e)[:100]}...")
            flash('Erro no sistema. Tente novamente.', 'error')
            return redirect(url_for('auth.register_admin'))
        
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
            user_id = collections['users'].insert_one(user_data).inserted_id
            admin_data = {
                'user_id': user_id,
                'permissions': json.dumps({'all': True}),
                'created_at': datetime.utcnow()
            }
            if collections['admins'] is not None:
                collections['admins'].insert_one(admin_data)
            logger.info(f"Novo admin criado: {username}")
            flash('Conta de administrador criada com sucesso!', 'success')
            
            if admin_exists and current_user.is_authenticated and current_user.user_type == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('auth.login'))
                
        except Exception as e:
            logger.error(f"Erro ao criar admin: {str(e)[:100]}...")
            flash('Erro ao criar conta. Tente novamente.', 'error')
    
    return render_template('auth/register_admin.html', is_first_admin=not admin_exists)

@auth_routes.route('/logout')
@login_required
def logout():
    """Logout do usuário"""
    username = current_user.username if current_user.is_authenticated else "Unknown"
    logout_user()
    logger.info(f"Logout realizado: {username}")
    flash('Logout realizado com sucesso', 'success')
    return redirect(url_for('index'))

@auth_routes.route('/forgot-password')
def forgot_password():
    """Página de recuperação de senha"""
    logger.info("Acesso à recuperação de senha")
    flash('Sistema de recuperação de senha em desenvolvimento.', 'info')
    return redirect(url_for('auth.login'))