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
    $(document).on('click', '.add-tag', function() {
        const linkToAddTagTo = $(this).attr('id');
        const utubAndURL = linkToAddTagTo.split('-');
        const utubID = utubAndURL[0];
        const urlID = utubAndURL[1];
        addTag(utubID, urlID);
    });

    // Remove a tag on button click
    $(document).on('click', '.tag-del', function() {
        const tagToRemove = $(this).parent().parent();
        const tagData = tagToRemove.attr('id');
        removeTag(tagToRemove, tagData);
    })

    // Add a URL on button click
    $('.add-url').click(function() {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            addUrlToUtub(utubId);
        };
    });

    $(document).on('click', '.url-card', function() {
        $('.url-card').css('background', 'none');
        const urlID = $(this).attr('id').replace('url','');
        $(this).css('background', 'silver');
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            getURLInfo(utubId, urlID);
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
        let userToRemove = $(this).attr('id').replace('user', '');

        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '')
            removeMemberFromUtub(userToRemove, utubId);
        };
    });

    $(document).on('click', '.member-card', function() {
        $('.member-card').css('background', 'gray');
        $(this).css('background', 'silver');
    })

    // Remove UTub on click
    $(document).on('click', '.delete-utub', function () {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked);

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '');
            deleteUtub(utubId);
        }
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
        return
    }

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
        $('.utub-title').text('No UTubs found.')
        $('.members-holder').empty();
        $('.tags-for-utub').empty();
    }
}

