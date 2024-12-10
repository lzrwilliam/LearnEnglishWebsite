import json
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate

from sqlalchemy.sql import text
from sqlalchemy import and_
from sqlalchemy.sql.expression import func

app = Flask(__name__)
CORS(app)

with open('config.json', 'r') as f:
    config = json.load(f)

app.config['SQLALCHEMY_DATABASE_URI'] = config['database']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

class User(db.Model):

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="User")
    is_banned = db.Column(db.Boolean, default=False)
    ban_reason = db.Column(db.String(255), nullable=True)
    xp = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.String(20), nullable=False, default="easy")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_banned": self.is_banned,
            "ban_reason": self.ban_reason,
            "xp": self.xp,
            "difficulty": self.difficulty,
        }

    def __repr__(self):
        return f"<User {self.username} (Role: {self.role})>"
    
@app.route('/api/admin/unban_user', methods=['POST'])
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

@app.route('/api/login', methods=['POST'])
def login():

    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()

    if not user:
        return {"message": "Username or password incorrect.", "status": "fail"}, 401

    if user.is_banned:
        return {"message": f"You are banned: {user.ban_reason}", "status": "banned"}, 403

    return {
        "message": "Login successful.",
        "status": "success",
        "user": user.to_dict()
    }, 200

@app.route('/api/admin/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):

    try:
        exercise = Exercise.query.get(exercise_id)

        if not exercise:
            return {"message": "Exercițiul nu a fost găsit.", "status": "fail"}, 404

        db.session.delete(exercise)
        db.session.commit()

        return {"message": "Exercițiul a fost șters cu succes.", "status": "success"}, 200
    
    except Exception as e:
        return {"message": "Eroare la ștergerea exercițiului.", "status": "fail", "error": str(e)}, 500

@app.route('/api/admin/exercises/<int:exercise_id>', methods=['PUT'])
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

@app.route('/api/admin/exercises', methods=['POST'])
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

@app.route('/api/register', methods=['POST'])
def register():

    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'User')
    difficulty = data.get('difficulty', 'easy')

    if not username or not email or not password or not role or not difficulty:
        return {"message": "Toate câmpurile sunt necesare!", "status": "fail"}, 400

    if User.query.filter_by(username=username).first():
        return {"message": "Username-ul există deja!", "status": "fail"}, 400

    if User.query.filter_by(email=email).first():
        return {"message": "Email-ul există deja!", "status": "fail"}, 400

    new_user = User(username=username, email=email, password=password, role=role, difficulty=difficulty)
    db.session.add(new_user)
    db.session.commit()

    return {
        "message": "Înregistrare reușită!",
        "status": "success",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "difficulty": new_user.difficulty,
        }
    }, 201

@app.route('/api/admin/users', methods=['GET'])
def get_users():

    #if not request.args.get("admin_id"):
    #    return {"message": "Access denied: Admin ID required.", "status": "fail"}, 403

    users = User.query.all()

    return {"users": [user.to_dict() for user in users]}, 200

@app.route('/api/admin/ban_user', methods=['POST'])
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

@app.route('/api/admin/kick_user', methods=['DELETE'])
def kick_user():

    user_id = request.args.get("user_id")

    user = User.query.filter_by(id=user_id).first()

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    db.session.delete(user)
    db.session.commit()

    return {"message": f"User {user.username} has been removed.", "status": "success"}, 200

class Exercise(db.Model):

    __tablename__ = 'exercises'
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(200), nullable=False)
    translation = db.Column(db.String(200), nullable=True)
    options = db.Column(db.JSON, nullable=True)
    correct_option = db.Column(db.Integer, nullable=True)
    correct_answer = db.Column(db.String(200), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.String(50), nullable=False, default="easy")
    random_order = db.Column(db.Float, default=func.random())

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "translation": self.translation,
            "options": self.options,
            "correct_option": self.correct_option,
            "correct_answer": self.correct_answer,
            "type": self.type,
            "difficulty": self.difficulty
        }

class ReviewerRequest(db.Model):

    __tablename__ = 'reviewer_requests'
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, nullable=False)
    request_type = db.Column(db.String(20), nullable=False)
    exercise_data = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

class UserQuestionProgress(db.Model):

    __tablename__ = 'user_question_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('exercises.id'), nullable=False)
    answered_correctly = db.Column(db.Boolean, default=False)

