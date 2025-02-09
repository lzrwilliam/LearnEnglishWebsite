from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql.expression import func
from datetime import datetime, timezone

db = SQLAlchemy()


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
    correct_streak = db.Column(db.Integer, default=0)  # Seria curenta de raspunsuri corecte
    daily_correct_answers = db.Column(db.Integer, default=0)  # Raspunsuri corecte azi
    last_active_date = db.Column(db.Date, nullable=True)  # Data ultimei activități
    active_days = db.Column(db.Integer, default=0)  # Numarul de zile active unice
    last_login_date = db.Column(db.Date, nullable=True)  # Ultima zi in care s-a logat
   


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
            "correct_streak": self.correct_streak,
            "daily_correct_answers": self.daily_correct_answers,
            "last_active_date": self.last_active_date,
            "active_days": self.active_days,
            "last_login_date": self.last_login_date

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
        
        
class RoleRequest(db.Model):
    __tablename__ = 'role_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role_requested = db.Column(db.String(20), nullable=False)  # "admin" sau "reviewer"
    status = db.Column(db.String(20), default="pending")  # "pending", "approved", "rejected"
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    user = db.relationship('User', backref="role_requests")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username,  
            "role_requested": self.role_requested,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
        
        
class Achievement(db.Model):
    __tablename__ = 'achievements'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    xp_reward = db.Column(db.Integer, default=0)
    goal = db.Column(db.Integer, nullable=False)  # Exemplu: 10 răspunsuri corecte
    type = db.Column(db.String(50), nullable=False)  # Tipul realizării
    icon = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "xp_reward": self.xp_reward,
            "goal": self.goal,
            "type": self.type,
            "icon": self.icon
        }

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id', ondelete='CASCADE'), nullable=False)
    progress = db.Column(db.Integer, default=0)  # Progresul curent (ex. 7/10)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        achievement = Achievement.query.get(self.achievement_id)
        return {
            "id": self.id,
            "achievement": achievement.to_dict() if achievement else None,
            "progress": self.progress,
            "completed": self.completed,
        }