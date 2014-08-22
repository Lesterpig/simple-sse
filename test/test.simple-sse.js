/**
 * Test file for Mocha.
 * Useful for some real use examples :)
 */

var sse = require("../lib/index");
var assert = require("assert");
var exec = require("child_process").execFile;
var path = require("path");
var fs = require("fs");
var EventSource = require('eventsource');

var wrongReq = {socket: {setTimeout: function() {}}, connection: {addListener: function() {}}};
var wrongRes = {writeHead: function() {}};

describe("Simple SSE", function() {
		
	describe("Client Management", function() { //Don't use "only" on "it" statements.

		var _c;
		var _d;

		it("should add client", function() {
			_c = sse.add(wrongReq, wrongRes);
			assert.equal(1, sse.clients.length);
			assert.equal(_c, sse.clients[0]);
			assert.equal(0, _c.id);
			_d = sse.add(wrongReq, wrongRes);
			assert.equal(1, _d.id);
		});

		it("should get asked client", function(){
			assert.equal(_c, sse.getClient(0));
			assert.equal(_d, sse.getClient(1));
		});

		it("should join rooms", function() {
			sse.join(0, "room_1");
			assert.equal("room_1", _c.rooms[0]);
			sse.join(_c, "room_2");
			assert.equal("room_2", _c.rooms[1]);
		});

		it("should be in rooms", function() {
			assert(sse.in(0, "room_1"));
			assert(sse.in(_c, "room_2"));
			assert(sse.in(0, "*"));
			assert(!sse.in(_d, "room_1"));
			assert(sse.in(_d, "*"));
		});

		it("should leave rooms", function() {
			sse.leave(_c, "room_1");
			assert.equal("room_2", _c.rooms[0]);
			sse.leave(_c, "room_3");
			assert.equal("room_2", _c.rooms[0]);
			sse.leave(_c, "room_2");
			assert.equal(undefined, _c.rooms[0]);
		});

		it("should remove users", function() {
			sse.remove(0);
			assert.equal(_d, sse.clients[0]);
			sse.remove(_d);
			assert.equal(0, sse.clients.length);
		});
	});

	describe("Real Test", function() {

		it("should work with a simple test", function(done) {

			var nbOk = 0;

			fs.chmodSync(path.join(__dirname, "scripts", "server_simple.js"), 508);
			fs.chmodSync(path.join(__dirname, "scripts", "client_simple.js"), 508);

			var server = exec(path.join(__dirname, "scripts", "server_simple.js"));
			var client = exec(path.join(__dirname, "scripts", "client_simple.js"));
			var client2 = exec(path.join(__dirname, "scripts", "client_simple.js"));

			client.stdout.on("data", checkEnd);
			client2.stdout.on("data", checkEnd);
			
			server.on("error", function(m) { throw Error(m) } );
			client.on("error", function(m) { throw Error(m) } );
			client2.on("error", function(m) { throw Error(m) } );

			server.stderr.on("data", function(d) { throw Error(d)});
			client.stderr.on("data", function(d) { throw Error(d)});

			function checkEnd(m) {

				if(m === "connected" || m === "broadcast") nbOk++;

				if(nbOk === 4) {
					server.kill();
					done();
				}
			}

		});

		it("should work with a room test", function(done) {

			fs.chmodSync(path.join(__dirname, "scripts", "server_room.js"), 508);

			var server = exec(path.join(__dirname, "scripts", "server_room.js"));
			server.stderr.on("data", function(d) { throw Error(d)});
			server.on("error", function(m) { throw Error(m) } );

			var client, client2;

			setTimeout(function() {
				client = new EventSource('http://localhost:3751/connect');
				client.onmessage = function(e) {
					if(e.data !== "roomMessage") throw Error("Invalid message");
					client.close();
					client2.close();
					server.kill();
					done();
				}
			}, 1000);


			setTimeout(function() {
				client2 = new EventSource('http://localhost:3751/connect');
			}, 2000);


		});

		it("should work with specific data (object, booleans, multilines strings..)", function(done) {
			fs.chmodSync(path.join(__dirname, "scripts", "server_type.js"), 508);

			var server = exec(path.join(__dirname, "scripts", "server_type.js"));
			server.stderr.on("data", function(d) { throw Error(d)});
			server.on("error", function(m) { throw Error(m) } );

			var client, client2;

			setTimeout(function() {
				client = new EventSource('http://localhost:3752/object');
				client.onmessage = function(m) {
					var o = JSON.parse(m.data);
					assert.strictEqual("action", o.type);
					assert.strictEqual(8, o.value);
					assert.strictEqual(true, o.data.defined);
					client2 = new EventSource('http://localhost:3752/text');
					client2.onmessage = function(m) {
						assert.strictEqual(m.data, "Lorem ipsum\ndolor sit\namet.\n\nLorem.");
						done();
					};
				};
			}, 1000);
		});
		

	});

});