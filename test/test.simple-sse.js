/**
 * Test file for Mocha.
 * Useful for some real use examples :)
 */

var sse = require("../lib/index");
var assert = require("assert");

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


	/* TODO : REAL TEST WITH AN EXPRESS SERVER */
});