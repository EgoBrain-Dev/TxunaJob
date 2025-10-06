# wsgi.py - CORRIGIDO
from app import app, init_db

# Inicializar banco de dados para produção
with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run()