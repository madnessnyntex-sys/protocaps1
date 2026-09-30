"""Resets the database and loads demo data: 2 accounts, 5 categories, 16 products
with a deliberate mix of stock levels so the color-coded system has something
to show (some green, some amber, some red) right out of the box.

Run with:  python seed.py
"""
from app import create_app
from extensions import db
from models import Category, Product, StockMovement, User

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(username="admin", full_name="Shop Owner", role="admin")
    admin.set_password("admin123")
    staff = User(username="staff", full_name="Staff Cashier", role="staff")
    staff.set_password("staff123")
    db.session.add_all([admin, staff])
    db.session.commit()

    categories = {
        "Men's Apparel": "Shirts, pants, and shorts for men",
        "Women's Apparel": "Blouses, dresses, and pants for women",
        "Kids' Apparel": "Clothing for children",
        "Undergarments": "Underwear, socks, and sleepwear",
        "Accessories": "Belts, caps, and bags",
    }
    cat_objs = {}
    for name, desc in categories.items():
        c = Category(name=name, description=desc)
        db.session.add(c)
        cat_objs[name] = c
    db.session.commit()

    # name, sku, category, size, color, price, cost, reorder_level, starting stock
    products = [
        ("Round Neck T-Shirt", "TS-001", "Men's Apparel", "M", "White", 179.00, 95.00, 10, 40),
        ("Round Neck T-Shirt", "TS-002", "Men's Apparel", "L", "Black", 179.00, 95.00, 10, 8),
        ("Polo Shirt", "PL-001", "Men's Apparel", "L", "Navy Blue", 349.00, 190.00, 5, 3),
        ("Denim Jeans", "DJ-001", "Men's Apparel", "32", "Blue", 699.00, 380.00, 5, 0),
        ("Cargo Shorts", "CS-001", "Men's Apparel", "M", "Khaki", 399.00, 210.00, 8, 15),
        ("Floral Blouse", "BL-001", "Women's Apparel", "S", "Pink", 289.00, 150.00, 8, 20),
        ("Casual Dress", "DR-001", "Women's Apparel", "M", "Red", 549.00, 300.00, 5, 2),
        ("Denim Skirt", "SK-001", "Women's Apparel", "M", "Blue", 329.00, 175.00, 6, 12),
        ("Leggings", "LG-001", "Women's Apparel", "L", "Black", 199.00, 100.00, 10, 25),
        ("Kids T-Shirt Set", "KD-001", "Kids' Apparel", "6", "Multicolor", 249.00, 130.00, 8, 18),
        ("Kids School Shorts", "KD-002", "Kids' Apparel", "8", "Navy Blue", 199.00, 100.00, 8, 6),
        ("Cotton Briefs (3-pack)", "UN-001", "Undergarments", "M", "Assorted", 149.00, 75.00, 15, 30),
        ("Ankle Socks (3-pack)", "UN-002", "Undergarments", "Free Size", "White", 99.00, 45.00, 15, 4),
        ("Sleepwear Set", "UN-003", "Undergarments", "L", "Grey", 329.00, 170.00, 6, 0),
        ("Canvas Belt", "AC-001", "Accessories", "Free Size", "Brown", 199.00, 90.00, 6, 10),
        ("Baseball Cap", "AC-002", "Accessories", "Free Size", "Black", 179.00, 80.00, 6, 22),
    ]

    for name, sku, cat_name, size, color, price, cost, reorder, stock in products:
        p = Product(
            name=name, sku=sku, category_id=cat_objs[cat_name].id,
            size=size, color=color, price=price, cost=cost,
            reorder_level=reorder, current_stock=stock,
        )
        db.session.add(p)
        db.session.flush()
        if stock > 0:
            db.session.add(StockMovement(
                product_id=p.id, movement_type="initial",
                quantity_change=stock, resulting_stock=stock,
                notes="Initial seed stock", created_by=admin.id,
            ))

    db.session.commit()
    print("Seed complete.")
    print("Admin login  -> username: admin / password: admin123")
    print("Staff login  -> username: staff / password: staff123")
    print("(Change both passwords after your first login.)")
