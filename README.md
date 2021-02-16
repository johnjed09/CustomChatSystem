# Custom-Chat System
## Table of Contents
* [Project Details](#Project-Details)
* [Technologies](#Technologies)
* [Dependencies](#Dependencies)
* [Installation](#Installation)
* [Development Status Timeline](#Development-Status-Timeline)
* [Other Information](#Other-Information)

## Project Details
A simple custom-chat system node-application that has the common functions of a social app for sending/receiving messages and files, private chats, and a user-friendly registration/login forms.

Deadline
* January 5, 2021 - January 21, 2021

## Technologies
Project is created with:
* Nodejs - v.14.15.3
* NPM - v.6.14.9
* XAMPP - v.3.2.4
    * PhpMyAdmin
    * MySQL

## Dependencies
Back-end
* dotenv - v.8.2.0
* express - v.4.17.1
* express-fileupload - v.1.2.0
* hbs - v.4.1.1
* mysql - v.2.18.1
* ws - v.7.3.1

Front-end
* Bootstrap CSS/JS
    * v.4.5.2
    * v.4.0.0
    * bootstrap-toggle - v.2.0.0

* Jquery JS
    * v.3.5.1
    * v.3.3.1
    * v.2.2.4

* Popper JS

## Installation
Extract the rar folder.

Install PhpMyAdmin and MySql using XAMPP
1. Download xampp https://www.apachefriends.org/download.html.
2. On the xampp installation wizard, leave the default installation settings and choose/create a folder for the installation.
3. Run xampp.
4. On the xampp control panel, just **Start** Apache and Mysql under **Module**. 
> Note: phpmyadmin won't be accessible if Apache is not yet started.
5. Click **Admin** under MySql Actions to redirect to the phpmyadmin localhost page or just search http://localhost/phpmyadmin/ on your default browser.

Importing */sql/opentext_chat.sql* for the database
1. Create a database named *opentext_chat* using SQL scripts or just click **New** on the sidepanel.
2. Click **Import** tab and click **Choose a file** to browse */sql/opentext_chat.sql*, then scroll-down and click **Go**
> Note: If importing is unsuccessful, check the database name and retry.

Installing Node.
* Follow these steps on your terminal https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04#installing-using-nvm or just download the Node from https://nodejs.org/en/download/

Running the app
1. Type this on your terminal.
> Note: Make sure your inside /CustomChatSytem, the extracted folder.
``````````````
$ node app.js
``````````````
2. Go to your browser and type http://localhost:5000/

*CONGRATS! YOU'VE JUST RUN THE APP. ENJOY.*

## Development Status Timeline
Jan 5, 2021
* Added a README.md file

Jan 6, 2021
* Connected to MySql database
* Commented app.js file

Jan 7, 2021
* Refactor app.js file
* Updated README.md format
* Commented db.js file
* Commented index.js file

Jan 8, 2021
* Refactor login.js
    * Used ajax(url,[settings]) instead of ajax([settings]) for readability
* Refactor register.js
    * uploadImage function
* Commented dbService.js
    * upload service
    * login service

Jan 11, 2021
* Added folder /update
* Added on dbService.js
    * Added property on data object: file_name *// Uploader service*
* Deleted on index.hbs
    * Removed aria-hidden attribute on index.hbs
* Refactor public/js/index.js *// index.hbs javascript*
    * Commented unreadable codes
* Added websocket feature on app.js

Jan 12, 2021
* Added on dbService.js
    * password + CONTEXT for registration and login
* Refactor public/js/index.js *// index.hbs javascript*
* Refactor index.hbs
* Refactor dbService.js

Jan 13, 2021
* Refactor public/js/index.js *// index.hbs javascript*
	* Fix Messaging where default number of messages to load is 25
* Added websocket to the server on app.js

Jan 14, 2021
* Fixed User status that ping if online|offline|away to other clients
* Fixed Real-time messaging with other clients
* Fixed Chat Logs default numbers of messages to load
    * Fixed Load More messages that will load another default number of messages

Jan 15, 2021
* Commented and Refactor index.hbs
* Refactor public/js/index.js *// index.hbs javascript*
* Fixed Single/Multiple File Uploader Feature
* Refactor dbService.js

Jan 18, 2021
* Updated .sql file for storing medium-blob file sizes
* Added a const variable on .env for registering/logging password
* Deleted old bootstrap version
* Installed npm packages:
	* Bootstrap, popper, jquery
* Change Bootstrap Dependencies for the Login Page *// views/index.hbs*

Jan 19, 2021
* Restore deleted bootstrap, jquery, popper
* Change front-end views:
    * login.hbs
    * register.hbs

Jan 20, 2021
* Redesign front-end views:
    * login.hbs
    * register.hbs

Jan 21, 2021
* Refactor index.hbs and remove unused elements
    * Remove Profile feature which has no current function yet.
* Refactor public/js/index.js
    * Profile and Settings condition statement restructure.
* Remove unused folder/files:
    * Jquery, Bootstrap

Feb 3, 2021
* Added a feature
	* User sends/accepts chat invitations in real-time

Feb 4, 2021
* Bug Fix
    * Reload invite list whenever User accept/reject invitation requests.
    * Fetching each contact's messages

Feb 5, 2021
* Bug Fix
    * Hide/Show fetched messages to increase speed

Feb 8, 2021
* Bug Fix
    * Selected messages must not be duplicates.
* Optimize Speed
    * Contact messages won't load again from the database when changing active contact.

Feb 9, 2021
* Feature
    * Blinking notification when recieving messages
    

## Other Information
Contribute
* John Jedidiah Getes