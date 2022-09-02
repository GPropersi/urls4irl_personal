from werkzeug.security import check_password_hash, generate_password_hash
from flask import render_template, url_for, redirect, flash, request, jsonify, abort
from urls4irl import app, db
from urls4irl.forms import (UserRegistrationForm, LoginForm, UTubForm, EditUTubNameDescForm, 
                            UTubNewUserForm, UTubNewURLForm, UTubNewUrlTagForm)
from urls4irl.models import User, Utub, URLS, Utub_Urls, Tags, Url_Tags, Utub_Users
from flask_login import login_user, login_required, current_user, logout_user
import json

"""#####################        MAIN ROUTES        ###################"""

@app.route('/')
def splash():
    """
    Splash page for an unlogged in user
    """
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return render_template('splash.html')

@app.route('/home', methods=["GET"])
@login_required
def home():
    """
    Splash page for logged in user. Loads and displays all UTubs, and contained URLs.

    Can return an Error if there are invalid arguments in the URL, or the user
    has requested access to a UTub they are not a part of.
    
    Args:
        /home : With no args, this returns all UTubIDs for the given user
        /home?UTubID=[int] = Where the integer value is the associated UTubID
                                that the user clicked on

    Returns:
        On /home - All UTub names and IDs
        On /home?UTubID=[int] - UTub name, creator, URLs, associated tags, and members for
            requested UTub in a JSON file
    """
    if not request.args:
        # User got here without any arguments in the URL
        # Therefore, only provide UTub name and UTub ID
        utub_details = current_user.serialized_on_initial_load
        return render_template('home.html', utubs_for_this_user=utub_details)

    elif len(request.args) > 1 or 'UTubID' not in request.args:
        # Too many args in URL, or wrong argument
        return abort(404)

    else:   
        requested_id = request.args.get('UTubID')

        utub = Utub.query.get_or_404(requested_id)
        
        if int(current_user.get_id()) not in [int(member.user_id) for member in utub.members]:
            # User is not member of the UTub they are requesting
            access_denied = {
                'error': 'You do not have permission to access this UTub.',
                'category': 'danger'
            }
            return jsonify(access_denied), 403

        utub_data_serialized = utub.serialized

        return jsonify(utub_data_serialized)

"""#####################        END MAIN ROUTES        ###################"""

"""#####################        USER LOGIN/LOGOUT/REGISTRATION ROUTES        ###################"""

@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Logs in the user.

    Client can send a GET or POST request.
    On GET:
        Returns the HTML WTForm for logging in a user.
        Form inputs include:
            Username
            Password
            
    On POST:
        On success, logs the user in and sends them to their requested
            next page, or to their home page.
        On failure, sends an error response back with JSON message.
            Possible failures include:
                Invalid credentials
                Empty inputs
    """
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    login_form = LoginForm()

    if request.method == 'GET':
        return render_template('_login_form.html', login_form=login_form)

    else:
        if login_form.validate_on_submit():
            username = login_form.username.data
            user = User.query.filter_by(username=username).first()

            if user and check_password_hash(user.password, login_form.password.data):
                login_user(user)    # Can add Remember Me functionality here
                next_page = request.args.get('next')    # Takes user to the page they wanted to originally before being logged in

                flash(f"Successful login, {username}", category="success")
                return url_for(next_page) if next_page else url_for('home')

            else:
                flash_message = "Login Unsuccessful. Please check username and password."
                flash_category = "danger"
                
                data = json.dumps({"flash": {"flashMessage": flash_message, "flashCategory": flash_category}}, ensure_ascii=False)
                response_code = 422

        else:
            data = json.dumps(login_form.errors, ensure_ascii=False)
            response_code = 422

    return jsonify(data), response_code
        
@app.route('/register', methods=['GET', 'POST'])
def register():
    """
    Registers a new user.

    On GET:
        Provides the HTML form data to register.
        Form inputs include:
            Username
            Email
            Email Confirmation
            Password
            Password Confirmation

    On POST:
        Checks the user's requested registration data.
        On success, logs the user in and sends them to their home page.
        On failure, returns errors used to populate the form.
            Possible failures include:
                Empty inputs
                Unique inputs not unique (i.e. username, email)
                Invalid confirmation inputs (email, password)
    """
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    register_form = UserRegistrationForm()

    if request.method == 'GET':
        return render_template('_register_form.html', register_form=register_form)

    else:
        if register_form.validate_on_submit():
            username = register_form.username.data
            email = register_form.email.data
            password = generate_password_hash(register_form.password.data, method='pbkdf2:sha512', salt_length=16)
            new_user = User(username=username, email=email, email_confirm=False, password=password)
            db.session.add(new_user)
            db.session.commit()
            user = User.query.filter_by(username=username).first()
            login_user(user)
            return url_for('home')

        else:
            registration_errors = json.dumps(register_form.errors, ensure_ascii=False)
            return jsonify(registration_errors), 422

@app.route('/logout')
def logout():
    """Logs user out by clearing session details. Returns to login page."""
    logout_user()
    return redirect(url_for('splash'))

"""#####################        END USER LOGIN/LOGOUT/REGISTRATION ROUTES        ###################"""

