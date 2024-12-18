from flask import Blueprint, jsonify, request
from models import db, Exercise, User,ReviewerRequest, Notification
from auth import token_required, role_required

user_bp = Blueprint('user', __name__)



@user_bp.route('/api/notifications/unread_count/<int:user_id>', methods=['GET'])
def get_unread_notifications_count(user_id):
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return {"unread_count": unread_count}, 200


#marcare notificare citita
@user_bp.route('/api/notifications/<int:notification_id>', methods=['PUT'])
def mark_notification_as_read(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return {"message": "Notificarea nu a fost găsită.", "status": "fail"}, 404

    notification.is_read = True
    db.session.commit()

    return {"message": "Notificarea a fost marcată ca citită.", "status": "success"}, 200


@user_bp.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return {"message": "Notificarea nu a fost găsită.", "status": "fail"}, 404

    db.session.delete(notification)
    db.session.commit()

    return {"message": "Notificarea a fost ștearsă.", "status": "success"}, 200

@user_bp.route('/api/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    pagination = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    notifications = pagination.items

    return {
        "notifications": [notif.to_dict() for notif in notifications],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages
    }, 200
    



@user_bp.route('/api/reviewer_requests', methods=['POST'])
def create_reviewer_request():
    data = request.json
    user_id = data.get('user_id')
    exercise_id = data.get('exercise_id')
    message = data.get('message')

    if not user_id or not exercise_id or not message:
        return {"message": "Toate câmpurile sunt necesare!", "status": "fail"}, 400

   
    existing_request = ReviewerRequest.query.filter_by(user_id=user_id, exercise_id=exercise_id, status="pending").first()
    if existing_request:
        return {"message": "Există deja o solicitare activă pentru acest exercițiu.", "status": "fail"}, 400

    new_request = ReviewerRequest(user_id=user_id, exercise_id=exercise_id, message=message)
    db.session.add(new_request)
    db.session.commit()

    return {"message": "Solicitarea a fost trimisă cu succes.", "status": "success"}, 201