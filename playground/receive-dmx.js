import { SerialPort } from 'serialport'
import { DelimiterParser } from '@serialport/parser-delimiter'

// MacOS : To list USB serial devices ... `ls /dev/tty.*`
// You can list available ports using SerialPort.list()
const deviceId = '/dev/tty.usbserial-EN481418'

// DMX USB PRO uses a fixed baud rate for DMX communication
const baudRate = 250000;

// The command to send to the device to put it into 'receive' mode
// This is the "Get DMX" command from the ENTTEC protocol
const receiveDMXCommand = Buffer.from([0x7E, 0x05, 0x00, 0x00, 0xE7]);

// Create a new SerialPort instance
const port = new SerialPort({
  path: deviceId,
  baudRate: baudRate,
  dataBits: 8,
  stopBits: 2,
  parity: 'none'
});

// Use a parser to handle the incoming data.
// The DMX USB PRO will stream a continuous series of DMX packets.
//const parser = port.pipe(new ReadlineParser({ delimiter: '\r' }));

const parser = port.pipe(new DelimiterParser({ delimiter: Buffer.from([0xe7]) }));


port.on('open', () => {
  console.log('Serial port opened.');

  // Send the command to tell the device to start sending DMX data.
  console.log('Sending command to switch to DMX Input Mode...');
  port.write(receiveDMXCommand, (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('Command sent.');
  });
});

let prev = null

// Listen for data from the serial port
parser.on('data', data => {
  if (data[0] === 0x7E && data[1] === 0x05) {
    // Extract DMX data from the buffer
    const length = (data[2] << 8) | data[3];
    // dmx data の前に、2bytesの `0x00,0x00` がついてくる
    const dmxData = data.slice(6, 4 + length);

    if( dmxData[0] !== undefined ) {
      if( !prev || Buffer.compare( prev, dmxData ) !== 0 ) {
        console.log("Received DMX Data:[%d]", length);
        console.log(`Channel 1: ${dmxData[0]}`);
        console.log(`Channel 2: ${dmxData[1]}`);
        console.log(`Channel 3: ${dmxData[2]}`);
        console.log(`Channel 4: ${dmxData[3]}`);
        console.log(`Channel 512: ${dmxData[511]}`);
        prev = dmxData
      }
    }
  }
  // The incoming data will be a continuous stream of DMX packets
  // You will need to parse this data based on the ENTTEC protocol spec.
  // A typical DMX packet from the device would be:
  // <Label><Data Length LSB><Data Length MSB><Start Code><DMX Data...><End Byte>
  // e.g., 0x05 + LSB + MSB + StartCode + 512 channels + 0xE7
});

port.on('error', (err) => {
  console.log('Error: ', err.message);
});

// To stop receiving, you can simply close the port
// port.close();
