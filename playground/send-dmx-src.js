import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const showData = ({ index, timestamp, data }) => {
    console.log("index=%d, timestamp=%d, data=%s", index, timestamp, data.join(',') );
}

const loadAndEmit = ( filename, onData ) => {
    const rawData = [];
    // CSVストリームを作成
    const fileStream =fs.createReadStream(filename);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Windowsの改行コードに対応
    });

    // 'line' イベントは、各行が読み込まれるたびに発生します
    rl.on('line', (line) => {
        rawData.push( line.split(',').map(v=>parseInt(v)) );
    });

    // 'close' イベントは、ファイルの読み込みが完了したときに発生します
    rl.on('close', () => {
        if( rawData.length === 0 ) {
            console.log('No data found.');
            return;
        }
        let currentTimestamp = rawData[0][0];
        let index = 0;
        let last = Date.now();

        const timer = setInterval(() => {
            if( index >= rawData.length ) {
                clearInterval(timer);
                return;
            }
            const timestamp = rawData[index][0];
            const _now = Date.now();
            const delta = _now - last;
            if( ( currentTimestamp + delta ) > timestamp ) {
                if( onData && typeof onData === 'function' ) {
                    onData({ index, timestamp, data: rawData[index].slice(1) });
                }

                currentTimestamp = timestamp;
                last = _now;
                index++;
            }
        }, 1)
    });
}

const csvFileName = path.join(__dirname, 'ikebukuro-dmx.csv');
loadAndEmit( csvFileName, showData );