"""#####################        UTUB INVOLVED ROUTES        ###################"""

@app.route('/create_utub', methods=["GET", "POST"])
@login_required
def create_utub():
    """
    User wants to create a new utub.

    On GET:
        Sends the HTML Form data required to make a new UTub.
        Form inputs include:
            UTub Name
            UTub Description

    On POST:
        Checks the requested new UTub information.
        On success, creates the UTub, and responds with a success code of 200.
        On failure, returns errors used to populate the form.
            Possible failures include:
                Duplicate UTub name for this current user    
                Empty required inputs
    
    Assocation Object:
    https://docs.sqlalchemy.org/en/14/orm/basic_relationships.html#many-to-many
    """

    utub_form = UTubForm()

    if request.method == 'GET':
        return render_template('_create_utub_form.html', utub_form=utub_form)
    
    if utub_form.validate_on_submit():
        name = utub_form.name.data
        description = utub_form.description.data

        # Get all utubs current user is in
        utub_details = current_user.serialized_on_initial_load
        if len(utub_details) > 0:
            utub_names = set([val['name'] for val in utub_details])
            
            if name in utub_names:
                error = {
                    'error': 'You are already a part of a UTub with that name.',
                    'category': 'danger'
                }
                return jsonify(error), 409
        
        new_utub = Utub(name=name, utub_creator=current_user.get_id(), utub_description=description)
        creator_to_utub = Utub_Users()
        creator_to_utub.to_user = current_user
        new_utub.members.append(creator_to_utub)
        db.session.commit()

        success = {
            'message': f'Successfully made your UTub named {name}',
            'category': 'success',
            'UTubID': f'{new_utub.id}',
            'UTub_Name': f'{name}'
        }
        flash(f"Successfully made your UTub named {name}", category="success")
        return jsonify(success), 200
    
    else:
        creation_utub_errors = json.dumps(utub_form.errors, ensure_ascii=False)
        return jsonify(creation_utub_errors), 404

@app.route('/delete_utub', methods=["POST"])
@login_required
def delete_utub():
    """
    Creator of the UTub wants to delete their UTub. It deletes all associations between 
    this UTub and its contained URLS and users.

    https://docs.sqlalchemy.org/en/13/orm/cascades.html#delete

    On POST:
        Receives a JSON containing the UTubID to delete:
        UTubID (int): The ID of the UTub to be deleted

        Example:
            {'UTubID': 1}

    On successful deletion, sends back a 200 response code with a JSON message.
    On unsuccessful deletion, sends back an error with a JSON message.
        Possible failures include:
            Invalid permission to delete this UTub
            UTub does not exist
            Invalid JSON sent along with the POST request
    """
    delete_utub_json = dict(request.get_json())

    if not delete_utub_json or 'UTubID' not in delete_utub_json:
        delete_failure = {
            'error': 'You do not have permission to delete this UTub.',
            'category': 'danger'
        }
        return jsonify(delete_failure), 403

    utub_id = delete_utub_json['UTubID']

    utub = Utub.query.get(int(utub_id))

    if not utub or int(current_user.get_id()) != int(utub.created_by.id):
        delete_failure = {
            'error': 'You do not have permission to delete this UTub.',
            'category': 'danger'
        }
        return jsonify(delete_failure), 403
    
    else:
        utub = Utub.query.get(int(utub_id))
        db.session.delete(utub)
        db.session.commit()
        delete_success = {
            'message': 'You successfully deleted this UTub',
            'category': 'success',
            'UTubID': utub_id,
            'url': url_for('home')
        }

        return jsonify(delete_success)

