#!/usr/bin/env node

var sse = require("../../lib/index.js");
var express = require("express");

var app = express();

//Test Routes
app.get('/connect', function(req, res) {
	var _client = sse.add(req, res);
	sse.broadcast("a_wrong_room", "wrongMessage");
	sse.broadcast("a_room", "roomMessage");
	sse.join(_client, "a_room");
});

setTimeout(function() {
	process.exit(0);
}, 2000);

var server = app.listen(3751, function() {});