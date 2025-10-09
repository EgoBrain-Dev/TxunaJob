# =============================================
# WSGI ENTRY POINT PARA VERCEL
# =============================================

from app import init_app  # ✅ importa a função que cria o app Flask

# Inicializa a aplicação Flask configurada
app = init_app()

# ✅ Exporta o app para o Vercel
# O Vercel procura automaticamente um objeto chamado "app"
