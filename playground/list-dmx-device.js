import { SerialPort } from 'serialport'
// MacOS : To list USB serial devices ... `ls /dev/tty.*`
// You can list available ports using SerialPort.list()
//
SerialPort.list()
  .then( devices => console.log( devices ) )
  .catch( err => console.warn( err ) )

