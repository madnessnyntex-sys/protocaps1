import datetime
from functools import wraps

import jwt
from flask import current_app, jsonify, request

from extensions import db
from models import User


def generate_token(user):
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + current_app.config["JWT_EXPIRES"],
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])


def token_required(f):
    """Validates the Bearer JWT on the request and attaches request.current_user."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid session token"}), 401

        user = db.session.get(User, payload["user_id"])
        if not user or not user.is_active:
            return jsonify({"error": "Account not found or deactivated"}), 401

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


def role_required(*roles):
    """Must be stacked BELOW @token_required so request.current_user already exists."""

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.current_user.role not in roles:
                return jsonify({"error": "You do not have permission to perform this action"}), 403
            return f(*args, **kwargs)

        return decorated

    return decorator
