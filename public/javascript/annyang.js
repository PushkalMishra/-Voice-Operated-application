
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}
    const stationMapping = {
        'bhopal': 'BHOPAL JN',
        'indore': 'INDORE JN',
        'jabalpur': 'JABALPUR',
        // Add more mappings as needed
    };
    const navigationcommands = {
        'go to home': () => window.location.href = '/',
        'go to booking': () => window.location.href = '/book',
        'go to login': () => window.location.href = '/login',
        'go to register': () => window.location.href = '/register',
        'logout': () => window.location.href = '/logout'
    };
    const commands = {
        'Login name is *n': function(n) {
            document.getElementById('username').value = n;
            console.log("login name is set")
            speak('Username set to ' + n);
            console.log("next field is spoken")
            speak("what's the password")  // Voice feedback
        },
        'My password is *p':function(p){
            document.getElementById('password').value=p;
            speak('password set');
            speak("submit the form") 
        },
        'Login': function() {
            document.getElementById('loginForm').submit();
            speak('You are Logined Succesfully');  // Voice feedback
        }
    };
    var registercommands = {
        'set username to *name': function(name) {
            document.getElementById('newusername').value = name;
            console.log(name);
            speak('Username set to ' + name); 
            console.log("next field is spoken")
            speak("what's the email") // Voice feedback
        },
        'set email to *email': function(email) {
            document.getElementById('email').value = email;
            console.log(email)
            speak('Email set to ' + email); 
            console.log("next field is spoken")
            speak("what's the password") 
        },
        'set password to *password': function(password) {
            document.getElementById('newpassword').value = password;
            console.log(password)
            speak('Password set to ' + password);
            speak("submi the form") 
        },
        'submit registration form': function() {
            document.getElementById('registerForm').submit();
            speak('Registration form submitted');  // Voice feedback
        }
    };
    const bookingCommands = {
        'set from station to *fromStation': function(fromStation) {
            const standardizedFrom = stationMapping[fromStation.toLowerCase()];
            if (standardizedFrom) {
                document.getElementById('from').value = standardizedFrom;
                speak(`From station is set to` + fromStation)
                speak('whats the destination')
            } else {
                speak(`Sorry, I did not recognize the station "${fromStation}". Please specify again.`);
            }
        },
        'set destination to *toStation': function(toStation) {
            const standardizedTo = stationMapping[toStation.toLowerCase()];
            if (standardizedTo) {
                document.getElementById('to').value = standardizedTo;
                speak(`destinnation station is set to` + toStation);
                speak(`whats the date`);
            } else {
                speak(`Sorry, I did not recognize the station "${toStation}". Please specify again.`);
            }
        },
        'set date to *date': function(date) {
            document.getElementById('date').value = date;
            speak(`Date set to ${date}`);
            speak('what is the class preference')
        },
        'set class preference to *preference': function(preference) {
            const classMapping = {
                'first AC': '1A',
                'second AC': '2A',
                'third AC': '3A',
                'sleeper': 'SL',
                'chair car': 'CC',
                'all classes': ''
            };
            document.getElementById('preference').value = classMapping[preference.toLowerCase()] || '';
            speak(`Class preference set to ${preference}`);
            speak('Submit the form')
        },
        'submit booking form': function() {
            document.querySelector('form').submit();
            speak('Booking form submitted');
        }
    };

if(annyang){
    window.onload=()=>{
    const path = window.location.pathname;
        if (path === '/login') {
            annyang.addCommands(navigationcommands);
            annyang.addCommands(commands);
            speak("What is your login name?");
        } else if (path === '/register') {
            annyang.addCommands(navigationcommands);
            annyang.addCommands(registercommands);
            speak("What is your username?");
        }
        else if (path === '/book') {
            annyang.addCommands(navigationcommands);
            annyang.addCommands(bookingCommands);
            speak("What is the starting point?");
        }
        else if (path === '/') {
            annyang.addCommands(navigationcommands);
            speak("Tell when u want to start recording");
        }
    annyang.start();
    }
}else {
    console.log('Annyang is not supported in this browser.');
}