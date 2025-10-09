from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from models import get_all_collections

# ✅ CORREÇÃO: Remover url_prefix daqui
admin_api_routes = Blueprint('admin_api', __name__)

def is_admin():
    """Verificar se o usuário atual é administrador"""
    return current_user.is_authenticated and current_user.user_type == 'admin'

@admin_api_routes.route('/stats')
@login_required
def api_admin_stats():
    """Obter estatísticas gerais da plataforma"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        # Total de usuários
        total_users = collections['users'].count_documents({}) if collections['users'] else 0
        
        # Total de profissionais
        total_professionals = collections['users'].count_documents({'user_type': 'professional'}) if collections['users'] else 0
        
        # Total de clientes
        total_clients = collections['users'].count_documents({'user_type': 'client'}) if collections['users'] else 0
        
        # Total de serviços
        total_services = collections['services'].count_documents({}) if collections['services'] else 0
        
        # Serviços ativos (não concluídos ou cancelados)
        active_services = collections['services'].count_documents({
            'status': {'$nin': ['completed', 'cancelled']}
        }) if collections['services'] else 0
        
        # Serviços concluídos
        completed_services = collections['services'].count_documents({
            'status': 'completed'
        }) if collections['services'] else 0
        
        # Verificações pendentes (profissionais não verificados)
        pending_verifications = collections['professionals'].count_documents({
            'is_verified': False
        }) if collections['professionals'] else 0
        
        # Total de reports (implementação básica)
        total_reports = 0  # Será implementado quando tiver collection de reports
        
        # Receita total (soma de todos os serviços concluídos)
        total_revenue = 0
        if collections['services']:
            completed_services_list = collections['services'].find({'status': 'completed'})
            for service in completed_services_list:
                total_revenue += service.get('price', 0)
        
        # Novos usuários este mês
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_month = collections['users'].count_documents({
            'created_at': {'$gte': current_month}
        }) if collections['users'] else 0
        
        # Serviços este mês
        services_month = collections['services'].count_documents({
            'created_at': {'$gte': current_month}
        }) if collections['services'] else 0
        
        stats = {
            'totalUsers': total_users,
            'totalProfessionals': total_professionals,
            'totalClients': total_clients,
            'totalServices': total_services,
            'activeServices': active_services,
            'completedServices': completed_services,
            'pendingVerifications': pending_verifications,
            'totalReports': total_reports,
            'totalRevenue': total_revenue,
            'newUsersMonth': new_users_month,
            'servicesMonth': services_month
        }
        
        return jsonify({'success': True, 'stats': stats})
        
    except Exception as e:
        print(f"Erro em api_admin_stats: {e}")
        return jsonify({'error': 'Erro ao carregar estatísticas'}), 500

@admin_api_routes.route('/users')
@login_required
def api_admin_users():
    """Obter lista de usuários para gestão"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        users_list = []
        if collections['users']:
            # Buscar últimos 20 usuários
            users_data = list(collections['users'].find().sort('created_at', -1).limit(20))
            
            for user in users_data:
                user_info = {
                    'id': str(user['_id']),
                    'username': user.get('username', ''),
                    'email': user.get('email', ''),
                    'user_type': user.get('user_type', 'client'),
                    'status': 'active',  # Status padrão
                    'created_at': user.get('created_at', datetime.utcnow()).isoformat(),
                    'full_name': user.get('full_name', '')
                }
                
                # Para profissionais, verificar status de verificação
                if user['user_type'] == 'professional' and collections['professionals']:
                    professional_data = collections['professionals'].find_one({'user_id': user['_id']})
                    if professional_data:
                        user_info['full_name'] = professional_data.get('full_name', user_info['full_name'])
                        if not professional_data.get('is_verified', False):
                            user_info['status'] = 'pending'
                
                users_list.append(user_info)
        
        return jsonify(users_list)
        
    except Exception as e:
        print(f"Erro em api_admin_users: {e}")
        return jsonify({'error': 'Erro ao carregar usuários'}), 500

