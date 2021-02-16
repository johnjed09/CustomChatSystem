/**
 * Main Chat Page Functions */
// User details global variables
var userDetails = (typeof localStorage.userDetails === 'undefined') ? [] : JSON.parse(localStorage.userDetails)
var from_user_id = userDetails.id
var username = userDetails.username
var fromUserId = userDetails.id
var selectedMsgs = []

// Initialize client's websocket
const ws_url = $('#ws_url').val(), ws_port = $('#ws_port').val();
let sock;

// Check if there's already a Client logged
var userFound = (typeof localStorage.userDetails !== 'undefined');
if(userFound) {
    sock = new WebSocket(`${ws_url}:${ws_port}`); // Initialize client's websocket credentials to server

    setTimeout(() => $("#loading").hide(), 1000)
} else setTimeout(() => window.location.href = "/login", 1000)

// Load User Details
loadUser(from_user_id)

/**
 * Websocket Client API*/
// Websocket is open for connections
sock.onopen = async function () {
    sock.send(JSON.stringify({
        type: "name",
        data: username
    }))
    
    updateStatus('online', from_user_id)
    loadChatInvite(from_user_id)
    await loadContacts(from_user_id)
}

// Receive messages from the server
sock.onmessage = function (event) {
    const json = JSON.parse(event['data'])
    const messageLog = $(".messages").find(`ul#${json.data.fromUserId}`)
    const contactName = $(`li.contact#${json.data.fromUserId} p.name`).html()
    const contactAvatar = $(`li.contact#${json.data.fromUserId} img`).attr('src')

    // Check if User is the correct receiver
    if (json.data.toUserId == fromUserId || json.data.userNameToAdd == username || json.data.contactReqUsername == username) {
        /**
        * Message Notification */
        // Is a file or text message?
        if (json['data']['type'] == 'files') {
            messageLog.find('#noMessage').hide()

            var saveMsgRes = json['data']['saveMsgRes']
            var saveImgRes = json['data']['saveImgRes']
            var file_index = 0
            var id = 0

            for (var key in saveImgRes) {
                const imgB64 = _arrayBufferToBase64(saveImgRes[key]['data']['data'])
                const imgAsc = imgB64.toString('ascii')
                const fsImgName = saveImgRes[key]['name']
                const size = saveImgRes[key]['size'] / 1000

                if (saveMsgRes instanceof Array) id = saveMsgRes[file_index]['insertId']
                else id = saveMsgRes['insertId']

                $(`.contact#${json.data.fromUserId} .preview`).html(`<span> ${contactName} : </span> Added a file`);

                $(`<li class="sent">
                        <input type="checkbox" class="msgChk" id="${id}" style="display:none;"><img src="${contactAvatar}" alt="" />
                        <a href="data:image/png;base64, ${imgAsc}" download="${fsImgName}">
                        <div style="background:#c0c3c3; border-radius:5px; align-items:center; display:flex;max-width: 300px;float: left;">
                            <img style="margin-left: 10px;margin-right:10px;width:50px;" src="/img/download-icon-1.png" />
                            <div style="display:inline-grid;line-height:20px;margin-right:9px;"><span>${fsImgName}</span><span>${parseFloat(size).toFixed(2)}KB</span></div>
                        </div>
                        </a>
                    </li>`).appendTo(messageLog); // Display file messages to logs

                $(".messages").animate({ scrollTop: $(document).height() }, "fast");

                file_index++
            }
        } else {
            messageLog.find('#noMessage').hide()

            $(`.contact#${json.data.fromUserId} .preview`).html(`<span> ${contactName} : </span> ${json.data.message}`);
            
            if ($(`.contact.active#${json.data.fromUserId}`).length == 0) $(`.contact#${json.data.fromUserId}`).addClass('unread');

            $(`<li class="sent"><input type="checkbox" class="msgChk" id="${json.data.insertId}" style="display:none;"><img src="${contactAvatar}" alt="" /><p>${json.data.message}</p></li>`).appendTo(messageLog); // Display text messages to logs
            $('.message-input input').val(null);

            $(".messages").animate({ scrollTop: $(document).height() }, "fast");
        }

        /**
         * New Contact Notification */
        // Invitation Response
        if(json['type'] == 'contactResponse') {
            var contactToAdd = json.data.username
            if(json.data.response == 'yes') {
                newContact(contactToAdd)// Save new contact
                alertMessage(`${contactToAdd} accepted your invitation.`, 'alert-success');
            } else alertMessage(`${contactToAdd} denied your invitation`, 'alert-danger');
        } else if(json['type']  == 'contactRequest') {
            $(`<li class="contact" id=${json['data']['from_user_id']}>
                <div class="wrap">
                    <img src="${json['data']['file']}" alt="" />
                
                    <div class="meta">
                        <p class="name">Accept <span id="invite-name">${json['data']['username']}</span> chat invitation?</p>
                        <input type="button" class="btn btn-success chatInviteYes" value="Yes">
                        <input type="button" class="btn btn-secondary chatInviteNo" value="No">
                    </div>
                </div>
            </li>`).appendTo($('#contacts ul'));

            // Yes|No button functions
            $('.chatInviteYes').click(function() {
                var contactReqUsername = $(this).siblings('p').find('span').text();
                var contactReqUserId=  $(this).parents('li.contact').attr('id');

                newContact(contactReqUsername) // Save new contact
                deleteInvite(fromUserId, contactReqUserId);
                alertMessage('Invite accepted.', 'alert-success')
                $(this).parents('li.contact').remove();

                sock.send(JSON.stringify({
                    type: "contactResponse",
                    data: { contactReqUsername, username, response:'yes' }
                }));
            });
            $('.chatInviteNo').click(function() {
                var contactReqUsername = $(this).siblings('p').find('span').text();
                var contactReqUserId=  $(this).parents('li.contact').attr('id');
                
                deleteInvite(fromUserId, contactReqUserId);
                alertMessage('Invite denied.', 'alert-warning')
                $(this).parents('li.contact').remove();

                sock.send(JSON.stringify({
                    type: "contactResponse",
                    data: { contactReqUsername, username, response:'no' }
                }));
            });
        }
    }
     
    // Load contacts' status
    loadStatus(from_user_id)
}

