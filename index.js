var express = require('express');
var app = express();
var http = require('http');

var options = {
    root: __dirname
};

app.get('/', function(req,res) {
	res.sendFile("test.html",options);
});

http.createServer(app).listen(process.env.PORT || 3000);