@app.route('/update_utub_details/<int:utub_id>', methods=["GET", "POST"])
@login_required
def update_utub_details(utub_id: int):
    """
    Creator wants to update their UTub name or description.
    Name limit is 30 characters
    Description limit is 500 characters.
    Form data required to be sent from the client with parameters:
        utub_name - The name to be updated
        utub_description - The description to be updated

    On GET:
        Returns the HTML Form data to edit the description of the requested UTub.
        Form inputs include:
            Description of UTub to add

        Args:
            utub_id: The ID of the utub to add a description to

    On POST:
        Attempts to change the description of the UTub.
        On success, returns UTubID and description in JSON, with 200 response code.
            On possibility of identical message entered, return success
            with message indicating duplicate description
        On failure, returns JSON containing error message:
            Possible failures include:
                Invalid permissions
                Description too long

    Example JSON on POST from client:
    {
        "utub_ID"           : 1,
        "utub_name":        : "New UTub name"
        "utub_description"  : "New UTub description."
    }
    """
    current_utub = Utub.query.get(int(utub_id))

    if int(current_user.get_id()) != int(current_utub.created_by.id):
        # Only the creator can change UTub description
        return jsonify({
            'error': 'Not authorized to edit this UTub.',
            'category': 'danger'}), 403

    utub_details_form = EditUTubNameDescForm()

    if request.method == 'GET':
        return render_template('_edit_utub_details_form.html', utub_details_form=utub_details_form)

    if utub_details_form.validate_on_submit():
        current_utub_name = current_utub.name
        current_utub_description = current_utub.utub_description

        new_utub_name = utub_details_form.utub_name.data
        new_utub_description = utub_details_form.utub_description.data

        if current_utub_description is None:
            # An empty description in database will show as None here, but need to compare 
            # the empty string from form input, so set it to ""
            current_utub_description = ""

        if new_utub_description != current_utub_description or new_utub_name != current_utub_name:
            # Only commit if the descriptions or names were different are different
            current_utub.utub_description = new_utub_description
            db.session.commit()

            return jsonify({
                'utubID': utub_id,
                'utub_name': new_utub_name,
                'utub_description': current_utub_description}), 200

        else:
            # Input description identical to current utub description
            return jsonify({
                'message': "No changes made, descriptions/names identical",
                'utubID': utub_id,
                'utub_name': current_utub_name,
                'utub_description': current_utub_description}), 200

    else:
        # User entered too long of a description, or other form errors
        utub_desc_errors = json.dumps(utub_details_form.errors, ensure_ascii=False)
        return jsonify(utub_desc_errors), 404

"""#####################        END UTUB INVOLVED ROUTES        ###################"""

"""#####################        USER INVOLVED ROUTES        ###################"""

