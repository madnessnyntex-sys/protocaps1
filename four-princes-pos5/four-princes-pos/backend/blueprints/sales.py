from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from auth_utils import role_required, token_required
from extensions import db
from models import Product, Sale, SaleItem, StockMovement

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("", methods=["POST"])
@token_required
def create_sale():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    payment_method = data.get("payment_method", "cash")

    try:
        discount = round(float(data.get("discount", 0) or 0), 2)
    except (TypeError, ValueError):
        return jsonify({"error": "discount must be numeric"}), 400

    if not items:
        return jsonify({"error": "Cart is empty"}), 400
    if payment_method not in ("cash", "digital"):
        return jsonify({"error": "payment_method must be 'cash' or 'digital'"}), 400
    if discount < 0:
        return jsonify({"error": "discount cannot be negative"}), 400

    # Validate every line before touching the database, so a bad line never
    # leaves stock partially deducted.
    line_data = []
    subtotal = 0.0
    for item in items:
        product_id = item.get("product_id")
        try:
            quantity = int(item.get("quantity"))
        except (TypeError, ValueError):
            return jsonify({"error": "Each item needs a valid quantity"}), 400
        if quantity <= 0:
            return jsonify({"error": "Quantity must be greater than zero"}), 400

        product = db.session.get(Product, product_id)
        if not product or not product.is_active:
            return jsonify({"error": f"Product {product_id} not found or inactive"}), 404
        if product.current_stock < quantity:
            return jsonify({
                "error": f"Not enough stock for '{product.name}' "
                         f"(available: {product.current_stock}, requested: {quantity})"
            }), 400

        unit_price = float(product.price)
        line_subtotal = round(unit_price * quantity, 2)
        subtotal += line_subtotal
        line_data.append((product, quantity, unit_price, line_subtotal))

    subtotal = round(subtotal, 2)
    if discount > subtotal:
        return jsonify({"error": "Discount cannot exceed the subtotal"}), 400
    total_amount = round(subtotal - discount, 2)

    amount_tendered = None
    change_amount = None
    if payment_method == "cash":
        try:
            amount_tendered = round(float(data.get("amount_tendered")), 2)
        except (TypeError, ValueError):
            return jsonify({"error": "amount_tendered is required for cash payments"}), 400
        if amount_tendered < total_amount:
            return jsonify({"error": "Amount tendered is less than the total due"}), 400
        change_amount = round(amount_tendered - total_amount, 2)

    sale = Sale(
        invoice_number="PENDING",
        cashier_id=request.current_user.id,
        subtotal=subtotal,
        discount=discount,
        total_amount=total_amount,
        payment_method=payment_method,
        amount_tendered=amount_tendered,
        change_amount=change_amount,
        status="completed",
    )
    db.session.add(sale)
    db.session.flush()  # assigns sale.id
    sale.invoice_number = f"INV-{sale.id:06d}"

    for product, quantity, unit_price, line_subtotal in line_data:
        db.session.add(SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=line_subtotal,
        ))

        product.current_stock -= quantity
        db.session.add(StockMovement(
            product_id=product.id,
            movement_type="sale",
            quantity_change=-quantity,
            resulting_stock=product.current_stock,
            reference=sale.invoice_number,
            notes=f"Sold via {sale.invoice_number}",
            created_by=request.current_user.id,
        ))

    db.session.commit()
    return jsonify(sale.to_dict(include_items=True)), 201


@sales_bp.route("", methods=["GET"])
@token_required
def list_sales():
    query = Sale.query

    start = request.args.get("start")
    if start:
        try:
            query = query.filter(Sale.created_at >= datetime.strptime(start, "%Y-%m-%d"))
        except ValueError:
            return jsonify({"error": "start must be in YYYY-MM-DD format"}), 400

    end = request.args.get("end")
    if end:
        try:
            end_exclusive = datetime.strptime(end, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Sale.created_at < end_exclusive)
        except ValueError:
            return jsonify({"error": "end must be in YYYY-MM-DD format"}), 400

    sales = query.order_by(Sale.created_at.desc()).limit(200).all()
    return jsonify([s.to_dict() for s in sales])


@sales_bp.route("/<int:sale_id>", methods=["GET"])
@token_required
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale.to_dict(include_items=True))


@sales_bp.route("/<int:sale_id>/void", methods=["POST"])
@token_required
@role_required("admin")
def void_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    if sale.status == "voided":
        return jsonify({"error": "Sale is already voided"}), 400

    for item in sale.items:
        product = item.product
        product.current_stock += item.quantity
        db.session.add(StockMovement(
            product_id=product.id,
            movement_type="void_restore",
            quantity_change=item.quantity,
            resulting_stock=product.current_stock,
            reference=sale.invoice_number,
            notes=f"Stock restored from voided sale {sale.invoice_number}",
            created_by=request.current_user.id,
        ))

    sale.status = "voided"
    db.session.commit()
    return jsonify(sale.to_dict(include_items=True))
