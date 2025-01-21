import pytest
import jwt
from auth import generate_token, verify_token
from app import app, db
from models import User
from config import Config
from flask import jsonify
from freezegun import freeze_time

# Test unitar 
def test_generate_token():
    token = generate_token(1)
    assert isinstance(token, str)

# Test unitar 
def test_verify_token():
    token = generate_token(1)
    user_id = verify_token(token)
    assert user_id == 1

# Test unitar  - Token expirat
def test_verify_token_expired():
    with freeze_time("2022-01-01 12:00:00"):
        token = generate_token(1)
    with freeze_time("2022-01-01 15:00:00"):
        user_id = verify_token(token)
        assert user_id is None

# Test de integrare  caz pozitiv
def test_token_required(client):
    with client.application.app_context():
        new_user = User(username="testuser", email="test@example.com", password="password123")
        db.session.add(new_user)
        db.session.commit()
        db.session.refresh(new_user)

    token = generate_token(new_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get('/api/profile/role_request_status', headers=headers)

    assert response.status_code == 200
    assert response.is_json
    assert response.json.get('status') == 'success'

# Test de integrare  caz pozitiv
def test_role_required(client):
    with client.application.app_context():
        new_user = User(username="adminuser", email="admin@example.com", password="password123", role="admin")
        db.session.add(new_user)
        db.session.commit()
        db.session.refresh(new_user)

    token = generate_token(new_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get('/api/admin/role_requests', headers=headers)


    assert response.status_code == 200
    assert response.is_json
    assert response.json.get('status') == 'success'
    assert isinstance(response.json.get('requests'), list)


def test_role_required_fail(client):
    with client.application.app_context():
        new_user = User(username="regularuser", email="user@example.com", password="password123", role="user")
        db.session.add(new_user)
        db.session.commit()
        db.session.refresh(new_user)

    token = generate_token(new_user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get('/api/admin/role_requests', headers=headers)

    assert response.status_code == 403
    assert response.is_json
    assert response.json.get('status') == 'fail'
    assert response.json.get('message') == "Access denied! Insufficient permissions."
