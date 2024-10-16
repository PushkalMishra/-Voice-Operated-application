const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');  // Used to send files to Flask
const fetch = require('node-fetch');    // For making HTTP requests to Flask
const { exec  } = require('child_process');
const http = require('http');
const ejsMate=require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose=require('mongoose');
const User=require('./models/user');
const userRoutes=require('./routes/users');
const BookingRoutes=require('./routes/book')
const { isLoggedIn } = require('./middleware');

mongoose.connect('mongodb://127.0.0.1:27017/voiceoperation');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));  // Make sure views directory is properly set
const upload = multer({ dest: 'uploads/' });
app.use(flash());

const sessionConfig = {
    name:'session',
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// above line tell the passport to use the localstrategy of username nd password and use authentiction mehtod defined in the user module defined by passport-local-mongoose

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Function to check if Flask is running
function isFlaskRunning(callback) {
    http.get('http://localhost:5000', (res) => {
        callback(true);  // Flask is running
    }).on('error', (err) => {
        callback(false); // Flask is not running
    });
}

// Function to start Flask server
function startFlaskServer() {
    return new Promise((resolve, reject) => {
        exec('python app.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting Flask: ${error.message}`);
                reject(error);
            }
            console.log(`Flask server started`);
            resolve();
        });
    });
}

// Serve the EJS index page
app.get('/', (req, res) => {
    res.render('index');  // This will render index.ejs from the views directory
});

// Handle file uploads and interact with Flask
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    // Check if Flask server is running
    isFlaskRunning(async (isRunning) => {
        if (!isRunning) {
            console.log('Flask is not running. Starting Flask...');
            await startFlaskServer();  // Start Flask if not running
        }

        // Prepare FormData for sending the file to Flask
        const formData = new FormData();
        const filePath = path.join(__dirname, 'uploads', file.filename);
        formData.append('file', fs.createReadStream(filePath));

        // Send the file to Flask for processing
        fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            console.log('Flask result:', result);
            res.json(result);  // Send the result back to the client
        })
        .catch(err => {
            console.error('Error sending file to Flask:', err);
            res.status(500).send('Error processing file');
        });
    });
});
app.get('/book',isLoggedIn,(req,res)=>{
    res.render('book')
})
app.use('/',userRoutes);
app.listen(3000, () => {
    console.log('Express server running at http://localhost:3000');
});