/**
 * Default Chat Page States */
$('.initial-content').show()
$('.content').hide()
$('#modalPlaceholder').hide()
$('#slctAllMsg').hide()
$('.select-delete').hide()
$("#settings-expanded").hide()
$("#add-contact-expanded").hide()

/**
 * Eventlisteners for the DOM */
// Open profile option
$("#profile-img").click(function () {
    $("#status-options").toggleClass("active");
});

// Logout and remove user local storage
$('#logout-option').click(function () {
    localStorage.removeItem("userDetails")
    $("#loading").show()

    setTimeout(function () {
        window.location = "/login"
    }, 1000)
})

// Expand a space below profile
$(".expand-button").click(function () {
    $("#profile").toggleClass("expanded");
    $("#contacts").toggleClass("expanded");
});

// Open settings
$("#settings").click(function () {
    let isAddContactExpand = $('#add-contact-expanded').css('display') == 'block' && !$('#profile').hasClass("expanded");
    let notAddContactExpand = $('#add-contact-expanded').css('display') == 'none' && !$('#profile').hasClass("expanded");
    let profileExpanded = $('#add-contact-expanded').css('display') == 'none' && $('#profile').hasClass("expanded");
    let notProfileExpanded = isAddContactExpand || notAddContactExpand || profileExpanded
    if (notProfileExpanded) {
        $("#profile").toggleClass("expanded");
        $("#contacts").toggleClass("expanded");
    }

    $("#settings-expanded").show()
    $("#add-contact-expanded").hide()

    // Switch Server-side Logs
    $('.toggle.btn').eq(0).click(function () {
        var valSsl = $('#ssl').prop('checked') != true ? 1 : 0
        updateSSL(valSsl, from_user_id)
    })

    // Switch Client-side Logs
    let timer;
    $('.toggle.btn').eq(1).click(() => {
        const toUserId = $("li.contact.active").attr('id')
        const messageLog = $(".messages").find(`ul#${toUserId}`)

        clearTimeout(timer);
        timer = setTimeout(function(){
            messageLog.empty()

            // Off/On = 0/1
            var valCsl = $('#csl').prop('checked') != true ? 0 : 1 
            updateCSL(valCsl, from_user_id)
            if (valCsl)// 0:false | 1:true
                if (typeof (toUserId) !== 'undefined')
                    loadContactMessages(toUserId, from_user_id, 1)
        }, 2000);
    })
});

