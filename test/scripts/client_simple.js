#!/usr/bin/env node

var EventSource = require('eventsource');
var es = new EventSource('http://localhost:3750/connect');
var nbOk = 0;

es.onmessage = function(e) {
	process.stdout.write("connected");
}

es.addEventListener("broadcast", function(e) {
	if(e.data !== "a message") return;
	if(++nbOk === 5) {
		//test passed
		process.stdout.write("broadcast");
		process.exit(0);
	}
});