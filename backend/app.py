import json
from datetime import datetime, timezone, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate

from sqlalchemy.sql import text
from sqlalchemy import and_


import os
from werkzeug.utils import secure_filename
from flask import send_from_directory


from functools import wraps
from flask import request, jsonify
import jwt


from auth import generate_token
from models import * 
from config import Config
from routes.admin_routes import admin_bp
from routes.reviewer_routes import reviewer_bp
from routes.user_routes import user_bp
from routes.profile_routes import profile_bp



app = Flask(__name__)
app.config.from_object(Config)  

#CORS(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


db.init_app(app)
migrate = Migrate(app, db)


if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']



#blueprints trebuie inregistrate
app.register_blueprint(admin_bp)
app.register_blueprint(reviewer_bp)
app.register_blueprint(user_bp)
app.register_blueprint(profile_bp)





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

        # stergem imaginea veche dacă exista
        if user.profile_picture:
            old_filepath = os.path.join(app.config['UPLOAD_FOLDER'], user.profile_picture)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

      
        file.save(filepath)
        user.profile_picture = filename
        db.session.commit()

        return {"message": "Profile picture uploaded successfully.", "status": "success", "profile_picture": filename}, 200

    return {"message": "File not allowed.", "status": "fail"}, 400

@app.route('/pictures/<filename>', methods=['GET'])
def serve_profile_picture(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
   
@app.route('/api/pfp/<int:user_id>', methods=['GET'])
def get_profile_picture(user_id):
    user = User.query.get(user_id)

    if not user or not user.profile_picture:
        return "", 404

    return send_from_directory(app.config['UPLOAD_FOLDER'], user.profile_picture)








   
    
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    user_id = request.args.get("user_id", type=int)

    if not user_id:
        return {"message": "User ID is required.", "status": "fail"}, 400

    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found.", "status": "fail"}, 404

    leaderboard_users = User.query.filter_by(is_banned=False).order_by(User.xp.desc()).all()

    leaderboard = [u.to_dict() for u in leaderboard_users]

    if user.role == "admin":
        banned_users = User.query.filter_by(is_banned=True).order_by(User.username).all()
        leaderboard.extend([ u.to_dict() for u in banned_users])

    return {"leaderboard": leaderboard}, 200



@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()

    if not user:
        return {"message": "Username or password incorrect.", "status": "fail"}, 401

    if user.is_banned:
        return {"message": f"Your account has been banned.", "status": "banned"}, 403

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
        return {"message": "All field required!", "status": "fail"}, 400

    if User.query.filter_by(username=username).first():
        return {"message": "Username aleready exists!", "status": "fail"}, 400

    if User.query.filter_by(email=email).first():
        return {"message": "Email already registered!", "status": "fail"}, 400

    new_user = User(username=username, email=email, password=password, role=role, difficulty=difficulty)
    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user.id)  # Generăm token-ul JWT

    return jsonify({  # Asigură-te că folosești jsonify pentru răspuns
        "message": "Registration succesful!",
        "status": "success",
        "user": new_user.to_dict(),
        "token": token
    }), 201





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




@app.route('/api/answer', methods=['POST'])
def submit_answer():
    data = request.json
    user_id = data.get('user_id')
    question_id = data.get('question_id')
    answer = data.get('answer')

    if not all([user_id, question_id, answer]):
        return {"message": "All field required!", "status": "fail"}, 400

    question = Exercise.query.get(question_id)

    if not question:
        return {"message": "Question does not exist.", "status": "fail"}, 404

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

    return {"message": "Answer sent.", "correct": correct, "user_xp": user.xp, "status": "success"}, 200





if __name__ == '__main__':
    try:
        with app.app_context():
         if not app.config['TESTING']:


            db.session.execute(text('SELECT 1'))
            print("Conexiunea la PostgreSQL funcționează!")

            db.create_all()
            print("Tabelele au fost create!")

            app.run(debug=True)

    except Exception as e:
        print("Eroare la conectarea cu baza de date:", e)