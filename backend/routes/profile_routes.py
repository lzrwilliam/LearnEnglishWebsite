from flask import Blueprint, request, jsonify
from models import db, User,RoleRequest
from auth import token_required


profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile') 


@profile_bp.route('/update_difficulty', methods=['PUT'])
@token_required
def update_difficulty():
    user_id = request.user_id
    data = request.json
    new_difficulty = data.get("difficulty")

    if new_difficulty not in ["easy", "medium", "hard"]:
        return jsonify({"message": "Dificultate invalidă.", "status": "fail"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Userul nu există.", "status": "fail"}), 404

    user.difficulty = new_difficulty.lower()
    db.session.commit()

    return jsonify({"message": "Difficulty has been updated!.", "status": "success", "difficulty": user.difficulty}), 200


@profile_bp.route('/reset_progress', methods=['DELETE'])
@token_required
def reset_progress():
    user_id = request.user_id
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "Userul nu există.", "status": "fail"}), 404

   
    user.xp = 0

    from models import UserQuestionProgress
    UserQuestionProgress.query.filter_by(user_id=user_id).delete()

    db.session.commit()
    return jsonify({"message": "Progress reseted!.", "status": "success"}), 200


@profile_bp.route('/delete_account', methods=['DELETE'])
@token_required
def delete_account():
    user_id = request.user_id

    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "Userul nu există.", "status": "fail"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Account deleted!.", "status": "success"}), 200


@profile_bp.route('/request_role', methods=['POST'])
@token_required
def request_role():
    user_id = request.user_id
    data = request.json
    role_requested = data.get("role")

    if role_requested not in ["admin", "reviewer"]:
        return jsonify({"message": "Rol invalid.", "status": "fail"}), 400

    existing_request = RoleRequest.query.filter_by(user_id=user_id, status="pending").first()
    if existing_request:
        return jsonify({"message": "Aveți deja o cerere în așteptare.", "status": "fail"}), 400

    new_request = RoleRequest(user_id=user_id, role_requested=role_requested)
    db.session.add(new_request)
    db.session.commit()

    return jsonify({"message": "Request sent.", "status": "success"}), 201

@profile_bp.route('/role_request_status', methods=['GET'])
@token_required
def check_role_request_status():
    user_id = request.user_id
    existing_request = RoleRequest.query.filter_by(user_id=user_id, status="pending").first()

    if existing_request:
        return jsonify({
            "has_request": True,
            "role_requested": existing_request.role_requested
        }), 200
    else:
        return jsonify({"has_request": False}), 200

