from app import db, Exercise, app

def populate_exercises():
    exercises = [
        # Fill-in-the-Blank Exercises
        {
            "question": "Completează propoziția: 'I ___ to the park yesterday.'",
            "options": ["go", "went", "gone"],
            "correct_option": 1,
            "correct_answer": None,
            "type": "fill_blank",
            "difficulty": "easy"
        },
        {
            "question": "Completează propoziția: 'She ___ a beautiful dress for the party.'",
            "options": ["wear", "wears", "wore"],
            "correct_option": 2,
            "correct_answer": None,
            "type": "fill_blank",
            "difficulty": "medium"
        },
        {
            "question": "Completează propoziția: 'We ___ not seen that movie yet.'",
            "options": ["have", "has", "had"],
            "correct_option": 0,
            "correct_answer": None,
            "type": "fill_blank",
            "difficulty": "hard"
        },
        
        # Multiple Choice Exercises
        {
            "question": "Choose the synonym for 'happy':",
            "options": ["Sad", "Joyful", "Angry"],
            "correct_option": 1,
            "correct_answer": None,
            "type": "multiple_choice",
            "difficulty": "easy"
        },
        {
            "question": "What is the antonym of 'strong'?",
            "options": ["Weak", "Powerful", "Energetic"],
            "correct_option": 0,
            "correct_answer": None,
            "type": "multiple_choice",
            "difficulty": "medium"
        },
        {
            "question": "Select the correct spelling:",
            "options": ["Recieve", "Receive", "Receeve"],
            "correct_option": 1,
            "correct_answer": None,
            "type": "multiple_choice",
            "difficulty": "hard"
        },
        
        # Rearrange Exercises
        {
            "question": "Rearanjează cuvintele pentru propoziția: 'The boy is reading a book.'",
            "options": None,
            "correct_option": None,
            "correct_answer": "The boy is reading a book",
            "type": "rearrange",
            "difficulty": "easy"
        },
        {
            "question": "Rearanjează cuvintele pentru propoziția: 'Learning English is fun and rewarding.'",
            "options": None,
            "correct_option": None,
            "correct_answer": "Learning English is fun and rewarding",
            "type": "rearrange",
            "difficulty": "medium"
        },
        {
            "question": "Rearanjează cuvintele pentru propoziția: 'Practice makes perfect in everything.'",
            "options": None,
            "correct_option": None,
            "correct_answer": "Practice makes perfect in everything",
            "type": "rearrange",
            "difficulty": "hard"
        },
        
        # Additional Fill-in-the-Blank
        {
            "question": "Completează propoziția: 'They ___ to the new restaurant last night.'",
            "options": ["go", "gone", "went"],
            "correct_option": 2,
            "correct_answer": None,
            "type": "fill_blank",
            "difficulty": "medium"
        },
        {
            "question": "Completează propoziția: 'The sun ___ brightly today.'",
            "options": ["shines", "shining", "shine"],
            "correct_option": 0,
            "correct_answer": None,
            "type": "fill_blank",
            "difficulty": "easy"
        },
        
        # Additional Multiple Choice
        {
            "question": "Which of the following is a noun?",
            "options": ["Run", "Book", "Quickly"],
            "correct_option": 1,
            "correct_answer": None,
            "type": "multiple_choice",
            "difficulty": "medium"
        },
        {
            "question": "Choose the correct verb form: 'He ___ playing football.'",
            "options": ["is", "are", "am"],
            "correct_option": 0,
            "correct_answer": None,
            "type": "multiple_choice",
            "difficulty": "easy"
        }
    ]

    with app.app_context():
        print("Populare baza de date...")  # Log pentru depanare
        for exercise in exercises:
            print(f"Adaug întrebarea: {exercise['question']}")  # Log întrebări
            new_exercise = Exercise(**exercise)
            db.session.add(new_exercise)
        db.session.commit()
        print("Exercițiile au fost adăugate cu succes!")

if __name__ == '__main__':
    populate_exercises()
