/**
 * Require Modules */
const WebSocket = require('ws');
const wsserver = new WebSocket.Server({ port: process.env.WS_PORT })

//Websocket Server Configurations
wsserver.on('connection', (ws) => {
    console.log("A Client has logged in.")

    ws.on('message', (message) => {
        message = JSON.parse(message)

        if (message.type == "name") {
            ws.personName = message.data
            console.log('User: ', ws.personName);
            return
        }

        if (message.type == "contactRequest" || message.type == "contactResponse") {
            console.log(message);
            wsserver.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message))
                }
            })
            return
        }

        console.log("Received: ", message)

        // Broadcast to all client including self
        wsserver.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ name: ws.personName, data: message.data }))
            }
        })
    })

    ws.on('close', () => {
        console.log("A Client just logged out.")
    })
})

module.exports = wsserver