/**
 * @function displayUtubData
 * Parses and displays the received JSON data this user's selected UTub
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
    const displayedUrlCardsIDs = Object.values(displayedUrlCards)

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
            innerUrlCard.append($("<br>"))
            
            // Check if url has tags, and if so, append the elements
            if (urlTags.length !== 0) {
                const tagSpan = $('<span></span>').addClass('card-text tag-span');
                innerUrlCard.append(tagSpan);
                let tagCounter = 0;

                for (let urlTagID of urlTags) {
                    const tagToAdd = tags.find(element => element.id === urlTagID);
                    let tagBadge = tagElemBuilder(tagToAdd);
                    if (tagCounter === 0) {
                        tagBadge.css("margin-left", "0px");
                        tagCounter += 1;
                    };

                    tagBadge.attr('id', utubData.id + "-" + url.url_id + "-" + urlTagID);
                    tagBadge.attr('tag', urlTagID);
                    tagSpan.append(tagBadge);
                };
                innerUrlCard.append('<br>');
            };

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
            continue
        };

        let memberCard = $('<div></div>').addClass('card member-card');
        let memberCardBody = $('<div></div>').addClass('card-body');
        let memberCardBodyRow = $('<div></div>').addClass('row justify-content-center');

        let cardText = member.username

        if (creator === member.id) {
            cardText = cardText + " (Creator)";
        };

        let memberUsername = $('<div></div>').addClass('col-12')
        memberUsername.text(cardText)
        memberCardBodyRow.append(memberUsername)

        if (currentUser == creator && creator !== member.id) {
            memberUsername.removeClass('col-12').addClass('col-9')
            let removeDiv = $('<div></div>').addClass('col-3 d-flex justify-content-end')
            let removeUserButton = $('<a></a>').addClass("btn btn-warning btn-sm py-0 remove-user ").attr({
                'href': '#',
                'id': 'user' + member.id
            })
            removeUserButton.text("Remove")
            removeDiv.append(removeUserButton)
            memberCardBodyRow.append(removeDiv)
        }

        
        memberCard.append(memberCardBody);
        memberCardBody.append(memberCardBodyRow)

        memberCard.attr({
            'id': 'user' + member.id
        });
        
        memberDeck.append(memberCard);
        memberCard.css("height", "4rem");
    };

    if (currentUser == creator) {
        $('.add-user').remove();
        let addUserButton = $('<a></a>').addClass("btn btn-primary py-0 px-5 add-user col-7").attr({
            'href': '#'
        });
        addUserButton.text("Add a User!");
        $('.member-buttons').append(addUserButton);

        let removeUserButton = $('<a></a>').addClass("btn btn-warning btn py-0 remove-user col-4 offset-1").attr({
            'href': '#',
            'id': 'user' + currentUser
        });
        removeUserButton.text("Remove User");
        $('.member-buttons').append(removeUserButton);
    } else {
        $('.remove-self').remove();
        let removeSelfButton = $('<a></a>').addClass("btn btn-warning btn-sm py-0 remove-self col-4").attr({
            'href': '#',
            'id': 'user' + currentUser
        });
        removeSelfButton.html("Leave this UTub");
        $('.member-buttons').append(removeSelfButton);
    }
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
    }

    let request = $.ajax({
        url: "/delete_user",
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(removeData),
    })

    request.done(function(xml, textStatus, xhr) {
        if (xhr.status == 200) {
            let cardToDel = '#user' + userID;
            $(cardToDel).remove();
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status != 404) {
            const flashMessage = xhr.responseJSON.error;
            const flashCategory = xhr.responseJSON.category;

            const flashElem = flashMessageBanner(flashMessage, flashCategory);
            flashElem.insertBefore($('.main-content'));
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
                    getUtubInfo(addUserSuccess.utubID)
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409 || xhr.status == 400 || xhr.status == 403) {
                    const flashMessage = xhr.responseJSON.Error;
                    const flashCategory = xhr.responseJSON.Category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory)
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    $('.invalid-feedback').remove();
                    $('.alert').remove();
                    $('.form-control').removeClass('is-invalid');
                    const error = JSON.parse(xhr.responseJSON);
                    for (var key in error) {
                        $('<div class="invalid-feedback"><span>' + error[key] + '</span></div>' )
                        .insertAfter('#' + key).show();
                        $('#' + key).addClass('is-invalid');
                    };
                }; 
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
        });
    });

    // Error if not authorized to add user to this utub
    addUser_Request.fail(function(xhr, textStatus, error){
        if (xhr.status == 403) {
            const flashMessage = xhr.responseJSON.error;
            const flashCategory = xhr.responseJSON.category;

            const flashElem = flashMessageBanner(flashMessage, flashCategory);
            flashElem.insertBefore($('.main-content'));
        }
    })
};

/**
 * @function displayTags
 * Displays the tags for the selected UTub
 * @param {Array} utubTags - The tags for this UTub, stored in a string
 */
function displayTags(utubTags) {
    let utubTagsForm = $(".tags-for-utub").empty();
    $('.no-tags').remove();
    if (utubTags.length === 0) {
        const noTags = $('<h4></h4>').addClass('no-tags').html('No tags in this UTub. Add some!');
        utubTagsForm.append(noTags);
    } else {
        for (let tag of utubTags) {
            let tagName = tag.tag_string;
            let tagID = tag.id;

            let tagLabel = $('<label></label>').addClass('form-check-label').attr({
                'for': tagName,
            });
            tagLabel.html(tagName);

            let tagCheckbox = $('<input>').addClass('form-check-input').attr({
                'type': 'checkbox',
                'id': tagName,
                'name': tagName,
                'value': tagID,
            });

            let newTag = $('<div></div>');
            newTag.addClass('form-check').addClass('tag-choice');
            newTag.attr("tag-choice", tagID);
            newTag.append(tagCheckbox);
            newTag.append(tagLabel);
            utubTagsForm.append(newTag);
        };
    };
};

/**
 * @function putUtubNames
 * Puts down the UTub names this user is a part of, as part of a selection of radio buttons
 * Saves the first UTub's id to return later as part of a post request to display the first 
 * UTub's data
 * @param {Array} utubNames - Array of UTub contained originally from a JSON
 * @returns {String}
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
 * Sends a post request to create a UTub with the given information, via a modal
 */
