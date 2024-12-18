import jwt
from flask import request, jsonify
from functools import wraps
from models import User
from config import Config
from datetime import datetime, timezone, timedelta

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def verify_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None  # Token expirat
    except jwt.InvalidTokenError:
        return None  # Token invalid


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing!", "status": "fail"}), 403
        
        try:
            token = token.split()[1]
            decoded = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded['user_id']  
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired!", "status": "fail"}), 403
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token!", "status": "fail"}), 403
        except IndexError:
            return jsonify({"message": "Token format is invalid!", "status": "fail"}), 403

        return f(*args, **kwargs)
    return decorated


def role_required(required_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization")
            if not token:
                return jsonify({"message": "Token is missing!"}), 403
            try:
                decoded = jwt.decode(token.split()[1], Config.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded['user_id']
                user = User.query.get(user_id)
                if not user:
                    return jsonify({"message": "User not found!"}), 403
                if user.role.lower() not in [r.lower() for r in required_roles]:
                    return jsonify({"message": "Access denied! Insufficient permissions."}), 403
                request.user = user  
            except jwt.ExpiredSignatureError:
                return jsonify({"message": "Token expired!"}), 403
            except jwt.InvalidTokenError:
                return jsonify({"message": "Invalid token!"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


