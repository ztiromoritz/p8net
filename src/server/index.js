import 'dotenv/config'
import { LuaFactory } from 'wasmoon';
import bodyParser from 'body-parser';
import express from 'express';
import chalk from 'chalk';
import fs from 'fs';


const P8_NET_WWW_FOLDER = process.env['P8_NET_WWW_FOLDER']??'dist/www';

const app = express();
const port = 6108
const factory = new LuaFactory()

/*     
		pico-8 pallet
		--color-0: #000000;
		--color-1: #1d2b53;
		--color-2: #7e2553;
		--color-3: #008751;
		--color-4: #ab5236;
		--color-5: #5f574f;
		--color-6: #c2c3c7;
		--color-7: #fff1e8;
		--color-8: #ff004d;
		--color-9: #ffa300;
		--color-10: #ffec27;
		--color-11: #00e436;
		--color-12: #29adff;
		--color-13: #83769c;
		--color-14: #ff77a8;
		--color-15: #ffccaa;
*/
const { log_lua, log_server , log_client_msg, log_server_msg, log_broadcast_msg} = (() => {
	const _lua = chalk.hex('#29adff');
	const _server = chalk.hex('#00e436');
	const _client_msg = chalk.hex('#ff004d');
	const _server_msg = chalk.hex('#ffa300')

	const log_lua = (msg) => console.log("👾 " + _server(msg));
	const log_server = (msg) => console.log("⚙️+ " + _lua(msg));
	const log_client_msg = (msg) => console.log("⬅️l "+ _client_msg(msg))
	const log_server_msg = (msg) => console.log("➡️  "+ _server_msg(msg))
	const log_broadcast_msg = (msg) => console.log("➡️  "+ _server_msg(msg))
  return {
		log_lua,
		log_server,
		log_client_msg,
		log_server_msg,
		log_broadcast_msg
	}
})();

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
			log_server(`SSE: ${clientId} opened`);
			on_join?.(clientId);
			response.write(`event: welcome\ndata:${clientId}\n\n`);
			setTimeout(() => { response.write("event:ping\n\n") }, 10_000);
			request.on('close', () => {
				log_server(`SSE: ${clientId} closed`);
				on_leave?.(clientId);
				clients = clients.filter((c) => { c.clientId !== clientId });
			});
		};
	}

	/** @type {(clientId: string, message: string)=>void} */
	function sendTo(clientId, message) {
		log_server_msg(message);
		const client = clients.find((c) => c.clientId === clientId);
		client?.response.write(`event:game-data\ndata:${message}\n\n`);
	}

	/** @type {(message: string)=>void} */
	function sendToAll(message) {
		log_broadcast_msg(message);
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

	lua.global.set('s_dbg', (msg) => log_lua(msg));
	lua.global.set('s_all', () => sse.clients.map(c => c.clientId));
	lua.global.set('s_snd', (msg) => sse.sendToAll(msg));
	lua.global.set('s_sndto', (c, msg) => sse.sendTo(c, msg));

	//mimic some of the pico8 api
	lua.global.set('sub', (str, begin, end) => str?.substring(begin - 1, end));


	//sse.on_join = (clientid)=>join?.({clientid});
	const on_join = (clientid) => join?.({ clientid });
	const on_leave = (clientid) => leave?.({ clientid });

	init?.();


	const STATE = {
		games: [],
	}

	app.use(bodyParser.text());

	app.get('/events', sse.handler(on_join, on_leave));

	// Endpoint to receive messages FROM the client games
	app.post('/message', (request, response) => {
		const clientId = request.header('X-Client-Id');
		const msg = request.body;
		log_client_msg(msg);
		handle({ clientid: clientId }, msg);
		response.sendStatus(200);
	})

	// Static game page
	app.use('/game', express.static(P8_NET_WWW_FOLDER));

	app.listen(port, () => {
		log_server(`Example app listening on http://localhost:${port}`)
	})
}

init();
