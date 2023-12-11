/**
	* @type {Uint8Array} pico8_gpio 
	**/
var pico8_gpio = new Uint8Array(128);

const p8net = (() => {

	let clientId;

	/**
	 * @type {(msg:string)=>void}
	 **/
	function send_to_p8(msg) {
		const len = Math.min(msg.length, 16);
		for (let i = 0; i < len; i++) {
			const c = msg.charCodeAt(i);
			if (c < 128) {
				pico8_gpio[i] = c;
			} else {
				pico8_gpio[i] = 130; // Jelpi p8scii
			}
		}
		// TODO: wait until this is 0
		pico8_gpio[16] = len; // There Is a Message marker
	}

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
	}, 300);

	const evtSource = new EventSource("/events");
  evtSource.addEventListener('welcome', (e)=>{ clientId = e.data;})
  evtSource.addEventListener('ping', (_)=>{ /* noop */ })
  evtSource.addEventListener('game-data', (e)=>{ send_to_p8(e.data)})

	return {
		send_to_p8
	}
})();

window.p8net = p8net;
