/**
	* @type {Uint8Array} pico8_gpio 
	**/
var pico8_gpio = new Uint8Array(128);

const p8net = (() => {

	// Messages from server	
	let clientId;
	const evtSource = new EventSource("/events");
	evtSource.addEventListener('welcome', (e) => { clientId = e.data; })
	evtSource.addEventListener('ping', (_) => { /* noop */ })
	evtSource.addEventListener('game-data', (e) => { send_to_p8(e.data) })

	// .. server message to p8
	// Message will be buffered in a queue
	/** @type {string[]} */
	const queue = []

	/**
	 * @type {(msg:string)=>void}
	 **/
	function send_to_p8(msg) {
		queue.push(msg);
	}

	/**
		* @type {()=>()}
		**/
	function handle_queue() {
		if (queue.lenght <= 0) return; // Queue is empty
		if (pico8_gpio[16] > 0) return; // Last message isn't handled yet
		const msg = queue.shift();
		const len = Math.min(msg.length, 16); // Truncate message
		if (len == 0) return;

		for (let i = 0; i < len; i++) {
			const c = msg.charCodeAt(i);
			if (c < 128) {
				pico8_gpio[i] = c;
			} else {
				pico8_gpio[i] = 130; // Jelpi p8scii
			}
		}
		pico8_gpio[16] = len; // There Is a Message marker
	}

  
	setInterval(handle_queue, 10);



	// Send message from p8 to server
	/**
	* @type {((msg:string)=>void)=>void}
	**/
	function on_p8_msg(msg) {
		fetch('/message', { method: 'POST', body: msg, credentials: 'include', headers: { "X-Client-Id": clientId ?? "UNKNOWN" } })
	}

	setInterval(() => {
		const len = pico8_gpio[48];
		if (len > 0) {
			const sub = pico8_gpio.subarray(32, 32 + len)
			const msg = String.fromCodePoint(...sub);
			on_p8_msg(msg);
			pico8_gpio[48] = 0;
		}
	}, 10);


	return {
		send_to_p8
	}
})();

window.p8net = p8net;
