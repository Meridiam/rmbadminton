var express = require('express');
var app = express();
var http = require('http');

var options = {
    root: __dirname
};

app.get('/', function(req,res) {
	res.sendFile("/public/index.html",options);
});

app.get('/p', function(req,res) {
	res.send("id is set to " + req.query.id);
});

app.use(express.static('public'));
app.use(express.static('assets'));

http.createServer(app).listen(process.env.PORT || 3000);
