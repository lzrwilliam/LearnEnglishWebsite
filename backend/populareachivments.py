from app import app
from models import db, Achievement

def seed_achievements():
    with app.app_context():
        achievements = [
            # 1. Achievements de progres
            Achievement(name="First Steps", description="Răspunde corect la 1 întrebare.", xp_reward=10, goal=1, type="correct_answers_total", icon="first_steps.png"),
            Achievement(name="Apprentice", description="Răspunde corect la 50 de întrebări.", xp_reward=50, goal=50, type="correct_answers_total", icon="apprentice.png"),
            Achievement(name="Master Linguist", description="Răspunde corect la 500 de întrebări.", xp_reward=200, goal=500, type="correct_answers_total", icon="master_linguist.png"),

            # 2. Achievements zilnice
            Achievement(name="Daily Grinder", description="Răspunde corect la 10 întrebări într-o zi.", xp_reward=30, goal=10, type="daily_correct_answers", icon="daily_grinder.png"),
            Achievement(name="Dedicated Learner", description="Răspunde corect la 10 întrebări în fiecare zi, timp de 7 zile consecutive.", xp_reward=100, goal=7, type="streak_days", icon="dedicated_learner.png"),
            Achievement(name="Legendary Streak", description="Ai un streak zilnic de 30 de zile fără întrerupere.", xp_reward=300, goal=30, type="streak_days", icon="legendary_streak.png"),

            # 3. Achievements de dificultate
            Achievement(name="Easy Peasy", description="Răspunde corect la 50 de întrebări ușoare.", xp_reward=30, goal=50, type="correct_answers_difficulty_easy", icon="easy_peasy.png"),
            Achievement(name="Intermediate Explorer", description="Răspunde corect la 50 de întrebări medii.", xp_reward=50, goal=50, type="correct_answers_difficulty_medium", icon="intermediate_explorer.png"),
            Achievement(name="Hardcore Master", description="Răspunde corect la 50 de întrebări dificile.", xp_reward=100, goal=50, type="correct_answers_difficulty_hard", icon="hardcore_master.png"),

            # 4. Achievements de utilizare
            Achievement(name="Explorer", description="Vizitează platforma în 5 zile diferite.", xp_reward=20, goal=5, type="days_active", icon="explorer.png"),
            Achievement(name="Committed", description="Vizitează platforma în 30 de zile diferite.", xp_reward=150, goal=30, type="days_active", icon="committed.png"),
        ]

        db.session.bulk_save_objects(achievements)
        db.session.commit()
        print("Achievements have been seeded successfully!")

if __name__ == "__main__":
    seed_achievements()
