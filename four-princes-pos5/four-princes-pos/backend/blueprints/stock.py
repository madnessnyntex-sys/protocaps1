from flask import Blueprint, jsonify, request

from auth_utils import token_required
from extensions import db
from models import Product, StockMovement

stock_bp = Blueprint("stock", __name__)


@stock_bp.route("", methods=["GET"])
@token_required
def list_stock():
    products = Product.query.filter_by(is_active=True).order_by(Product.name.asc()).all()
    return jsonify([p.to_dict() for p in products])


@stock_bp.route("/alerts", methods=["GET"])
@token_required
def stock_alerts():
    products = Product.query.filter_by(is_active=True).all()
    low = [p.to_dict() for p in products if p.stock_status() == "low_stock"]
    out = [p.to_dict() for p in products if p.stock_status() == "out_of_stock"]
    return jsonify({
        "low_stock": low,
        "out_of_stock": out,
        "low_stock_count": len(low),
        "out_of_stock_count": len(out),
    })


@stock_bp.route("/adjust", methods=["POST"])
@token_required
def adjust_stock():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")

    try:
        quantity_change = int(data.get("quantity_change"))
    except (TypeError, ValueError):
        return jsonify({"error": "quantity_change must be an integer"}), 400

    movement_type = data.get("movement_type", "adjustment")
    if movement_type not in ("restock", "adjustment"):
        return jsonify({"error": "movement_type must be 'restock' or 'adjustment'"}), 400
    if quantity_change == 0:
        return jsonify({"error": "quantity_change cannot be zero"}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    new_stock = product.current_stock + quantity_change
    if new_stock < 0:
        return jsonify({
            "error": f"Cannot reduce stock below zero (current stock: {product.current_stock})"
        }), 400

    product.current_stock = new_stock
    movement = StockMovement(
        product_id=product.id,
        movement_type=movement_type,
        quantity_change=quantity_change,
        resulting_stock=new_stock,
        notes=(data.get("notes") or "").strip(),
        created_by=request.current_user.id,
    )
    db.session.add(movement)
    db.session.commit()

    return jsonify({"product": product.to_dict(), "movement": movement.to_dict()})


@stock_bp.route("/movements", methods=["GET"])
@token_required
def list_movements():
    query = StockMovement.query
    product_id = request.args.get("product_id")
    if product_id:
        query = query.filter_by(product_id=product_id)
    movements = query.order_by(StockMovement.created_at.desc()).limit(200).all()
    return jsonify([m.to_dict() for m in movements])
