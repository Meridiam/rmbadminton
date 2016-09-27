var express = require('express');
var app = express();

var http = require('http');

var useragent = require('express-useragent')
app.use(useragent.express());

var pg = require('pg');
pg.defaults.ssl = true;

pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});

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

app.get('/t', function(req,res){
    res.send(req);
});

app.use(express.static('public'));
app.use(express.static('assets'));

http.createServer(app).listen(process.env.PORT || 3000);
