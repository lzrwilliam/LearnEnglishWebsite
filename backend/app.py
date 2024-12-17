import json
from datetime import datetime, timezone, timedelta

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate

from sqlalchemy.sql import text
from sqlalchemy import and_
from sqlalchemy.sql.expression import func


import os
from werkzeug.utils import secure_filename
from flask import send_from_directory


from functools import wraps
from flask import request, jsonify
import jwt

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pictures')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
#CORS(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

with open('config.json', 'r') as f:
    config = json.load(f)

app.config['SQLALCHEMY_DATABASE_URI'] = config['database']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = config['SECRET_KEY']
SECRET_KEY = app.config['SECRET_KEY']
db = SQLAlchemy(app)
migrate = Migrate(app, db)



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None  # Token expirat
    except jwt.InvalidTokenError:
        return None  # Token invalid


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing!"}), 403
        try:
            decoded = jwt.decode(token.split()[1], SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded['user_id']
        except:
            return jsonify({"message": "Invalid token!"}), 403
        return f(*args, **kwargs)
    return decorated


def role_required(required_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization")
            if not token:
                return jsonify({"message": "Token is missing!"}), 403
            try:
                decoded = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=["HS256"])
                user_id = decoded['user_id']
                user = User.query.get(user_id)
                if not user:
                    return jsonify({"message": "User not found!"}), 403
                if user.role.lower() not in [r.lower() for r in required_roles]:
                    return jsonify({"message": "Access denied! Insufficient permissions."}), 403
                request.user = user  
            except jwt.ExpiredSignatureError:
                return jsonify({"message": "Token expired!"}), 403
            except jwt.InvalidTokenError:
                return jsonify({"message": "Invalid token!"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator




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
    profile_picture = db.Column(db.String(255), nullable=True)  


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
            "profile_picture": f"/pictures/{self.profile_picture}" if self.profile_picture else None,

        }

    def __repr__(self):
        return f"<User {self.username} (Role: {self.role})>"
    


class ReviewerRequest(db.Model):
    __tablename__ = 'reviewer_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default="pending")  # "pending", "approved", "rejected"
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # ID-ul reviewer-ului care a procesat solicitarea
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))



class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) 
    message = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False)   

    def to_dict(self):
        sender = User.query.get(self.sender_id) if self.sender_id else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "sender_id": self.sender_id,
            "sender_name": sender.username if sender else None, 
            "message": self.message,
            "created_at": self.created_at,
            "is_read": self.is_read
        }
    





