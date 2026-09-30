from flask import Blueprint, jsonify, request

from auth_utils import generate_token, role_required, token_required
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401
    if not user.is_active:
        return jsonify({"error": "This account has been deactivated"}), 403

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    return jsonify(request.current_user.to_dict())


@auth_bp.route("/me/password", methods=["PATCH"])
@token_required
def change_own_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    user = request.current_user
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated successfully"})


@auth_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def list_users():
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify([u.to_dict() for u in users])


@auth_bp.route("/users", methods=["POST"])
@token_required
@role_required("admin")
def create_user():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    role = data.get("role", "staff")

    if not username or not password or not full_name:
        return jsonify({"error": "username, password, and full_name are required"}), 400
    if role not in ("admin", "staff"):
        return jsonify({"error": "role must be 'admin' or 'staff'"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    user = User(username=username, full_name=full_name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@auth_bp.route("/users/<int:user_id>", methods=["PATCH"])
@token_required
@role_required("admin")
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()
    if "role" in data and data["role"] in ("admin", "staff"):
        user.role = data["role"]
    if "is_active" in data:
        if user.id == request.current_user.id and not data["is_active"]:
            return jsonify({"error": "You cannot deactivate your own account"}), 400
        user.is_active = bool(data["is_active"])
    if data.get("password"):
        if len(data["password"]) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict())