@admin_api_routes.route('/services')
@login_required
def api_admin_services():
    """Obter lista de serviços para gestão"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        services_list = []
        if collections['services']:
            # Buscar últimos 15 serviços
            services_data = list(collections['services'].find().sort('created_at', -1).limit(15))
            
            for service in services_data:
                # Buscar nome do profissional
                professional_name = 'N/A'
                if collections['professionals'] and 'professional_id' in service:
                    professional_data = collections['professionals'].find_one({
                        'user_id': service['professional_id']
                    })
                    if professional_data:
                        professional_name = professional_data.get('full_name', 'Profissional')
                
                # Buscar nome do cliente
                client_name = 'N/A'
                if collections['clients'] and 'client_id' in service:
                    client_data = collections['clients'].find_one({
                        'user_id': service['client_id']
                    })
                    if client_data:
                        client_name = client_data.get('full_name', 'Cliente')
                
                services_list.append({
                    'id': str(service['_id']),
                    'title': service.get('title', 'Serviço'),
                    'professional_name': professional_name,
                    'client_name': client_name,
                    'status': service.get('status', 'pending'),
                    'price': service.get('price', 0),
                    'created_at': service.get('created_at', datetime.utcnow()).isoformat(),
                    'description': service.get('description', '')
                })
        
        return jsonify(services_list)
        
    except Exception as e:
        print(f"Erro em api_admin_services: {e}")
        return jsonify({'error': 'Erro ao carregar serviços'}), 500

@admin_api_routes.route('/activities')
@login_required
def api_admin_activities():
    """Obter atividades recentes da plataforma"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        activities_list = []
        
        # Atividades de novos usuários (últimas 24 horas)
        if collections['users']:
            last_24h = datetime.utcnow() - timedelta(hours=24)
            new_users = list(collections['users'].find({
                'created_at': {'$gte': last_24h}
            }).sort('created_at', -1).limit(10))
            
            for user in new_users:
                user_type = user.get('user_type', 'client')
                activities_list.append({
                    'type': 'user_registered',
                    'title': 'Novo usuário registrado',
                    'description': f"{user.get('username', 'Usuário')} ({user_type.capitalize()})",
                    'timestamp': user.get('created_at', datetime.utcnow()),
                    'user_id': str(user['_id'])
                })
        
        # Atividades de serviços concluídos (últimas 24 horas)
        if collections['services']:
            completed_services = list(collections['services'].find({
                'status': 'completed',
                'completed_at': {'$gte': datetime.utcnow() - timedelta(hours=24)}
            }).sort('completed_at', -1).limit(10))
            
            for service in completed_services:
                activities_list.append({
                    'type': 'service_completed',
                    'title': 'Serviço concluído',
                    'description': f"{service.get('title', 'Serviço')} - {service.get('price', 0)} MT",
                    'timestamp': service.get('completed_at', datetime.utcnow()),
                    'service_id': str(service['_id'])
                })
        
        # Ordenar todas as atividades por timestamp
        activities_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Limitar a 10 atividades mais recentes
        recent_activities = activities_list[:10]
        
        # Formatar timestamps para ISO
        for activity in recent_activities:
            if hasattr(activity['timestamp'], 'isoformat'):
                activity['timestamp'] = activity['timestamp'].isoformat()
            else:
                activity['timestamp'] = str(activity['timestamp'])
        
        return jsonify(recent_activities)
        
    except Exception as e:
        print(f"Erro em api_admin_activities: {e}")
        # Retornar atividades de exemplo em caso de erro
        return jsonify(get_fallback_activities())

