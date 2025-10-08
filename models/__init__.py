from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime
from flask import current_app

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
            if not current_app or not hasattr(current_app, 'users_collection'):
                return None
            user_data = current_app.users_collection.find_one({'_id': ObjectId(user_id)})
            return User(user_data) if user_data else None
        except:
            return None
    
    @staticmethod
    def find_by_username(username):
        if not current_app or not hasattr(current_app, 'users_collection'):
            return None
        user_data = current_app.users_collection.find_one({'username': username})
        return User(user_data) if user_data else None
    
    @staticmethod
    def find_by_email(email):
        if not current_app or not hasattr(current_app, 'users_collection'):
            return None
        user_data = current_app.users_collection.find_one({'email': email})
        return User(user_data) if user_data else None
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Funções auxiliares para acessar collections
def get_users_collection():
    return current_app.users_collection if current_app and hasattr(current_app, 'users_collection') else None

def get_clients_collection():
    return current_app.clients_collection if current_app and hasattr(current_app, 'clients_collection') else None

def get_professionals_collection():
    return current_app.professionals_collection if current_app and hasattr(current_app, 'professionals_collection') else None

def get_admins_collection():
    return current_app.admins_collection if current_app and hasattr(current_app, 'admins_collection') else None

def get_services_collection():
    return current_app.services_collection if current_app and hasattr(current_app, 'services_collection') else None

def get_chats_collection():
    return current_app.chats_collection if current_app and hasattr(current_app, 'chats_collection') else None

def get_messages_collection():
    return current_app.messages_collection if current_app and hasattr(current_app, 'messages_collection') else None

def get_all_collections():
    """Só funciona dentro do contexto da aplicação"""
    if not current_app or not hasattr(current_app, 'users_collection'):
        return {
            'users': None,
            'clients': None,
            'professionals': None,
            'admins': None,
            'services': None,
            'chats': None,
            'messages': None
        }
    
    return {
        'users': current_app.users_collection,
        'clients': current_app.clients_collection,
        'professionals': current_app.professionals_collection,
        'admins': current_app.admins_collection,
        'services': current_app.services_collection,
        'chats': current_app.chats_collection,
        'messages': current_app.messages_collection
    }