@app.route('/delete_user',  methods=["POST"])
@login_required
def delete_user():
    """
    Deletes a user from a Utub. The creator of the Utub can delete anyone but themselves.
    Any user can remove themselves from a UTub they did not create.
    
    On POST: 
        Request is sent with a JSON indicating the UTub ID and User ID to remove.

    i.e. On post, the following JSON would be sent, to delete User 2 from Utub 1: 
    {
        'UtubID': 1,
        'UserID': 2
    }

    On success, removes the user from the requested UTub.
    On failure, returns error message in a JSON to indicate the error.
        Possible failures include:
            Invalid inputs
            Invalid permissions
            Creator tried to remove themselves
    """
    delete_user_json = dict(request.get_json())

    if not delete_user_json or 'UTubID' not in delete_user_json or 'UserID' not in delete_user_json:
        flash("Something went wrong", category="danger")
        return abort(404)

    utub_id = delete_user_json['UTubID']
    user_id = delete_user_json['UserID']

    current_utub = Utub.query.get(int(utub_id))

    if not current_utub:
        # UTub must exist
        user_delete_failure = {
            'error': 'Cannot remove user from this UTub.',
            'category': 'danger'
        }
        return jsonify(user_delete_failure), 403

    if int(user_id) == int(current_utub.created_by.id):
        # Creator tried to delete themselves
        user_delete_failure = {
            'error': 'Creator cannot be removed.',
            'category': 'danger'
        }
        return jsonify(user_delete_failure), 400

    current_user_ids_in_utub = [int(member.user_id) for member in current_utub.members]

    if int(user_id) not in current_user_ids_in_utub:
        # User not in this Utub

        user_delete_failure = {
            'error': 'Cannot remove user from this UTub.',
            'category': 'danger'
        }
        return jsonify(user_delete_failure), 400

    if int(current_user.get_id()) == int(current_utub.created_by.id):
        # Creator of utub wants to delete someone
        creator = True
        user_to_delete_in_utub = [member_to_delete for member_to_delete in current_utub.members if int(user_id) == (member_to_delete.user_id)][0]

    elif int(current_user.get_id()) in current_user_ids_in_utub and int(user_id) == int(current_user.get_id()):
        # User in this UTub and user wants to remove themself
        creator = False
        user_to_delete_in_utub = [member_to_delete for member_to_delete in current_utub.members if int(user_id) == (member_to_delete.user_id)][0]

    else:
        user_delete_failure = {
            'error': 'You do not have permission to remove this user.',
            'category': 'danger'
        }
        flash("Error: Only the creator of a UTub can delete other users. Only you can remove yourself.", category="danger")
        return jsonify(user_delete_failure), 403
    
    current_utub.members.remove(user_to_delete_in_utub)
    db.session.commit()

    user_delete_success = {
        'Result': 'Success',
        'UTub': utub_id,
        'User_Removed': user_id
    }

    if creator:
        user_delete_success['message'] = 'Successfully removed user.'
        user_delete_success['category'] = 'success'
    else:
        user_delete_success['message'] = 'Left the UTub.'
        user_delete_success['category'] = 'success'

    return jsonify(user_delete_success), 200

@app.route('/add_user/<int:utub_id>', methods=["GET", "POST"])
@login_required
def add_user(utub_id: int):
    """
    Creater of utub wants to add a user to the utub.
    
    Args:
        utub_id (int): The utub that this user is being added to

    On GET:
        Returns the HTML Form data to add a user to the requested UTub.
        Form inputs include:
            Username of user to add to this UTub

    On POST:
        Attempts to add the user to this UTub.
        On success, returns UTubID and UserID in JSON, with 200 response code.
        On failure, returns JSON containing error message:
            Possible failures include:
                Invalid permissions
                User already in the UTub
    """
    utub = Utub.query.get(utub_id)

    if int(utub.created_by.id) != int(current_user.get_id()):
        add_user_error = {
            'error': 'Not authorized to add a user to this UTub',
            'category': 'danger'
        }
        return jsonify(add_user_error), 403

    utub_new_user_form = UTubNewUserForm()

    if request.method == 'GET':
        return render_template('_add_user_form.html', utub_new_user_form=utub_new_user_form)
    
    if utub_new_user_form.validate_on_submit():
        username = utub_new_user_form.username.data
        
        new_user = User.query.filter_by(username=username).first()
        already_in_utub = [member for member in utub.members if int(member.user_id) == int(new_user.id)]

        if already_in_utub:
            return jsonify({
                'error': 'User already in this UTub.',
                'category': 'danger'}), 400
           
        else:
            new_user_to_utub = Utub_Users()
            new_user_to_utub.to_user = new_user
            new_user_id = new_user_to_utub.user_id
            utub.members.append(new_user_to_utub)
            db.session.commit()
            
            return jsonify({
                'utubID': utub_id,
                'userID': new_user_id}), 200

    else:
        add_user_errors = json.dumps(utub_new_user_form.errors, ensure_ascii=False)
        return jsonify(add_user_errors), 404

