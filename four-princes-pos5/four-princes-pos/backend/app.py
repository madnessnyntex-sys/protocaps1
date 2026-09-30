from flask import Flask, jsonify

from config import Config
from extensions import cors, db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from blueprints.auth import auth_bp
    from blueprints.backup import backup_bp
    from blueprints.dashboard import dashboard_bp
    from blueprints.popularity import popularity_bp
    from blueprints.products import products_bp
    from blueprints.sales import sales_bp
    from blueprints.stock import stock_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(stock_bp, url_prefix="/api/stock")
    app.register_blueprint(sales_bp, url_prefix="/api/sales")
    app.register_blueprint(popularity_bp, url_prefix="/api/popularity")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(backup_bp, url_prefix="/api/backup")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Four Princes POS API"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "That file is too large to upload"}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
