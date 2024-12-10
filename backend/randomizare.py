from flask import Flask
from app import db, Exercise

import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://alexnicorescu:parola@localhost/baza_de_date'
db.init_app(app)

with app.app_context():
    exercises = Exercise.query.all()
    for exercise in exercises:
        exercise.random_order = random.random()  # Assign a new random value
    db.session.commit()
    print("Questions randomized for the day!")
