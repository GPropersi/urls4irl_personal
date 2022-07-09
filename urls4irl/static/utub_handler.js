$(document).ready(function() {
    // On load, get all UTub data for current logged in user
    loadUtubData(userUtubs);

    // Create UTub on button click
    $('.create-utub').click(function() {
        createUtub();
    });
    
    // Update shown UTub info with selected on radio button selection
    $('.utub-names-ids').on('change', 'input[type=radio]', function(){
        let utubToLoad = $(this).val().replace("utub", "")
        $('.utub-holder').empty();
        $('.tags-for-utub').empty();
        $('.members-holder').empty();
        getUtubInfo(utubToLoad);
    });

    // Delete a URL from a UTub on button click
    $(document).on('click', '.del-link', function() {
        const linkToDelete = $(this).attr('id');
        deleteUTubURL(linkToDelete);
    });

    // Add a tag to a URL on button click
    $(document).on('click', '.add-tag', function(event) {
        event.stopPropagation();
        const linkToAddTagTo = $(this).attr('id');
        const utubAndURL = linkToAddTagTo.split('-');
        const utubID = utubAndURL[0];
        const urlID = utubAndURL[1];
        addTag(utubID, urlID);
    });

    // Remove a tag on button click
    $(document).on('click', '.tag-del', function(event) {
        event.stopPropagation();
        const tagToRemove = $(this).parent().parent();
        const tagData = tagToRemove.attr('id');
        removeTag(tagToRemove, tagData);
    });

    // Add a URL on button click
    $('.add-url').click(function() {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            addUrlToUtub(utubId);
        };
    });

    // On URL card selection show URL info
    $(document).on('click', '.url-card', function() {
        const urlCard = $(this);
        let url_card_desc = $(this).find(".url-card-desc")[0];

        // Deselect the card if the user clicks on it again
        if ($(url_card_desc).is(":visible")) {
            urlCard.find(".url-card-desc").hide(100);
            urlCard.find(".url-card-buttons").hide(100);
            urlCard.css('background', 'none');
        } else {
            $(".url-card-desc").hide(100);
            $(".url-card-buttons").hide(100);
            $('.url-card').css('background', 'none');
            urlCard.css('background', 'silver');
            urlCard.find(".url-card-desc").show(100);
            urlCard.find(".url-card-buttons").show(100);
        };
    });

    // Add a member on button click
    $(document).on('click', '.add-user', function() {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            addMemberToUtub(utubId, selected);
        };
    });

    // Remove member on button click
    $(document).on('click', '.remove-user', function () {
        let userToRemove = $(this).attr('user');

        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            removeMemberFromUtub(userToRemove, utubId);
        };
    });

    // On click of a member card
    $(document).on('click', '.member-card', function() {
        // Allow user to deselect a member

        $('.member-card').css('background', 'gray');
        let selectedUser = $(this).css('background', 'silver');
        let selectedUserId = selectedUser.attr('id').replace('user','');
        let currentUser = $('.c-user').attr('id');
        let creator = $('[creator]').attr('id').replace('user','');

        let removeUserButton = $('.remove-user');
        if (selectedUserId != currentUser || selectedUserId != creator) {
            removeUserButton.removeClass('disabled').attr('user', selectedUserId);
        } else {
            removeUserButton.addClass('disabled').removeAttr('user');
        };
    });

    // Remove UTub on click
    $(document).on('click', '.delete-utub', function () {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            deleteUtub(utubId);
        };
    });

    // On click of a tag for filtering
    $('.tags-for-utub').on('change', 'input[type=checkbox]', function(){
        const tagSelected = $(this);
        const tagID = tagSelected.attr("tag-id");
        const tagName = tagSelected.attr("id");

        if (tagID == "select-all-tags") {
            // Handle showing all or hiding all
            filterSelectAllPressed(tagSelected);
        } else if (!tagSelected.prop("checked")) {
            // Handle if a specific tag is unchecked
            $("input[tag-id='select-all-tags']").prop("checked", false);
            filterHideURLs(tagID);
        } else {
            // Handle if a specific tag is checked
            filterShowURLs(tagID);
        };
            
    });

    var csrftoken = $('meta[name=csrf-token]').attr('content')
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            };
        }
    });
});



/**
 * @function loadUtubData
 * Loads the UTub names and IDs for the currently logged in user, occurs on first log in
 * @param {Object} userUtubs - JSON Object containing all user's utub's and their IDs
 */
function loadUtubData(userUtubs) {
    if (userUtubs.length === 0) {
        userHasUtubs(false);
        return;
    };

    let utubNames = [];
    for (let utub of userUtubs) {
        utubNames.push([utub.id, utub.name]);
    };

    const firstUtubId = putUtubNames(utubNames);
    getUtubInfo(firstUtubId);
};

