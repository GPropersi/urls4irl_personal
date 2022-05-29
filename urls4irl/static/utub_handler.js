$(document).ready(function() {
    loadUtubData(userUtubs)
    $('.create-utub').click(function() {
        createUtub("/create_utub")
    })

});

function loadUtubData(userUtubs) {
    var utubNames = [];
    for (var utub of userUtubs) {
        utubNames.push([utub.id, utub.name]);
        
    }
    putUtubNames(utubNames)
}

function putUtubNames(utubNames) {
    for (let index = 0; index < utubNames.length; ++index) {
        var utub_id = utubNames[index][0];
        var utub_name = utubNames[index][1];

        if (index === 0) {
            var checked = 'checked';
        } else {
            checked = '';
        }
        var $input = $('<input class="form-check-input" type="radio" name="utub-name" id="utub' + utub_id + '" value="utub' + utub_id + '" '+ checked + '>')
        var $label = $('<label class="form-check-label" for="utub' + utub_id + '"><b>' + utub_name + '</b></label>')
        
        $(".utub-names-ids").append('<div class="form-check utub-names-radios">')
        $(".utub-names-ids").append($input)
        $(".utub-names-ids").append($label)
        $(".utub-names-ids").append('</div>')
    }
}

function createUtub(url) {
    $.get(url, function (data) {
        $('#Modal .modal-content').html(data);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            $.ajax({
                url: url,
                type: "POST",
                data: $('#ModalForm').serialize(),
                success: function(xml, textStatus, xhr) {
                    if (xhr.status === 200) {
                        $('#Modal').modal('hide')
                        window.location = arguments[0]
                    } else {
                        alert("Status Code: " + xhr.status + ". Text Status: " + textStatus)
                    }
                },
            });
        });
    })
};


