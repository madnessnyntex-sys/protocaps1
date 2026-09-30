from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from auth_utils import token_required
from extensions import db
from models import Product, Sale, SaleItem

popularity_bp = Blueprint("popularity", __name__)


def _period_bounds():
    """Returns (start_datetime, end_datetime) as real datetime objects so
    comparisons behave identically on SQLite (dev) and MySQL (production)."""
    start_param = request.args.get("start")
    end_param = request.args.get("end")
    if start_param and end_param:
        start_dt = datetime.strptime(start_param, "%Y-%m-%d")
        end_dt = datetime.strptime(end_param, "%Y-%m-%d") + timedelta(days=1)
    else:
        days = int(request.args.get("days", 30))
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=days)
    return start_dt, end_dt


@popularity_bp.route("", methods=["GET"])
@token_required
def popularity():
    start_dt, end_dt = _period_bounds()
    dead_stock_days = int(request.args.get("dead_stock_days", 30))

    sold_rows = (
        db.session.query(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("qty_sold"),
            func.sum(SaleItem.subtotal).label("revenue"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.status == "completed")
        .filter(Sale.created_at >= start_dt)
        .filter(Sale.created_at < end_dt)
        .group_by(SaleItem.product_id)
        .all()
    )
    sold_map = {row.product_id: {"qty_sold": int(row.qty_sold), "revenue": float(row.revenue)} for row in sold_rows}

    products = Product.query.filter_by(is_active=True).all()
    ranked = []
    for p in products:
        stats = sold_map.get(p.id, {"qty_sold": 0, "revenue": 0.0})
        entry = p.to_dict()
        entry["qty_sold"] = stats["qty_sold"]
        entry["revenue"] = stats["revenue"]
        ranked.append(entry)

    sold_ranked = sorted([r for r in ranked if r["qty_sold"] > 0], key=lambda r: r["qty_sold"], reverse=True)
    best_sellers = sold_ranked[:10]

    qty_values = sorted(r["qty_sold"] for r in sold_ranked)
    if qty_values:
        mid = len(qty_values) // 2
        median_qty = qty_values[mid] if len(qty_values) % 2 else (qty_values[mid - 1] + qty_values[mid]) / 2
    else:
        median_qty = 0

    slow_movers = sorted(
        [r for r in ranked if 0 < r["qty_sold"] <= max(median_qty, 1)],
        key=lambda r: r["qty_sold"],
    )[:10]

    restock_priority = sorted(
        [r for r in ranked if r["qty_sold"] > 0 and r["status"] in ("low_stock", "out_of_stock")],
        key=lambda r: r["qty_sold"],
        reverse=True,
    )

    dead_cutoff = datetime.utcnow() - timedelta(days=dead_stock_days)
    recently_sold_ids = {
        row.product_id
        for row in (
            db.session.query(SaleItem.product_id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .filter(Sale.status == "completed")
            .filter(Sale.created_at >= dead_cutoff)
            .distinct()
            .all()
        )
    }
    dead_stock = [p.to_dict() for p in products if p.id not in recently_sold_ids]

    return jsonify({
        "period": {"start": start_dt.isoformat(), "end": end_dt.isoformat()},
        "best_sellers": best_sellers,
        "slow_movers": slow_movers,
        "restock_priority": restock_priority,
        "dead_stock": dead_stock,
        "dead_stock_days": dead_stock_days,
    })
