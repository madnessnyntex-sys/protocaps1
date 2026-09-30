from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from auth_utils import role_required, token_required
from extensions import db
from models import Category, Product, StockMovement

products_bp = Blueprint("products", __name__)


# ---------------------------------------------------------------- Categories

@products_bp.route("/categories", methods=["GET"])
@token_required
def list_categories():
    include_inactive = request.args.get("include_inactive") == "true"
    query = Category.query
    if not include_inactive:
        query = query.filter_by(is_active=True)
    categories = query.order_by(Category.name.asc()).all()
    return jsonify([c.to_dict() for c in categories])


@products_bp.route("/categories", methods=["POST"])
@token_required
@role_required("admin", "staff")
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required"}), 400
    if Category.query.filter_by(name=name).first():
        return jsonify({"error": "A category with this name already exists"}), 409

    category = Category(name=name, description=(data.get("description") or "").strip())
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@products_bp.route("/categories/<int:cat_id>", methods=["PUT"])
@token_required
@role_required("admin")
def update_category(cat_id):
    category = Category.query.get_or_404(cat_id)
    data = request.get_json(silent=True) or {}
    if data.get("name", "").strip():
        category.name = data["name"].strip()
    if "description" in data:
        category.description = data["description"]
    db.session.commit()
    return jsonify(category.to_dict())


@products_bp.route("/categories/<int:cat_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def deactivate_category(cat_id):
    category = Category.query.get_or_404(cat_id)
    category.is_active = False
    db.session.commit()
    return jsonify({"message": "Category deactivated"})


# ------------------------------------------------------------------ Products

@products_bp.route("/products", methods=["GET"])
@token_required
def list_products():
    query = Product.query
    if request.args.get("active", "true") == "true":
        query = query.filter_by(is_active=True)

    category_id = request.args.get("category_id")
    if category_id:
        try:
            query = query.filter_by(category_id=int(category_id))
        except ValueError:
            return jsonify({"error": "category_id must be an integer"}), 400

    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(like), Product.sku.ilike(like)))

    products = query.order_by(Product.name.asc()).all()
    result = [p.to_dict() for p in products]

    status = request.args.get("status")
    if status:
        result = [p for p in result if p["status"] == status]

    return jsonify(result)


@products_bp.route("/products/<int:product_id>", methods=["GET"])
@token_required
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@products_bp.route("/products", methods=["POST"])
@token_required
@role_required("admin", "staff")
def create_product():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    sku = (data.get("sku") or "").strip().upper()

    if not name or not sku:
        return jsonify({"error": "name and sku are required"}), 400
    if Product.query.filter_by(sku=sku).first():
        return jsonify({"error": "A product with this SKU already exists"}), 409

    try:
        price = float(data.get("price", 0))
        cost = float(data.get("cost", 0))
        reorder_level = int(data.get("reorder_level", 5))
        initial_stock = int(data.get("initial_stock", 0) or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "price, cost, reorder_level, and initial_stock must be numeric"}), 400

    if price < 0 or cost < 0 or reorder_level < 0 or initial_stock < 0:
        return jsonify({"error": "Numeric values cannot be negative"}), 400

    category_id = data.get("category_id") or None
    if category_id is not None and not Category.query.get(category_id):
        return jsonify({"error": "category_id does not exist"}), 400

    product = Product(
        name=name,
        sku=sku,
        category_id=category_id,
        size=(data.get("size") or "").strip(),
        color=(data.get("color") or "").strip(),
        price=price,
        cost=cost,
        reorder_level=reorder_level,
        current_stock=initial_stock,
    )
    db.session.add(product)
    db.session.flush()  # assigns product.id

    if initial_stock > 0:
        db.session.add(StockMovement(
            product_id=product.id,
            movement_type="initial",
            quantity_change=initial_stock,
            resulting_stock=initial_stock,
            notes="Initial stock on product creation",
            created_by=request.current_user.id,
        ))

    db.session.commit()
    return jsonify(product.to_dict()), 201


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@token_required
@role_required("admin", "staff")
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(silent=True) or {}

    if data.get("name", "").strip():
        product.name = data["name"].strip()
    if "category_id" in data:
        category_id = data["category_id"] or None
        if category_id is not None and not Category.query.get(category_id):
            return jsonify({"error": "category_id does not exist"}), 400
        product.category_id = category_id
    if "size" in data:
        product.size = data["size"]
    if "color" in data:
        product.color = data["color"]

    if "price" in data:
        try:
            price = float(data["price"])
        except (TypeError, ValueError):
            return jsonify({"error": "price must be numeric"}), 400
        if price < 0:
            return jsonify({"error": "price cannot be negative"}), 400
        product.price = price

    if "cost" in data:
        try:
            cost = float(data["cost"])
        except (TypeError, ValueError):
            return jsonify({"error": "cost must be numeric"}), 400
        if cost < 0:
            return jsonify({"error": "cost cannot be negative"}), 400
        product.cost = cost

    if "reorder_level" in data:
        try:
            reorder_level = int(data["reorder_level"])
        except (TypeError, ValueError):
            return jsonify({"error": "reorder_level must be an integer"}), 400
        if reorder_level < 0:
            return jsonify({"error": "reorder_level cannot be negative"}), 400
        product.reorder_level = reorder_level

    if data.get("sku", "").strip():
        new_sku = data["sku"].strip().upper()
        existing = Product.query.filter_by(sku=new_sku).first()
        if existing and existing.id != product.id:
            return jsonify({"error": "A product with this SKU already exists"}), 409
        product.sku = new_sku

    db.session.commit()
    return jsonify(product.to_dict())


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def deactivate_product(product_id):
    product = Product.query.get_or_404(product_id)
    product.is_active = False
    db.session.commit()
    return jsonify({"message": "Product deactivated"})
