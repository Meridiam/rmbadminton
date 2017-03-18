var express = require('express');
var app = express();
var passport = require('passport'),
    exphbs = require('express-handlebars'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    LocalStrategy = require('passport-local'),
    TwitterStrategy = require('passport-twitter'),
    GoogleStrategy = require('passport-google'),
    FacebookStrategy = require('passport-facebook');

//We will be creating these two files shortly
// var config = require('./config.js'), //config file contains all tokens and other private info
//    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var http = require('http');

var useragent = require('express-useragent')
app.use(useragent.express());


//PASSPORT



//POSTGRESQL
/*var pg = require('pg');
pg.defaults.ssl = true;

pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});*/


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

app.get('/', function(req,res) {
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
});

app.use(express.static('public'));
app.use(express.static('assets'));

//ROUTES



//PORT

http.createServer(app).listen(process.env.PORT || 3000);
