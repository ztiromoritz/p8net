const { LuaFactory } = require('wasmoon');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const fs = require('fs');
const app = express()
const port = 6108

const factory = new LuaFactory()




function SSE() {

	/** @type {{clientId:string, response: express.Response}[]}*/
	let clients = [];


	/** @type {(on_join:(clientId:string) => void, on_leave:(clientId:string) => void)=> (request,response ) => void} */
	
	function handler(
		on_join,
		on_leave
	) {

		return (request, response) => {
			const clientId = (Math.random() + 1).toString(36).substring(8);
			const headers = {
				'Content-Type': 'text/event-stream',
				'Connection': 'keep-alive',
				'Cache-Control': 'no-cache',
			};
			response.writeHead(200, headers);
			const client = { clientId, response }
			clients.push(client);
			console.log(`SSE: ${clientId} opened`);
			on_join?.(clientId);
			response.write(`event: welcome\ndata:${clientId}\n\n`);
			setTimeout(() => { response.write("event:ping\n\n") }, 10_000);
			request.on('close', () => {
				console.log(`SSE: ${clientId} closed`);
				on_leave?.(clientId);
				clients = clients.filter((c) => { c.clientId !== clientId });
			});
		};
	}

	/** @type {(clientId: string, message: string)=>void} */
	function sendTo(clientId, message) {
		const client = clients.find((c) =>  c.clientId === clientId );
		client?.response.write(`event:game-data\ndata:${message}\n\n`);
	}

	/** @type {(message: string)=>void} */
	function sendToAll(message) {
		clients.forEach(c => {
			c.response.write(`event:game-data\ndata:${message}\n\n`);
		})
	}
	return { handler, sendTo, sendToAll, clients }
}

//Extract the last tab of code
function extract_server_code() {
	const sourceFile = fs.readFileSync('src/p8net.p8');
	const out = [];
	let in_last_tab = false;
	sourceFile
		.toString()
		.split(/\r?\n/)
		.reverse() // search from below
		.forEach(line => {
			if (line === '-->8') {
				in_last_tab = false;
			}
			if (in_last_tab) {
				out.push(line);
			}
			if (line === '__gfx__') {
				in_last_tab = true;
			}
		});
	return out.reverse().join("\n");
}

// Lua examples
// Set a JS function to be a global lua function
// lua.global.set('sum', (x, y) => x + y)

// Run a lua string
//await lua.doString(` print(sum(10, 10)) function multiply(x, y) return x * y end `)

// Get a global lua function as a JS function
//	const multiply = lua.global.get('multiply')

//await lua.global.call("test", "Print this");

async function init() {
	const lua = await factory.createEngine()

	// SSE Stream to send messages TO the client games
	const sse = SSE();

	const server_code = extract_server_code();
	await lua.doString(server_code);

	/** @type {(ctx: {clientid:string}, msg: string)=>void} **/
	const handle = lua.global.get("_s_handle");

	/** @type {(ctx: {clientid:string})=>void} **/
	const join = lua.global.get("_s_join");

	/** @type {(ctx: {clientid:string})=>void} **/
	const leave = lua.global.get("_s_leave");

	/** @type {()=>void} **/
	const init = lua.global.get("_s_init");

	lua.global.set('s_dbg', (msg) => console.log("DEBUG: " + msg));
	lua.global.set('s_all', () => sse.clients.map(c => c.clientId));
	lua.global.set('s_snd', (msg) => sse.sendToAll(msg));
	lua.global.set('s_sndto', (c, msg) => sse.sendTo(c, msg));

	//mimic some of the pico8 api
	lua.global.set('sub', (str,begin,end)=>str?.substring(begin-1,end));


	//sse.on_join = (clientid)=>join?.({clientid});
	const on_join = (clientid) => join?.({clientid});
	const on_leave = (clientid) => leave?.({ clientid });

	init?.();

	console.log({ handle, join, leave, init });

	const STATE = {
		games: [],
	}

	app.use(bodyParser.text());

	app.get('/events', sse.handler(on_join, on_leave));

	// Endpoint to receive messages FROM the client games
	app.post('/message', (request, response) => {
		const clientId = request.header('X-Client-Id');
		const msg = request.body;
		//console.log(`Message received. msg: ${request.body} clientId: ${clientId}`);
		handle({ clientid: clientId }, msg);
		response.sendStatus(200);
	})

	// Static game page
	app.use('/game', express.static(__dirname + '/dist/www/'));


	// Test
	app.get('/lua', (req, res) => {
		console.log("URL", req.url);
		const multi_return = lua.global.call("test", "Print this");
		res.send(multi_return[0] || "Lua had nothing to say");

	})


	app.listen(port, () => {
		console.log(`Example app listening on http://localhost:${port}`)
	})
}

init();
