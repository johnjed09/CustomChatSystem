/**
 * Require Modules */
const db = require('./db.js')
const crypto = require('crypto');
const mysql = require("mysql");
const today = new Date()

// Upload Files
exports.uploadFiles = async (req, res) => {
    const { to_user_id, from_user_id } = req.params
    var queries = ''
    var objEsi = []

    const saveImg = () => {
        return new Promise((resolve, reject) => {
            try {
                objEsi = Object.entries(req.files)

                // Check for multiple files sent
                if (objEsi.length > 1) {
                    for (const [key,value] of Object.entries(req.files)) {
                        data = { file_name: value['name'], file: value['data'], createdAt: today }
                        queries += mysql.format('INSERT INTO files SET ?;', [data])
                    }
                } else {
                    data = { file_name: req.files['file_0']['name'], file: req.files['file_0']['data'], createdAt: today }                    
                    queries = mysql.format('INSERT INTO files SET ?;', data)
                }

                db.query(queries, (error, results) => {
                    if (error) {
                        reject(error.toString('utf8'));
                    }
                    resolve(results)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const saveMsg = (saveImgRes) => {
        return new Promise((resolve, reject) => {
            try {
                queries = ''

                // Check for multiple files sent
                if (objEsi.length > 1) {
                    for (const [key,value] of Object.entries(saveImgRes)) {
                        dataMsg = { to_user_id, from_user_id, file_id: value['insertId'], createdAt: today }
                        queries += mysql.format('INSERT INTO message SET ?;', [dataMsg])
                    }
                } else {
                    dataMsg = { to_user_id, from_user_id, file_id: saveImgRes['insertId'], createdAt: today }
                    queries = mysql.format('INSERT INTO message SET ?;', [dataMsg])
                }

                db.query(queries, (error, results) => {
                    if (error) {
                        reject(error.toString('utf8'));
                    }
                    resolve(results)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const saveImgRes = await saveImg()
    const saveMsgRes = await saveMsg(saveImgRes)

    res.send({ message: 'success', saveMsgRes: saveMsgRes, images: req.files })
}

// Upload Profile Photo
exports.upload = async (req, res) => {
    var file = req.files.file_0;
    var imageBuffer = req.files.file_0.data;
    var fileName = req.files.file_0.name;
    var data = { file_name: fileName, file: imageBuffer, createdAt: today }

    // Save file to local
    file.mv(`public/data/uploads/${file.name}`, (err) => console.log('Profile Pic not saved.', err))

    return new Promise((_resolve, reject) => {
        try {
            db.query('INSERT INTO files SET ?', data, (error, result) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                res.send(result)
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Register New User
exports.register = async (req, res) => {
    const { username, password, imgId } = req.body
    var hashed = crypto.createHash('sha256').update(password + process.env.PASSWORD_CONTEXT).digest('hex')
    
    var data = { username, password: hashed, file_id: imgId, createdAt: today, status: 'away' }

    const checkDuplicate = (username) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT * FROM user WHERE username = ?', [username], (_error, result) => {
                    if (result != '') {
                        res.send('duplicate')
                        return false
                    }
                    resolve(result)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const insertUser = (data) => {
        return new Promise((_resolve, reject) => {
            try {
                db.query('INSERT INTO user SET ?', data, (error) => {
                    if (error) {
                        reject(error.toString('utf8'));
                    }
                    res.send('success')
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const NoUserDuplicate = await checkDuplicate(username)
    if(NoUserDuplicate) {
        await insertUser(data)
    }
}

// Login Service
exports.login = async (req, res) => {
    const { username, password } = req.body
    const hashedPassword = crypto.createHash('sha256').update(password + process.env.PASSWORD_CONTEXT).digest('hex')

    const checkUser = (username, hashedPassword) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, hashedPassword], (_error, result) => {
                    if (result == '') {
                        res.send('user_not_exist')
                        return false
                    } else {
                        res.send({
                            'result': result,
                            'message': 'success'
                        })
                    }
                    resolve(result)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    console.log('checkUser(username, hashedPassword) ', await checkUser(username, hashedPassword))
}

// User Details Service
exports.userDetails = async (req) => {
    const { from_user_id } = req

    return new Promise((resolve, reject) => {
        try {
            db.query('SELECT * FROM user as u LEFT JOIN files as f ON f.id=u.file_id WHERE u.id = ? ', [from_user_id], (error, result) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                resolve(result)
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Invitation Lists
exports.invitationList = async (req) => {
    const { from_user_id } = req

    return new Promise((resolve, reject) => {
        try {
            db.query('SELECT i.id, i.from_user_id, i.to_user_id, i.date_invited, i.status, u.username, f.file_name, f.file FROM invite as i INNER JOIN user as u ON i.from_user_id = u.id INNER JOIN files as f ON u.file_id = f.id WHERE i.to_user_id = ? AND i.status = 0', [from_user_id], (error, result) => {;
                if (error) {
                    reject(error.toString('utf8'));
                }
                resolve(result)
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Chat Invite
exports.chatInvite = async (req, res) => {
    const { from_user_id, userNameToAdd } = req.body

    const getUserToData = (userNameToAdd) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT id FROM user WHERE username = ?', [userNameToAdd], (error, result) => {
                    if (error) {
                        reject(err.toString('utf8'))
                    }
                    resolve(result)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const checkInviteDuplicate = (from_user_id, to_user_id) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT from_user_id, to_user_id FROM invite WHERE from_user_id = ? AND to_user_id = ?', [from_user_id, to_user_id], (error, result) => {
                    if (error) {
                        reject(err.toString('utf8'))
                    }
                    resolve(result)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const insertInvite = (data) => {
        return new Promise((_resolve, reject) => {
            try {
                db.query('INSERT INTO invite SET ?', data, (error) => {
                    if (error) {
                        reject(error.toString('utf8'));
                    }
                    res.send({ message: 'success', data: to_user_id})
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const to_user = await getUserToData(userNameToAdd)
    if (to_user != '') {
        to_user_id = to_user[0]['id']

        if (from_user_id == to_user_id) {
            res.send('user_not_exist')
        } else {
            const InviteDuplicate = await checkInviteDuplicate(from_user_id, to_user_id)
            if(InviteDuplicate == '') {
                var data = { to_user_id, from_user_id, date_invited: today }
                insertInvite(data)
            } else {
                res.send({message:'invite_duplicate'})
            }
        }
    } else {
        res.send('user_not_exist')
    }
}

// Delete Invitation
exports.invitationDelete = async (req, res) => {
    const user_id = req['body']['user_id']
    const from_user_id = req['body']['from_user_id']

    db.query('DELETE FROM invite WHERE to_user_id = ? AND from_user_id = ?',[user_id, from_user_id], (error, results) => {
        if (error) {
            reject(error.toString('utf8'));
        }
        res.send({ message: 'success', result: results })
    })
}

// User Contact Lists
exports.userLists = async (req) => {
    const { from_user_id } = req

    return new Promise((resolve, reject) => {
        try {
            db.query('SELECT us.id, us.username, us.status, us.client_side_log, us.server_side_log, f.file FROM user as us INNER JOIN contacts as cn ON us.id=cn.to_user_id INNER JOIN files as f ON us.file_id=f.id WHERE cn.from_user_id = ? GROUP BY cn.to_user_id', [from_user_id], (error, result) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                resolve(result)
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Add Contact Person
exports.contactAdd = async (req, res) => {
    const { userNameToAdd, from_user_id } = req.body
    var to_user_id = 0

    const checkUname = (userNameToAdd) => {
        return new Promise((resolve, reject) => {
            try {
                db.query('SELECT id FROM user WHERE username = ?', [userNameToAdd], (error, result) => {
                    if (error) {
                        reject(err.toString('utf8'))
                    }
                    resolve(result)
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const insertContact = (data) => {
        return new Promise((_resolve, reject) => {
            try {
                db.query('INSERT INTO contacts SET ?', data, (error) => {
                    if (error) {
                        reject(error.toString('utf8'));
                    }
                    res.send('success')
                })
            } catch (err) {
                reject(err.toString('utf8'));
            }
        })
    }

    const cD = await checkUname(userNameToAdd)
    if (cD != '') {
        to_user_id = cD[0]['id']

        if (from_user_id == to_user_id) {
            res.send('user_not_exist')
        } else {
            var data = { from_user_id, to_user_id, createdAt: today }
            await insertContact(data)
        }
    } else {
        res.send('user_not_exist')
    }
}

// Delete Contact
exports.contactDelete = async (req, res) => {
    const from_user_id = req['body']['from_user_id']
    const to_user_id = req['body']['to_user_id']

    db.query('DELETE FROM contacts WHERE from_user_id = ? AND to_user_id = ?',[from_user_id, to_user_id], (error, results) => {
        if (error) {
            reject(error.toString('utf8'));
        }
        res.send({ message: 'success', result: results })
    })
}

// User Create New Message
exports.messageAdd = async (req, res) => {
    const { to_user_id, from_user_id, message } = req.body
    var data = { to_user_id, from_user_id, message, createdAt: today }

    return new Promise((_resolve, reject) => {
        try {
            db.query('INSERT INTO message SET ?', data, (error, result) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                res.send({ 'message': 'success', 'data': result })
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// User Delete Messages Temporary
exports.messageDelTemp = async (req, res) => {
    const { from_user_id } = req.body
    const selectedMsgs = req['body']['selectedItems[]']
    const deletedAt = today
    let queries = ''

    if (selectedMsgs instanceof Array) {
        selectedMsgs.forEach(function (id) {
            queries += mysql.format('UPDATE message SET deletedBy = ?, deletedAt = ? WHERE id = ?;', [from_user_id, deletedAt, id])
        });
    } else {
        queries = mysql.format('UPDATE message SET deletedBy = ?, deletedAt = ? WHERE id = ?;', [from_user_id, deletedAt, selectedMsgs])
    }

    db.query(queries, (error, results) => {
        if (error) {
            reject(error.toString('utf8'));
        }
        res.send({ message: 'success', result: results })
    })
}

// User Delete Messages Permanently
exports.messageDelPerm = async (req, res) => {
    const selectedMsgs = req['body']['selectedItems[]']
    let queries = ''

    if (selectedMsgs instanceof Array) {
        selectedMsgs.forEach(function (id) {
            queries += mysql.format('DELETE FROM message WHERE id = ?;', [id])
        })
    } else {
        queries = mysql.format('DELETE FROM message WHERE id = ?;', [selectedMsgs])
    }

    db.query(queries, (error, results) => {
        if (error) {
            reject(error.toString('utf8'));
        }
        res.send({ message: 'success', result: results })
    })
}

// Get Contact Messages
exports.messageList = async (req) => {
    const { from_user_id, to_user_id } = req

    return new Promise((resolve, reject) => {
        try {
            db.query(`SELECT m.id, m.message, m.from_user_id, m.to_user_id, us.client_side_log, us.server_side_log, us.status, us.username, m.deletedBy, m.deletedAt, f.file ,fs.file as fsImg, fs.file_name as fsImgName FROM message as m LEFT JOIN user as us ON us.id=m.from_user_id LEFT JOIN files as f ON f.id=us.file_id LEFT JOIN files as fs ON fs.id=m.file_id WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?) ORDER BY m.id DESC`, [from_user_id, to_user_id, to_user_id, from_user_id], (error, result) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                resolve(result)
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Update User Status(online, offline, away)
exports.userStatusUpdate = async (req, res) => {
    const { status, from_user_id } = req.body

    return new Promise((_resolve, reject) => {
        try {
            db.query('UPDATE user SET status = ? WHERE id = ? ', [status, from_user_id], (error) => {
                if (error) {
                    reject(error.toString('utf8'))
                }
                res.send('success')
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Update Client-side History
exports.userCSLUpdate = async (req, res) => {
    const { client_side_log, from_user_id } = req.body

    return new Promise((_resolve, reject) => {
        try {
            db.query('UPDATE user SET client_side_log = ? WHERE id = ? ', [client_side_log, from_user_id], (error) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                res.send({ message: 'success', data: client_side_log })
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}

// Update Service-side History
exports.userSSLUpdate = async (req, res) => {
    const { server_side_log, from_user_id } = req.body

    return new Promise((_resolve, reject) => {
        try {
            db.query('UPDATE user SET server_side_log = ? WHERE id = ? ', [server_side_log, from_user_id], (error) => {
                if (error) {
                    reject(error.toString('utf8'));
                }
                res.send({ message: 'success', data: server_side_log })
            })
        } catch (err) {
            reject(err.toString('utf8'));
        }
    })
}