/**
 * Makes a GET request promise from backend to receive the selected UTub's data, sends to displayUtubData
 * @function getUtubInfo
 * @param {string} utubId - The ID of this UTub to receive data for
 */
function getUtubInfo(utubId) {
    return $.get({
        url: '/home?UTubID=' + utubId,
        dataType: 'json'
    }).then(function(utubData, textStatus, xhr){ 
        if (xhr.status == 200) {
            displayUtubData(utubData);
        };
    }).fail(function(xhr, textStatus, error){
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category);
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

/**
 * @function userHasUtubs
 * Hides key features if the user does not have any UTubs.
 * Otherwise, shows the key features
 * @param {boolean} hasUTubs - Whether or not this user has utubs
 */
function userHasUtubs(hasUTubs){
    $('.add-url').prop({'hidden': !hasUTubs})
    if (hasUTubs) {
        $('.no-utubs').remove();
    } else {
        const noUtubLabel = $('<h4></h4>').addClass('no-utubs');
        noUtubLabel.text('No UTubs found.');
        noUtubLabel.insertBefore($('.create-utub'));
        $('.utub-title').text('No UTubs found.');
        $('.members-holder').empty();
        $('.tags-for-utub').empty();
    };
};

/**
 * @function displayUtubData
 * Parses and displays the received JSON data for this user's selected UTub
 * @param {JSON} utubData JSON data containing all UTub information for this user
 */
function displayUtubData(utubData) {
    userHasUtubs(true);
    let name = utubData.name;
    let desc = utubData.description;
    let urls = utubData.urls;
    let tags = utubData.tags;
    let members = utubData.members;
    let currentUser = $('.c-user').attr('id');

    // Clear out elements in preparation for showing the UTub's data
    $('.no-urls').remove();
    $('.utub-description').remove();
    $('.url-card').remove();
    let noUrlSelected = $("<p></p>").addClass("url-description").text("Add/Select a URL!");
    $('.url-info').empty().append(noUrlSelected);
    $('.url-buttons').empty();
    $('.member-buttons').empty();

    $(".utub-title").text(name);
    $(".utub-title").attr('name', 'utub' + utubData.id);
    let utubDescription = $(".utub-description");
    
    if (utubDescription.length == 0) {
        utubDescription = $('<p></p>').addClass('lead').addClass('utub-description').html(desc);
        $(".utub-holder").append(utubDescription);
    }

    const urlCards = $('.url-card');
    const displayedUrlCards = urlCards.map(found => urlCards[found].id);
    const displayedUrlCardsIDs = Object.values(displayedUrlCards);

    if (urls.length !== 0) {
        $('.no-urls').remove();
        for (let url of urls) {

            // This URL is already displayed, therefore do not show it
            if (displayedUrlCardsIDs.includes("url" + url.url_id)) {
                continue;
            };

            let urlName = url.url_string;
            let urlTags = url.url_tags;
            let urlCard = $('<div></div>').addClass("card url-card").attr({
                'id': "url" + url.url_id
            });

            let innerUrlCard = $('<div></div>').addClass("card-body url-card-body");
            urlCard.append(innerUrlCard);

            let urlLink = $('<a></a>').addClass("card-title").attr({
                'href': urlName,
            });
            urlLink.html(urlName);

            innerUrlCard.append(urlLink);
            innerUrlCard.append($("<br>"));

            const urlAdder = members.find(member => member.id === url.added_by);
            const urlDesc = url.notes;

            // Add div before tag div for label of whomever added this URL and description of URL
            const descDiv = urlDescriptionElemBuilder(urlDesc, urlAdder.username);
            
            innerUrlCard.append(descDiv);

            const tagDiv = $('<div></div>').addClass('card-text tag-span');
            tagDiv.attr({
                'urltagspan': url.url_id
            });
            innerUrlCard.append(tagDiv);

            // Check if url has tags, and if so, append the elements
            if (urlTags.length !== 0) {
                let tagCounter = 0;

                for (let urlTagID of urlTags) {
                    const tagToAdd = tags.find(element => element.id === urlTagID);
                    let tagBadge = tagBadgeBuilder(utubData.id, url.url_id, tagToAdd);
                    if (tagCounter === 0) {
                        tagBadge.css("margin-left", "0px");
                        tagCounter += 1;
                    };
                    tagDiv.append(tagBadge);
                };
            };

            // Generate the div and place relevant buttons for adding a tag or removing this URL
            const urlButtonsDiv = urlButtonsElemBuilder(utubData.id, url.url_id, currentUser, url.added_by, utubData.created_by);
            innerUrlCard.append(urlButtonsDiv);
            descDiv.hide();
            urlButtonsDiv.hide();

            $(".utub-holder").append(urlCard);
        };
    } else {
        const utubHolder= $(".utub-holder");
        const noURLs = $('<h4></h4>').addClass('no-urls').append('<h4>No URLs found. Add one!</h4>');
        utubHolder.append(noURLs);
    };

    $('.delete-utub').remove();
    if (currentUser == utubData.created_by) {
        addDeleteUTubButton();
    };

    displayTags(tags);
    displayMembers(members, currentUser, utubData.created_by);
};

/**
 * @function urlDescriptionElemBuilder
 * Receives the URL description and adder, and creates a div containing the
 * adder of this URL and description of this URL to show.
 * @param {string} urlDesc - The URL description for this UTub
 * @param {string} urlAdder - The username of the user who added this URL to this UTub
 * @returns - A div element containing the adder and description of the URL
 */
function urlDescriptionElemBuilder(urlDesc, urlAdder) {
    const descDiv = $('<div></div>').addClass("card-body url-card-desc");
    let addedBy = $('<p></p>').addClass("added-by").css('display', 'inline');
    addedBy.text('Added by: ' + urlAdder);
    
    let urlDescription = $('<p></p>').addClass("url-description");

    // Handle if the URL description is empty or not
    if (urlDesc) {
        urlDescription.text(urlDesc);
    } else {
        urlDescription.text("No description available.");
    };

    descDiv.append(addedBy);
    descDiv.append(urlDescription);

    return descDiv;
};

/**
 * @function tagBadgeBuilder
 * Generates a tag badge with the given tag details, and returns it.
 * @param {number} utubID - ID of this UTub
 * @param {number} urlID - ID of this URL
 * @param {Object} tagDetails - Contains:
 *      "id" -> THe ID of the tag
 *      "tag_string" -> A string of the tag itself
 * @returns - A tag badge HTML element.
 */
 function tagBadgeBuilder(utubID, urlID, tagDetails){
    const tagElem = $('<span></span>').addClass('badge badge-pill badge-light tag-badge');
    const tagID = tagDetails.id;
    const tag = tagDetails.tag_string;
    const tagNameElem = $('<span></span>').text(tag);
    const closeButtonOuter = $('<span></span>').prop('aria-hidden', false).attr('id', 'tag' + tagID);
    const closeButtonInner = $('<a></a>').addClass('btn btn-sm btn-outline-link border-0 tag-del').html('&times;').prop('href', '#');
    closeButtonOuter.append(closeButtonInner);
    tagElem.append(tagNameElem);
    tagElem.append(closeButtonOuter);

    tagElem.attr({
        'id': utubID + "-" + urlID + "-" + tagID,
        'tag': tagID
    });
    
    return tagElem;
};

/**
 * @function urlButtonsElemBuilder
 * Generates a button div to place within a URL card, containing Add Tag
 * and remove URL buttons, if appropriate permissions had.
 * @param {number} utubID - ID of this UTub
 * @param {number} urlID - ID of this URL
 * @param {string} currentUser - Current user ID
 * @param {number} urlAdder - ID of user who added this URL to this UTub
 * @param {number} utubCreator - ID of the creator of this UTub.
 * @returns - A div containing the relevant buttons for this URL.
 */
 function urlButtonsElemBuilder(utubID, urlID, currentUser, urlAdder, utubCreator){
    const urlButtonsDiv = $('<div></div>').addClass('card-body url-card-buttons col-6');
    let addTag = $('<a></a>').addClass("btn btn-primary btn-sm py-0 add-tag col-4").attr({
        'href': '#',
        'id': utubID + '-' + urlID
    });
    addTag.text("Add Tag");
    urlButtonsDiv.append(addTag);
    
    if (currentUser == urlAdder || currentUser == utubCreator) {
        let deleteUrl = $('<a></a>').addClass("btn btn-warning btn-sm py-0 del-link col-4 offset-1").attr({
            'href': '#',
            'id': utubID + '-' + urlID
        });
        deleteUrl.text('Remove URL');
        urlButtonsDiv.append(deleteUrl);
    };
    return urlButtonsDiv;
};

/**
 * @function addDeleteUTubButton
 * Gives the creator of this UTub the option to delete this UTub if they choose to
 */
function addDeleteUTubButton() {
    const delUTub = $('<btn></btn>').addClass('delete-utub').html("Delete UTub");
    delUTub.addClass('btn').addClass('btn-warning').addClass('btn-block').css("margin-top", "10px");
    $(".utub-buttons").append(delUTub);
}

/**
 * @function displayMembers
 * Displays the current UTub's members. Gives functionality to leave the UTub.
 * If creator of the UTub, allows them to add or remove members.
 * Indicates who the creator was.
 * @param {Object} utubMembers - JSON object containing all members of this UTub  
 * @param {string} currentUser - The current user's ID
 * @param {number} creator - The creator's ID
 */
function displayMembers(utubMembers, currentUser, creator) {
    const memberDeck = $('.members-holder');
    memberDeck.empty();
    for (let member of utubMembers) {

        // Only display members if they aren't already being displayed
        if ($('#user' + member.id).length > 0) {
            continue;
        };

        let memberCard = $('<div></div>').addClass('card member-card');
        let memberCardBody = $('<div></div>').addClass('card-body member-card-body');

        let cardText = member.username;
        memberCard.attr({'username': member.username});

        if (creator === member.id) {
            cardText = cardText + " (Creator)";
            memberCard.attr("creator", true);
        };

        memberCardBody.text(cardText);
        memberCard.append(memberCardBody);
        memberCard.attr({'id': 'user' + member.id});
        
        memberDeck.append(memberCard);
    };

    let removeUserButton = $('<a></a>').addClass("btn btn-warning btn py-0 px-0 remove-user col-4 offset-1").attr({
        'href': '#',
    });

    if (currentUser == creator) {
        $('.add-user').remove();
        let addUserButton = $('<a></a>').addClass("btn btn-primary py-0 add-user col-7").attr({
            'href': '#'
        });
        addUserButton.text("Add a User!");
        $('.member-buttons').append(addUserButton);
        removeUserButton.text("Remove User").addClass("disabled");
    } else {
        $('.remove-self').remove();
        removeUserButton.text("Leave this UTub");
        removeUserButton.removeClass('col-4 offset-1').addClass('btn-block');
    };
    $('.member-buttons').append(removeUserButton);
};

/**
 * @function removeMemberFromUtub
 * Gives the creator the ability to remove a user from a UTub. The creator cannot remove themselves.
 * Allows a non-creator to remove themselves from the UTub
 * @param {string} userID - The user ID to remove from this UTub
 * @param {string} utubID - The UTubID to remove this user from
 */
function removeMemberFromUtub(userID, utubID) {
    let removeData = {
        "UTubID": utubID,
        "UserID": userID
    };

    let request = $.ajax({
        url: "/delete_user",
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(removeData),
    });

    request.done(function(xml, textStatus, xhr) {
        if (xhr.status == 200) {
            let cardToDel = '#user' + userID;
            const usernameToRemove = $(cardToDel).attr("username");
            $(cardToDel).remove();
            globalFlashBanner(usernameToRemove +" removed from this UTub.", "info")
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status != 404) {
            const flashMessage = xhr.responseJSON.error;
            const flashCategory = xhr.responseJSON.category;

            globalFlashBanner(flashMessage, flashCategory);
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

/**
 * @function addMemberToUtub
 * AJAX call for the creator to add a user to their UTub. Pulls up a form that requires
 * creator to input the username of the user they want to add. Username add is case-sensitive.
 * @param {string} utubID - The ID of this UTub
 */
function addMemberToUtub(utubID) {
    let addUser_Request = $.get("/add_user/" + utubID, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            $('.invalid-feedback').remove();
            $('.alert').remove();
            $('.form-control').removeClass('is-invalid');
            let request = $.ajax({
                url: "/add_user/" + utubID,
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(addUserSuccess, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    getUtubInfo(addUserSuccess.utubID);
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409 || xhr.status == 400 || xhr.status == 403) {
                    const flashMessage = xhr.responseJSON.Error;
                    const flashCategory = xhr.responseJSON.Category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory)
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    ModalFormErrorGenerator(xhr.responseJSON);
                }; 
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            });
        });
    });

    // Error if not authorized to add user to this utub
    addUser_Request.fail(function(xhr, textStatus, error){
        if (xhr.status == 403) {
            const flashMessage = xhr.responseJSON.error;
            const flashCategory = xhr.responseJSON.category;

            globalFlashBanner(flashMessage, flashCategory);
        };
    });
};

/**
 * @function displayTags
 * Displays the tags for the selected UTub, as a list of check boxes.
 * @param {Array} utubTags - The tags for this UTub, stored in a string
 */
function displayTags(utubTags) {
    let utubTagsForm = $(".tags-for-utub").empty();
    $('.no-tags').remove();
    if (utubTags.length === 0) {
        const noTags = $('<h4></h4>').addClass('no-tags').html('No tags in this UTub. Add a tag to a URL!');
        utubTagsForm.append(noTags);
        utubTagsForm.css({'padding-left': 0});
    } else {
        utubTagsForm.css({'padding-left': ''});
        let selectAllTag = Object();
        selectAllTag.tag_string = "Select All";
        selectAllTag.id = "select-all-tags";

        for (let tag of utubTags) {
            let newTag = tagSelectionElemBuilder(tag);
            utubTagsForm.append(newTag);
        };

        selectAllBox = tagSelectionElemBuilder(selectAllTag);
        selectAllBox.attr("id", "selectAllTags");
        utubTagsForm.prepend(selectAllBox);
    };
};

/**
 * @function tagSelectionElemBuilder
 * Builds a selection element for a tag, used to filter URLs based on tags.
 * @param {Object} tagDetails - Contains:
 *      "id": The id of the tag
 *      "tag_string": The tag itself 
 * @returns - An HTML form element with a checkbox describing a tag
 */
function tagSelectionElemBuilder(tagDetails){
    const tagName = tagDetails.tag_string;
    const tagID = tagDetails.id;

    let newTag = $('<div></div>').addClass('tag-choice').attr("tag-choice", tagID);

    let tagLabel = $('<label></label>').addClass('form-check-label').attr({
        'for': tagName,
    });
    tagLabel.text(tagName);

    let tagCheckbox = $('<input>').addClass('form-check-input tag-box').attr({
        'type': 'checkbox',
        'id': tagID,
        'name': tagName,
        'tag-id': tagID,
    }).prop('checked', true);;

    newTag.append(tagCheckbox);
    newTag.append(tagLabel);

    return newTag;
}

/**
 * @function putUtubNames
 * Displays the UTub names this user is a part of, as part of a selection of radio buttons.
 * Saves the first UTub's id to return later as part of a post request to display the first 
 * UTub's data.
 * Selects the first radio button, where there is one radio button for each UTub this user
 * is a member of.
 * @param {Array} utubNames - Array of UTub contained originally from a JSON
 * @returns {String} - The UTub ID for the first UTub in the newly created set of radio buttons
 */
function putUtubNames(utubNames) {
    let firstUtubId = null;
    for (let index = 0; index < utubNames.length; ++index) {
        let utub_id = utubNames[index][0];
        let utub_name = utubNames[index][1];

        let utubRadio = $('<input>');
        utubRadio.addClass('form-check-input');
        utubRadio.attr({
            'type': 'radio',
            'name': 'utub-name',
            'id': 'utub' + utub_id,
            'value': 'utub' + utub_id
        });

        if (index === 0) {
            utubRadio.prop('checked', true);
            firstUtubId = utub_id;
        };
    
        let utubLabel = $('<label></label>');
        utubLabel.addClass('form-check-label');
        utubLabel.attr({'for': 'utub' + utub_id});
        utubLabel.html('<b>' + utub_name + '</b>');
        
        let newUtubNameDiv = $('<div></div>');
        newUtubNameDiv.addClass('utub-names-radios');

        newUtubNameDiv.append(utubRadio);
        newUtubNameDiv.append(utubLabel);
        $(".utub-names-ids").append(newUtubNameDiv);
    };
    return firstUtubId;
};

/**
 * @function createUtub
 * Sends an AJAX post request to create a UTub with the given information, through a
 * popped up modal form.
 */
function createUtub() {
    $.get("/create_utub", function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
    
            let request = $.ajax({
                url: "/create_utub",
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(response, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    globalFlashBanner(response.message, response.category);

                    let utubRadio = $('<input>');
                    utubRadio.addClass('form-check-input');
                    utubRadio.attr({
                        'type': 'radio',
                        'name': 'utub-name',
                        'id': 'utub' + response.UTubID,
                        'value': 'utub' + response.UTubID
                    });
                    let utubLabel = $('<label></label>');
                    utubLabel.addClass('form-check-label');
                    utubLabel.attr({'for': 'utub' + response.UTubID});
                    utubLabel.html('<b>' + response.UTub_Name + '</b>');
                    
                    let newUtubNameDiv = $('<div></div>');
                    newUtubNameDiv.addClass('utub-names-radios');
            
                    newUtubNameDiv.append(utubRadio);
                    newUtubNameDiv.append(utubLabel);
                    $(".utub-names-ids").append(newUtubNameDiv);
                    utubRadio.prop('checked', true);
                    getUtubInfo(response.UTubID);
                };
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409) {
                    const flashMessage = xhr.responseJSON.error;
                    const flashCategory = xhr.responseJSON.category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory);
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    ModalFormErrorGenerator(xhr.responseJSON);
                };
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            });
        });
    });
};