"""#####################        END USER INVOLVED ROUTES        ###################"""

"""#####################        URL INVOLVED ROUTES        ###################"""
@app.route('/delete_url', methods=["POST"])
@login_required
def delete_url():
    """
    User wants to delete a URL from a UTub. Only available to owner of that utub,
    or whoever added the URL into that Utub.

    Intakes a JSON body as follows: {
        'UTubID': int value for utub id,
        'url_ID': int value for url id
    }

    Args:
        utub_id (int): The ID of the UTub that contains the URL to be deleted
        url_id (int): The ID of the URL to be deleted

    On success, returns JSON with success of deletion and 200 response code.
    On failure, returns failure to flash to the client.
        Possible failures include:
            Invalid inputs
            Invalid permissions
    """
    json_args = dict(request.get_json())

    if not json_args or 'UTubID' not in json_args or 'url_ID' not in json_args:
        flash("Something went wrong", category="danger")
        return abort(404)
    
    utub_id = json_args.get('UTubID')
    url_id = json_args.get('url_ID')

    try:
        utub_id = int(utub_id)
        url_id = int(url_id)
    except ValueError:
        flash("Something went wrong", category="danger")
        return abort(404)

    utub = Utub.query.get(int(utub_id))
    owner_id = int(utub.created_by.id)
    
    # Search through all urls in the UTub for the one that matches the prescribed URL ID and get the user who added it - should be only one
    url_added_by = [url_in_utub.user_that_added_url.id for url_in_utub in utub.utub_urls if int(url_in_utub.url_id) == int(url_id)]

    if not url_added_by or len(url_added_by) != 1:
        # This URL or does not exist in the UTub
        delete_url_error = {
            'error': 'This UTub does not contain the specified URL.',
            'category': 'danger'
        }
        return jsonify(delete_url_error), 404

    # Otherwise, only one user should've added this url - retrieve them
    url_added_by = url_added_by[0]
    

    if int(current_user.get_id()) == owner_id or int(current_user.get_id()) == url_added_by:
        # User is creator of this UTub, or added the URL
        utub_url_user_row = Utub_Urls.query.filter_by(utub_id=utub_id, url_id=url_id).all()

        db.session.delete(utub_url_user_row[0])

        # Remove all tags associated with this URL in this UTub as well
        Url_Tags.query.filter_by(utub_id=utub_id, url_id=url_id).delete()

        db.session.commit()

        delete_success = {
            'message': 'You successfully deleted the URL from the UTub.',
            'category': 'success'
        }
        flash("You successfully deleted the URL from the UTub.", category="danger")
        return jsonify(delete_success), 200

    else:
        delete_url_error = {
            'error': 'You do not have permission to remove this URL.',
            'category': 'danger'
        }
        return jsonify(delete_url_error), 403

