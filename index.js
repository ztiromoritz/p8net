const { LuaFactory } = require('wasmoon');


const express = require('express')
const fs = require('fs');
const app = express()
const port = 6108

const factory = new LuaFactory()


async function init() {
	const lua = await factory.createEngine()
	// Set a JS function to be a global lua function
	lua.global.set('sum', (x, y) => x + y)
	const luaFile = fs.readFileSync("./test.lua");
	// TODO: Filter for only backend functions one fuction
	await lua.doString(luaFile.toString());
	await lua.global.call("test", "Print this");
	// Run a lua string
	await lua.doString(` print(sum(10, 10)) function multiply(x, y) return x * y end `)
	// Get a global lua function as a JS function
	const multiply = lua.global.get('multiply')
	console.log(multiply(10, 10))

	app.get('/', (req, res) => {
		res.send('Hello World!')
	})

	app.use('/client', express.static(__dirname + '/dist/'));

	app.get('/lua', (req, res) => {
		console.log("URL",req.url);
		const multi_return = lua.global.call("test", "Print this");
		res.send(multi_return[0] || "Lua had nothing to say");

	})


	app.listen(port, () => {
		console.log(`Example app listening on http://localhost:${port}`)
	})
}

init();