/**
 * @function deleteUtub
 * Performs an AJAX request to delete the selected UTub.
 * Can only be performed by the creator of the UTub.
 * @param {string} utubID - The ID of the UTub to delete
 */
function deleteUtub(utubID) {
    let utubToDelete = new Object();
    utubToDelete.UTubID = utubID;

    let request = $.ajax({
        url: '/delete_utub',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(utubToDelete),
    });

    request.done(function(response, textStatus, xhr) {
        if (xhr.status == 200) {
            // Flash success on delete of UTub
            globalFlashBanner(response.message, response.category)
            let utubSelections = $('.utub-names-radios :radio');
            let selected = utubSelections.filter(found => utubSelections[found].checked);

            if (utubSelections.length == 1) {
                selected.parent().remove();
                userHasUtubs(false);
                return;
            };

            const firstUtub = utubSelections[0].id.replace('utub', '');

            // Update the selectable UTubs
            if (utubID == firstUtub) {
                utubSelections[1].checked = true;
                const secondUtub = utubSelections[1].id.replace('utub', '');
                selected.parent().remove();
                getUtubInfo(secondUtub);
            } else {
                const selectedID = selected[0].id;
                const toRemove = $('#' + selectedID);
                toRemove.parent().remove();
                getUtubInfo(firstUtub);
                utubSelections[0].checked = true;
            };
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status === 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category);
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

/**
 * @function addUrlToUtub
 * Adds a URL to a UTub via AJAX request.
 * Pops up a modal to allow the user to type in the URL they wish to add.
 * If the URL does not send back a valid HTTP code, or the URL is invalid,
 * an error message will pop up.
 * @param {string} utubID - The ID for the UTub to generate a URL for
 */
function addUrlToUtub(utubID) {
    let addUrl = $.get("/add_url/" + utubID, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();

            $('.invalid-feedback').remove();
            $('.alert').remove();
            $('.form-control').removeClass('is-invalid');
            let request = $.ajax({
                url: "/add_url/" + utubID,
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(addUrlSuccess, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    getUtubInfo(addUrlSuccess.utubID);
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409 || xhr.status == 400) {
                    const flashMessage = xhr.responseJSON.error;
                    const flashCategory = xhr.responseJSON.category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory);
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    ModalFormErrorGenerator(xhr.responseJSON);
                }; 
                console.log("Failure. Status code: " + response.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            });
        });
    });

    addUrl.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            const flashMessage = xhr.responseJSON.error;
            const flashCategory = xhr.responseJSON.category;

            const flashElem = flashMessageBanner(flashMessage, flashCategory);
            flashElem.insertBefore($('.main-content'));
        };
    });
};

