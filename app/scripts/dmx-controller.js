import DMXWrapper from './libs/dmx-wrapper.js';
import { config, colors } from './conf/default.js';

const STATUS = {
    IDLE: 'idle',
    CONNECTED: 'connected',
}

const KEY_MEMORIES = 'dmx_memories_v1';
const KEY_SEQUENCE = 'dmx_sequence_v1';

const connectButton = document.getElementById('connectButton');
const memoryButton = document.getElementById('memoryButton');
const clearButton = document.getElementById('clearButton');
const controlPanel = document.getElementById('control-panel');
const memoryPanel = document.getElementById('memory-panel');
const sequenceSection = document.getElementById('sequence-section');
const sequenceTextarea = document.getElementById('sequence-textarea');
const playSequenceButton = document.getElementById('play-sequence-button');
const pauseSequenceButton = document.getElementById('pause-sequence-button');
let status = STATUS.IDLE;

const logs = [];

// Array<{id: number, label: string, data: {[channel: number]: number}}>;
const memories = [];

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
    // str を timestamp 付きで記録
    const timestamp = new Date().toLocaleTimeString();
    const _str = `[${timestamp}] ${str}`;
    logs.push( _str );
    if( logs.length > 20 ) logs.shift();
    const statusElement = document.getElementById('log');
    // logs を逆順に表示
    const _logs = logs.slice().reverse();
    statusElement.textContent = _logs.join('\n');
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
        input['data-channel'] = ch;
        input.style.width = '300px';
        input.addEventListener('input', async () => {
            const dmxData = {};
            dmxData[ch] = parseInt(input.value);
            valueDisplay.value = parseInt(input.value);
            log(`CH ${ch} set to ${input.value}`);
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
            
            memoryButton.disabled = false;
            clearButton.disabled = false;
            sequenceSection.style.display = 'block';
            memoryPanel.style.display = 'block'; 
            log('connected');
            createPanel();
        } else {
            await dmx.disconnect();
            status = STATUS.IDLE;
            connectButton.textContent = 'connect';
            memoryButton.disabled = true;
            clearButton.disabled = true;
            sequenceSection.style.display = 'none';
            memoryPanel.style.display = 'none';
            log('disconnected');
            clearPanel();
        }
    } catch (error) {
        log(`connection error: ${error.message}`);
    }
});

/**
 * label が一致する場合、ボタンの背景をハイライト表示
 * 
 * @param {string} label 
 */
function renderMemories( label ) {
    const memoryPanel = document.getElementById('memory-panel');
    memoryPanel.innerHTML = '<h3>Memories</h3>';
    memories.forEach( memory => {
        const button = document.createElement('button');
        button.textContent = memory.label;
        button.style.marginLeft = '5px';
        if( label && memory.label === label ) {
            button.style.backgroundColor = 'yellow';
        }
        button.addEventListener('click', async () => {
            if( status !== STATUS.CONNECTED ) return;
            dmx.update( memory.data );
            try {
                await dmx.send();
                log(`Memory "${memory.label}" applied: ${JSON.stringify(memory.data)}`);
                // Update UI sliders
                for( let ch = 1; ch <= 512; ch++ ) {
                    const input = document.getElementById(`ch-${ch}`);
                    if( input && memory.data[ch] !== undefined ) {
                        input.value = memory.data[ch];
                        const valueDisplay = input.nextSibling;
                        if( valueDisplay ) valueDisplay.value = memory.data[ch];
                    }
                }
                renderMemories( memory.label );
            } catch (error) {
                log(`send error: ${error.message}`);
            }
        });
        memoryPanel.appendChild(button);

        // button の横に削除ボタンを追加
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.marginLeft = '0px';
        deleteButton.style.color = 'white';
        deleteButton.style.backgroundColor = 'red';
        deleteButton.addEventListener('click', () => {
            const index = memories.findIndex( m => m.id === memory.id );
            if( index !== -1 ) {
                memories.splice(index, 1);
                // ローカルストレージに保存
                localStorage.setItem(KEY_MEMORIES, JSON.stringify(memories));
                renderMemories();
                log(`Memory "${memory.label}" deleted.`);
            }
        });
        memoryPanel.appendChild(deleteButton);
    });
}

