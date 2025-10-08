import os
import secrets
from flask import Flask, request
from pymongo import MongoClient

def configure_app(app):
    # Configuração de Segurança
    secret_key = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    app.config['SECRET_KEY'] = secret_key

    # Configuração de Ambiente
    flask_env = os.environ.get('FLASK_ENV', 'production')
    app.config['ENV'] = flask_env
    app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'

    # Configuração MongoDB
    app.config['MONGODB_URI'] = get_mongodb_uri()
    app.mongo_client = get_mongo_connection()
    configure_collections(app)

def get_mongodb_uri():
    mongodb_password = os.environ.get('MONGODB_PASSWORD')
    if not mongodb_password:
        return None
    
    database_name = 'txunajob' if os.environ.get('FLASK_ENV', 'production') == 'production' else 'txunajob_dev'
    return f"mongodb+srv://Egobrain-dev:{mongodb_password}@txunajob.r8q0ldm.mongodb.net/{database_name}?retryWrites=true&w=majority&appName=txunajob"

def get_mongo_connection():
    try:
        uri = get_mongodb_uri()
        if not uri:
            return None
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        return client
    except Exception:
        return None

def configure_collections(app):
    if app.mongo_client:
        db_name = 'txunajob' if app.config['ENV'] == 'production' else 'txunajob_dev'
        db = app.mongo_client[db_name]
        
        # Tornar collections acessíveis globalmente
        app.users_collection = db.users
        app.clients_collection = db.clients
        app.professionals_collection = db.professionals
        app.admins_collection = db.admins
        app.services_collection = db.services
        app.chats_collection = db.chats
        app.messages_collection = db.messages
    else:
        # Modo manutenção
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
        if request.data[0] == 0x16 and request.data[1] == 0x03:
            return '', 400
        if b'\x16\x03' in request.data[:10]:
            return '', 400