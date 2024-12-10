from flask import Flask
from flask_apscheduler import APScheduler
from app import app, db, Exercise
import random

# Scheduler logic
def randomize_questions():
    with app.app_context():  # Ensure Flask app context is active
        exercises = Exercise.query.all()
        for exercise in exercises:
            exercise.random_order = random.random()  # Assign new random values
        db.session.commit()
        print("Questions randomized successfully!")

# Initialize scheduler
scheduler = APScheduler()
scheduler.init_app(app)

# Add job to randomize questions daily at midnight
scheduler.add_job(
    id='RandomizeQuestions',
    func=randomize_questions,
    trigger='cron',
    hour=0,
)

scheduler.start()

if __name__ == "__main__":
    app.run(debug=True)