/**
 * @function deleteUTubURL
 * Sends a JSON as a POST request to delete the selected URL from the given UTub.
 * Removes the URL HTML element from display
 * @param {string} urlToDel - A string containing the UTub ID and URL ID, split by '-'
 */
function deleteUTubURL(urlToDel) {
    const utubAndUrl = urlToDel.split('-');
    const utub = utubAndUrl[0];
    const url = utubAndUrl[1];
    let urlToDelete = new Object();
    urlToDelete.UTubID = utub;
    urlToDelete.url_ID = url;
    
    let request = $.ajax({
        url: '/delete_url',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(urlToDelete),
    });

    request.done(function(response, textStatus, xhr) {
        if (xhr.status == 200) {
            let cardToDel = '#url' + url;
            $(cardToDel).remove();

            // Flash success on delete of URL
            globalFlashBanner(response.message, response.category);

            // Remove URL cards, check if no URLs remain
            const urlCards = $('.url-card');
            if (urlCards.length === 0) {
                const utubHolder= $(".utub-holder");
                const noURLs = $('<h4></h4>').addClass('no-urls').append('<h4>No URLs found. Add one!</h4>');
                utubHolder.append(noURLs);
            };

            // Update URL Info deck to indicate no URL is selected
            let noUrlSelected = $("<p></p>").addClass("url-description").text("Add/Select a URL!");
            $('#UrlOptionsHolder').empty().append(noUrlSelected);
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category);
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

/**
 * @function addTag
 * Performs an AJAX request to add a tag to the selected URL in the selected UTub.
 * URLs in a given UTub can only have 5 tags each.
 * Pops up a modal for the user to type in the tag they wish to add to the URL.
 * @param {string} utubID - The ID of the currently selected UTub
 * @param {string} urlID - The ID of the URL to add a tag to
 */
function addTag(utubID, urlID){
    let addTagRequest = $.get("/add_tag/" + utubID + "/" + urlID, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            $('.invalid-feedback').remove();
            $('.alert').remove();
            $('.form-control').removeClass('is-invalid');
            let request = $.ajax({
                url: "/add_tag/" + utubID + "/" + urlID,
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(addTagSuccess, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    //Add tag to URL card here
                    let urlTagParent = $("#url" + urlID).find($(".tag-span"))[0];

                    let tagToAdd = Object();
                    tagToAdd.id = addTagSuccess.tagID;
                    tagToAdd.tag_string = addTagSuccess.tag;

                    let tagCounter = urlTagParent.childElementCount;
                    let tagBadge = tagBadgeBuilder(utubID, urlID, tagToAdd);
                    if (tagCounter === 0) {
                        tagBadge.css("margin-left", "0px");
                        tagCounter += 1;
                    };
    
                    urlTagParent.append(tagBadge[0]);

                    // Need to add tag to Tag Panel if not already displayed
                    checkIfTagChoiceAdded(tagToAdd);
                    
                    globalFlashBanner(addTagSuccess.message, addTagSuccess.category);
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 403 || xhr.status == 400) {
                    const flashMessage = xhr.responseJSON.error;
                    const flashCategory = xhr.responseJSON.category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory);
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    ModalFormErrorGenerator(xhr.responseJSON);
                }; 
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            });
        });
    });

    addTagRequest.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category);
        };
    });
};

