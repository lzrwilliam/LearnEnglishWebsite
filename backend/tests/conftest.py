import pytest
import sys
import os

os.environ['TESTING'] = '1'

# Adăugăm manual calea către folderul backend pentru importuri corecte
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_path)

# Import corect forțat, verificând explicit calea
try:
    from app import app, db
except ImportError as e:
    print(f"Eroare la import: {e}")
    raise

from config import Config

@pytest.fixture(scope='function')
def client():
    app.config['TESTING'] = True
    #app.config['SQLALCHEMY_DATABASE_URI'] = Config.TEST_DATABASE
    #app.config['WTF_CSRF_ENABLED'] = False
    client = app.test_client()

    with app.app_context():
        db.create_all()
        yield client
        db.session.remove()
        db.drop_all()
