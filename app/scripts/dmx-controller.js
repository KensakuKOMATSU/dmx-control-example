import DMXWrapper from './libs/dmx-wrapper.js';
import { config, colors } from './conf/default.js';

const STATUS = {
    IDLE: 'idle',
    CONNECTED: 'connected',
}

const connectButton = document.getElementById('connectButton');
const controlPanel = document.getElementById('control-panel');
let status = STATUS.IDLE;

function getDmxLabel( config, channel ) {
    for( const device of config ) {
        const relativeChannel = channel - device.start_address + 1;
        if( relativeChannel >= 1 && relativeChannel <= Object.keys( device.map ).length ) {
            //return `${device.name} - ${device.map[ relativeChannel ]} (CH ${channel})`;
            return {
                id: device.id,
                deviceName: device.name,
                channel: channel,
                name: device.map[ relativeChannel ]
            }
        }
    }
    return null;
}

function log( str ) {
    const statusElement = document.getElementById('log');
    statusElement.textContent += str + "\n";
}

function createPanel() {
    for( let ch = 1; ch <= 32; ch++ ) {
        const obj = getDmxLabel( config, ch );
        if( !obj ) continue;

        const label = document.createElement('input');
        label.type = 'text';
        label.value = `[CH ${obj.channel}] ${obj.deviceName} - ${obj.name}`;
        label.style.backgroundColor = colors[ obj.id % colors.length ];
        label.style.padding = '2px 5px';
        label.style.fontWeight = 'bold';
        label.style.color = 'white';

        const valueDisplay = document.createElement('input');
        valueDisplay.type = 'number';
        valueDisplay.readOnly = true;
        valueDisplay.style.width = '3em';
        valueDisplay.value = '0';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = 0;
        input.max = 255;
        input.value = 0;
        input.id = `ch-${ch}`;
        input.style.width = '300px';
        input.addEventListener('input', async () => {
            const dmxData = {};
            dmxData[ch] = parseInt(input.value);
            valueDisplay.value = parseInt(input.value);
            dmx.update( dmxData );
            try {
                await dmx.send();
            } catch (error) {
                log(`send error: ${error.message}`);
            }
        });
        controlPanel.appendChild(label);
        controlPanel.appendChild(input);
        controlPanel.appendChild(valueDisplay);
        controlPanel.appendChild(document.createElement('br'));
    }
}

function clearPanel() {
    controlPanel.innerHTML = '';
}

const dmx = new DMXWrapper();

connectButton.addEventListener('click', async () => {
    log('connecting...');

    // 接続フィルター（ここではベンダーIDのみを指定する例）
    try {
        if( status === STATUS.IDLE ) {
            await dmx.connect();
            status = STATUS.CONNECTED;
            connectButton.textContent = 'disconnect';
            log('connected');
            createPanel();
        } else {
            await dmx.disconnect();
            status = STATUS.IDLE;
            connectButton.textContent = 'connect';
            log('disconnected');
            clearPanel();
        }
    } catch (error) {
        log(`connection error: ${error.message}`);
    }
});