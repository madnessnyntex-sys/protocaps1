from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from sqlalchemy import func

from auth_utils import token_required
from extensions import db
from models import Product, Sale, SaleItem

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/summary", methods=["GET"])
@token_required
def summary():
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())

    today_revenue = db.session.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(
        Sale.status == "completed", Sale.created_at >= today_start
    ).scalar()

    week_revenue = db.session.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(
        Sale.status == "completed", Sale.created_at >= week_start
    ).scalar()

    today_txn_count = db.session.query(func.count(Sale.id)).filter(
        Sale.status == "completed", Sale.created_at >= today_start
    ).scalar()

    products = Product.query.filter_by(is_active=True).all()
    low_stock_count = sum(1 for p in products if p.stock_status() == "low_stock")
    out_of_stock_count = sum(1 for p in products if p.stock_status() == "out_of_stock")

    top_rows = (
        db.session.query(SaleItem.product_id, func.sum(SaleItem.quantity).label("qty_sold"))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.status == "completed", Sale.created_at >= week_start)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = []
    for row in top_rows:
        product = db.session.get(Product, row.product_id)
        if product:
            top_products.append({
                "id": product.id, "name": product.name, "sku": product.sku, "qty_sold": int(row.qty_sold)
            })

    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(10).all()

    return jsonify({
        "today_revenue": float(today_revenue or 0),
        "week_revenue": float(week_revenue or 0),
        "today_transaction_count": int(today_txn_count or 0),
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "top_products": top_products,
        "recent_sales": [s.to_dict() for s in recent_sales],
    })