def get_fallback_activities():
    """Atividades de fallback em caso de erro"""
    now = datetime.utcnow()
    return [
        {
            'type': 'user_registered',
            'title': 'Novo usuário registrado',
            'description': 'Carlos Muchanga (Profissional)',
            'timestamp': (now - timedelta(minutes=30)).isoformat()
        },
        {
            'type': 'service_completed',
            'title': 'Serviço concluído',
            'description': 'Instalação Elétrica - 1.500 MT',
            'timestamp': (now - timedelta(hours=1)).isoformat()
        },
        {
            'type': 'user_registered',
            'title': 'Novo usuário registrado',
            'description': 'Ana Silva (Cliente)',
            'timestamp': (now - timedelta(hours=2)).isoformat()
        }
    ]

@admin_api_routes.route('/system-status')
@login_required
def api_admin_system_status():
    """Obter status do sistema"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    try:
        # Verificar conectividade com as collections
        collections = get_all_collections()
        
        system_status = {
            'web_server': 'online',
            'database': 'online' if collections['users'] is not None else 'offline',
            'api': 'online',
            'chat': 'online' if collections['chats'] is not None else 'offline'
        }
        
        return jsonify({'success': True, 'status': system_status})
        
    except Exception as e:
        print(f"Erro em api_admin_system_status: {e}")
        return jsonify({'error': 'Erro ao verificar status do sistema'}), 500

# =============================================================================
# CONFIGURAÇÕES DO SISTEMA - DADOS REAIS
# =============================================================================

@admin_api_routes.route('/settings')
@login_required
def api_admin_settings():
    """Obter configurações do sistema"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    try:
        collections = get_all_collections()
        
        # Buscar configurações do MongoDB
        settings_data = {}
        if collections.get('settings'):
            settings_data = collections['settings'].find_one({}) or {}
        
        # Valores padrão
        default_settings = {
            'siteName': 'TxunaJob',
            'siteDescription': 'Plataforma de serviços profissionais em Moçambique',
            'adminEmail': 'admin@txunajob.com',
            'comissionRate': 15,
            'maxServices': 10,
            'autoApprove': False,
            'passwordMinLength': 8,
            'maxLoginAttempts': 5,
            'sessionTimeout': 120,
            'emailNotifications': True,
            'pushNotifications': True,
            'smsNotifications': False,
            'maintenanceMode': False,
            'maintenanceMessage': 'Sistema em manutenção. Volte em breve!'
        }
        
        # Mesclar configurações (DB tem prioridade)
        final_settings = {**default_settings, **settings_data}
        
        return jsonify({'success': True, 'settings': final_settings})
        
    except Exception as e:
        print(f"Erro em api_admin_settings: {e}")
        return jsonify({'error': 'Erro ao carregar configurações'}), 500

