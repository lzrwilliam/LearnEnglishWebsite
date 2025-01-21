import os
import json


with open('config.json', 'r') as f:
    config = json.load(f)

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
  
    SQLALCHEMY_DATABASE_URI = config['database'] if not os.getenv('TESTING') else config['test_database']
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = config['SECRET_KEY']

    UPLOAD_FOLDER = os.path.join(basedir, 'pictures')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

    DEBUG = True
    TEST_DATABASE = config['test_database']

