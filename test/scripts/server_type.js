#!/usr/bin/env node

var sse = require("../../lib/index.js");
var express = require("express");

var app = express();

//Test Routes
app.get('/object', function(req, res) {
	var _client = sse.add(req, res);
	sse.send(_client, {type: "action", value: 8, data: {defined: true}});
});

app.get('/text', function(req, res) {
	var _client = sse.add(req, res);
	sse.send(_client, "Lorem ipsum\ndolor sit\namet.\n\nLorem.");
});

setTimeout(function() {
	process.exit(0);
}, 2000);

var server = app.listen(3752, function() {});