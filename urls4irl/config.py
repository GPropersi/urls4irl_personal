from dotenv import load_dotenv
from os import environ, path

basedir = path.abspath(path.dirname(__file__))
load_dotenv(path.join(basedir, ".env"))

class Config:
    """Set Flask config variables."""

    FLASK_ENV = environ.get("FLASK_ENV")
    SECRET_KEY = environ.get("SECRET_KEY")
    SESSION_PERMANENT = "False"
    SESSION_TYPE = "sqlalchemy"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    POSTGRES_URI_FOR_PROD = environ.get("DATABASE_URL")
    print(POSTGRES_URI_FOR_PROD)

class DevelopmentConfig(Config):
    DEBUG = "True"
