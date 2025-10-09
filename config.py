import os
import secrets
import logging
from flask import Flask, request
from pymongo import MongoClient
from urllib.parse import quote_plus

# Configurar logging
logger = logging.getLogger('txunajob')

def configure_app(app):
    """Configura a aplicação Flask com todas as definições necessárias"""
    
    # Configuração de Segurança
    secret_key = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    app.config['SECRET_KEY'] = secret_key

    # Configuração de Ambiente
    flask_env = os.environ.get('FLASK_ENV', 'production')
    app.config['ENV'] = flask_env
    app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'

    # Configurações de servidor
    app.config['HOST'] = os.environ.get('HOST', '0.0.0.0')
    app.config['PORT'] = int(os.environ.get('PORT', 5000))

    # Configuração MongoDB
    app.mongo_client = get_mongo_connection()
    
    if not app.mongo_client:
        logger.error("Não foi possível estabelecer conexão com MongoDB")
    
    configure_collections(app)
    
    # Registrar middleware de segurança
    app.before_request(security_checks)

def get_mongo_connection():
    """Estabelece conexão com MongoDB em ordem de prioridade"""
    connection_methods = [
        get_mongodb_atlas_connection,  # Prioridade: Atlas
        get_local_mongo_connection     # Fallback: local
    ]
    
    for method in connection_methods:
        try:
            client = method()
            if client:
                logger.info(f"Conectado via {method.__name__}")
                return client
        except Exception as e:
            logger.warning(f"Falha no método {method.__name__}: {str(e)[:100]}...")
            continue
    
    return None

def get_mongodb_atlas_connection():
    """Conecta ao MongoDB Atlas usando variáveis de ambiente"""
    
    # Obter credenciais das variáveis de ambiente
    mongodb_username = os.environ.get('MONGODB_USERNAME', 'Egobrain-dev')
    mongodb_password = os.environ.get('MONGODB_PASSWORD')
    mongodb_cluster = os.environ.get('MONGODB_CLUSTER', 'txunajob.r8q0ldm.mongodb.net')
    
    if not mongodb_password:
        logger.error("MONGODB_PASSWORD não encontrada nas variáveis de ambiente")
        return None
    
    # Codificar credenciais para URL
    username_encoded = quote_plus(mongodb_username)
    password_encoded = quote_plus(mongodb_password)
    
    # Determinar database baseado no ambiente
    flask_env = os.environ.get('FLASK_ENV', 'development')
    database_name = 'txunajob' if flask_env == 'production' else 'txunajob_dev'
    
    # Construir URI do MongoDB Atlas
    uri = f"mongodb+srv://{username_encoded}:{password_encoded}@{mongodb_cluster}/{database_name}?retryWrites=true&w=majority&appName=txunajob"
    
    try:
        client = MongoClient(
            uri, 
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=15000,
            socketTimeoutMS=30000
        )
        
        client.admin.command('ping')
        logger.info(f"Conectado ao MongoDB Atlas - Database: {database_name}")
        return client
        
    except Exception as e:
        logger.error(f"Erro ao conectar com MongoDB Atlas: {str(e)[:100]}...")
        return None

def get_local_mongo_connection():
    """Conexão local como fallback para desenvolvimento"""
    try:
        flask_env = os.environ.get('FLASK_ENV', 'development')
        database_name = 'txunajob_dev'
        
        mongodb_host = os.environ.get('MONGODB_LOCAL_HOST', 'localhost')
        mongodb_port = os.environ.get('MONGODB_LOCAL_PORT', '27017')
        
        uri = f"mongodb://{mongodb_host}:{mongodb_port}/{database_name}"
        
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=15000
        )
        
        client.admin.command('ping')
        logger.info(f"Conectado ao MongoDB local - Database: {database_name}")
        return client
        
    except Exception as e:
        logger.warning(f"Erro na conexão local: {str(e)[:100]}...")
        return None

def configure_collections(app):
    """Configura e verifica todas as collections necessárias"""
    if app.mongo_client:
        flask_env = os.environ.get('FLASK_ENV', 'development')
        db_name = 'txunajob' if flask_env == 'production' else 'txunajob_dev'
        
        db = app.mongo_client[db_name]
        
        collections_to_create = [
            'users', 'clients', 'professionals', 'admins', 
            'services', 'chats', 'messages'
        ]
        
        existing_collections = db.list_collection_names()
        collections_created = 0
        
        for collection_name in collections_to_create:
            if collection_name not in existing_collections:
                db.create_collection(collection_name)
                collections_created += 1
                logger.info(f"Collection criada: {collection_name}")
        
        # Tornar collections acessíveis globalmente
        app.users_collection = db.users
        app.clients_collection = db.clients
        app.professionals_collection = db.professionals
        app.admins_collection = db.admins
        app.services_collection = db.services
        app.chats_collection = db.chats
        app.messages_collection = db.messages
        
        logger.info(f"Database '{db_name}' configurado - Collections: {len(existing_collections)} existentes, {collections_created} criadas")
        
    else:
        logger.error("Modo manutenção - Sem conexão com database")
        app.users_collection = None
        app.clients_collection = None
        app.professionals_collection = None
        app.admins_collection = None
        app.services_collection = None
        app.chats_collection = None
        app.messages_collection = None

def security_checks():
    """Middleware para verificações de segurança"""
    if request.data and len(request.data) > 10:
        client_ip = request.remote_addr
        
        if request.data[0] == 0x16 and request.data[1] == 0x03:
            logger.warning(f"Tentativa de handshake TLS detectada - IP: {client_ip}")
            return '', 400
        
        if b'\x16\x03' in request.data[:10]:
            logger.warning(f"Padrão TLS suspeito detectado - IP: {client_ip}")
            return '', 400
        
        suspicious_patterns = [
            b'GET https://',
            b'CONNECT ',
            b'SSH-'
        ]
        
        for pattern in suspicious_patterns:
            if pattern in request.data[:100]:
                logger.warning(f"Padrão suspeito detectado - IP: {client_ip}")
                return '', 400
    
    return None