@app.route("/api/reviewer/requests", methods=["GET"])
def get_reviewer_requests():

    reviewer_id = request.args.get("reviewer_id")

    if not reviewer_id:
        return jsonify({"status": "error", "message": "Reviewer ID is required."}), 400

    try:
        pending_requests = ReviewerRequest.query.filter_by(reviewer_id=reviewer_id, status="pending").all()

        formatted_requests = [
            {
                "id": req.id,
                "reviewer_id": req.reviewer_id,
                "request_type": req.request_type,
                "exercise_data": req.exercise_data,
                "status": req.status,
                "created_at": req.created_at,
            }
            for req in pending_requests
        ]

        return jsonify({"status": "success", "requests": formatted_requests}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/reviewer/requests", methods=["POST"])
def create_request():

    data = request.json
    reviewer_id = data.get("reviewer_id")
    request_type = data.get("request_type")
    exercise_data = data.get("exercise_data")
    exercise_id = exercise_data.get("id")

    if not reviewer_id or not request_type or not exercise_data:
        return jsonify({"status": "error", "message": "Invalid data provided"}), 400

    existing_request = ReviewerRequest.query.filter(
        ReviewerRequest.reviewer_id == reviewer_id,
        ReviewerRequest.status == "pending",
        ReviewerRequest.request_type == request_type,
        db.cast(ReviewerRequest.exercise_data["id"], db.String) == str(exercise_id)
    ).first()

    if existing_request:
        return jsonify({"status": "error", "message": "A pending request for this exercise already exists."}), 400

    new_request = ReviewerRequest(
        reviewer_id=reviewer_id,
        request_type=request_type,
        exercise_data=exercise_data,
    )

    db.session.add(new_request)
    db.session.commit()

    return jsonify({"status": "success", "message": "Request submitted successfully"}), 201

@app.route("/api/admin/requests", methods=["GET"])
def get_requests():

    requests = ReviewerRequest.query.filter_by(status="pending").all()
    formatted_requests = []

    for req in requests:
        exercise_data = req.exercise_data

        if req.request_type == "edit":
            original_exercise = Exercise.query.get(exercise_data.get("id"))
            exercise_data = {
                "original": original_exercise.to_dict() if original_exercise else {},
                "proposed": exercise_data,
            }
        elif req.request_type == "delete":
            exercise = Exercise.query.get(exercise_data.get("id"))
            if exercise:
                exercise_data = exercise.to_dict()

        formatted_requests.append({
            "id": req.id,
            "reviewer_id": req.reviewer_id,
            "request_type": req.request_type,
            "exercise_data": exercise_data,
            "created_at": req.created_at,
        })

    return jsonify({"requests": formatted_requests})

@app.route("/api/admin/requests/<int:request_id>/approve", methods=["POST"])
def approve_request(request_id):

    request_item = ReviewerRequest.query.get(request_id)

    if not request_item:
        return jsonify({"status": "error", "message": "Request not found"}), 404

    try:
        if request_item.request_type == "add":
            new_exercise = Exercise(**request_item.exercise_data)
            db.session.add(new_exercise)
        elif request_item.request_type == "edit":
            exercise_id = request_item.exercise_data.get("id")
            exercise = Exercise.query.get(exercise_id)
            if exercise:
                for key, value in request_item.exercise_data.items():
                    setattr(exercise, key, value)
        elif request_item.request_type == "delete":
            exercise_id = request_item.exercise_data.get("id")
            exercise = Exercise.query.get(exercise_id)
            if exercise:
                db.session.delete(exercise)

        request_item.status = "approved"
        db.session.commit()

        return jsonify({"status": "success", "message": "Request approved successfully"}), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": "Error processing request", "error": str(e)}), 500

@app.route("/api/admin/requests/<int:request_id>/reject", methods=["POST"])
def reject_request(request_id):

    request_item = ReviewerRequest.query.get(request_id)

    if not request_item:
        return jsonify({"status": "error", "message": "Request not found"}), 404

    try:
        request_item.status = "rejected"
        db.session.commit()

        return jsonify({"status": "success", "message": "Request rejected successfully"}), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": "Error rejecting request", "error": str(e)}), 500

@app.route('/api/questions', methods=['POST'])
def get_questions():

    data = request.json
    user_id = data.get('user_id')
    session_questions = data.get('session_questions', [])

    if not user_id:
        return {"message": "User ID is required.", "status": "fail"}, 400

    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    questions = Exercise.query.filter(
        Exercise.difficulty == user.difficulty,
        ~Exercise.id.in_(session_questions)
    ).order_by(Exercise.random_order).limit(5).all()

    if not questions:
        return {"message": f"No more questions available for difficulty {user.difficulty}.", "status": "fail"}, 404

    return {"questions": [q.to_dict() for q in questions], "status": "success"}, 200

@app.route('/api/reviewer/exercises', methods=['GET'])
def get_reviewer_exercises():

    exercises = Exercise.query.all()

    return {"exercises": [exercise.to_dict() for exercise in exercises]}, 200

@app.route('/api/answer', methods=['POST'])
def submit_answer():

    data = request.json
    user_id = data.get('user_id')
    question_id = data.get('question_id')
    answer = data.get('answer')

    if not all([user_id, question_id, answer]):
        return {"message": "Toate câmpurile sunt necesare!", "status": "fail"}, 400

    question = Exercise.query.get(question_id)

    if not question:
        return {"message": "Întrebarea nu există.", "status": "fail"}, 404

    correct = False
    xp = 0

    if question.type in ['multiple_choice', 'fill_blank']:
        try:
            answer_index = int(answer)
            correct = question.correct_option == answer_index
        except ValueError:
            correct = False

        if correct:
            xp = 10 if question.difficulty == 'easy' else 20 if question.difficulty == 'medium' else 30

    elif question.type == 'rearrange':
        correct = question.correct_answer and question.correct_answer.lower().strip() == answer.lower().strip()

        if correct:
            xp = 20 if question.difficulty == 'easy' else 30 if question.difficulty == 'medium' else 40

    if correct:
        user = User.query.get(user_id)

        if user:
            user.xp += xp
            db.session.commit()

        progress = UserQuestionProgress.query.filter_by(user_id=user_id, question_id=question_id).first()

        if not progress:
            progress = UserQuestionProgress(user_id=user_id, question_id=question_id, answered_correctly=True)
            db.session.add(progress)
            db.session.commit()

    return {"message": "Răspuns trimis.", "correct": correct, "xp": xp, "status": "success"}, 200

@app.route('/api/admin/exercises', methods=['GET'])
def get_all_exercises():

    exercises = Exercise.query.all()

    return {"exercises": [exercise.to_dict() for exercise in exercises]}, 200

if __name__ == '__main__':
    try:
        with app.app_context():

            db.session.execute(text('SELECT 1'))
            print("Conexiunea la PostgreSQL funcționează!")

            db.create_all()
            print("Tabelele au fost create!")

            app.run(debug=True)

    except Exception as e:
        print("Eroare la conectarea cu baza de date:", e)