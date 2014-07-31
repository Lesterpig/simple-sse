#!/usr/bin/env node

var sse = require("../../lib/index.js");
var express = require("express");

var app = express();

//Test Routes
app.get('/connect', function(req, res) {
	var _client = sse.add(req, res);
	sse.send(_client, "welcome");
});

setInterval(function() {
	sse.broadcast("*", "broadcast", "a message");
}, 100);

setTimeout(function() {
	process.exit(0);
}, 2000);

var server = app.listen(3750, function() {});