import pytest
from app import app, db, allowed_file
from models import User, Exercise
from io import BytesIO

# Test unitar 
def test_allowed_file():
    assert allowed_file("test.png") == True
    assert allowed_file("test.doc") == False
    assert allowed_file("test") == False

# Test de integrare - Caz pozitiv
def test_register_user(client):
    response = client.post('/api/register', json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "User",
        "difficulty": "easy"
    })
    assert response.status_code == 201
    assert response.json['status'] == 'success'

# Test de integrare - Caz negativ (username duplicat)
def test_register_user_duplicate(client):
    client.post('/api/register', json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    response = client.post('/api/register', json={
        "username": "testuser",
        "email": "duplicate@example.com",
        "password": "password123"
    })
    assert response.status_code == 400
    assert response.json['status'] == 'fail'

# Test de integrare  Caz pozitiv
def test_login_user(client):
    with client.application.app_context():
        new_user = User(username="testuser", email="test@example.com", password="password123")
        db.session.add(new_user)
        db.session.commit()

    response = client.post('/api/login', json={
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 200
    assert 'token' in response.json

# Test de integrare  - Caz negativ (parola gresita)
def test_login_user_invalid_password(client):
    response = client.post('/api/login', json={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

# Test de integrare 
def test_upload_profile_picture(client):
    with client.application.app_context():
        new_user = User(username="testuser", email="test@example.com", password="password123")
        db.session.add(new_user)
        db.session.commit()
        user_id = new_user.id

    # Folosim BytesIO pentru fisier test
    data = {
        'file': (BytesIO(b"file content"), 'test.png')
    }
    response = client.post(f'/api/upload_profile_picture/{user_id}', content_type='multipart/form-data', data=data)
    assert response.status_code == 200
    assert response.json['status'] == 'success'

# Test de integrare pentru leaderboard - Caz pozitiv
def test_get_leaderboard(client):
    with client.application.app_context():
        new_user = User(username="testuser", email="test@example.com", password="password123", xp=100)
        db.session.add(new_user)
        db.session.commit()

    response = client.get('/api/leaderboard?user_id=1')
    assert response.status_code == 200
    assert len(response.json['leaderboard']) > 0

# # Test de integrare pentru /api/questions - Caz pozitiv
# def test_get_questions(client):
#     with client.application.app_context():
#         new_question = Exercise(question="Test Question?", difficulty="easy", type="multiple_choice")
#         db.session.add(new_question)
#         db.session.commit()

#     response = client.post('/api/questions')
#     assert response.status_code == 415
#     assert len(response.json['questions']) > 0

# Test de integrare pentru /api/answer - Caz pozitiv
def test_submit_answer(client):
    with client.application.app_context():
        new_user = User(username="testuser", email="test@example.com", password="password123")
        new_question = Exercise(question="Test Question?", difficulty="easy", type="multiple_choice", correct_option=1)
        db.session.add(new_user)
        db.session.add(new_question)
        db.session.commit()

        db.session.refresh(new_user)
        db.session.refresh(new_question)

    response = client.post('/api/answer', json={
        "user_id": new_user.id,
        "question_id": new_question.id,
        "answer": "1"
    })
    assert response.status_code == 200
    assert response.json['correct'] is True
    
 # Test de integrare pentru  - Caz negativ
def test_submit_answer_fail(client):
    with client.application.app_context():
        new_user = User(username="testuser1", email="test@example.com", password="password123")
        new_question = Exercise(question="Test Question?", difficulty="easy", type="multiple_choice", correct_option=1)
        db.session.add(new_user)
        db.session.add(new_question)
        db.session.commit()

        db.session.refresh(new_user)
        db.session.refresh(new_question)

    response = client.post('/api/answer', json={
        "user_id": new_user.id,
        "question_id": new_question.id,
        "answer": "2"
    })
    assert response.json['correct'] is False
   
