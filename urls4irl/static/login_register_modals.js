$(document).ready(function() {
    $('.to_register').off('click').on('click', function() {
        modalOpener("/register")
    })

    $('.to_login').off('click').on('click', function() {
        modalOpener("/login")
    })

    $('.edit-modal-opener').click(function() {
        var url = $(this).data('for-modal');
        modalOpener(url)
    });
    
});

function modalOpener(url) {
    $.get(url, function (data) {
        $('#Modal .modal-content').html(data);
        $('#Modal').modal();
        $('#submit').click(function (event) {
            event.preventDefault();
            let request = $.ajax({
                url: url,
                type: "POST",
                data: $('#ModalForm').serialize()
            });

            request.done(function(response, textStatus, xhr) {
                if (xhr.status == 200) {
                    $('#Modal').modal('hide');
                    window.location = response;
                };
            });

            request.fail(function(xhr, textStatus, error) {
                if (xhr.status == 422) {
                    console.log("422 error")
                    let errorResponse = JSON.parse(xhr.responseJSON);
                    $('.invalid-feedback').remove();
                    $('.alert').remove();
                    $('.form-control').removeClass('is-invalid');
                    for (var key in errorResponse) {
                        switch (key) {
                            case "username":
                            case "password":
                            case "email":
                            case "confirm_email":
                            case "confirm_password":
                                let errorMessage = errorResponse[key];
                                $('<div class="invalid-feedback"><span>' + errorMessage + '</span></div>' )
                                .insertAfter('#' + key).show();
                                $('#' + key).addClass('is-invalid');
                                break;
                            default:
                                const flashMessage = errorResponse.flash.flashMessage
                                const flashCategory = errorResponse.flash.flashCategory
                                $('<div class="alert alert-' + flashCategory + ' alert-dismissible fade show" role="alert">' + flashMessage + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="false">&times;</span></button></div>')
                                .insertBefore('#modal-body').show();
                                $('.alert-' + flashCategory).css("margin-bottom", "0rem")
                        }
                    }
                }
            });
        });
    });
};