@app.route('/api/upload_profile_picture/<int:user_id>', methods=['POST'])
def upload_profile_picture(user_id):
    user = User.query.get(user_id)
    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    if 'file' not in request.files:
        return {"message": "No file part.", "status": "fail"}, 400

    file = request.files['file']
    if file.filename == '':
        return {"message": "No selected file.", "status": "fail"}, 400

    if file and allowed_file(file.filename):
        filename = secure_filename(f"user_{user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file.filename.rsplit('.', 1)[1].lower()}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Ștergem imaginea veche dacă există
        if user.profile_picture:
            old_filepath = os.path.join(app.config['UPLOAD_FOLDER'], user.profile_picture)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

        # Salvăm noua imagine
        file.save(filepath)

        # Actualizăm baza de date
        user.profile_picture = filename
        db.session.commit()

        return {"message": "Profile picture uploaded successfully.", "status": "success", "profile_picture": filename}, 200

    return {"message": "File not allowed.", "status": "fail"}, 400




@app.route('/pictures/<filename>', methods=['GET'])
def serve_profile_picture(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
   


@app.route('/api/user_requests/<int:user_id>', methods=['GET'])
def get_user_requests(user_id):
    requests = ReviewerRequest.query.filter_by(user_id=user_id).order_by(ReviewerRequest.created_at.desc()).all()
    return {
        "requests": [
            {
                "id": req.id,
                "exercise_id": req.exercise_id,
                "message": req.message,
                "status": req.status,
                "created_at": req.created_at
            }
            for req in requests
        ]
    }, 200


@app.route('/api/notifications/unread_count/<int:user_id>', methods=['GET'])
def get_unread_notifications_count(user_id):
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return {"unread_count": unread_count}, 200


#marcare notificare citita
@app.route('/api/notifications/<int:notification_id>', methods=['PUT'])
def mark_notification_as_read(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return {"message": "Notificarea nu a fost găsită.", "status": "fail"}, 404

    notification.is_read = True
    db.session.commit()

    return {"message": "Notificarea a fost marcată ca citită.", "status": "success"}, 200


@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return {"message": "Notificarea nu a fost găsită.", "status": "fail"}, 404

    db.session.delete(notification)
    db.session.commit()

    return {"message": "Notificarea a fost ștearsă.", "status": "success"}, 200

@app.route('/api/notifications/<int:user_id>', methods=['GET'])
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



@app.route('/api/user_requests', methods=['GET'])
def check_active_request():
    user_id = request.args.get('user_id', type=int)
    exercise_id = request.args.get('exercise_id', type=int)

    if not user_id or not exercise_id:
        return {"hasActiveRequest": False}, 400

    # Verificam daca exista o cerere activa pt exercitiul curent și user-ul curent
    active_request = ReviewerRequest.query.filter_by(
        user_id=user_id,
        exercise_id=exercise_id,
        status="pending"  # doar cele in asteptare sunt considerate active
    ).first()

    return {"hasActiveRequest": bool(active_request)}, 200


@app.route('/api/reviewer_requests', methods=['POST'])
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


@app.route('/api/reviewer_requests', methods=['GET'])
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



@app.route('/api/reviewer_requests/<int:request_id>', methods=['POST'])
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


   
    
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    user_id = request.args.get("user_id", type=int)

    if not user_id:
        return {"message": "User ID is required.", "status": "fail"}, 400

    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    leaderboard_users = User.query.filter_by(is_banned=False).order_by(User.xp.desc()).all()

    leaderboard = [
        {
            "username": u.username,
            "xp": u.xp,
            **({"id": u.id} if user.role == "admin" else {})
        }
        for u in leaderboard_users
    ]

    if user.role == "admin":
        banned_users = User.query.filter_by(is_banned=True).order_by(User.username).all()
        leaderboard.extend([
            {
                "id": u.id,
                "username": u.username,
                "xp": u.xp,
                "is_banned": True
               
            }
            for u in banned_users
        ])

    return {"leaderboard": leaderboard}, 200


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

    token = generate_token(user.id)  # Generăm token-ul JWT

    return jsonify({  # Asigură-te că folosești jsonify pentru răspuns
        "message": "Login successful.",
        "status": "success",
        "user": user.to_dict(),
        "token": token
    }), 200


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

    token = generate_token(new_user.id)  # Generăm token-ul JWT

    return jsonify({  # Asigură-te că folosești jsonify pentru răspuns
        "message": "Înregistrare reușită!",
        "status": "success",
        "user": new_user.to_dict(),
        "token": token
    }), 201



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

    user_progress = db.relationship(
        'UserQuestionProgress',
        cascade="all, delete",
        backref='exercise',
        passive_deletes=True
    )



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



class UserQuestionProgress(db.Model):
    __tablename__ = 'user_question_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('exercises.id',ondelete='CASCADE'),nullable=False)
    answered_correctly = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answered_correctly": self.answered_correctly,
        }


@app.route('/api/questions', methods=['POST'])
def get_questions():
    # data = request.json
    # user_id = data.get('user_id')
    # session_questions = data.get('session_questions', [])

    # if not user_id:
    #     return {"message": "User ID is required.", "status": "fail"}, 400

    # user = User.query.get(user_id)
    
    # if not user:
    #     return {"message": "User not found.", "status": "fail"}, 404

    # answered_questions = db.session.query(UserQuestionProgress.question_id).filter_by(user_id=user_id).all()
    # answered_question_ids = [q[0] for q in answered_questions]

    # questions = Exercise.query.filter(
    #     Exercise.difficulty == user.difficulty,
    #     ~Exercise.id.in_(session_questions + answered_question_ids)
    # ).order_by(Exercise.random_order).limit(5).all()

    # if not questions:
    #     return {"message": f"No more questions available for difficulty {user.difficulty}.", "status": "fail"}, 404

    # return {"questions": [q.to_dict() for q in questions], "status": "success"}, 200

    questions = Exercise.query.all()

    return {"questions": [q.to_dict() for q in questions], "status": "success"}, 200



@app.route('/api/reviewer/exercises', methods=['GET'])
@token_required
@role_required(["reviewer"])
def get_reviewer_exercises():

    exercises = Exercise.query.all()

    return {"exercises": [exercise.to_dict() for exercise in exercises]}, 200

@app.route('/api/reviewer/exercises/<int:exercise_id>', methods=['GET'])
def get_exercise_details(exercise_id):
    exercise = Exercise.query.get(exercise_id)
    if not exercise:
        return {"message": "Exercițiul nu a fost găsit.", "status": "fail"}, 404

    return {"exercise": exercise.to_dict(), "status": "success"}, 200



@app.route('/api/reviewer/exercises/<int:exercise_id>', methods=['PUT'])
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

@app.route('/api/reviewer/exercises', methods=['POST'])
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






@app.route('/api/reviewer/exercises/<int:exercise_id>', methods=['DELETE'])
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

    # Verificăm dacă întrebarea a fost deja răspunsă
    # progress = UserQuestionProgress.query.filter_by(user_id=user_id, question_id=question_id).first()

    # if progress:
    #     return {"message": "Întrebarea a fost deja răspunsă.", "status": "fail"}, 400

    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

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
        user.xp += xp
        db.session.commit()

    progress = UserQuestionProgress(user_id=user_id, question_id=question_id, answered_correctly=correct)
    db.session.add(progress)
    db.session.commit()

    return {"message": "Răspuns trimis.", "correct": correct, "user_xp": user.xp, "status": "success"}, 200

@app.route('/api/admin/update_role', methods=['POST'])
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