function createUtub() {
    $.get("/create_utub", function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            // $('.modal-flasher').prop({'hidden': true});
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
                    $('.invalid-feedback').remove();
                    $('.alert').remove();
                    $('.form-control').removeClass('is-invalid');
                    const error = JSON.parse(xhr.responseJSON);
                    for (var key in error) {
                        $('<div class="invalid-feedback"><span>' + error[key] + '</span></div>' )
                        .insertAfter('#' + key).show();
                        $('#' + key).addClass('is-invalid');
                    };
                };
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
        });
    });
};

/**
 * @function deleteUtub
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

            if (utubID == firstUtub) {
                utubSelections[1].checked = true;
                const secondUtub = utubSelections[1].id.replace('utub', '');
                selected.parent().remove()
                getUtubInfo(secondUtub);
            } else {
                const selectedID = selected[0].id;
                const toRemove = $('#' + selectedID);
                toRemove.parent().remove()
                getUtubInfo(firstUtub);
                utubSelections[0].checked = true;
            };
    
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status === 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category)
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
}

/**
 * @function addUrlToUtub
 * Adds a URL to a UTub via AJAX request
 * @param {string} utubID - The ID for the UTub to generate a URL for
 */
function addUrlToUtub(utubID) {
    let addUrl = $.get("/add_url/" + utubID, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            // $('.modal-flasher').prop({'hidden': true});
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
                    getUtubInfo(addUrlSuccess.utubID)
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409 || xhr.status == 400) {
                    const flashMessage = xhr.responseJSON.error;
                    const flashCategory = xhr.responseJSON.category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory)
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    $('.invalid-feedback').remove();
                    $('.alert').remove();
                    $('.form-control').removeClass('is-invalid');
                    const error = JSON.parse(xhr.responseJSON);
                    for (var key in error) {
                        $('<div class="invalid-feedback"><span>' + error[key] + '</span></div>' )
                        .insertAfter('#' + key).show();
                        $('#' + key).addClass('is-invalid');
                    };
                }; 
                console.log("Failure. Status code: " + response.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
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
 * Sends a JSON as a POST request to delete the signified URL from the given UTub
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

            // Remove URL card
            const urlCards = $('.url-card');
            if (urlCards.length === 0) {
                const utubHolder= $(".utub-holder");
                const noURLs = $('<h4></h4>').addClass('no-urls').append('<h4>No URLs found. Add one!</h4>');
                utubHolder.append(noURLs);
            };

            let noUrlSelected = $("<p></p>").addClass("url-description").text("Add/Select a URL!");
            $('#UrlOptionsHolder').empty().append(noUrlSelected);
        };
    });

    request.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category)
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    });
};

function getURLInfo(utubID, urlID) {
    let request = $.getJSON({
        'url': '/get_url_info/' + utubID + '-' + urlID,
    });

    request.done(function(url_info, textStatus, xhr) {
        if (xhr.status == 200) {
            showURLInfo(url_info)
        };
    });

    request.fail(function(xhr, textStatus, error){
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category)
        } else {
            console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
            console.log("Error: " + error);
        };
    })
};

