from flask import Blueprint, request, jsonify
from models import User, Exercise, db
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


@admin_bp.route('/update_role', methods=['POST'])
@token_required
@role_required(["admin"])
def update_role():
    data = request.json
    user_id = data.get("user_id")
    new_role = data.get("new_role")

    if not user_id or not new_role:
        return {"message": "User ID și rolul nou sunt necesare.", "status": "fail"}, 400

    valid_roles = ["user", "reviewer", "admin"]
    if new_role.lower() not in valid_roles:
        return {"message": "Rol invalid.", "status": "fail"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"message": "Userul nu a fost găsit.", "status": "fail"}, 404

    user.role = new_role.lower()
    db.session.commit()

    return {"message": f"Rolul utilizatorului {user.username} a fost actualizat la {new_role}.", "status": "success"}, 200
