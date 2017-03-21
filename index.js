var express = require('express'),
    exphbs = require('express-handlebars'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    bCrypt = require('bcryptjs'),
    flash = require('connect-flash'),
    showdown  = require('showdown'),
    converter = new showdown.Converter(),
    Remarkable = require('remarkable'),
    md = new Remarkable();

//We will be creating these two files shortly
// var config = require('./config.js'), //config file contains all tokens and other private info
//    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var app = express();
var dbConfig = require('./db.js');
var mongoose = require('mongoose');
mongoose.connect(dbConfig.url);
var User = require('./models/user.js');
var Post = require('./models/post.js');
var Event = require('./models/event.js');

//===============PASSPORT===============

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

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
                // Username does not exist, log error & redirect back
                if (!user){
                    console.log('User Not Found with username '+username);
                    return done(null, false,
                        req.flash('message', 'User Not found.'));
                }
                // User exists but wrong password, log the error
                if (!isValidPassword(user, password)){
                    console.log('Invalid Password');
                    return done(null, false,
                        req.flash('message', 'Invalid Password'));
                }
                // User and password both match, return user from
                // done method which will be treated like success
                return done(null, user);
            }
        );
    }));

var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
};

passport.use('local-signup', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            User.findOne({'username':username},function(err, user) {
                // In case of any error return
                if (err){
                    console.log('Error in SignUp: '+err);
                    return done(err);
                }
                // already exists
                if (user) {
                    console.log('User already exists');
                    return done(null, false,
                        req.flash('message','User Already Exists'));
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
                    newUser.lowerLast = req.param('lastname').toLowerCase();

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

        // Delay the execution of findOrCreateUser and execute
        // the method in the next tick of the event loop
        process.nextTick(findOrCreateUser);
    })
);

var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

//===============EXPRESS================
// Configure Express
app.use(cookieParser());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));
app.use(express.static('assets'));

// Session-persisted message middleware
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
    defaultLayout: 'main'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

//===============ROUTES=================
//displays homepage
app.get('/', function(req, res){
    Post.find({}).sort('-created_at').populate('author').exec(function ( err, posts ){
        Event.find({
            happens: {
                $gte: new Date()
            }
        })
            .sort('happens')
            .exec(function (err, events){
            res.render( 'home', {
                user: req.user,
                news: posts,
                events: events,
                message: req.flash('message')
            });
        });
    });
});

//displays signup page
app.get('/signup', function(req, res){
    res.render('signup', { message: req.flash('message')});
});

//sends the request through local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup'
    })
);

//sends the request through local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', isRegistered, function(req, res){
    var name = req.user.username;
    console.log("LOGGING OUT " + req.user.username);
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
});

app.get('/members', isRegistered, function(req, res){
    User.find()
        .sort({ lowerLast: 1 })
        .exec(function ( err, users ) {
            Event.find()
                .sort('-happens')
                .exec(function (err, events){
                User.findOne({'_id': req.user._id})
                    .populate('events')
                    .exec(function (err, user) {
                        res.render('members', {
                            user: req.user,
                            members: users,
                            events: events,
                            personals: user.events
                        });
                    });
                console.log(JSON.stringify(users, null, "\t"));
            });
        });
});

app.post('/newpost', function(req, res){
    var title = req.body.title,
        //html = converter.makeHtml(req.body.info);
        html = md.render(req.body.info);

    var newPost = new Post();
    newPost.title = title;
    newPost.body = html;
    newPost.author = req.user._id;

    // save the user
    newPost.save(function(err) {
        if (err){
            console.log('Error in Saving user: '+err);
            throw err;
        }
        if (!err) {
            Post.find()
                .populate('author')
                .exec(function(error, posts) {
                    console.log(JSON.stringify(posts, null, "\t"))
                });
            res.redirect('/');
        }
    });
});

