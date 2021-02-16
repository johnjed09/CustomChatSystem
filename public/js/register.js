/**
 * Register Page Functions */
let imgId = 0;
var avatar_size = $("#avatar_size").val();
var max_avatar = avatar_size * 1000;

// Check image(extension, size) and upload
const uploadImage = () => {
  let validExtensions = ["image/png"],
    imageFile = jQuery("#fileD")[0].files;

  const isNotPNG = $.inArray(imageFile[0].type, validExtensions) == -1;
  if (isNotPNG) {
    alertMessage("Please upload PNG.", "alert-danger");
    return false;
  }

  // Image file must be 'x' size
  if (imageFile[0].size > max_avatar) {
    alertMessage(`Please upload less than ${avatar_size}KB.`, "alert-danger");
    return false;
  }

  // Append image file to data
  var data = new FormData();
  data.append("file_0", imageFile[0]);

  // Upload image
  $.ajax("/upload", {
    cache: false,
    contentType: false,
    data: data,
    method: "POST",
    processData: false,
    type: "POST",
    success: function (res) {
      imgId = res["insertId"];
      alertMessage("Avatar uploaded.", "alert-success");
    },
  });
};

// Save new User
const saveUser = () => {
  var image = $("#fileD")[0];
  var username = $("#username").val();
  var password = $("#password").val();
  var confirmPassword = $("#confirmPassword").val();

  if (image.files.length == 0 || imgId == 0) {
    alertMessage(`Please upload photo.`, "alert-danger");
    return false;
  }

  if (password !== confirmPassword) {
    alertMessage("Password do not match!", "alert-danger");
    return;
  }

  if (
    username.length === 0 ||
    password.length === 0 ||
    confirmPassword.length === 0
  ) {
    alertMessage("Please fill empty fields.", "alert-danger");
    return;
  }

  $.ajax({
    url: "/user/register",
    type: "POST",
    cache: false,
    data: { username, password, imgId },
    success: function (data) {
      if (data == "duplicate") {
        alertMessage("Username already taken.", "alert-danger");
        return;
      }

      if (data == "success") {
        alertMessage("New username added, you can now login.", "alert-success");
        return;
      }
    },
    error: function (_jqXHR, textStatus, err) {
      alert("text status " + textStatus + ", err " + err);
    },
  });
};

// Create alert message
const alertMessage = (message, type) => {
    $('#alertPlaceholder').html(`<div class="alert ${ type } mx-auto"><a type="button" class="close" data-dismiss="alert">&times;</a><span> ${ message } </span></div>`)
}