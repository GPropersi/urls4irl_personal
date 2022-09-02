from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import Length, Email, EqualTo, InputRequired, ValidationError
from urls4irl.models import User
from urls4irl.url_validation import InvalidURLError, check_request_head


class UserRegistrationForm(FlaskForm):
    """Form to register users. Inherits from FlaskForm. All fields require data.

    Fields:
        username (StringField): Length Requirements? Must be a unique username
        email (Stringfield): Must be a unique email
        confirm_email (Stringfield): Confirm's email
        password (PasswordField): Can set length requirements
        confirm_password (PasswordField): Confirms passwords
        submit (SubmitField): Represents the button to submit the form
    """

    username = StringField('Username', validators=[InputRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[InputRequired(), Email()])
    confirm_email = StringField('Confirm Email', validators=[InputRequired(), EqualTo('email')])
    password = PasswordField('Password', validators=[InputRequired(), Length(min=12, max=30)])
    confirm_password = PasswordField('Confirm Password', validators=[InputRequired(), EqualTo('password')])

    submit = SubmitField('Register')

    def validate_username(self, username):
        """Validates username is unique in the db"""
        username_exists = User.query.filter_by(username=username.data).first()

        if username_exists:
            raise ValidationError('That username is already taken. Please choose another.')

        """ 
        #TODO
        Add validation for - no symbols in username, no spaces in username, only number and letters
        """

    def validate_email(self, email):
        """Validates username is unique in the db"""
        email_exists = User.query.filter_by(email=email.data).first()

        if email_exists:
            raise ValidationError('That email address is already in use.')

    def validate_password(self, password):
        """
        #TODO
        Add validation for passwords - symbols, spaces, letters, numbers allowed
        """
        pass
        

class LoginForm(FlaskForm):
    """Form to login users. Inherits from FlaskForm. All fields require data.

    Fields:
        ### TODO Email or username to login? (Stringfield): The user
        password (PasswordField): Must match the user's password
        submit (Submitfield): Represents the submit button to submit the form
    """

    username = StringField('Username', validators=[InputRequired()])
    password = PasswordField('Password', validators=[InputRequired()])

    submit = SubmitField('Login')


class UTubForm(FlaskForm):
    """Form to create a UTub. Inherits from FlaskForm. All fields require data.

    Fields:
        name (Stringfield): Maximum 30 chars? TODO
        utub_description (Stringfield): Maximum 500 chars? TODO
    """
    
    name = StringField('UTub Name', validators=[InputRequired(), Length(min=1, max=30)])
    description = StringField('UTub Description', validators=[Length(max=500)])

    submit = SubmitField('Create UTub!')

    def validate_name(self, name):
        """
        #TODO
        Add validators for letters, numbers, symbols in utub name
        - Must begin with lowercase/uppercase letters
        - Only _, ?, !, +, - allowed as symbols
        """
        pass

    def validate_description(self, description):
        """
        #TODO
        Add validators for utub description - must only contain spaces, numbers, letters
        """
        pass


class EditUTubNameDescForm(FlaskForm):
    """Form to change the name or description of a UTub.

    Fields:
        utub_name (Stringfield): Maximum 30 chars? TODO
        utub_description (Stringfield): Maximum 500 chars? TODO
    """
    
    utub_name = StringField('UTub Name', validators=[InputRequired(), Length(max=30)])
    utub_description = StringField('UTub Description', validators=[Length(max=500)])

    submit = SubmitField('Edit Details!')

    """Inherit from UTubForm?"""

    def validate_utub_name(self,utub_name):
        """
        #TODO
        Add validators for letters, numbers, symbols in utub name
        - Must begin with lowercase/uppercase letters
        - Only _, ?, !, +, - allowed as symbols
        """
        pass

    def validate_utub_description(self, utub_description):
        """
        #TODO
        Add validators for utub description - must only contain spaces, numbers, letters
        """
        pass



class UTubNewUserForm(FlaskForm):
    """Form to add a user to a UTub. Inherits from FlaskForm. All fields require data.

    Fields:
        username (Stringfield): Maximum 30 chars? TODO
    """
    
    username = StringField('Username', validators=[InputRequired(), Length(min=1, max=30)])

    submit = SubmitField('Add to this UTub!')

    def validate_username(self, username):
        """Validates username is unique in the db"""
        username_exists = User.query.filter_by(username=username.data).first()

        if not username_exists:
            raise ValidationError('That user does not exist. Note this is case sensitive.')


class UTubNewURLForm(FlaskForm):
    """Form to add a URL to a UTub. Inherits from FlaskForm. All fields require data.

    Fields:
        URL (Stringfield): Maximum 2000 chars? TODO
    """
    
    url_string = StringField('URL', validators=[InputRequired(), Length(min=1, max=2000)])
    url_description = StringField('URL Description', validators=[Length(max=140)])

    submit = SubmitField('Add URL to this UTub!')

    def validate_url_string(self, url_string):
        """Validates the URL and normalizes it with https method"""
        try:
            url_string.data = check_request_head(url_string.data)

        except InvalidURLError:
            raise ValidationError("Invalid URL entered.")

    def validate_url_description(self, url_description):
        """
        #TODO
        Validate url_description -must only contain spaces, numbers, letters
        """
        pass


class UTubNewUrlTagForm(FlaskForm):
    """Form to add a tag to a URL in a Utub.

    Fields:
        tag_string (Stringfield): Maximum 30 chars? TODO
    """
    
    tag_string = StringField('Tag', validators=[InputRequired(), Length(min=1, max=30)])

    submit = SubmitField('Add tag to this URL!')

    def validate_tag_string(self, tag_string):
        #TODO Add tag validation (PG filter?)
        pass