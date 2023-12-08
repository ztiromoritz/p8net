/**
  * @type {Uint8Array} pico8_gpio 
  **/
var pico8_gpio = new Uint8Array(128);
//var pico8_gpio = new Array(128);
console.log("hier");
const p8net = {

  

  /**
   * @type {(msg:string)=>void}
   **/
  send_to_p8(msg){
    const len = Math.min(msg.length,16);
    for(let i =0;i<len;i++){
      const c = msg.charCodeAt(i);
      if(c<128){
        pico8_gpio[i] = c;
      }else{
        pico8_gpio[i] = 130; // Jelpi p8scii
      }
    }
    // TODO: wait until this is 0
    pico8_gpio[16] = len; // There Is a Message marker
  },

  /**
  * @type {((msg:string)=>void)=>void}
  **/
  on_p8_msg(cb){
    this.cb = cb;
  }

}

setInterval(()=>{
  const len = pico8_gpio[48];
  if(len>0){
    const sub = pico8_gpio.subarray(32,32+len)
    const msg = String.fromCodePoint(...sub);
    p8net.cb?.(msg);
  }
},300);


p8net.on_p8_msg((msg)=>console.log("msg",msg));

window.p8net = p8net;
