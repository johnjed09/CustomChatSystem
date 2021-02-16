/**
 * Login Page Functions */
// Login Function
const login = () => {
    let username = $("#username").val(),
    password = $("#password").val();

    if (username.length === 0 || password.length === 0) {
        alertMessage('Please fill empty fields.', 'alert-danger');
        return
    }

    // Performs Asynchronous Login
    $.ajax('/user/login', {
        type: 'POST',
        cache: false,
        data: { username, password },
        
        success: function (data) {
            if (data == 'user_not_exist') {
                alertMessage('Invalid username or password!', 'alert-danger');
                return
            }

            if (data['message'] == 'success') {
                alertMessage('Login success!', 'alert-success');

                // Set user info to Storage object on the DOM
                localStorage.setItem('username', username)
                localStorage.setItem('from_user_id', data['result'][0]['id'])
                localStorage.setItem('userDetails', JSON.stringify(data['result'][0]))
                
                // Assign to the index.hbs
                window.location.assign("/")
                return
            }
        }, error: function (textStatus, err) {
            alert(`text status ${textStatus}, err ${err}`)
        }
    })
}

// Create alert message
const alertMessage = (message, type) => {
    $('#alertPlaceholder').html(`<div class="alert ${ type } mx-auto"><a type="button" class="close" data-dismiss="alert">&times;</a><span> ${ message } </span></div>`)
}