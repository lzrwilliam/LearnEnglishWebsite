from app import db, Exercise, app

def populate_exercises():
    exercises = [
        # {
        #     "type": "fill_blank",
        #     "sentence": "I ___ to the park yesterday.",
        #     "options": ["go", "went", "gone"],
        #     "correct_option": 1,
        # }


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
            "options": [],
            "correct_option": None,
            "correct_answer": "The boy is reading a book",
            "type": "rearrange",
            "difficulty": "easy"
        },
        {
            "question": "Rearanjează cuvintele pentru propoziția: 'Learning English is fun and rewarding.'",
            "options": [],
            "correct_option": None,
            "correct_answer": "Learning English is fun and rewarding",
            "type": "rearrange",
            "difficulty": "medium"
        },
        {
            "question": "Rearanjează cuvintele pentru propoziția: 'Practice makes perfect in everything.'",
            "options": [],
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
            "correct_answer": "is",
            "type": "multiple_choice",
            "difficulty": "easy"
        },
        
        # Translation Questions
        {
            "question": "I went to the park yesterday.",
            "translation": "Care este traducerea cuvântului 'park'?",
            "options": ["parc", "parcare", "teren"],
            "correct_option": 0,
            "correct_answer": "parc",
            "type": "multiple_choice",
            "difficulty": "easy"
        },
        {
            "question": "She wore a beautiful dress for the party.",
            "translation": "Care este traducerea cuvântului 'dress'?",
            "options": ["rochie", "costum", "tricou"],
            "correct_option": 0,
            "correct_answer": "rochie",
            "type": "multiple_choice",
            "difficulty": "medium"
        },
        {
            "question": "We have not seen that movie yet.",
            "translation": "Care este traducerea cuvântului 'movie'?",
            "options": ["film", "carte", "piesă"],
            "correct_option": 0,
            "correct_answer": "film",
            "type": "multiple_choice",
            "difficulty": "hard"
        },
        {
            "question": "The children were playing outside all day.",
            "translation": "Care este traducerea cuvântului 'children'?",
            "options": ["copii", "prieteni", "tineri"],
            "correct_option": 0,
            "correct_answer": "copii",
            "type": "multiple_choice",
            "difficulty": "medium"
        },
        {
            "question": "I have never seen such a beautiful sunset.",
            "translation": "Care este traducerea cuvântului 'sunset'?",
            "options": ["apus", "răsărit", "peisaj"],
            "correct_option": 0,
            "correct_answer": "apus",
            "type": "multiple_choice",
            "difficulty": "hard"
        }
    ]

    with app.app_context():
        print("Populare baza de date...")
        for exercise in exercises:
            try:
                print(f"Adaug întrebarea: {exercise['question']}")
                new_exercise = Exercise(**exercise)
                db.session.add(new_exercise)
            except Exception as e:
                print(f"Error adding question {exercise['question']}: {e}")
        db.session.commit()
        print("Exercițiile au fost adăugate cu succes!")

if __name__ == '__main__':
    populate_exercises()