/**
 * @function filterHideURLs
 * Hides URL cards based on the selected tag IDs
 * @param {string} tagID - The ID of the tag the user has clicked to hide
 */
function filterHideURLs(tagID) {
    const urls = $('.url-card');

    for (i=0; i < urls.length; i++){
        let currentURL = $(urls[i]);
        const currentURLTags = currentURL.find('.tag-span').children();
        let numbOfHiddenTags = 0;

        $.each(currentURLTags, function(idx, tag) {
            if (!$(tag).is(":visible")) {
                numbOfHiddenTags++;
            };
        });

        let numbOfTagsOnCurrentURL = currentURLTags.length - numbOfHiddenTags;

        for (let tag of currentURLTags){
            let currTag = $(tag);
            if (currTag.attr('tag') == tagID) {
                currTag.hide(100);
                numbOfTagsOnCurrentURL--;
            };

            if (!numbOfTagsOnCurrentURL){
                currentURL.hide(100);
            };
        };
    };
};

/**
 * @function filterShowURLs
 * Shows URLs that contain the selected tag
 * @param {string} tagID - The ID of the tag chosen to hide
 */
function filterShowURLs(tagID) {
    const urls = $('.url-card');
    const utubTagsForm = $('.tags-for-utub');

    for (i=0; i < urls.length; i++){
        let currentURL = $(urls[i]);
        const currentURLTags = currentURL.find('.tag-span').children();

        for (let tag of currentURLTags){
            let currTag = $(tag);
            if (currTag.attr('tag') == tagID) {
                if (!currentURL.is(":visible")){
                    currentURL.show(100);
                };
                currTag.show(100);
            };
        };
    };

    const numbOfTagCheckboxes = utubTagsForm.find('[tag-id]').length;
    const numbOfTagCheckboxesChecked = utubTagsForm.find('input[type=checkbox]:checked').length;

    // If all tags have been selected, also select the Select All checkbox
    if (numbOfTagCheckboxes - numbOfTagCheckboxesChecked === 1) {
        $("#select-all-tags").prop("checked", true);
    };
};

