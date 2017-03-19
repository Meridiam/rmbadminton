var express = require('express');
var app = express();
var passport = require('passport'),
    exphbs = require('express-handlebars'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    LocalStrategy = require('passport-local'),
    TwitterStrategy = require('passport-twitter').Strategy;

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var bCrypt = require('bcryptjs');
var Q = require('q');

var http = require('http');

var User = require('./models/user.js');
var Membership = require('./models/membership.js');

var useragent = require('express-useragent');
app.use(useragent.express());

//===============MONGOOSE=================
var dbConfig = require('./db.js');
var mongoose = require('mongoose');
mongoose.connect(dbConfig.url);

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// Use the LocalStrategy within Passport to login/"signin" users.
passport.use('local-signin', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        // check in mongo if a user with username exists or not
        User.findOne({ 'username' :  username },
            function(err, user) {
                // In case of any error, return using the done method
                if (err)
                    return done(err);
                // Username does not exist, log the error and redirect back
                if (!user){
                    console.log('User Not Found with username '+username);
                    return done(null, false, req.flash('message', 'User Not found.'));
                }
                // User exists but wrong password, log the error
                if (!isValidPassword(user, password)){
                    console.log('Invalid Password');
                    return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                }
                // User and password both match, return user from done method
                // which will be treated like success
                return done(null, user);
            }
        );

    })
);


var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
};
// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('local-signup', new LocalStrategy({
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            User.findOne({ 'username' :  username }, function(err, user) {
                // In case of any error, return using the done method
                if (err){
                    console.log('Error in SignUp: '+err);
                    return done(err);
                }
                // already exists
                if (user) {
                    console.log('User already exists with username: '+username);
                    return done(null, false, req.flash('message','User Already Exists'));
                } else {
                    // if there is no user with that email
                    // create the user
                    var newUser = new User();

                    // set the user's local credentials
                    newUser.username = username;
                    newUser.password = createHash(password);
                    newUser.email = req.param('email');
                    newUser.firstname = req.param('firstname');
                    newUser.lastname = req.param('lastname');

                    // save the user
                    newUser.save(function(err) {
                        if (err){
                            console.log('Error in Saving user: '+err);
                            throw err;
                        }
                        console.log('User Registration succesful');
                        return done(null, newUser);
                    });
                }
            });
        };
        // Delay the execution of findOrCreateUser and execute the method
        // in the next tick of the event loop
        process.nextTick(findOrCreateUser);
    })
);

// Generates hash using bCrypt
var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

passport.use(new GoogleStrategy({
        clientID: "114380784743-am5ep4etkkdm6hoa0g1cjvnodpkk0p6m.apps.googleusercontent.com",
        clientSecret: "Hh0eq0U_ye5ZGsaYR_BI7uqp",
        callbackURL: "http://localhost:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        Membership.findOne({
            'providerUserId': profile.id
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new Membership({
                    provider: profile.provider,
                    providerUserId: profile.id,
                    accessToken: accessToken,
                    displayname: profile.displayName,
                    //email: profile.emails[0].value,
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: "1708125412812130",
        clientSecret: "27fa89d2ee7c68bbd1f3cd1906a960af",
        callbackURL: "http://rmbadminton.herokuapp.com/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        Membership.findOne({
            "providerUserId": profile.id
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new Membership({
                    provider: profile.provider,
                    providerUserId: profile.id,
                    accessToken: accessToken,
                    displayname: profile.displayName,
                    //email: profile.emails[0].value,
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
));

passport.use(new TwitterStrategy({
        consumerKey: "vUVM9VMcLuRuZw63rKX22RgtB",
        consumerSecret: "UBsjVRnHqTtsuUoCsU41pJixBu9mLD3LxaTQeyCzVIFcTEMJw5",
        callbackURL: "http://rmbadminton.herokuapp.com/auth/twitter/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        Membership.findOne({
            "providerUserId": profile.id
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new Membership({
                    provider: profile.provider,
                    providerUserId: profile.id,
                    accessToken: accessToken,
                    displayname: profile.displayName,
                    //email: profile.emails[0].value,
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
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
    passport.authenticate('google', { failureRedirect: '/signup' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
        failureRedirect: '/signup' }));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/',
        failureRedirect: '/signup' }));

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

/* uncomment to check if something is authenticated before showing site content
var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}*/

//PORT

http.createServer(app).listen(process.env.PORT || 3000);