function showURLInfo(urlInfo) {
    $(".url-info").empty();
    $(".url-buttons").empty();
    let addedBy = $('<p></p>').addClass("added-by").css('display', 'inline');
    addedBy.text('Added by: ' + urlInfo.urlAddedBy);
    $(".url-info").append(addedBy);

    let urlDescription = $('<p></p>').addClass("url-description");
    if (urlInfo.urlDesc) {
        urlDescription.text(urlInfo.urlDesc);
    } else {
        urlDescription.text("No description available.");
    };
    $(".url-info").append(urlDescription);

    let addTag = $('<a></a>').addClass("btn btn-primary btn-sm py-0 px-5 add-tag").attr({
        'href': '#',
        'id': urlInfo.utubID + '-' + urlInfo.urlID
    });
    addTag.text("Add Tag");
    $(".url-buttons").append(addTag);

    if (urlInfo.canRemove) {
        let deleteUrl = $('<a></a>').addClass("btn btn-warning btn-sm py-0 del-link").attr({
            'href': '#',
            'id': urlInfo.utubID + '-' + urlInfo.urlID
        });
        deleteUrl.text('Remove URL');
        $(".url-buttons").append(deleteUrl);
    };
};

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

                    getUtubInfo(addTagSuccess.utubID)
                        .then(function(result) {
                            $("#url" + urlID).css('background', 'silver');
                        });
                    
                    globalFlashBanner(addTagSuccess.message, addTagSuccess.category)
                }; 
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 403 || xhr.status == 400) {
                    const flashMessage = xhr.responseJSON.error;
                    const flashCategory = xhr.responseJSON.category;

                    let flashElem = flashMessageBanner(flashMessage, flashCategory)
                    flashElem.insertBefore('#modal-body').show();
                } else if (xhr.status == 404) {
                    $('.invalid-feedback').remove();
                    $('.alert').remove();
                    $('.form-control').removeClass('is-invalid');
                    const error = JSON.parse(xhr.responseJSON);
                    for (var key in error) {
                        $('<div class="invalid-feedback"><span>' + error[key] + '</span></div>' )
                        .insertAfter('#' + key).show();
                        $('#' + key).addClass('is-invalid');
                    };
                }; 
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
        });
    });

    addTagRequest.fail(function(xhr, textStatus, error) {
        if (xhr.status == 403) {
            globalFlashBanner(xhr.responseJSON.error, xhr.responseJSON.category)
        };
    });
}

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
    })

    request.done(function(response, textStatus, xhr) {
        if (xhr.status == 200) {
            // Remove tag
            tagElem.remove();

            // Flash success on delete of URL
            globalFlashBanner(response.message, response.category);

            if ($(".tag-choice").length != 0) {
                let tagsForUtub = $(".tag-badge");
                let tagChoicesForUtub = $(".tag-choice");
                checkIfTagChoiceRemoved(tagsForUtub, tagChoicesForUtub)
            }
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

}

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

    // Remove the filterable choice if no longer present on any URLs on the UTub
    for (let tagChoice of tagChoices) {
        const tagChoiceID = $(tagChoice).attr('tag-choice')
        if (!tagIDsInUtub.includes(tagChoiceID)) {
            $(tagChoice).remove()
        }
    }
}

function tagElemBuilder(tagDetails){
    const tagElem = $('<span></span>').addClass('badge badge-pill badge-light tag-badge');
    const tagID = tagDetails.id;
    const tag = tagDetails.tag_string;
    const tagNameElem = $('<span></span>').text(tag);
    const closeButtonOuter = $('<span></span>').prop('aria-hidden', false).attr('id', 'tag' + tagID);
    const closeButtonInner = $('<a></a>').addClass('btn btn-sm btn-outline-link border-0 tag-del').html('&times;').prop('href', '#');
    closeButtonOuter.append(closeButtonInner)
    tagElem.append(tagNameElem);
    tagElem.append(closeButtonOuter);
    return tagElem
}

/**
 * @function flashMessageBanner
 * Creates a banner that flashes a message. Can be inserted wherever chosen.
 * @param {string} message - The message to display
 * @param {string} category - The type of banner based on bootstrap class
 * @returns An HTML div element that is displayed with a message and given the prescribed category
 */
function flashMessageBanner(message, category) {
    $('.flash-message').remove()
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

function globalFlashBanner(flashMessage, flashCategory) {
    const flashElem = flashMessageBanner(flashMessage, flashCategory);
    $(flashElem).css({
        "z-index": 1,
        "position": "fixed",
        "width": "100%"
    });
    flashElem.insertBefore($('.main-content'));
};