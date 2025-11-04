import DMXWrapper from "./scripts/libs/dmx-wrapper.js";
import { datacue2dmx } from "./scripts/libs/datacue2dmx.js";

const dmx = new DMXWrapper();

/**
 * Draws a light element with specified pan, tilt, dimmer, and color.
 * 
 * @param {object} param0 
 * @param {string} param0.lightId - ID of the light element to draw
 * @param {number} param0.pan - Pan angle in degrees
 * @param {number} param0.tilt - Tilt angle in degrees
 * @param {number} param0.dimmer - Dimmer value (0-255)
 * @param {string} param0.color - Color in RGB format (e.g., "rgb(255, 0, 0)")
 * @param {string} [param0.text] - Optional text to display on the light element
 */
const drawLight = ( { lightId, pan, tilt, dimmer, color, text } ) => {
    const lightElement = document.querySelector(`#${lightId} .light`);
    const textElement = document.querySelector(`#${lightId} .text pre`);

    if( lightElement ) {
        lightElement.style.transition = 'transform 1s';
        lightElement.style.transform = `rotateX(${tilt}deg) rotateZ(${pan}deg)`;
        lightElement.style.filter = `brightness(${dimmer / 255})`;

        // color から最後の ) を削除
        const _color = color.slice(0, -1);
        const bgcolor = [
            'radial-gradient( circle',
            `${_color}, 1) 0%`,
            `${_color}, 0.8) 40%`,
            `${_color}, 0.6) 60%`,
            `${_color}, 0.4) 70%`,
            `${_color}, 0.2) 80%`,
            `${_color}, 0.1) 90% )`
            //'transparent 60% )'
        ].join(', ');

        lightElement.style.background = bgcolor;

        textElement.textContent = text || '';
    }
}

/**
 * Initialize the light element with default values.
 * 
 * @param {string} lightId - ID of the light element to initialize
 */
const initLight = ( lightId ) => {
    drawLight({ lightId, pan: 0, tilt: 0, dimmer: 0, color: 'rgb(0, 0, 0)' });
}

/**
 * Update the device status display in the UI.
 */
const connectButton = document.querySelector('#connect-button');
const statusTextElement = document.querySelector('#device-status .status-text');

setInterval( () => {
    statusTextElement.textContent = dmx.status;
}, 500 );

connectButton.addEventListener('click', async () => {
    const isConnected = connectButton.getAttribute('data-connected') === 'true';
    if( !isConnected ) {
        // connect
        await dmx.connect().then( async () => {
            connectButton.setAttribute('data-connected', 'true');
            connectButton.textContent = 'Disconnect from DMX Device';
            log(`Connected to DMX device. status: ${dmx.status}`);
        })
    } else {
        // disconnect
        dmx.update({ 10: 0, 11: 0, 12: 0, 13: 0 }); // reset pan, tilt, dimmer
        await dmx.disconnect();
        connectButton.setAttribute('data-connected', 'false');
        connectButton.textContent = 'Connect to DMX Device';
        log(`Disconnected from DMX device. status: ${dmx.status}`);
    }
});

const logs = []

const log = ( str ) => {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${str}`);

    if( logs.length > 5 ) {
        logs.shift();
    }
    
    const logElement = document.querySelector('#device-control-section .log');
    logElement.innerHTML = '';

    for( let i = logs.length - 1; i >= 0; i-- ) {
        const div = document.createElement('div');
        div.textContent = logs[i];
        logElement.appendChild(div);
    }
}

/**
 * Initialize the application by setting up event listeners for track elements, DataCue.
 */
function init() {
    const trackElements = document.querySelectorAll('track[kind="metadata"]'); 

    for( const trackElement of trackElements ) {
        const forValue = trackElement.getAttribute('for');

        if( forValue && trackElement.track ) {
            trackElement.addEventListener('cuechange', async () => {
                const activeCues = trackElement.track.activeCues;
                if( activeCues && activeCues.length > 0 ) {
                    const currentCue = activeCues[0]; // obtain DataCue

                    if( currentCue.type === 'org.webvmt.example.lighting' ) {
                        drawLight({ lightId: forValue, ...currentCue.value, text: JSON.stringify(currentCue.value, null, 2) });
                        if( dmx.connected ) {
                            const dmxData = datacue2dmx(forValue, currentCue.value);
                            dmx.update(dmxData);
                            await dmx.send();
                            log( JSON.stringify( dmxData ) );
                        }
                    }
                } else {
                    initLight(forValue);
                    if( dmx.connected ) {
                        dmx.clear();
                        await dmx.send();
                        log( 'No active cue. DMX cleared.' );
                    }
                }
            })
            initLight(forValue);
        }
    }
}

init();