"""
Contains database models for URLS4IRL.

Users.
TODO: UTubs.
TODO: URLs
TODO: tags
"""
from datetime import datetime
from urls4irl import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    """Class represents a User, with their username, email, and hashed password."""

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    email_confirm = db.Column(db.Boolean, default=False)
    password = db.Column(db.String(166), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    utubs_created = db.relationship('UTub', backref='created_by', lazy=True)
    # links_added = db.relationship('URLs', backref='added_by', lazy=True)
    #TODO Relationship to the URL they added
    #TODO Relationship to the URL tag they added

    def __repr__(self):
        return f"User: {self.username}, Email: {self.email}, Password: {self.password}"


class UTub(db.Model):
    """Class represents a UTub. A UTub is created by a specific user, but has read-edit access given to other users depending on who it
    is shared with. The UTub contains a set of URL's and their associated tags."""

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False) # Note that multiple UTubs can have the same name, maybe verify this per user?
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    # links = db.relationship('URLs', backref='urls', lazy='select')