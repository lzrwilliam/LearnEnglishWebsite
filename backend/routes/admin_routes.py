from flask import Blueprint, request, jsonify
from models import User, Exercise, db, RoleRequest, Notification
from auth import token_required, role_required


admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin') #va dauga la apeluri /api/admin




@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required(["admin"])
def get_users():

    #if not request.args.get("admin_id"):
    #    return {"message": "Access denied: Admin ID required.", "status": "fail"}, 403

    users = User.query.all()

    return {"users": [user.to_dict() for user in users]}, 200

@admin_bp.route('/ban_user', methods=['POST'])
@token_required
@role_required(["admin"])
def ban_user():

    data = request.json
    user_id = data.get("user_id")
    reason = data.get("reason")

    user = User.query.filter_by(id=user_id).first()

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    user.is_banned = True
    user.ban_reason = reason
    db.session.commit()

    return {"message": f"User {user.username} has been banned.", "status": "success"}, 200

@admin_bp.route('/kick_user', methods=['DELETE'])
@token_required
@role_required(["admin"])
def kick_user():

    user_id = request.args.get("user_id")

    user = User.query.filter_by(id=user_id).first()

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    db.session.delete(user)
    db.session.commit()

    return {"message": f"User {user.username} has been removed.", "status": "success"}, 200



@token_required
@role_required(["admin"])
@admin_bp.route('/unban_user', methods=['POST'])
def unban_user():

    data = request.json
    user_id = data.get("user_id")

    user = User.query.filter_by(id=user_id).first()

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    user.is_banned = False
    user.ban_reason = None

    db.session.commit()

    return {"message": f"User {user.username} has been unbanned.", "status": "success"}, 200

@admin_bp.route('/role_requests', methods=['GET'])
@token_required
@role_required(['admin'])
def get_role_requests():
    role_requests = RoleRequest.query.filter_by(status="pending").all()
    if not role_requests:
        return jsonify({"status": "success", "requests": [], "message": "No role requests found"}), 200
    return jsonify({"status": "success", "requests": [r.to_dict() for r in role_requests]}), 200



@admin_bp.route('/role_requests/<int:request_id>', methods=['PUT'])
@token_required
def handle_role_request(request_id):
    data = request.json
    action = data.get("action")  # "approve" sau "reject"

    role_request = RoleRequest.query.get(request_id)
    if not role_request:
        return jsonify({"message": "Cererea nu există.", "status": "fail"}), 404

    if action not in ["approve", "reject"]:
        return jsonify({"message": "Acțiune invalidă.", "status": "fail"}), 400

    role_request.status = "approved" if action == "approve" else "rejected"
    if action == "approve":
        user = User.query.get(role_request.user_id)
        user.role = role_request.role_requested

    db.session.commit()

    notification_message = (
        f"Cererea ta pentru rolul {role_request.role_requested} a fost aprobata."
        if action == "approve" else
        f"Cererea ta pentru rolul {role_request.role_requested} a fost respinsa."
    )
    new_notification = Notification(
        user_id=role_request.user_id,
        message=notification_message
    )
    db.session.add(new_notification)
    db.session.commit()

    return jsonify({"message": f"Cererea a fost {action}-ată.", "status": "success"}), 200

