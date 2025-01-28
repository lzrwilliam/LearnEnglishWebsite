from app import app  # Importă aplicația Flask
from models import db, Achievement  # Importă modelele necesare

def seed_achievements():
    with app.app_context():  # Asigură-te că folosești contextul aplicației
        achievements = [
            Achievement(
                name="First Steps",
                description="Răspunde corect la 1 întrebare.",
                xp_reward=10,
                goal=1,
                type="correct_answers_total",
                icon="first_steps.png",
            ),
            Achievement(
                name="Streak Starter",
                description="Răspunde corect la 5 întrebări consecutive.",
                xp_reward=50,
                goal=5,
                type="correct_answers_streak",
                icon="streak_starter.png",
            ),
            Achievement(
                name="Daily Grinder",
                description="Răspunde corect la 10 întrebări într-o singură zi.",
                xp_reward=100,
                goal=10,
                type="daily_correct_answers",
                icon="daily_grinder.png",
            ),
        ]

        db.session.bulk_save_objects(achievements)
        db.session.commit()
        print("Achievements have been seeded!")

if __name__ == "__main__":
    seed_achievements()
