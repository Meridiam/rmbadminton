var express = require('express');
var app = express();
var http = require('http');
var useragent = require('express-useragent')

var options = {
    root: __dirname
};

app.use(useragent.express());


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
	res.send("id is set to " + req.query.id);
});

app.use(express.static('public'));
app.use(express.static('assets'));

http.createServer(app).listen(process.env.PORT || 3000);