@admin_api_routes.route('/settings/save', methods=['POST'])
@login_required
def api_save_settings():
    """Salvar configurações do sistema"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    try:
        settings_data = request.get_json()
        if not settings_data:
            return jsonify({'error': 'Dados de configuração inválidos'}), 400
        
        collections = get_all_collections()
        
        # Salvar no MongoDB
        if collections.get('settings'):
            result = collections['settings'].update_one(
                {},
                {'$set': settings_data},
                upsert=True
            )
            
            if result.acknowledged:
                return jsonify({'success': True, 'message': 'Configurações salvas com sucesso'})
            else:
                return jsonify({'error': 'Erro ao salvar no banco de dados'}), 500
        else:
            return jsonify({'error': 'Collection de configurações não disponível'}), 500
        
    except Exception as e:
        print(f"Erro em api_save_settings: {e}")
        return jsonify({'error': 'Erro ao salvar configurações'}), 500

# =============================================================================
# ROTAS DE AÇÃO - GESTÃO DE USUÁRIOS
# =============================================================================

@admin_api_routes.route('/users/<user_id>/verify', methods=['POST'])
@login_required
def api_verify_user(user_id):
    """Verificar um profissional"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        # Verificar se o usuário é um profissional
        user_data = collections['users'].find_one({'_id': ObjectId(user_id)})
        if not user_data or user_data.get('user_type') != 'professional':
            return jsonify({'error': 'Usuário não é um profissional'}), 400
        
        # Atualizar status de verificação
        result = collections['professionals'].update_one(
            {'user_id': ObjectId(user_id)},
            {
                '$set': {
                    'is_verified': True,
                    'verified_at': datetime.utcnow(),
                    'verified_by': str(current_user.id),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Profissional verificado com sucesso'})
        else:
            return jsonify({'error': 'Profissional não encontrado'}), 404
            
    except Exception as e:
        print(f"Erro em api_verify_user: {e}")
        return jsonify({'error': 'Erro ao verificar profissional'}), 500

@admin_api_routes.route('/users/<user_id>/reject', methods=['POST'])
@login_required
def api_reject_user(user_id):
    """Rejeitar verificação de profissional"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        result = collections['professionals'].update_one(
            {'user_id': ObjectId(user_id)},
            {
                '$set': {
                    'verification_status': 'rejected',
                    'rejected_at': datetime.utcnow(),
                    'rejected_by': str(current_user.id),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Verificação rejeitada'})
        else:
            return jsonify({'error': 'Profissional não encontrado'}), 404
            
    except Exception as e:
        print(f"Erro em api_reject_user: {e}")
        return jsonify({'error': 'Erro ao rejeitar verificação'}), 500

@admin_api_routes.route('/users/<user_id>/suspend', methods=['POST'])
@login_required
def api_suspend_user(user_id):
    """Suspender um usuário"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        result = collections['users'].update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'status': 'suspended',
                    'suspended_at': datetime.utcnow(),
                    'suspended_by': str(current_user.id),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Usuário suspenso'})
        else:
            return jsonify({'error': 'Usuário não encontrado'}), 404
            
    except Exception as e:
        print(f"Erro em api_suspend_user: {e}")
        return jsonify({'error': 'Erro ao suspender usuário'}), 500

@admin_api_routes.route('/users/<user_id>/activate', methods=['POST'])
@login_required
def api_activate_user(user_id):
    """Ativar um usuário suspenso"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        result = collections['users'].update_one(
            {'_id': ObjectId(user_id), 'status': 'suspended'},
            {
                '$set': {
                    'status': 'active',
                    'activated_at': datetime.utcnow(),
                    'activated_by': str(current_user.id),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 1:
            return jsonify({'success': True, 'message': 'Usuário ativado com sucesso'})
        else:
            return jsonify({'error': 'Usuário não encontrado ou não está suspenso'}), 404
            
    except Exception as e:
        print(f"Erro em api_activate_user: {e}")
        return jsonify({'error': 'Erro ao ativar usuário'}), 500

# =============================================================================
# ROTAS DE RELATÓRIOS
# =============================================================================

@admin_api_routes.route('/reports/users-growth')
@login_required
def api_users_growth_report():
    """Relatório de crescimento de usuários"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        # Últimos 6 meses
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        
        pipeline = [
            {
                '$match': {
                    'created_at': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$created_at'},
                        'month': {'$month': '$created_at'}
                    },
                    'count': {'$sum': 1}
                }
            },
            {
                '$sort': {'_id.year': 1, '_id.month': 1}
            }
        ]
        
        if collections['users']:
            result = list(collections['users'].aggregate(pipeline))
            
            # Formatar resultado
            growth_data = []
            for item in result:
                growth_data.append({
                    'period': f"{item['_id']['month']}/{item['_id']['year']}",
                    'users': item['count']
                })
            
            return jsonify({'success': True, 'data': growth_data})
        else:
            return jsonify({'success': True, 'data': []})
            
    except Exception as e:
        print(f"Erro em api_users_growth_report: {e}")
        return jsonify({'error': 'Erro ao gerar relatório'}), 500

@admin_api_routes.route('/reports/services-analytics')
@login_required
def api_services_analytics_report():
    """Relatório analítico de serviços"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        analytics = {
            'totalServices': 0,
            'completedServices': 0,
            'pendingServices': 0,
            'cancelledServices': 0,
            'totalRevenue': 0,
            'averageServiceValue': 0
        }
        
        if collections['services']:
            # Contagem por status
            analytics['totalServices'] = collections['services'].count_documents({})
            analytics['completedServices'] = collections['services'].count_documents({'status': 'completed'})
            analytics['pendingServices'] = collections['services'].count_documents({'status': 'pending'})
            analytics['cancelledServices'] = collections['services'].count_documents({'status': 'cancelled'})
            
            # Receita total e valor médio
            completed_services = list(collections['services'].find({'status': 'completed'}))
            total_revenue = sum(service.get('price', 0) for service in completed_services)
            
            analytics['totalRevenue'] = total_revenue
            if completed_services:
                analytics['averageServiceValue'] = total_revenue / len(completed_services)
        
        return jsonify({'success': True, 'analytics': analytics})
        
    except Exception as e:
        print(f"Erro em api_services_analytics_report: {e}")
        return jsonify({'error': 'Erro ao gerar relatório'}), 500

@admin_api_routes.route('/reports/financial')
@login_required
def api_financial_report():
    """Relatório financeiro"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        # Receita dos últimos 6 meses
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        
        pipeline = [
            {
                '$match': {
                    'status': 'completed',
                    'completed_at': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$completed_at'},
                        'month': {'$month': '$completed_at'}
                    },
                    'revenue': {'$sum': '$price'},
                    'services_count': {'$sum': 1}
                }
            },
            {
                '$sort': {'_id.year': 1, '_id.month': 1}
            }
        ]
        
        financial_data = []
        if collections['services']:
            result = list(collections['services'].aggregate(pipeline))
            
            for item in result:
                financial_data.append({
                    'period': f"{item['_id']['month']}/{item['_id']['year']}",
                    'revenue': item['revenue'],
                    'services_count': item['services_count']
                })
        
        return jsonify({'success': True, 'data': financial_data})
        
    except Exception as e:
        print(f"Erro em api_financial_report: {e}")
        return jsonify({'error': 'Erro ao gerar relatório financeiro'}), 500

@admin_api_routes.route('/users/<user_id>')
@login_required
def api_get_user_details(user_id):
    """Obter detalhes completos de um usuário"""
    if not is_admin():
        return jsonify({'error': 'Acesso não autorizado'}), 403
    
    collections = get_all_collections()
    
    try:
        user_data = collections['users'].find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user_details = {
            'id': str(user_data['_id']),
            'username': user_data.get('username', ''),
            'email': user_data.get('email', ''),
            'user_type': user_data.get('user_type', 'client'),
            'full_name': user_data.get('full_name', ''),
            'phone': user_data.get('phone', ''),
            'location': user_data.get('location', ''),
            'created_at': user_data.get('created_at', datetime.utcnow()).isoformat(),
            'status': user_data.get('status', 'active')
        }
        
        # Adicionar informações específicas do tipo de usuário
        if user_data['user_type'] == 'professional' and collections['professionals']:
            professional_data = collections['professionals'].find_one({'user_id': ObjectId(user_id)})
            if professional_data:
                user_details.update({
                    'is_verified': professional_data.get('is_verified', False),
                    'verification_status': professional_data.get('verification_status', 'pending'),
                    'skills': professional_data.get('skills', []),
                    'experience': professional_data.get('experience', ''),
                    'hourly_rate': professional_data.get('hourly_rate', 0)
                })
        
        elif user_data['user_type'] == 'client' and collections['clients']:
            client_data = collections['clients'].find_one({'user_id': ObjectId(user_id)})
            if client_data:
                user_details.update({
                    'preferences': client_data.get('preferences', {})
                })
        
        return jsonify({'success': True, 'user': user_details})
        
    except Exception as e:
        print(f"Erro em api_get_user_details: {e}")
        return jsonify({'error': 'Erro ao carregar detalhes do usuário'}), 500