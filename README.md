Simple Server-Sent Events
=========================

A really simple library to work with Server-Sent Events in Node.js
[> Mozilla Reference][1]

Installation
------------

You can use npm module, or just copy `lib/index.js` into your own package!

```bash
npm install --save simple-sse
```

Don't forget to require it ! `var sse = require("simple-sse");`

To work, this module requires a http server. You can use express.

Usage
-----

This library is for a global use in your application (e.g. you don't have to call new instances).
It's designed to work with **rooms** for several jobs in your application.

Here is the API :

####sse.add(req, res)

Register a client using it's own http req and res object.
You can add this instruction in a classic route. For example :

```javascript
app.get('/realtime', function(req, res) {
	sse.add(req, res);
});
```

Returns a SSE client.

####sse.join(client, room)

When a client has to join a particular room. A client can join several rooms.

```javascript
app.get('/room/:roomId', function(req, res) {
	var client = sse.add(req, res);
	sse.join(client, parseInt(req.params.roomId));
});
```

####sse.leave(client, room)

To leave a room.

####sse.in(client, room)

Returns true if the client is in the room.
Room "*" will always return true.

####sse.send(client, [event], data)

Send an event to the client.
Data can be multiline or an object, Simple-SSE will parse it correctly.

####sse.broadcast(room, [event], data)

Send an event to each client in "room" room. "room" parameter can be "*".

####sse.remove(client)

Remove a client for Simple-SSE store. It will not close the connection to the client.
Used internally when a client closes the connection.

Test
----

If you have cloned/forked this repository, you can test it with **mocha**.
Just type `npm test` in simple-sse directory.

Enjoy !
-------

This is a very simple library, but don't hesitate to fork and send pull requests :)
*- Lesterpig, a french javascript addict.*


  [1]: https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events