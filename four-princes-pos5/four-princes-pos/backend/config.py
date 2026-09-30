import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

# Load a .env file if python-dotenv is available (optional convenience)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(basedir, ".env"))
except ImportError:
    pass


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-secret-in-production")
    JWT_EXPIRES = timedelta(hours=8)

    # Defaults to a local SQLite file so the app runs with zero setup.
    # For the real deployment, set DATABASE_URL in backend/.env, e.g.:
    #   DATABASE_URL=mysql+pymysql://root:@localhost/four_princes_pos
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(basedir, "four_princes_dev.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Caps how large a restore upload can be. Generous for a single shop's
    # database, but stops something absurd from being uploaded by mistake.
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB

    # Comma-separated list of allowed frontend origins, or "*" for any (fine for
    # a single-shop LAN deployment; tighten this for production).
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