// Add new contact
$("#addcontact").click(function () {
    let isSettingsExpanded = $('#settings-expanded').css('display') == 'block' && !$('#profile').hasClass("expanded");
    let notSettingsExpaned = $('#settings-expanded').css('display') == 'none' && !$('#profile').hasClass("expanded");
    let profileExpanded = $('#settings-expanded').css('display') == 'none' && $('#profile').hasClass("expanded")
    let notProfileExpanded = isSettingsExpanded || notSettingsExpaned || profileExpanded
    if (notProfileExpanded) {
        $("#profile").toggleClass("expanded");
        $("#contacts").toggleClass("expanded");
    }

    $("#add-contact-expanded").show()
    $("#settings-expanded").hide()
});

// Add new contact
$("#edit").click(function () {
    var contact = $('#contacts .contact')
    contact.find('input').toggleClass('contactChk');
    // contacts.find('.msgChk').show()
    // $('#mi').hide()
    // $('.select-delete').show()
    // $('#slctMsg').hide()
    // $('#slctAllMsg').show()

    // messageLog.find('.msgChk').click(function () {
    //     if ($(this).prop('checked')) {
    //         const index = selectedMsgs.indexOf($(this).attr('id'));
    //         if (index == -1)
    //             selectedMsgs.push($(this).attr('id'));
    //     }else {
    //         const index = selectedMsgs.indexOf($(this).attr('id'));
    //         if (index > -1)
    //             selectedMsgs.splice(index, 1);
    //     }
    //     $('.selectedCount').html(selectedMsgs.length)
    // })
});


// Send message/file to a contact
$('.submit').click(function () {
    var insertFile = $('#fileD')[0].files
    insertFile.length == 0 ? newMessage() : newFileMessage()
});

// Sending message, shift+enter next line
$('textarea').keyup(function (event) {
    if (event.keyCode == 13 && event.shiftKey) console.log('Enter+shift') 
    else if (event.keyCode == 13) newMessage()
})

// Message content scrolling animation
$(".messages").animate({ scrollTop: $(document).height() }, "fast");

/**
 * Main Features */
// Update User status
var idleTime = 0;
var isCheckedStats = 0
$(document).ready(() => {
    setInterval(timerIncrement, 2000);

    $(this).mousemove(() => {
        idleTime = 0;

        if (isCheckedStats == 0) {
            isCheckedStats = 1

            updateStatus('online', from_user_id)

            $('#profile-img').removeAttr('class');
            $('#profile-img').addClass('online');

            sock.send(JSON.stringify({
                type: "message",
                data: { status: 'online' }
            }))
        }
    });
});

// Away duration
function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime > 10 && idleTime < 13) { // 20 minutes
        $('#profile-img').removeAttr('class');
        $('#profile-img').addClass('away')

        updateStatus('away', from_user_id)

        sock.send(JSON.stringify({
            type: "message",
            data: { status: 'away' }
        }))

        isCheckedStats = 0
    }
}

//Update user status to offline when user logout
$(window).on('beforeunload', () => {
    updateStatus('offline', from_user_id)
    
    sock.send(JSON.stringify({
        type: "message",
        data: { status: 'offline' }
    }))
});