@app.route('/add_url/<int:utub_id>', methods=["GET", "POST"])
@login_required
def add_url(utub_id: int):
    """
    User wants to add a URL to UTub.

    Args:
        utub_id (int): The Utub to add this URL to
    
    On GET:
        Sends the HTML Form data required to add a URL.
        Form inputs include:
            The URL to add
            An optional description of the URL

    On POST:
        Checks the sent in Form data.
        On success, adds the URL to this UTub, and sends back a 200 response code.
        On failure, sends back a JSON response.
            Possible failures include:
                URL already contained in the UTub
                URL not valid
                Missing inputs
    """
    utub = Utub.query.get(int(utub_id))

    if int(current_user.get_id()) not in [int(member.user_id) for member in utub.members]:
        add_url_error = {
            'error': 'You do not have permission to add a URL to this UTub.',
            'category': 'danger'
        }
        return jsonify(add_url_error), 403

    utub_new_url_form = UTubNewURLForm()

    if request.method == 'GET':
        return render_template('_add_url_form.html', utub_new_url_form=utub_new_url_form)
    
    if utub_new_url_form.validate_on_submit():
        url_string = utub_new_url_form.url_string.data
        url_description = utub_new_url_form.url_description.data

        # Get URL if already created
        already_created_url = URLS.query.filter_by(url_string=url_string).first()

        if already_created_url:

            # Get all urls currently in utub
            urls_in_utub = [utub_user_url_object.url_in_utub for utub_user_url_object in utub.utub_urls]
        
            #URL already generated, now confirm if within UTUB or not
            if already_created_url in urls_in_utub:
                # URL already in UTUB
                add_url_error = {
                    'error': 'URL already in UTub.',
                    'category': 'danger'
                }
                return jsonify(add_url_error), 409

            url_utub_user_add = Utub_Urls(utub_id=utub_id, url_id=already_created_url.id, user_id=int(current_user.get_id()), url_notes=url_description)

        else:
            # Else create new URL and append to the UTUB
            new_url = URLS(url_string=url_string, created_by=int(current_user.get_id()))
            db.session.add(new_url)
            db.session.commit()
            url_utub_user_add = Utub_Urls(utub_id=utub_id, url_id=new_url.id, user_id=int(current_user.get_id()), url_notes=url_description)
            
        db.session.add(url_utub_user_add)
        db.session.commit()

        return jsonify({'url_added': url_string, 'utubID': utub_id}), 200

    else:
        url_errors = json.dumps(utub_new_url_form.errors, ensure_ascii=False)
        return jsonify(url_errors), 404
     
"""#####################        END URL INVOLVED ROUTES        ###################"""

"""#####################        TAG INVOLVED ROUTES        ###################"""

@app.route('/add_tag/<int:utub_id>/<int:url_id>', methods=["GET", "POST"])
@login_required
def add_tag(utub_id: int, url_id: int):
    """
    User wants to add a tag to a URL. 5 tag limit per URL.
    
    Args:
        utub_id (int): The utub that this user is being added to
        url_id (int): The URL this user wants to add a tag to

    On GET:
        Sends the HTML Form data needed to add a tag to a URL in this UTub
        Form data includes:
            Tag name to add

    On POST:
        Checks if tag can be added to URL in UTub.
        If success, sends back JSON response with 200 response code.
        If failure, sends back JSON response with error message.
            Possible failures included:
                5 tag limit on URL reached
                Tag already on URL
                Invalid permissions
                Empty input
    """
    utub = Utub.query.get(utub_id)
    utub_url = [url_in_utub for url_in_utub in utub.utub_urls if url_in_utub.url_id == url_id]
    user_in_utub = [int(member.user_id) for member in utub.members if int(member.user_id) == int(current_user.get_id())]

    if not user_in_utub or not utub_url:
        # How did a user not in this utub get access to add a tag to this URL?
        # How did a user try to add a tag to a URL not contained within the UTub?
        add_tag_error = {
            'error': 'Not able to process this tag request.',
            'category': 'danger'
        }
        return jsonify(add_tag_error), 403
       
    url_tag_form = UTubNewUrlTagForm()

    if request.method == "GET":
        return render_template('_add_tag_to_url_form.html', url_tag_form=url_tag_form)

    if url_tag_form.validate_on_submit():

        tag_to_add = url_tag_form.tag_string.data

        # If too many tags, disallow adding tag
        tags_already_on_this_url = [tags for tags in utub.utub_url_tags if int(tags.url_id) == int(url_id)]

        if len(tags_already_on_this_url) > 4:
                # Cannot have more than 5 tags on a URL
                add_tag_error = {
                    'error': 'You cannot add more tags to this URL.',
                    'category': 'danger'
                }
                return jsonify(add_tag_error), 400

        # If not a tag already, create it
        tag_already_created = Tags.query.filter_by(tag_string=tag_to_add).first()

        if tag_already_created:
            # Check if tag already on url
            this_tag_is_already_on_this_url = [tags for tags in tags_already_on_this_url if int(tags.tag_id) == int(tag_already_created.id)]

            if this_tag_is_already_on_this_url:
                add_tag_error = {
                    'error': 'This tag is already on this URL.',
                    'category': 'danger'
                }
                return jsonify(add_tag_error), 400

            # Associate with the UTub and URL
            utub_url_tag = Url_Tags(utub_id=utub_id, url_id=url_id, tag_id=tag_already_created.id)
            tag_id = tag_already_created.id

        else:
            # Create tag, then associate with this UTub and URL
            new_tag = Tags(tag_string=tag_to_add, created_by=int(current_user.get_id()))
            db.session.add(new_tag)
            db.session.commit()
            utub_url_tag = Url_Tags(utub_id=utub_id, url_id=url_id, tag_id=new_tag.id)
            tag_id = new_tag.id

        db.session.add(utub_url_tag)
        db.session.commit()

        add_tag_success = {
            'message': 'Tag added successfully.',
            'category': 'info',
            'tag': tag_to_add,
            'tagID': tag_id,
            'url': utub_url[0].url_in_utub.url_string,
            'urlID': utub_url[0].url_in_utub.id,
            'utubID': utub_id
        }

        return jsonify(add_tag_success), 200

    else:
        creation_tag_errors = json.dumps(url_tag_form.errors, ensure_ascii=False)
        return jsonify(creation_tag_errors), 404


