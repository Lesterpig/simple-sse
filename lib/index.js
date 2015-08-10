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

var that = module.exports = {

	/**
	 * Used internally. You should use it as a readonly variable.
	 * @type {Array}
	 */
	clients: [],
	/**
	 * The heartbeat interval
	 * Every (heartbeat) ms, a hearbeat will be sent to active clients in order to keep their connection alive.
	 * @type {Number}
	 */
	heartbeat: 20000,

	/**
	 * Converts a client id to its full stored object.
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
	 * Adds a client 
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

		req.socket.setTimeout(0x7FFFFFFF);

		req.connection.addListener("close", function() {
			that.remove(_id);
	    });

		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		//should start interval ?
		if(!heartInterval) {
			heartInterval = setInterval(that.sendHeartbeat, that.heartbeat);
		}
	
		return _o;
	},

	/**
	 * Removes client from local store
	 * @param  {Client} id
	 */
	remove: function(id) {

		if(typeof id === "object") id = id.id;

		for(var i = 0; i < this.clients.length; i++) {
			if(this.clients[i].id === id) {
				this.clients.splice(i, 1);
				//should stop interval ?
				if(that.clients.length === 0) {
					clearInterval(heartInterval);
				}
				return;
			}
		}

	},

	/**
	 * Joins a room
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
	 * Leaves a room or all rooms
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
	 * Sends a Server-Sent Event to the specified client.
	 * @param  {Client} client
	 * @param  {String} [event]  The event. Should be just a word.
	 * @param  {String|Object} data   The data. Can be multiline or even an object.
	 */
	send: function(client, event, data) {

		client = convertClient(client);
		if(event === undefined) return;
		if(data === undefined) {
			data = event;
			event = null;
		}

		client.res.write("id: " + client.id + '\n');
		if(event !== null) client.res.write('event: '+event+'\n');

		//Clean data
		if(typeof data === "object") {
			data = JSON.stringify(data);
		}
		else if(typeof data === "number") {
			data = data.toString();
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
	 * Sends a Server-Sent Event to all clients in a specified room.
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

	},

	/**
	 * Sets the retry parameters for the client.
	 * Should be called just after a connection.
	 * The client will try to reconnect after the retry delay.
	 * @param {Client} client
	 * @param {Number} retry  Delay in ms
	 */
	setRetry: function(client, retry) {
		client = convertClient(client);
		client.res.write("id: " + client.id + '\n');
		client.res.write('retry: '+retry+'\n');
		client.res.write('\n');
		if(client.res.flush)
			client.res.flush();

	},

	/**
	 * Sends a heartbeat comment to all connected clients, to keep their connection alive.
	 */
	sendHeartbeat: function() {
		for(var i = 0; i < that.clients.length; i++) {
			that.clients[i].res.write(":heartbeat signal\n\n");
			if(that.clients[i].res.flush)
				that.clients[i].res.flush();
		}
	}

}

/**** PRIVATE *****/

var uid = 0;
var heartInterval = null;

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
