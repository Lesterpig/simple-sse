/**
 * Simple SSE (Server-Sent Events)
 *
 * @author Lesterpig
 *
 * PUBLIC DOMAIN
 *
 * Note : {Client} refers to {Object|Number}
 * If a number is provided, simple-sse will convert it to the correct object.
 */

var uid = 0;

var that = module.exports = {

	clients: [],

	/**
	 * Convert a client id to its full stored object.
	 * Null if not stored.
	 * @param  {Number} id Client Id
	 * @return {Object}    The full client object
	 */
	getClient: function(id) {
		for(var i = 0; i < this.clients.length; i++) {
			if(this.clients[i].id === id) {
				return this.clients[i];
			}
		}
		return null;
	},

	/**
	 * Add a client 
	 * @param {Object} req Http Request
	 * @param {Object} res Http Result
	 * @return{Object} the generated client
	 */
	add: function(req, res) {
		var _id = uid++;
		var _o = {
			id: _id,
			rooms: [],
			res: res
		};
		this.clients.push(_o);

		req.socket.setTimeout(Infinity);

		req.connection.addListener("close", function() {
			that.remove(_id);
	    });

		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});
	
		return _o;
	},

	/**
	 * Remove client from local store
	 * @param  {Client} id
	 */
	remove: function(id) {

		if(typeof id === "object") id = id.id;

		for(var i = 0; i < this.clients.length; i++) {
			if(this.clients[i].id === id) {
				this.clients.splice(i, 1);
				return;
			}
		}

	},

	/**
	 * Join a room
	 * @param  {Client} client
	 * @param  {String} room
	 * @return {Boolean}        False if already in this room.
	 */
	join: function(client, room) {

		client = convertClient(client);
		if(this.in(client, room)) return false;

		client.rooms.push(room);
		return true;

	},

	/**
	 * Leave a room or all rooms
	 * @param  {Client} client
	 * @param  {String} room    The room to leave. Can be "*" to leave all rooms.
	 */
	leave: function(client, room) {

		client = convertClient(client);

		if(room === "*" || !room) {
			client.rooms = [];
			return;
		}

		for(var i = 0; i < client.rooms.length; i++) {
			if(client.rooms[i] === room) {
				client.rooms.splice(i, 1);
			}
		}

		return;

	},

	/**
	 * Wether or not a client is in a room
	 * @param  {Client} client
	 * @param  {String} room
	 * @return {Boolean}
	 */
	in: function(client, room) {

		client = convertClient(client);
		if(room === "*") return true;
		return (client.rooms.indexOf(room) > -1);

	},

	/**
	 * Send a Server-Sent Event to the specified client.
	 * @param  {Client} client
	 * @param  {String} [event]  The event. Should be just a word.
	 * @param  {String|Object} data   The data. Can be multiline or even an object.
	 */
	send: function(client, event, data) {

		client = convertClient(client);
		if(!event) return;
		if(!data) {
			data = event;
			event = null;
		}

		client.res.write("id: " + client.id + '\n');
		if(event) client.res.write('event: '+event+'\n');

		//Clean data
		if(typeof data === "object") {
			data = JSON.stringify(data);
		}
		data = data.split("\n");
		for(var i = 0; i < data.length; i++) {
			client.res.write('data: '+data[i]+'\n');
		}

		client.res.write('\n');

		//For compression module of express
		if(client.res.flush)
			client.res.flush();

		return;

	},

	/**
	 * Send a Server-Sent Event to all clients in a specified room.
	 * @param  {String} room
	 * @param  {String} [event] The event. Should be just a word.
	 * @param  {String|Object} data  The data. Can be multiline or even an object.
	 */
	broadcast: function(room, event, data) {

		for(var i = 0; i < this.clients.length; i++) {
			if(this.in(this.clients[i], room)) {
				this.send(this.clients[i], event, data);
			}
		}

		return;

	}

}

/**** PRIVATE *****/

/**
 * Convert a client id to a full client object if needed.
 * @param  {Client} client A client object or a client id.
 * @return {Object}        The client object associated.
 */
function convertClient(client) {
	if(typeof client === "object")
		return client;
	else {
		client = that.getClient(client);
		if(!client) throw Error(client + " SSE client does not exist.");
		return client;
	}
}