/**
 * Require Modules */
const express = require("express")
const router = express.Router()
const dbServiceController = require('../controllers/dbService')

// Use Uploader Service when User is in the specified path
router.post("/upload", dbServiceController.upload)

// Use Files Uploader Service
router.post("/upload/files/:to_user_id/:from_user_id", dbServiceController.uploadFiles)

/**
 * Page/Views Routes */
// Serve index page and pass websocket variables
router.get("/", (_req, res) => {
    res.render('index', {
        ws_url: process.env.WS_URL,
        ws_port: process.env.WS_PORT
    })
})

// Serve login page
router.get("/login", (_req, res) => {
    res.render('login')
})

// Serve register page and pass the avatar size of the User
router.get("/register", (_req, res) => {
    res.render('register', {
        avatar_size: process.env.AVATAR_SIZE
    })
})

/**
 * Service Routes */
// Register Service Route
router.post("/user/register", dbServiceController.register)

// Login Service Route
router.post("/user/login", dbServiceController.login)

// User Details Service Route
router.get("/user/details/:from_user_id", (req, res) => {
    const { from_user_id } = req.params
    const data = { from_user_id }

    return new Promise((_resolve, reject) => {
        try {
            const result = dbServiceController.userDetails(data)

            result
                .then(data => res.json({ data: data }))
                .catch(err => reject(err))
        } catch (err) {
            reject(err.toString('utf8'))
        }
    })
})

// User Lists Service Route
router.get("/user/lists/:from_user_id", (req, res) => {
    const { from_user_id } = req.params
    const data = { from_user_id }

    return new Promise((_resolve, reject) => {
        try {
            const result = dbServiceController.userLists(data)

            result
                .then(data => res.json({ data: data }))
                .catch(err => reject(err))
        } catch (err) {
            reject(err.toString('utf8'))
        }
    })
})

// Status Update Service Route
router.post("/user/status/update", dbServiceController.userStatusUpdate)

// Client-side Log Update Service Route
router.post("/user/csl/update", dbServiceController.userCSLUpdate)

// Server-side Log Update Service Route
router.post("/user/ssl/update", dbServiceController.userSSLUpdate)

// Add new message
router.post("/message/add", dbServiceController.messageAdd)

// Temporary Delete Service Route
router.post("/message/del/temp", dbServiceController.messageDelTemp)

// Permanent Delete Service Route
router.post("/message/del/perm", dbServiceController.messageDelPerm)

// Load User's and Person's Messages Service Route
router.get("/message/list/:to_user_id/:from_user_id", (req, res) => {
    const { to_user_id, from_user_id } = req.params
    const data = { to_user_id, from_user_id }

    return new Promise((_resolve, reject) => {
        try {
            const result = dbServiceController.messageList(data)

            result
                .then(data => res.json({ data: data }))
                .catch(err => reject(err))
        } catch (err) {
            reject(err.toString('utf8'))
        }
    })
})

// Add Contact Service Route
router.post("/contact/add", dbServiceController.contactAdd)

// Delete Contact Route
router.post("/contact/del", dbServiceController.contactDelete)

// Load Invitation List Route
router.get("/invitation/list/:from_user_id", (req, res) => {
    const { from_user_id } = req.params
    const data = { from_user_id }

    return new Promise((_resolve, reject) => {
        try {
            const result = dbServiceController.invitationList(data)

            result
                .then(data => res.json({ data: data }))
                .catch(err => reject(err))
        } catch (err) {
            reject(err.toString('utf8'))
        }
    })
})

// Add new message
router.post("/invitation/add", dbServiceController.chatInvite)

// Delete Invitation Route
router.post("/invitation/del", dbServiceController.invitationDelete)

module.exports = router