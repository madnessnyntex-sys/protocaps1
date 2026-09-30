from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum("admin", "staff", name="user_role"), nullable=False, default="staff")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships (backref name chosen to avoid clashing with FK column names)
    sales = db.relationship("Sale", backref="cashier", lazy=True, foreign_keys="Sale.cashier_id")
    stock_movements = db.relationship(
        "StockMovement", backref="created_by_user", lazy=True, foreign_keys="StockMovement.created_by"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", backref="category", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_active": self.is_active,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    size = db.Column(db.String(20))
    color = db.Column(db.String(40))
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, default=5)
    current_stock = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    stock_movements = db.relationship("StockMovement", backref="product", lazy=True, foreign_keys="StockMovement.product_id")
    sale_items = db.relationship("SaleItem", backref="product", lazy=True)

    def stock_status(self):
        if self.current_stock <= 0:
            return "out_of_stock"
        elif self.current_stock <= self.reorder_level:
            return "low_stock"
        return "in_stock"

    def to_dict(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "name": self.name,
            "sku": self.sku,
            "size": self.size,
            "color": self.color,
            "price": float(self.price),
            "cost": float(self.cost),
            "reorder_level": self.reorder_level,
            "current_stock": self.current_stock,
            "status": self.stock_status(),
            "is_active": self.is_active,
        }


class StockMovement(db.Model):
    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    movement_type = db.Column(
        db.Enum("initial", "restock", "sale", "adjustment", "void_restore", name="movement_type"),
        nullable=False,
    )
    quantity_change = db.Column(db.Integer, nullable=False)  # signed: + adds stock, - removes stock
    resulting_stock = db.Column(db.Integer, nullable=False)
    reference = db.Column(db.String(100))  # e.g. an invoice number
    notes = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "movement_type": self.movement_type,
            "quantity_change": self.quantity_change,
            "resulting_stock": self.resulting_stock,
            "reference": self.reference,
            "notes": self.notes,
            "created_by_name": self.created_by_user.full_name if self.created_by_user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(30), unique=True, nullable=False)
    cashier_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    payment_method = db.Column(db.Enum("cash", "digital", name="payment_method"), nullable=False, default="cash")
    amount_tendered = db.Column(db.Numeric(10, 2))
    change_amount = db.Column(db.Numeric(10, 2))
    status = db.Column(db.Enum("completed", "voided", name="sale_status"), nullable=False, default="completed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("SaleItem", backref="sale", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "cashier_id": self.cashier_id,
            "cashier_name": self.cashier.full_name if self.cashier else None,
            "subtotal": float(self.subtotal),
            "discount": float(self.discount),
            "total_amount": float(self.total_amount),
            "payment_method": self.payment_method,
            "amount_tendered": float(self.amount_tendered) if self.amount_tendered is not None else None,
            "change_amount": float(self.change_amount) if self.change_amount is not None else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        return data


class SaleItem(db.Model):
    __tablename__ = "sale_items"

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sales.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "sku": self.product.sku if self.product else None,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "subtotal": float(self.subtotal),
        }
