$(document).ready(function() {
    loadUtubData(userUtubs)
    $('.create-utub').click(function() {
        createUtub("/create_utub")
    });
    
    $('.utub-names-ids').on('change', 'input[type=radio]', function(){
        let utubToLoad = $(this).val().replace("utub", "")
        $('.utub-holder').empty()
        $('.tagsForUtub').empty()
        getUtubInfo(utubToLoad)
    });

    $(document).on('click', '.del-link', function() {
        let linkToDelete = $(this).attr('id');
        deleteUtubLink(linkToDelete)
    });

    $('.add-url').click(function() {
        let utubId = $('.utub-title').attr('name').replace('utub', '')
        console.log("Trying to add a url to UTUB: " + utubId)
        // Call modal form to add a URL to this UTub
    });

    var csrftoken = $('meta[name=csrf-token]').attr('content')
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
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

function displayUtubData(utubData) {
    console.log(utubData)
    let name = utubData.name;
    let desc = utubData.description;
    let urls = utubData.urls;
    let tags = utubData.tags;
    let members = utubData.members
    let currentUser = $('.c-user').attr('id')

    $(".utub-title").text(name)
    $(".utub-title").attr('name', 'utub' + utubData.id)
    $(".utub-holder").append('<p class="lead">' + desc + '</p>')
    
    if (urls.length !== 0) {
        for (let url of urls) {
            console.log(url)
            let urlAdderID = url.added_by
            let urlAdder = members.find(element => element.id === urlAdderID);
            let urlName = url.url_string;
            let urlTags = url.url_tags;
            let urlCard = '<div class="card url-card" id="url' + url.url_id
            urlCard += '"><div class="card-body url-card-body">'
            urlCard += '<a class="card-title" href="' + urlName + '">'
            urlCard += urlName + '</a>'
            urlCard += '<p class="card-text">Added by: ' + urlAdder.username + '</p>'
         
            if (urlTags.length !== 0) {
                urlCard += '<span class="card-text">Tags: </span>';
                for (let urlTagID of urlTags) {
                    let tagName = tags.find(element => element.id === urlTagID);
                    urlCard += '<span class="tag">' + tagName.tag_string + '</span>';
                };
                urlCard += '<br>'
            };

            if (currentUser == urlAdderID || currentUser == utubData.created_by) {
                urlCard += '<a class="btn btn-warning btn-sm del-link" href="#" id="'
                urlCard += utubData.id + "-" + url.url_id
                urlCard += '">Remove</a>'
            }
            urlCard += '</div></div>'
            $(".utub-holder").append(urlCard);
        };
    } else {
        $(".utub-holder").append('<h4>No URLs found. Add one!</h4>');
    };

    displayTags(tags);
};

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
    })

    request.done(function(xml, textStatus, xhr) {
        if (xhr.status == 200) {
            let cardToDel = '#url' + url
            $(cardToDel).remove()
        };
    });

    request.fail(function(xhr, textStatus, error) {
        console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus);
        console.log("Error: " + error);
    });
};

function displayTags(utubTags) {
    if (utubTags.length === 0) {
        $(".tagsForUtub").append('<h4>No tags in this UTub. Add some!</h4>');
    } else {
        for (let tag of utubTags) {
            let tagName = tag.tag_string
            let tagID = tag.id
            let htmlLabel = '<label for="' + tagName + '">'
            let htmlInput = '<input type="checkbox" id="' + tagID + '" name="'
            htmlInput += tagName
            htmlInput += '">  ' + tagName
            htmlLabel += htmlInput + '</label>'

            $(".tagsForUtub").append(htmlLabel)
        }
    };
};

function putUtubNames(utubNames) {
    let firstUtubId = null;
    for (let index = 0; index < utubNames.length; ++index) {
        let utub_id = utubNames[index][0];
        let utub_name = utubNames[index][1];
        let checked;

        if (index === 0) {
            checked = 'checked';
            firstUtubId = utub_id
        } else {
            checked = '';
        }
        let $input = $('<input class="form-check-input" type="radio" name="utub-name" id="utub' + utub_id + '" value="utub' + utub_id + '" '+ checked + '>');
        let $label = $('<label class="form-check-label" for="utub' + utub_id + '"><b>' + utub_name + '</b></label>');
        
        $(".utub-names-ids").append('<div class="form-check utub-names-radios">');
        $(".utub-names-ids").append($input);
        $(".utub-names-ids").append($label);
        $(".utub-names-ids").append('</div>');
    }
    return firstUtubId
}

function createUtub(url) {
    $.get(url, function (formHtml) {
        $('#Modal .modal-content').html(formHtml);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            let request = $.ajax({
                url: url,
                type: "POST",
                data: $('#ModalForm').serialize(),
            });

            request.done(function(url_home, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide')
                    window.location = url_home
                }
            })
        
            request.fail(function(xhr, textStatus, error) {
                console.log("Failure. Status code: " + xhr.status + ". Status: " + textStatus)
                console.log("Error: " + error)
            })
        });
    })
};


