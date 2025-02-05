if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const Grid = require('gridfs-stream');
const { GridFsStorage } = require("multer-gridfs-storage");
const { Readable } = require('stream');
const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');  // Used to send files to Flask
const fetch = require('node-fetch');    // For making HTTP requests to Flask
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const User = require('./models/user');
const userRoutes = require('./routes/users');
const { isLoggedIn } = require('./middleware');
const MongoDBStore = require("connect-mongo");
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.use(mongoSanitize({
    replaceWith: '_'
}))
app.use(flash());

const secret = process.env.SECRET || 'thisshouldbeabettersecret!'; 
const store = MongoDBStore.create({ 
    mongoUrl: dbUrl, 
    secret, 
    touchAfter: 24 * 60 * 60, 
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
};
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user; // Access user data in EJS
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Function to check if Flask is running
// function isFlaskRunning(callback) {
//     http.get('http://localhost:5000', (res) => {
//         callback(true);  // Flask is running
//     }).on('error', (err) => {
//         callback(false); // Flask is not running
//     });
// }
// Function to start the Flask server


// function startFlaskServer() {
//     return new Promise((resolve, reject) => {
//         const flaskProcess = spawn('python', ['app.py']);
//         flaskProcess.stdout.on('data', (data) => {
//             console.log(`Flask stdout: ${data}`);
//             if (data.includes("Running on http://127.0.0.1:5000/")) {
//                 resolve();
//             }
//         });
//         flaskProcess.stderr.on('data', (data) => {
//             console.error(`Flask stderr: ${data}`);
//         });
//         flaskProcess.on('error', (error) => {
//             console.error(`Error starting Flask: ${error.message}`);
//             reject(error);
//         });
//         flaskProcess.on('close', (code) => {
//             console.log(`Flask process exited with code ${code}`);
//         });
//     });
// }

// Route to check if Flask is running
// app.get('/check-flask', (req, res) => {
//         isFlaskRunning(isRunning => {
//             res.sendStatus(isRunning ? 200 : 404);
//         });
// });

// // Route to start Flask server
// app.get('/start-flask', async (req, res) => {
//     try {
//         await startFlaskServer();
//         res.sendStatus(200);
//     } catch (error) {
//         res.sendStatus(500);
//     }
// });

// Serve the EJS index page

app.use('/', userRoutes);
app.get('/', (req, res) => {
    res.render('index');
});

// app.get('/book', isLoggedIn, (req, res) => {
//     res.render('book');
// });

// app.post('/book', async (req, res) => {
//     try {
//         const { to, from, date } = req.body;
//         const trains = await Train.find({
//             'properties.from_station_name': from,
//             'properties.to_station_name': to,
//         });
//         res.render('train/details', { trains, date });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// });

// const storage = new GridFsStorage({ 
//     url: dbUrl, 
//     file: (req, file) => { 
//         return new Promise((resolve, reject) => { 
//             crypto.randomBytes(16, (err, buf) => {
//                 if (err) { 
//                     return reject(err); 
//                 } 
//                 const filename = buf.toString('hex') + path.extname(file.originalname);
//                 const fileInfo = { filename: filename, bucketName: 'uploads'}; 
//                 resolve(fileInfo); 
//             }); 
//         }); 
//     }
// });

// const upload = multer({ storage });

// app.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//         console.log("no file")
//         return res.status(400).send('No file uploaded');
        
//     }
//     console.log('uploaded');
//     const fileId = req.file.id; // MongoDB Objectname
//     console.log(`File uploaded successfully: ${req.file.filename}`);

//     // Check if Flask is running
//     isFlaskRunning(async (isRunning) => {
//         if (!isRunning) {
//             console.log('Flask is not running. Starting Flask...');
//             await startFlaskServer();

//             // Add a delay to give Flask some time to start
//             await new Promise(resolve => setTimeout(resolve, 5000));  // Wait
//         }
//         // Send the fileId to Flask for processing
//         fetch('http://127.0.0.1:5000/upload', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ fileId }),
//         }).then(
//             response=>response.json()
//         ).then(result=>{
//             console.log('Flask result:', result);
//             res.json(result);
//         })

//         .catch (err=>{
//             console.error('Error sending file to Flask:', err);
//             res.status(500).send('Error processing file');
//         });
//     });
// });


const Port = 3000;
app.listen(Port, () => {
    console.log(`Serving on port ${Port}`)
})