/**
 * @function filterSelectAllPressed
 * Hides or shows all URL cards containing tags for this UTub
 * @param {Object} selectAllTag - The checkbox element for Select All tags
 */
function filterSelectAllPressed(selectAllTag) {
    const urls = $('.url-card');
    const urlTags = $('.tag-badge');
    const tagCheckboxes = $('.tag-box');

    if (selectAllTag.prop("checked")) {
        // Show all URLs and tags
        urls.show(100);
        urlTags.show(100);
        tagCheckboxes.prop("checked", true);
    } else {
        // Only hide URL Cards that contain tags
        for (let i = 0; i < urls.length; i++) {
            const currentURL = $(urls[i]);
            const numbOfTagsForURL = currentURL.find(".tag-span")[0].childElementCount;

            if (numbOfTagsForURL > 0){
                currentURL.hide(100);
                currentURL.find('.tag-badge').hide(100);
            };
        };
        tagCheckboxes.prop("checked", false);
    };
};

/**
 * @function removeTag
 * Performs an AJAX requst with the given tag data to remove it from given URL.
 * @param {Object} tagElem - The HTML element of the tag selected to remove
 * @param {string} tagData - String containing the UTubID, UrlID, and TagID separeated by a '-'.
 */
function removeTag(tagElem, tagData) {
    const rawTagData = tagData.split('-');
    let tagDataForDelete = new Object;
    tagDataForDelete.UTubID = rawTagData[0];
    tagDataForDelete.UrlID = rawTagData[1];
    tagDataForDelete.TagID = rawTagData[2];

    let request = $.ajax({
        'url': '/remove_tag',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(tagDataForDelete),
    });

    request.done(function(response, textStatus, xhr) {
        if (xhr.status == 200) {
            // Remove tag
            tagElem.remove();

            // Flash success on delete of URL
            globalFlashBanner(response.message, response.category);

            if ($(".tag-choice").length != 0) {
                let tagsForUtub = $(".tag-badge");
                let tagChoicesForUtub = $(".tag-choice");
                // Check if any updates need to be made to the tags displayed in TagDeck
                checkIfTagChoiceRemoved(tagsForUtub, tagChoicesForUtub);
            };
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category);
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

function checkIfTagChoiceAdded(tagDetails) {
    const tagID = tagDetails.id;
    const utubTagsForm = $('.tags-for-utub');
    let tagElemIfExists = utubTagsForm.find("[tag-choice='" + tagID + "']");

    if (utubTagsForm.find("[tag-choice]").length === 0) {
        $('.no-tags').remove()
        utubTagsForm.css({'padding-left': ''});

        let selectAllTag = Object();
        selectAllTag.tag_string = "Select All";
        selectAllTag.id = "select-all-tags";
        selectAllBox = tagSelectionElemBuilder(selectAllTag);
        utubTagsForm.append(selectAllBox);
    }

    if (tagElemIfExists.length === 0) {
        let newTag = tagSelectionElemBuilder(tagDetails);
        utubTagsForm.append(newTag);   
    };
  
};

/**
 * @function checkIfTagChoiceRemoved
 * Reads in the all unique tag HTML elements under each URL for the selected UTub.
 * If no tags remain, updates the TagDeck to indicate no tags are left.
 * If a tag is deleted and no other URLs have that tag, but other tags still remain,
 * then updates the TagDeck with the tags that remain.
 * @param {Array} tagsInUtub - Current tags under each URL in the UTub
 * @param {Array} tagChoices - The tags left to choose from in the TagDeck
 * @returns 
 */
function checkIfTagChoiceRemoved(tagsInUtub, tagChoices) {
    if (tagsInUtub.length === 0) {
        $(".tags-for-utub").empty();
        const noTags = $('<h4></h4>').addClass('no-tags').html('No tags in this UTub. Add some!');
        $(".tags-for-utub").append(noTags);
        return
    }

    let tagIDsInUtub = new Array;
    for (let tag of tagsInUtub) {
        tagIDsInUtub.push($(tag).attr('tag'));
    };

    // Remove the tag from display if no longer present on any URLs on the UTub
    for (let tagChoice of tagChoices) {
        const tagChoiceID = $(tagChoice).attr('tag-choice');
        if (tagChoiceID === "select-all-tags") {
            continue
        } else if (!tagIDsInUtub.includes(tagChoiceID)) {
            $(tagChoice).remove();
        };
    };
};

/**
 * @function ModalFormErrorGenerator
 * Parses and generates the relevant Modal Form errors contained, provided
 * when an AJAX request is sent to the server and returns with errors.
 * @param {Object} modalFormErrors - The inputs to add errors to
 */
function ModalFormErrorGenerator(modalFormErrors){
    $('.invalid-feedback').remove();
    $('.alert').remove();
    $('.form-control').removeClass('is-invalid');
    const error = JSON.parse(modalFormErrors);
    for (var key in error) {
        $('<div class="invalid-feedback"><span>' + error[key] + '</span></div>' )
        .insertAfter('#' + key).show();
        $('#' + key).addClass('is-invalid');
    };
};

/**
 * @function flashMessageBanner
 * Creates a banner that flashes a message. Can be inserted wherever chosen.
 * @param {string} message - The message to display
 * @param {string} category - The type of banner based on bootstrap class
 * @returns An HTML div element that is displayed with a message and given the prescribed category
 */
function flashMessageBanner(message, category) {
    $('.flash-message').remove();
    const flashElem = $('<div></div>').addClass('alert');
    flashElem.addClass('alert-dismissible');
    flashElem.addClass('alert-' + category);
    flashElem.addClass('fade').addClass('show').addClass('flash-message');

    flashElem.attr({
        'role':'alert'
    });

    flashElem.text(message);

    const closeButton = $('<button></button>').addClass('close').attr({
        'data-dismiss': 'alert',
        'aria-label': 'Close'
    });
    closeButton.append('<span aria-hidden="false">&times;</span>');

    flashElem.append(closeButton);
    flashElem.css({
        "margin-bottom": "0rem",
    });

    $(flashElem).fadeTo(2000, 500).slideUp(500, function(){
        $(flashElem).slideUp(500);
    });
    
    return flashElem;
};

/**
 * @function globalFlashBanner
 * Uses flashMessageBanner to display a flash message at the top of the window for the
 * whole webpage.
 * @param {string} flashMessage - The message to display 
 * @param {string} flashCategory - The relevant bootstrap 4 category for flash messages
 */
function globalFlashBanner(flashMessage, flashCategory) {
    const flashElem = flashMessageBanner(flashMessage, flashCategory);
    $(flashElem).css({
        "z-index": 1,
        "position": "fixed",
        "width": "100%"
    });
    flashElem.insertBefore($('.main-content'));
};