@app.route('/remove_tag', methods=["POST"])
@login_required
def remove_tag():
    """
    User wants to delete a tag from a URL contained in a UTub. Only available to members of that UTub.

    On POST:
        Receives a JSON containing the following necessary inputs:
            UTubID (int): The ID of the UTub that contains the URL to be deleted
            UrlID (int): The ID of the URL to be deleted
            TagID (int): The ID of the tag

        On successful removal of tag, sends back JSON message with 200 code.
        On failure, sends back JSON message with error.
            Possible failures include:
                Invalid inputs
                Invalid permissions
    """
    json_args = dict(request.get_json())

    if not json_args or 'UTubID' not in json_args or 'UrlID' not in json_args or "TagID" not in json_args:
        flash("Something went wrong", category="danger")
        return abort(404)
    
    utub_id = json_args.get('UTubID')
    url_id = json_args.get('UrlID')
    tag_id = json_args.get('TagID')

    try:
        utub_id = int(utub_id)
        url_id = int(url_id)
        tag_id = int(tag_id)
    except ValueError:
        flash("Something went wrong", category="danger")
        return abort(404)

    utub = Utub.query.get(int(utub_id))
    user_in_utub = [user for user in utub.members if user.user_id == int(current_user.get_id())]
    if not user_in_utub:
        tag_error_delete = {
            'error': 'You do not have permission to remove this tag.',
            'category': 'danger'
        }
        return jsonify(tag_error_delete), 403

    tag_for_url_in_utub = Url_Tags.query.filter_by(utub_id=utub_id, url_id=url_id, tag_id=tag_id).first()

    tag_error_success = {
        "message": "Tag successfully removed",
        "category": "success",
        "utub_id": utub_id,
        "utub": utub.name,
        "removed_by": user_in_utub[0].to_user.username,
        "url_untagged": tag_for_url_in_utub.tagged_url.url_string,
        "tag_removed": tag_for_url_in_utub.tag_item.tag_string
        }

    db.session.delete(tag_for_url_in_utub)
    db.session.commit()

    return jsonify(tag_error_success), 200

"""#####################        END TAG INVOLVED ROUTES        ###################"""