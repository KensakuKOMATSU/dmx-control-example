import { SerialPort } from 'serialport'

// This code is specified for 'ENTTEC_PRO_DMX'
// ref https://github.com/node-dmx/dmx/blob/master/drivers/enttec-usb-dmx-pro.js

const deviceId = '/dev/tty.usbserial-EN481283'
//const deviceId = '/dev/tty.usbserial-EN481418'
const ENTTEC_PRO_DMX_STARTCODE = 0x00
const ENTTEC_PRO_START_OF_MSG = 0x7e
const ENTTEC_PRO_END_OF_MSG = 0xe7
const ENTTEC_PRO_SEND_DMX_RQ = 0x06
const ENTTEC_PRO_RECV_DMX_PKT = 0x05;

const dmx_data = new Array(512).fill(0);
let dmx_value = 0;
let direction = 1;

// Open the serial port
const port = new SerialPort({
  path: deviceId,
  baudRate: 250000,
  dataBits: 8,
  stopBits: 2,
  parity: 'none'
}, err => {
  if(!err) {
    start();
  } else {
    console.warn(err)
  }
});

function start() {
    console.log('Serial port opened. Sending DMX data...');
  const universe = Buffer.alloc(513, 0)
  let readyToWrite = true

  const hdr = Buffer.from([
    ENTTEC_PRO_START_OF_MSG,
    ENTTEC_PRO_SEND_DMX_RQ,
    universe.length & 0xff,
    ( universe.length >> 8 ) & 0xff,
    ENTTEC_PRO_DMX_STARTCODE,
  ])


    setInterval(() => {
      if( !readyToWrite ) return

        // Simple fader animation
        dmx_value += direction;
        console.log( dmx_value );
        if (dmx_value >= 255) {
            dmx_value = 255;
            direction = -1;
        } else if (dmx_value <= 0) {
            dmx_value = 0;
            direction = 1;
        }
        universe[1] = dmx_value; // Set channel 1
        universe[2] = 100;
        universe[3] = 255
        universe[4] = dmx_value

        const msg = Buffer.concat([
          hdr,
          universe.slice(1),
          Buffer.from([ENTTEC_PRO_END_OF_MSG])
        ]);

        // Write the packet to the serial port
      readyToWrite = false;
      port.write(msg);
      port.drain(() => {
        readyToWrite = true;
      })

    }, 250);
}