memoryButton.addEventListener('click', async () => {
    if( status !== STATUS.CONNECTED ) return;

    // 入力ボックスを表示し、label を取得
    const label = prompt("Enter a label for the memory:");
    if( !label ) {
        log("Memory save cancelled.");
        return;
    }

    // 現在のDMXデータをメモリに保存
    const memoryData = {};
    for( let ch = 1; ch <= 512; ch++ ) {
        const input = document.getElementById(`ch-${ch}`);
        memoryData[ch] = input ? parseInt(input.value) : 0;
    }
    const id = Date.now();
    memories.push({ id, label, data: memoryData });
    log(`DMX data saved to memory: ${JSON.stringify(memoryData)}`);
    renderMemories();

    // ローカルストレージに保存
    localStorage.setItem( KEY_MEMORIES, JSON.stringify( memories ) );
});

clearButton.addEventListener('click', async () => {
    if( status !== STATUS.CONNECTED ) return;
    dmx.clear();
    try {
        await dmx.send();
        log('DMX data cleared to zeros.');
        // Update UI sliders
        for( let ch = 1; ch <= 512; ch++ ) {
            const input = document.getElementById(`ch-${ch}`);
            if( input ) {
                input.value = 0;
                const valueDisplay = input.nextSibling;
                if( valueDisplay ) valueDisplay.value = 0;
            }
        }
        renderMemories();
    } catch (error) {
        log(`send error: ${error.message}`);
    }
});

sequenceTextarea.addEventListener('input', () => {
    // シーケンスデータをローカルストレージに保存
    const sequenceData = sequenceTextarea.value;
    localStorage.setItem( KEY_SEQUENCE, sequenceData );
});

let sequenceTimeout = null;
playSequenceButton.addEventListener('click', () => {
    if( status !== STATUS.CONNECTED ) return;
    log('Sequence playback started.');
    // textarea の内容を解析してシーケンス再生の実装はここに追加
    playSequenceButton.disabled = true;
    pauseSequenceButton.disabled = false;

    const sequenceData = sequenceTextarea.value.split('\n');
    log(`Sequence data: ${sequenceData}`);

    // sequenceData は、Array<string> 形式で各行は "duration,label" の形式
    const sequenceSteps = sequenceData.map(line => {
        const [duration, label] = line.split(',');
        return { duration: parseInt(duration), label };
    });

    log(`Parsed sequence steps: ${JSON.stringify(sequenceSteps)}`);
    // シーケンス再生のロジックをここに追加
    let currentStep = 0;
    const playNextStep = () => {
        if (currentStep < sequenceSteps.length) {
            const { duration, label } = sequenceSteps[currentStep];
            log(`Playing step ${currentStep + 1}: ${label} (Duration: ${duration}sec)`);
            const memory = memories.find(m => m.label === label);
            if (memory) {
                dmx.update(memory.data);
                dmx.send().then(() => {
                    log(`Memory "${label}" applied.`);
                    for( let ch = 1; ch <= 512; ch++ ) {
                        const input = document.getElementById(`ch-${ch}`);
                        if( input && memory.data[ch] !== undefined ) {
                            input.value = memory.data[ch];
                            const valueDisplay = input.nextSibling;
                            if( valueDisplay ) valueDisplay.value = memory.data[ch];
                        }
                    }
                    renderMemories( label );

                }).catch(error => {
                    log(`send error: ${error.message}`);
                });
            } else {
                renderMemories();
            }
            const buttons = document.querySelectorAll('#memory-panel button');
            for (const btn of buttons) {
                btn.disabled = true;
                console.log( btn );
            }
            sequenceTimeout = setTimeout(() => {
                currentStep++;
                playNextStep();
            }, duration * 1000);
        } else {
            log('Sequence playback finished. looping back to start.');
            currentStep = 0;
            playNextStep();
        }
    };
    playNextStep();
});

pauseSequenceButton.addEventListener('click', () => {
    log('Sequence playback paused.');
    // シーケンス一時停止の実装はここに追加
    if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
        sequenceTimeout = null;
        playSequenceButton.disabled = false;
        pauseSequenceButton.disabled = true;
    }
});

window.addEventListener('load', () => {
    // ローカルストレージからメモリを読み込み
    const savedMemories = localStorage.getItem( KEY_MEMORIES );
    if( savedMemories ) {
        const parsedMemories = JSON.parse( savedMemories );
        for( const mem of parsedMemories ) {
            // Validate memory data
            if( mem.id && mem.label && mem.data ) {
                memories.push( mem );
            }
        }
        renderMemories();
        log('Memories loaded from local storage.');
    }

    // ローカルストレージからシーケンスデータを読み込み
    const savedSequence = localStorage.getItem( KEY_SEQUENCE );
    if( savedSequence ) {
        sequenceTextarea.value = savedSequence;
        log('Sequence data loaded from local storage.');
    }
});