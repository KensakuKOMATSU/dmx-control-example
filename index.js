import DMX from 'dmx'

const dmx = new DMX()
//const driver = 'enttec-open-usb-dmx' // to display raw dmx data, set 'null'
const driver = 'enttec-usb-dmx-pro'
//const driver = 'artnet' // to display raw dmx data, set 'null'
//
// MacOS : To list USB serial devices ... `ls /dev/tty.*`
//const deviceId = '/dev/tty.usbserial-A50285BI' // specify your usb-dmx device name
const deviceId = '/dev/tty.usbserial-EN481283'
//const deviceId = '192.168.0.5' // specify your artnet device ip address
const universe = dmx.addUniverse( 'demo', driver, deviceId )

let flag = true;

const patternObj = {
  "default" : [
    [
      // sa: 1,   red - rgb( 255, 0, 0 )
      {  1: 160,  2: 160,  3: 255,  4: 255, 5: 0 },
      // sa: 10, blue - rgb( 0, 0, 255 )
      { 10:  32, 11: 160, 12: 255, 13:   0, 14: 0, 15: 255 }
    ],
    [
      // sa: 1,   green - rgb( 0, 255, 0 )
      { 1: 32, 2: 96, 3: 255, 4: 0, 5: 255},
      // sa: 10, yellow - rgb( 255, 255, 0 )
      { 10: 160, 11: 96, 12: 255, 13: 255, 14: 255, 15: 0}
    ]
  ],
  "lm70" : [
    [
      // sa: 1,   red - rgb( 255, 0, 0 )
      {  1: 0,  2: 200,  3: 255,  4: 255, 5: 0, 6: 0 },
    ],
    [
      // sa: 1,   green - rgb( 0, 255, 0 )
      { 1: 0, 2: 128, 3: 255, 4: 0, 5: 255, 6: 0 },
    ]
  ]
}

// In this example,
// start address of first dmx light is `1`, while other is `10`
//
// === DMX MAP of devices ===
//  1 : Tilt (Maximum 540 deg.)
//  2 : Pan  (Maximum 180 deg.)
//  3 : Dimmer
//  4 : RED
//  5 : GREEN
//  6 : BLUE
//  7 : WHITE
//
//  URL of video (dmx lightin control with the script shown below.
//  https://nttcom.app.box.com/s/ui9dmitp0t0nb5xs4pe6jrklu75la9ze

let cnt = 0;
const name = 'lm70';

setInterval(() => {
  const index = cnt++ % patternObj[name].length;
  console.log( index )

  for( const obj of patternObj[name][index] ){
    console.log( obj )
    universe.update(obj);
  }
}, 2_500);

