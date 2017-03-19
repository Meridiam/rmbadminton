var express = require('express');
var app = express();
var passport = require('passport'),
    exphbs = require('express-handlebars'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    LocalStrategy = require('passport-local'),
    TwitterStrategy = require('passport-twitter');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook');

//We will be creating these two files shortly
var config = require('./config.js'), //config file contains all tokens and other private info
    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var http = require('http');

var useragent = require('express-useragent')
app.use(useragent.express());


//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
    console.log("serializing " + user.username);
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    console.log("deserializing " + obj);
    done(null, obj);
});

// Use the LocalStrategy within Passport to login/"signin" users.
passport.use('local-signin', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
        funct.localAuth(username, password)
            .then(function (user) {
                if (user) {
                    console.log("LOGGED IN AS: " + user.username);
                    req.session.success = 'You are successfully logged in ' + user.username + '!';
                    done(null, user);
                }
                if (!user) {
                    console.log("COULD NOT LOG IN");
                    req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
                    done(null, user);
                }
            })
            .fail(function (err){
                console.log(err.body);
            });
    }
));
// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('local-signup', new LocalStrategy(
    {passReqToCallback : true}, //allows us to pass back the request to the callback
    function(req, username, password, done) {
        funct.localReg(username, password)
            .then(function (user) {
                if (user) {
                    console.log("REGISTERED: " + user.username);
                    req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
                    done(null, user);
                }
                if (!user) {
                    console.log("COULD NOT REGISTER");
                    req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
                    done(null, user);
                }
            })
            .fail(function (err){
                console.log(err.body);
            });
    }
));

var user = {
    "username": [],
    "password": []
}

passport.use(new GoogleStrategy({
        clientID: "114380784743-am5ep4etkkdm6hoa0g1cjvnodpkk0p6m.apps.googleusercontent.com",
        clientSecret: "Hh0eq0U_ye5ZGsaYR_BI7uqp",
        callbackURL: "http://rmbadminton.herokuapp.com/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return done(err, user);
        });
    }
));


//EXPRESS
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
    var err = req.session.error,
        msg = req.session.notice,
        success = req.session.success;

    delete req.session.error;
    delete req.session.success;
    delete req.session.notice;

    if (err) res.locals.error = err;
    if (msg) res.locals.notice = msg;
    if (success) res.locals.success = success;

    next();
});

// Configure express to use handlebars templates
var hbs = exphbs.create({
    defaultLayout: 'main', //layout
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

var options = {
    root: __dirname
};

/*app.get('/', function(req,res) {
    if(req.useragent.isMobile==true){
        res.sendFile("/public/mobile.html", options);
    } else {
	    res.sendFile("/public/index.html", options);
	}
});

app.get('/ua', function(req,res){
    res.send(req.useragent);
});

app.get('/id', function(req,res) {
	res.send("query: " + req.query.id);
});*/

app.use(express.static('public'));
app.use(express.static('assets'));

//ROUTES

//displays our homepage
app.get('/', function(req, res){
    res.render('home', {user: req.user});
});

//displays our signup page
app.get('/signup', function(req, res){
    res.render('signup');
});

app.get('/SUCC', function(req, res){
    res.render('')
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup'
    })
);

app.get('/auth/google',
    passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }),
    function(req, res){
        // The request will be redirected to Google for authentication, so
        // this function will not be called.
    });

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/SUCC');
    });

//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', {
        successRedirect: '/',
        failureRedirect: '/signup'
    })
);

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
    var name = req.user.username;
    console.log("LOGGIN OUT " + req.user.username)
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
});

//PORT

http.createServer(app).listen(process.env.PORT || 3000);
