from flask import Blueprint, jsonify, request
from models import db, Exercise, User,ReviewerRequest, Notification
from auth import token_required, role_required

reviewer_bp = Blueprint('reviewer', __name__)






@reviewer_bp.route('/api/reviewer_requests/<int:request_id>', methods=['POST'])
def process_reviewer_request(request_id):
    data = request.json
    action = data.get('action')  # approve/reject
    reviewer_id = data.get('reviewer_id')

    reviewer = User.query.get(reviewer_id)
    if not reviewer:
        return {"message": "Reviewer-ul nu a fost găsit.", "status": "fail"}, 404

    request_obj = ReviewerRequest.query.get(request_id)
    if not request_obj:
        return {"message": "Solicitarea nu a fost găsită.", "status": "fail"}, 404

    if action not in ["approve", "reject"]:
        return {"message": "Acțiune invalidă.", "status": "fail"}, 400

    request_obj.status = "approved" if action == "approve" else "rejected"
    request_obj.reviewer_id = reviewer_id
    db.session.commit()

    notification_message = (
        f"Solicitarea ta pentru exercițiul {request_obj.exercise_id} a fost "
        + ("acceptată" if action == "approve" else "respinsă.")
    )

    new_notification = Notification(user_id=request_obj.user_id, sender_id=reviewer_id, message=notification_message)
    db.session.add(new_notification)
    db.session.commit()

    return {"message": f"Solicitarea a fost {action}.", "status": "success"}, 200



@reviewer_bp.route('/api/reviewer/exercises', methods=['GET'])

def get_reviewer_exercises():

    exercises = Exercise.query.all()

    return {"exercises": [exercise.to_dict() for exercise in exercises]}, 200

@reviewer_bp.route('/api/reviewer/exercises/<int:exercise_id>', methods=['GET'])
def get_exercise_details(exercise_id):
    exercise = Exercise.query.get(exercise_id)
    if not exercise:
        return {"message": "Exercițiul nu a fost găsit.", "status": "fail"}, 404

    return {"exercise": exercise.to_dict(), "status": "success"}, 200



@reviewer_bp.route('/api/reviewer/exercises/<int:exercise_id>', methods=['PUT'])
def edit_exercise(exercise_id):

    data = request.json

    try:
        exercise = Exercise.query.get(exercise_id)

        if not exercise:
            return {"message": "Exercițiul nu a fost găsit.", "status": "fail"}, 404

        exercise.question = data.get("question", exercise.question)
        exercise.options = data.get("options", exercise.options)
        exercise.correct_option = data.get("correct_option", exercise.correct_option)
        exercise.correct_answer = data.get("correct_answer", exercise.correct_answer)
        exercise.type = data.get("type", exercise.type)
        exercise.difficulty = data.get("difficulty", exercise.difficulty)

        db.session.commit()

        return {"message": "Exercițiul a fost actualizat cu succes.", "status": "success"}, 200
    
    except Exception as e:
        return {"message": "Eroare la actualizarea exercițiului.", "status": "fail", "error": str(e)}, 500

@reviewer_bp.route('/api/reviewer/exercises', methods=['POST'])
def add_exercise():

    data = request.json

    try:
        new_exercise = Exercise(
            question=data["question"],
            options=data.get("options"),                # Poate fi None
            correct_option=data.get("correct_option"),  # Poate fi None
            correct_answer=data.get("correct_answer"),  # Poate fi None
            type=data["type"],
            difficulty=data["difficulty"]
        )

        db.session.add(new_exercise)
        db.session.commit()

        return {"message": "Exercițiul a fost adăugat cu succes.", "status": "success", "exercise": new_exercise.to_dict()}, 201
    
    except Exception as e:
        return {"message": "Eroare la adăugarea exercițiului.", "status": "fail", "error": str(e)}, 500



@reviewer_bp.route('/api/reviewer_requests', methods=['GET'])
def get_reviewer_requests():
    requests = ReviewerRequest.query.filter_by(status="pending").all()
    return {
        "requests": [
            {
                "id": req.id,
                "user_id": req.user_id,
                "exercise_id": req.exercise_id,
                "message": req.message,
                "created_at": req.created_at
            }
            for req in requests
        ]
    }, 200


@reviewer_bp.route('/api/reviewer/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    try:
       
        print(f"Attempting to delete exercise with ID: {exercise_id}")

       
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            print(f"Exercise with ID {exercise_id} not found.")  # Debugging
            return {"message": "Exercițiul nu a fost găsit.", "status": "fail"}, 404

      
        db.session.delete(exercise)
        db.session.commit()

        print(f"Exercise with ID {exercise_id} deleted successfully.")  # Debugging
        return {"message": "Exercițiul a fost șters cu succes.", "status": "success"}, 200
    
    except Exception as e:
      
        print(f"Error deleting exercise with ID {exercise_id}: {e}")
        return {"message": "Eroare la ștergerea exercițiului.", "status": "fail", "error": str(e)}, 500