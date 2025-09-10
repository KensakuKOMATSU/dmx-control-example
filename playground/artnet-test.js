const dmxnet = require('dmxnet');

const net = new dmxnet.dmxnet({
  log: { level: 'info' }
})

const sender = net.newSender({
  ip: "192.168.0.5", //IP to send to, default 255.255.255.255
  subnet: 0, //Destination subnet, default 0
  universe: 0, //Destination universe, default 0
  net: 0, //Destination net, default 0
  port: 6454, //Destination UDP Port, default 6454
  base_refresh_interval: 1000
})

const patternObj = {
  "default" : [
    [ 
      // sa: 1,   red - rgb( 255, 0, 0 )
      {  0: 160,  1: 160,  2: 255,  3: 255, 4: 0 },
      { 10:  32, 11: 160, 12: 255, 13:   0, 14: 0, 15: 255 }
    ],
    [
      // sa: 1,   green - rgb( 0, 255, 0 )
      { 0: 32, 1: 96, 2: 255, 3: 0, 4: 255},
      { 10: 160, 11: 96, 12: 255, 13: 255, 14: 255, 15: 0}
    ]
  ],
}

let cnt = 0;
const name = 'default';

setInterval(() => {
  const index = cnt++ % patternObj[name].length;

  for( const obj of patternObj[name][index] ){
    Object.entries( obj ).forEach( ([channel, value]) => {
      sender.prepChannel( parseInt(channel), value );
    })
  }
  sender.transmit();
}, 2_500);

