import DMXWrapper from './libs/dmx-wrapper.js';

const STATUS = {
    IDLE: 'idle',
    CONNECTED: 'connected',
}

const connectButton = document.getElementById('connectButton');
const controlPanel = document.getElementById('control-panel');
let status = STATUS.IDLE;

function log( str ) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = str;
}

function createPanel() {
    for( let ch = 1; ch <= 32; ch++ ) {
        const label = document.createElement('label');
        label.textContent = `CH ${ch}`;
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = '0';
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
            valueDisplay.textContent = input.value;
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