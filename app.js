/**
 * Require Modules */
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");

// Add .env variables to process.env
// Warning: To load db, always put this before database object.
require("dotenv").config({ path: "./.env" });
const db = require("./controllers/db.js");
const wsserver = require("./controllers/chat.js");
const { ServerResponse } = require("http");

/**
 * App Middlewares Initialization */
const app = express();

// Parse urlencoded and JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// fileUploader
app.use(fileUpload());

// Serve static files
app.use(express.static(path.join(__dirname, "./public")));

// Initialize routes folder
app.use("/", require("./routes"));

// Setup view
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));

/**
 * MySQL Connection */
db.connect((error) => {
  return new Promise((_resolve, reject) => {
    try {
      error ? reject(error.toString("utf8")) : console.log("Connected to MySQL");
    } catch (err) {
      reject(err.toString("utf8"));
    }
  });
});

/**
 * Start a Server */
// Listen on process.env.PORT property
const server = app.listen(process.env.PORT, () => {
  console.log("Server running port 5000");
});

// Upgrade express server and initialize Websocket Server
server.on("upgrade", (request, socket, head) => {
  wsserver.handleUpgrade(request, socket, head, (socket) => {
    wsserver.emit("connection", socket, request);
  });
});