app.post('/newevent', function(req, res){
    var title = req.body.name;
    var text = req.body.desc;
    var date = req.body.date;
    var duration = req.body.dur;

    var newEvent = new Event();
    newEvent.name = title;
    newEvent.desc = text;
    newEvent.date = date;
    newEvent.happens = new Date(date);
    newEvent.duration = duration;

    // save the user
    newEvent.save(function(err) {
        if (err){
            console.log('Error in Saving user: '+ err);
            throw err;
        }
            res.redirect('/');
    });
});

app.get('/member/:id', isAdmin, function(req, res){
    User.findOne({ '_id' :  req.params.id },
        function(err, user) {
            // In case of any error, return using the done method
            if (err) {
                return done(err);
            }
            res.render('member', {
                user: user
            })
        }
    );
});

app.get('/event/:id', isRegistered, function(req, res){
    Event.findOne({ '_id' :  req.params.id },
        function(err, event) {
            // In case of any error, return using the done method
            if (err) {
                return done(err);
            }
            if (req.user.events.indexOf(req.params.id) > -1) {
                console.log('This event is in your events');
                if (req.user.admin) {
                    res.render('event', {
                        event: event,
                        admin: true
                    })
                } else {
                    res.render('event', {
                        event: event
                    })
                }
            } else {
                console.log('This event is not your events');
                if (req.user.admin) {
                    res.render('event', {
                        event: event,
                        admin: true,
                        inevents: 'no'
                    })
                } else {
                    res.render('event', {
                        event: event,
                        inevents: 'no'
                    })
                }
            }
        }
    );
});

app.get('/addevent/:id', isRegistered, function(req, res){
    User.findByIdAndUpdate(
        req.user,
        {$push: {'events': req.params.id}},
        {safe: true, upsert: true, new : true},
        function(err, user) {
            if(err) {
                console.log(err);
                return done(err);
            }
            User.find({})
                .populate('events')
                .exec(function(error, user) {
                    console.log(JSON.stringify(user, null, "\t"));
                });
            res.redirect('/members');
        }
    );
});

app.get('/rmevent/:id', isRegistered, function(req, res){
    User.findByIdAndUpdate(
        req.user,
        {$pull: {'events': req.params.id}},
        {safe: true, upsert: true, new : true},
        function(err, user) {
            if(err) {
                console.log(err);
                return done(err);
            }
            User.find({})
                .exec(function(error, user) {
                    console.log(JSON.stringify(user, null, "\t"));
                });
            res.redirect('/members');
        }
    );
});

app.get('/delevent/:id', isAdmin, function(req, res){
    Event.find({'_id': req.params.id})
        .remove()
        .exec(function (err){
            if (err){
                return done(err);
            }
            res.redirect('/members');
        });
});

/*app.post('/resetpwd/:id', isRegistered, function(req, res){
    req.logout();
    User.find({'_id': req.params.id})
        .exec(function (err, user){
            if (err){
                return done(err);
            }
            if(bCrypt.compareSync(req.body.oldpass, user.password)){
                User.update({'_id': req.params.id }, { $set:
                    {
                        'password': createHash(req.body.password)
                    }
                });
                console.log('password reset to: '+user.password);
            }
            res.redirect("/")
        });
});

app.get('/resetpass', isRegistered, function(req, res){
    res.render('resetpwd', {
        'user': req.user
    })
});*/


function isRegistered(req, res, next){
    if(req.isAuthenticated()){
        console.log('cool you are a member, carry on your way');
        next();
    } else {
        console.log('You are not a member');
        res.redirect('/signup');
    }
}

function isAdmin(req, res, next){
    if(req.isAuthenticated() && req.user.admin){
        console.log('cool you are an admin, carry on your way');
        next();
    } else {
        console.log('You are not an admin');
        res.redirect('/signup');
    }
}

//===============PORT=================
var port = process.env.PORT || 3000; //select your port or let it pull from your .env file
app.listen(port);
console.log("listening on " + port + "!");