$(document).ready(function() {
    loadUtubData(userUtubs);
    $('.create-utub').click(function() {
        createUtub();
    });
    
    $('.utub-names-ids').on('change', 'input[type=radio]', function(){
        let utubToLoad = $(this).val().replace("utub", "")
        $('.utub-holder').empty();
        $('.tagsForUtub').empty();
        getUtubInfo(utubToLoad);
    });

    $(document).on('click', '.del-link', function() {
        let linkToDelete = $(this).attr('id');
        deleteUtubLink(linkToDelete);
    });

    $('.add-url').click(function() {
        let utubSelections = $('.utub-names-radios :radio');
        let selected = utubSelections.filter(found => utubSelections[found].checked)

        if (!jQuery.isEmptyObject(selected)) {
            let utubId = selected[0].id.replace('utub', '')
            addUrlToUtub(utubId, selected)
        }
        // Call modal form to add a URL to this UTub
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

function loadUtubData(userUtubs) {
    let utubNames = [];
    for (let utub of userUtubs) {
        utubNames.push([utub.id, utub.name]);
    };

    const firstUtubId = putUtubNames(utubNames);
    if (firstUtubId == null) {
        console.log("User has no UTubs");
    } else {
        getUtubInfo(firstUtubId, userUtubs);
    };
};

/**
 * Makes a GET request from backend to receive the selected UTub's data, sends to displayUtubData
 * @function getUtubInfo
 * @param {string} utubId - The ID of this UTub to receive data for
 */
function getUtubInfo(utubId) {
    let request = $.ajax({
        url: '/home?UTubID=' + utubId,
        type: 'GET',
        dataType: 'json'
    });

    request.done(function(utubData, textStatus, xhr) {
        if (xhr.status == 200) {
            displayUtubData(utubData);
        };
    });

    request.fail(function(xhr, textStatus, error) {
        console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
        console.log("Error: " + error);
    });
};

/**
 * @function displayUtubData
 * Parses and displays the received JSON data this user's selected UTub
 * @param {JSON} utubData JSON data containing all UTub information for this user
 */
function displayUtubData(utubData) {
    let name = utubData.name;
    let desc = utubData.description;
    let urls = utubData.urls;
    let tags = utubData.tags;
    let members = utubData.members;
    let currentUser = $('.c-user').attr('id');

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

            let urlAdderID = url.added_by
            let urlAdder = members.find(element => element.id === urlAdderID);
            let urlName = url.url_string;
            let urlTags = url.url_tags;
            let urlCard = $('<div></div>').attr({
                'class': "card url-card",
                'id': "url" + url.url_id
            });

            let innerUrlCard = $('<div></div>').attr({
                'class': "card-body url-card-body"
            });
            urlCard.append(innerUrlCard);

            let urlLink = $('<a></a>').attr({
                'class': 'card-title',
                'href': '"' + urlName + '"',
            });
            urlLink.html(urlName);

            let addedBy = $('<p></p>').attr({
                'class': 'card-text'
            });
            addedBy.html('Added by: ' + urlAdder.username);

            innerUrlCard.append(urlLink);
            innerUrlCard.append(addedBy);
            
            // Check if url has tags, and if so, append the elements
            if (urlTags.length !== 0) {
                innerUrlCard.append($('<span>Tags: </span>').attr({
                    'class': 'card-text'
                }));

                for (let urlTagID of urlTags) {
                    let tagName = tags.find(element => element.id === urlTagID);
                    let tagToAdd = $('<span></span>').attr({
                        'class': 'tag'
                    });
                    tagToAdd.html(tagName.tag_string);
                    innerUrlCard.append(tagToAdd);
                };
                innerUrlCard.append('<br>');
            };

            // Check if URL was added by current user, or if the user was the creator of this UTub
            if (currentUser == urlAdderID || currentUser == utubData.created_by) {
                let deleteUrl = $('<a></a>').attr({
                    'class': 'btn btn-warning btn-sm py-0 del-link',
                    'href': '#',
                    'id': utubData.id + '-' + url.url_id
                });

                deleteUrl.html('Remove URL');
                innerUrlCard.append(deleteUrl);
            };

            $(".utub-holder").append(urlCard);
        };
    } else {
        const utubHolder= $(".utub-holder");
        const noURLs = $('<h4></h4>').addClass('no-urls').append('<h4>No URLs found. Add one!</h4>');
        utubHolder.append(noURLs);
    };

    displayTags(tags);
};

/**
 * @function deleteUtubLink
 * Sends a JSON as a POST request to delete the signified URL from the given UTub
 * @param {string} urlToDel - A string containing the UTub ID and URL ID, split by '-'
 */
function deleteUtubLink(urlToDel) {
    const utubAndUrl = urlToDel.split('-');
    const utub = utubAndUrl[0];
    const url = utubAndUrl[1];
    var urlToDelete = new Object();
    urlToDelete.UTubID = utub;
    urlToDelete.url_ID = url;
    
    let request = $.ajax({
        url: '/delete_url',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(urlToDelete),
    });

    request.done(function(xml, textStatus, xhr) {
        if (xhr.status == 200) {
            let cardToDel = '#url' + url;
            $(cardToDel).remove();

            const urlCards = $('.url-card');
            if (urlCards.length === 0) {
                const utubHolder= $(".utub-holder");
                const noURLs = $('<h4></h4>').addClass('no-urls').append('<h4>No URLs found. Add one!</h4>');
                utubHolder.append(noURLs);
            }
        };
    });

    request.fail(function(xhr, textStatus, error) {
        console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
        console.log("Error: " + error);
    });
};

/**
 * @function displayTags
 * Displays the tags for the selected UTub
 * @param {Array} utubTags - The tags for this UTub, stored in a string
 */
function displayTags(utubTags) {
    let utubTagsForm = $(".tagsForUtub");
    $('.no-tags').remove();
    if (utubTags.length === 0) {
        const noTags = $('<h4></h4>').addClass('no-tags').html('No tags in this UTub. Add some!');
        utubTagsForm.append(noTags);
    } else {
        for (let tag of utubTags) {
            let tagName = tag.tag_string;
            let tagID = tag.id;

            let tagLabel = $('<label></label>').attr({
                'for': tagName,
                'class': 'form-check-label'
            });
            tagLabel.html(tagName);

            let tagCheckbox = $('<input>').attr({
                'type': 'checkbox',
                'id': tagName,
                'name': tagName,
                'value': tagID,
                'class': 'form-check-input'
            });

            let newTag = $('<div></div>');
            newTag.addClass('form-check');
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
            let request = $.ajax({
                url: "/create_utub",
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(url_home, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    window.location = url_home;
                };
            });
        
            request.fail(function(xhr, textStatus, error) {
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
        });
    });
};

function addUrlToUtub(utub_id, radio_button) {
    $.get("/add_url/" + utub_id, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            $('.modal-flasher').prop({'hidden': true});
            let request = $.ajax({
                url: "/add_url/" + utub_id,
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(add_url_success, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    // window.location = add_url_success.url;
                    getUtubInfo(add_url_success.utubID)
                };
            });
        
            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 409 || xhr.status == 400) {
                    $('.modal-flasher').prop({'hidden': false});
                    $('.modal-flasher').html(xhr.responseJSON.Error)

                }
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
                console.log("Error: " + error);
            })
        });
    });
};