// User status (oneline|offline|away)
function updateStatus(status, from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/user/status/update',
                type: 'POST',
                cache: false,
                data: ({ status, from_user_id })
            }).done(function (res) {
                console.log('User status updated:', res)
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

/**
 *  Load User Details, status, invites/contact list */
function loadUser(from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: `/user/details/${from_user_id}`,
                type: 'GET',
                cache: false
            }).done(function (res) {
                var server_side_log = res['data'][0]['server_side_log']
                var client_side_log = res['data'][0]['client_side_log']

                if (server_side_log != 1) {
                    $('.toggle.btn').eq(0).removeClass('btn-ch-success')
                    $('.toggle.btn').eq(0).addClass('btn-ch-danger off')
                    $('#ssl').prop('checked', false).change()
                } else {
                    $('.toggle.btn').eq(0).removeClass('btn-ch-danger off')
                    $('.toggle.btn').eq(0).addClass('btn-ch-success')
                    $('#ssl').prop('checked', true).change()
                }

                if (client_side_log != 1) {
                    $('.toggle.btn').eq(1).removeClass('btn-ch-success')
                    $('.toggle.btn').eq(1).addClass('btn-ch-danger off')
                    $('#csl').prop('checked', false).change()
                } else {
                    $('.toggle.btn').eq(1).removeClass('btn-ch-danger off')
                    $('.toggle.btn').eq(1).addClass('btn-ch-success')
                    $('#csl').prop('checked', true).change()
                }

                var imgB64 = _arrayBufferToBase64(res['data'][0]['file']['data'])
                var imgAsc = imgB64.toString('ascii')

                $('.my-username').text(username)
                $("#profile-img").attr("src", "data:image/png;base64," + imgAsc);

            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Fetch contacts' status (online|offline|away)
function loadChatInvite(from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: `/invitation/list/${from_user_id}`,
                type: 'GET',
                cache: false
            }).done(function (res) {
                console.log('Invitations:', res['data'])
                loadInvitesHTML(res['data'])
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Fetch contact list
function loadContacts(from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: `/user/lists/${from_user_id}`,
                type: 'GET',
                cache: false
            }).done(function (res) {
                console.log('Contacts: ', res['data'])
                loadContactsHTML(res['data'])
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Invite new contact
async function addChatInvite() {
    var userNameToAdd = $('#userNameToAdd').val() 
    var res = await saveInvite(from_user_id, userNameToAdd)

    if(res['message'] != 'invite_duplicate') {
        var file = $('#profile-img').attr('src')

        sock.send(JSON.stringify({
            type: "contactRequest",
            data: { userNameToAdd, from_user_id, username, file }
        }));
    }
}

//Save invitation
function saveInvite(from_user_id, userNameToAdd) {
    return new Promise((resolve, reject) => {
        try {
            $.ajax({
                url: '/invitation/add',
                type: 'POST',
                cache: false,
                data: ({ from_user_id, userNameToAdd })
            }).done(function (res) {
                if (res['message'] == 'success') {
                    $("#profile").toggleClass("expanded");
                    alertMessage('Chat requested.', 'alert-success');
                    resolve(res);
                } else if(res['message'] == 'invite_duplicate') {
                    $("#profile").toggleClass("expanded");
                    alertMessage('Your invitation is still pending...', 'alert-warning');
                    resolve(res);
                }else {
                    $("#profile").toggleClass("expanded");
                    alertMessage('User not exist.', 'alert-danger');
                }
                $('#userNameToAdd').val('')
            }).fail(function(err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Saving new contact
function newContact(userNameToAdd) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/contact/add',
                type: 'POST',
                cache: false,
                data: ({ from_user_id, userNameToAdd })
            }).done(function (res) {
                if (res == 'success') {
                    $('#contacts ul').empty()
                    loadContacts(from_user_id)
                } else {
                    $("#profile").toggleClass("expanded");
                    alertMessage('User not exist.', 'alert-danger');
                }
                $('#userNameToAdd').val('')
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Fetch contacts' status (online|offline|away)
function loadStatus(from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: `/user/lists/${from_user_id}`,
                type: 'GET',
                cache: false
            }).done(function (res) {
                console.log('Contacts status:', res['data'])
                loadStatusHTML(res['data'])
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Display contacts status (online|offline|away) to DOM
function loadStatusHTML(data) {
    data.forEach(function ({ id, status }) {
        $(`#${id}.contact span`).removeAttr('class')
        $(`#${id}.contact span`).addClass(`contact-status ${status}`)
    })
}

// Display contact list to DOM
function loadInvitesHTML(data) {
    if (data.length === 0) return

    // Load each contacts to DOM
    for (var key in data) {
        var imgB64 = _arrayBufferToBase64(data[key]['file']['data'])
        var imgAsc = imgB64.toString('ascii')

        $(`<li class="contact" id=${data[key]['from_user_id']}>
            <div class="wrap">
                <img src="data:image/png;base64, ${imgAsc}" alt="" />
            
                <div class="meta">
                    <p class="name">Accept <span id="invite-name">${data[key]['username']}</span> chat invitation?</p>
                    <input type="button" class="btn btn-success chatInviteYes" value="Yes">
                    <input type="button" class="btn btn-secondary chatInviteNo" value="No">
                </div>
            </div>
        </li>`).appendTo($('#contacts ul'));
    }
    
    // Yes|No button functions
    $('.chatInviteYes').click(function() {
        var contactReqUsername = $(this).siblings('p').find('span').text();
        var contactReqUserId=  $(this).parents('li.contact').attr('id');
        newContact(contactReqUsername) // Save new contact
        
        deleteInvite(fromUserId, contactReqUserId);
        alertMessage('Invite accepted.', 'alert-success')
        $(this).parents('li.contact').remove();
        
        sock.send(JSON.stringify({
            type: "contactResponse",
            data: { contactReqUsername, username, response:'yes' }
        }));
    });
    $('.chatInviteNo').click(function() {
        var contactReqUsername = $(this).siblings('p').find('span').text();
        var contactReqUserId=  $(this).parents('li.contact').attr('id');

        deleteInvite(fromUserId, contactReqUserId);
        alertMessage('Invite denied.', 'alert-warning')
        $(this).parents('li.contact').remove();

        sock.send(JSON.stringify({
            type: "contactResponse",
            data: { contactReqUsername, username, response:'no' }
        }));
    });
}

// Delete a contact
function deleteInvite(user_id, from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/invitation/del',
                type: 'POST',
                cache: false,
                data: ({ user_id, from_user_id })
            }).done(function (res) {
                console.log("Deletion: ", res['message'])
                if (res['message'] != 'success') alertMessage('Something went wrong!', 'alert-danger')
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Display contact list to DOM
function loadContactsHTML(data) {
    if (data.length === 0) {
        $(`<li class="contact"><div class="wrap"><div class="meta"><p class="name text-center">No Contacts in Your List</p></div></div></li>`).appendTo($('#contacts ul'));
        return
    }

    // Load each contacts to DOM
    for (var key in data) {
        var imgB64 = _arrayBufferToBase64(data[key]['file']['data'])
        var imgAsc = imgB64.toString('ascii')

        $(`<li class="contact" id=${data[key]['id']}>
            <div class="wrap">
                <span class="contact-status ${data[key]['status']}"></span>
                <img src="data:image/png;base64, ${imgAsc}" alt="" />
                <div class="meta">
                    <p class="name">${data[key]['username']}</p>
                    <p class="preview"></p>
                </div>
                <input type="checkbox" id="${data[key]['id']}" style="display: none;">
            </div>
            </li>`).appendTo($('#contacts ul'));
    }

    // Initialize eventlisteners when User click a contact
    $('li.contact').click(function () {
        $(this).removeClass('unread');
        $(".messages").children().hide();

        const contact_id = this.id // this clicked contact id
        const isLogExist = $(".messages").find(`ul#${contact_id}`).length != 0
        if(isLogExist)
            $(".messages").find(`ul#${contact_id}`).show()
        else {
            $(`<ul class="log" id="${contact_id}"></ul>`).appendTo($('.messages'));
            
            // Load this person's messages
            loadContactMessages(contact_id, from_user_id, 1)
        } 

        // Change active contact
        $('li.contact').removeClass("active")
        
        // This clicked contact will be active
        $(this).addClass("active")
        const contactName = $('li.contact.active p.name').text()

        /**
         * Contact details to the Message Log Panel */
        $('.user-display').text(contactName) 
        const contactAvatar = $('li.contact.active img').attr('src') // Add profile-image(avatar)
        $(".contact-profile img").attr("src", contactAvatar);
    
        cancelDel()
    });
}

/**
 *  Fetch contact messages */
let messageLogs = {}
function loadContactMessages(to_user_id, from_user_id, offset) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: `/message/list/${to_user_id}/${from_user_id}`,
                type: 'GET',
                cache: false
            }).done(function (res) {
                console.log('Contact Messages: ', res['data'])
                messageLogs[to_user_id] = { data:res['data'], offset } // save to object messages
                loadMessagesHTML(messageLogs[to_user_id]['data'], messageLogs[to_user_id]['offset'])
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Display more messages
function loadMoreMessage() {
    const toUserId = $("li.contact.active").attr('id')
    const messageLog = $(".messages").find(`ul#${toUserId}`)

    messageLog.empty();
    messageLog.find('#btnShowMore').remove();

    loadMessagesHTML(messageLogs[toUserId].data, messageLogs[toUserId].offset += 1);
}

// Display messages to the DOM
function loadMessagesHTML(data, offset) {
    $('.initial-content').hide()
    $('.content').show()
    const toUserId = $("li.contact.active").attr('id')
    const messageLog = $(".messages").find(`ul#${toUserId}`)

    // Adjustable default number of messages to load
    var defaultNumMessages = 25
    var numberOfMessages = defaultNumMessages * offset

    /**
     * Render messages to the DOM*/
    var messagesToLog = [];
    if ($('#csl').prop('checked')) {
        messagesToLog = data.slice(0, numberOfMessages);
        messagesToLog.reverse().forEach(function ({ id, to_user_id, from_user_id, message, file, fsImg, fsImgName, deletedBy }) {
            var imgB64 = _arrayBufferToBase64(file['data'])
            var imgAsc = imgB64.toString('ascii')

            // Display on the DOM the undeleted messages/files
            if (deletedBy != fromUserId) {
                // Check for message replies
                if (to_user_id == toUserId) {
                    if (fsImg == null) {
                        $(`<li class="replies"><input type="checkbox" class="msgChk" id="${id}"><img src="data:image/png;base64, ${imgAsc}" alt="" /><p>${message}</p></li>`).appendTo(messageLog);
                    } else {
                        var imgB64b = _arrayBufferToBase64(fsImg['data'])
                        var imgAscb = imgB64b.toString('ascii')
                        var size = fsImg['data'].length / 1000
                        
                        $(`<li class="replies">
                            <input type="checkbox" class="msgChk" id="${id}"><img src="data:image/png;base64, ${imgAsc}" alt="" />
                            <a href="data:image/png;base64, ${imgAscb}" download="${fsImgName}">
                            <div style="background:#c0c3c3; border-radius:5px; align-items:center; display:flex;max-width: 300px;float: right;">
                                <div style="margin-left: 15px;display:inline-grid;line-height:20px;margin-right:9px;"><span>${fsImgName}</span><span>${parseFloat(size).toFixed(2)}KB</span></div>
                                <img style="margin-right:10px;width:50px;" src="/img/download-icon-1.png" />
                            </div>
                            </a>
                        </li>`).appendTo(messageLog);
                    }
                // Check for message sent
                } else if (to_user_id == fromUserId) {
                    if (fsImg == null) {
                        $(`<li class="sent"><input type="checkbox" class="msgChk" id="${id}"><img src="data:image/png;base64, ${imgAsc}" alt="" /><p>${message}</p></li>`).appendTo(messageLog);
                    } else {
                        var imgB64b = _arrayBufferToBase64(fsImg['data'])
                        var imgAscb = imgB64b.toString('ascii')
                        var size = fsImg['data'].length / 1000

                        $(`<li class="sent">
                                <input type="checkbox" class="msgChk" id="${id}"><img src="data:image/png;base64, ${imgAsc}" alt="" />
                                <a href="data:image/png;base64, ${imgAscb}" download="${fsImgName}">
                                <div style="background:#c0c3c3; border-radius:5px; align-items:center; display:flex;max-width: 300px;float: left;">
                                    <img style="margin-left: 10px;margin-right:10px;width:50px;" src="/img/download-icon-1.png" />
                                    <div style="display:inline-grid;line-height:20px;margin-right:9px;"><span>${fsImgName}</span><span>${parseFloat(size).toFixed(2)}KB</span></div>
                                </div>
                                </a>
                            </li>`).appendTo(messageLog);
                    }
                }
            }
        });
    }

    if (offset = 1) { $(".messages").animate({ scrollTop: messageLog.find('li').length * 38 }, "fast") } // auto-scroll to latest message

    $('.msgChk').hide()
    $('.select-delete').hide()

    // Checkbox
    $('#slctMsg').click(function () {
        messageLog.find('.msgChk').show()
        $('#mi').hide()
        $('.select-delete').show()
        $('#slctMsg').hide()
        $('#slctAllMsg').show()

        messageLog.find('.msgChk').click(function () {
            if ($(this).prop('checked')) {
                const index = selectedMsgs.indexOf($(this).attr('id'));
                if (index == -1)
                    selectedMsgs.push($(this).attr('id'));
            }else {
                const index = selectedMsgs.indexOf($(this).attr('id'));
                if (index > -1)
                    selectedMsgs.splice(index, 1);
            }
            $('.selectedCount').html(selectedMsgs.length)
        })
    })

    // Select All Message Checkbox
    $('#slctAllMsg').click(function () {
        selectedMsgs = []
        $('.selectedCount').html(selectedMsgs.length)
        $('.msgChk').prop('checked', true).change()
        $(".msgChk").each(function () {
            selectedMsgs.push($(this).attr('id'))
        });

        $('.selectedCount').html(selectedMsgs.length)
    })

    // modal submit button
    $('.submitDel').click(function () {
        if (selectedMsgs.length == 0)
            alertMessage('Please select message to delete', 'alert-danger');
        else {
            $('#modalPlaceholder').show()
            modalMessage('Are you sure you want to delete?', 'alert-warning');

            $('#modalYes').click(function () {
                $('#msgDelAll').prop('checked') ? delChatPerm(selectedMsgs) : delChatTemp(selectedMsgs);
                $('#modalPlaceholder').hide()
            });
            $('#modalNo').click(function () {
                $('#modalPlaceholder').hide()
            });
        }
    })

    /**
     * Show Message Logs Status*/
    var logs = messageLog.children('li');
    if(logs.length > 1) { // Is message logs not empty
        if(messagesToLog.length < data.length) { // Check messages that are not yet rendered
            messageLog.find('#noMessage').hide()
            $('<div id="btnShowMore" class="text-center m-4"><button class="btn btn-light" onclick="loadMoreMessage()">Show more..</button></div>').prependTo(messageLog)
        } else messageLog.find('#noMessage').hide()
    } else $('<div class="text-center m-4" id="noMessage"><h1>No Messages Yet</h1></div>').prependTo(messageLog)
}

/**
 *  Send new text/file messages */
async function newMessage() {
    const messageElement = $(".message-input textarea")
    var message = messageElement.val();

    const messageEmpty = $.trim(message) == ''
    if (messageEmpty) return false

    messageElement.val("");

    const userAvatar = $('#profile-img').attr('src')
    const toUserId = $("li.contact.active").attr('id')
    const messageLog = $(".messages").find(`ul#${toUserId}`)
    var scRes = ''
    var insertId = 0

    // Save chats to database
    if ($('#ssl').prop('checked')) {
        scRes = await saveChat(toUserId, from_user_id, message)
        insertId = scRes['data']['insertId']
    }

    // Display our new message to the DOM
    messageLog.find('#noMessage').hide()
    $(`<li class="replies"><input type="checkbox" class="msgChk" id="${insertId}" style="display:none;"><img src="${userAvatar}" alt="" /><p>${message}</p></li>`).appendTo(messageLog);
    $('.contact.active .preview').html(`<span>You: </span>${message}`);
    $(".messages").animate({ scrollTop: messageLog.find('li').length * 45 }, "fast");
    $('.message-input input').val(null);

    // Alert the server for a new User's message
    sock.send(JSON.stringify({
        type: "message",
        data: { message, toUserId, fromUserId, insertId }
    }))
}

// Send new file message
async function newFileMessage() {
    const toUserId = $("li.contact.active").attr('id')
    const userAvatar = $('#profile-img').attr('src')
    const messageLog = $(".messages").find(`ul#${toUserId}`)

    if ($('#ssl').prop('checked')) {
        siRes = await saveFileMessage()
        var saveMsgRes = siRes['saveMsgRes']
        var saveImgRes = siRes['images']
    }

    var i = 0
    var id = 0
    for (var key in saveImgRes) {
        const imgB64 = _arrayBufferToBase64(saveImgRes[key]['data']['data'])
        const imgAsc = imgB64.toString('ascii')
        const fsImgName = saveImgRes[key]['name']
        const size = saveImgRes[key]['size'] / 1000

        saveMsgRes instanceof Array ? id = saveMsgRes[i]['insertId'] : id = saveMsgRes['insertId']

        // Send a file type message
        $(`<li class="replies">
                <input type="checkbox" class="msgChk" id="${id}" style="display:none;"><img src="${userAvatar}" alt="" />
                <a href="data:image/png;base64, ${imgAsc}" download="${fsImgName}">
                <div style="background:#c0c3c3; border-radius:5px; align-items:center; display:flex;max-width: 300px;float: right;">
                    <div style="margin-left: 15px;display:inline-grid;line-height:20px;margin-right:9px;"><span>${fsImgName}</span><span>${parseFloat(size).toFixed(2)}KB</span></div>
                    <img style="margin-right:10px;width:50px;" src="/img/download-icon-1.png" />
                </div>
                </a>
            </li>`).appendTo(messageLog);
        
        $('.contact.active .preview').html('<span>You: </span> Added a file');
        $(".messages").animate({ scrollTop: messageLog.find('li').length * 45 }, "fast");
        
        $('.message-input input').val(null);
        i++
    }
    $('#fileD').val('')

    sock.send(JSON.stringify({
        type: "message",
        data: { type: "files", toUserId, fromUserId, saveMsgRes, saveImgRes }
    }))
}

// Save text message
function saveChat(to_user_id, from_user_id, message) {
    return new Promise((resolve, reject) => {
        try {
            $.ajax({
                url: '/message/add',
                type: 'POST',
                cache: false,
                data: ({ to_user_id, from_user_id, message })

            }).done(function (res) {
                console.log('Message saved', res['message'])
                resolve(res)
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Save file(s) message
function saveFileMessage() {
    return new Promise((resolve, reject) => {
        try {
            var data = new FormData();

            $.each($('#fileD')[0].files, function (i, file) {
                data.append(`file_${i}`, file);
            });
            const to_user_id = $("li.contact.active").attr('id')

            $.ajax({
                url: `/upload/files/${to_user_id}/${from_user_id}`,
                cache: false,
                contentType: false,
                data: data,
                method: 'POST',
                processData: false,
                type: 'POST'
            }).done(function (res) {
                alertMessage('File(s) uploaded.', 'alert-success');
                resolve(res)
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

/**
 *  Delete text/file messages */
// Deleting message temporary including database entries
function delChatTemp(selectedItems) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/message/del/temp',
                type: 'POST',
                cache: false,
                data: ({ from_user_id, selectedItems })
            })
            .done(function (res) {
                console.log("Deletion: ", res['message'])
                if (res['message'] == 'success') {
                    const toUserId = $("li.contact.active").attr('id')
                    const messageLog = $(".messages").find(`ul#${toUserId}`)
                    
                    alertMessage('Message deleted!', 'alert-success')
                    messageLog.empty()
                    loadContactMessages(toUserId, from_user_id, 1)
                    cancelDel();
                } else alertMessage('Something went wrong!', 'alert-danger')
            })
            .fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Deleting message permanently including database entries
function delChatPerm(selectedItems) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/message/del/perm',
                type: 'POST',
                cache: false,
                data: ({ from_user_id, selectedItems })
            }).done(function (res) {
                console.log("Deletion: ", res['message'])
                if (res['message'] == 'success') {
                    const toUserId = $("li.contact.active").attr('id')
                    const messageLog = $(".messages").find(`ul#${toUserId}`)
                    
                    alertMessage('Message deleted!', 'alert-success')
                    messageLog.empty()
                    loadContactMessages(toUserId, from_user_id, 1)
                    cancelDel();
                } else alertMessage('Something went wrong!', 'alert-danger')
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Uncheck and cancel selected messages to delete
function cancelDel() {
    $('.msgChk').hide()
    $('#mi').show()
    $('.select-delete').hide()
    selectedMsgs = []
    $('.selectedCount').html(selectedMsgs.length)
    $('.msgChk').prop('checked', false).change()
    $('#slctMsg').show()
    $('#slctAllMsg').hide()
}

/**
 *  Settings Server/Client Button Functions */
// Enable/disable client side message log
function updateCSL(client_side_log, from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/user/csl/update',
                type: 'POST',
                cache: false,
                data: ({ client_side_log, from_user_id })
            }).done(function (res) {
                console.log('User client-side status updated ', res)
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Enable/disable server side message log
function updateSSL(server_side_log, from_user_id) {
    return new Promise((_resolve, reject) => {
        try {
            $.ajax({
                url: '/user/ssl/update',
                type: 'POST',
                cache: false,
                data: ({ server_side_log, from_user_id })
            }).done(function (res) {
                console.log('User server-side status updated ', res)
            }).fail(function (err) {
                reject(err.toString('utf8'));
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

/**
 *  Utilities */
// Blob files to base64 convertion
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
}

// Show an Alert Message for unsuccessful events
function alertMessage(message, type) {
    $('#alertPlaceholder').html(`<div class="alert ${type} mr-auto ml-auto"><a class="close" data-dismiss="alert">&times;</a><span>${message}</span></div>`)
}

// Show an Alert Message for a request events
function modalMessage(message, type) {
    $('#modalPlaceholder').html(`<div class="modalPlaceholder alert ${type} mr-auto ml-auto"><a class="close" data-dismiss="alert">&times;</a><span>${message}</span><div class="mt-4"><input type="checkbox" id="msgDelAll" class="mr-2"><em>Delete forever?</em></div><div class="mt-4"><button class="btn btn-success" id="modalYes">YES</button><button class="btn btn-secondary ml-2" id="modalNo">NO</button></div></div>`)
}

// Show an Alert Message for a request events
function inviteReqMessage(message, type) {
    $('#modalPlaceholder').html(`<div class="modalPlaceholder alert ${type} mr-auto ml-auto"><a class="close" data-dismiss="alert">&times;</a><span>${message}</span><div class="mt-4"><button class="btn btn-success" id="chatInviteYes">YES</button><button class="btn btn-secondary ml-2" id="chatInviteNo">NO</button></div></div>`)
}