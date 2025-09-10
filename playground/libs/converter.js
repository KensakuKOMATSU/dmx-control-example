/**
 * 入力データと設定を基にDMXデータ配列を生成する関数
 * @param {Array<Object>} inputData - 照明器具のパラメータを含む配列 e.g. [{ deviceId: 1, pan: 128, tilt: 128, color: "rgb(255, 0, 0)", dimmer: 255 }]
 * @param {Array<Object>} settings - DMXアドレスのマッピング設定を含む配列 e.g. [{ id: 0, start_address: 1, map: { 1: "pan", 2: "tilt", 3: "dimmer", 4: "red", 5: "green", 6: "blue", 7: "white", 8: "speed", 9: "reset" } }]
 * @returns {Array<number>} - 生成されたDMXデータ配列 - e.g. [0, 128, 128, 255, 255, 0, 0, 0, 0, 132, 145, 255, 0, 255, 255, 128, 0, 0]
 */
export function generateDMXData(inputData, settings) {
  // DMXデータを格納する配列を初期化
  const dmxData = new Array(512).fill(0);

  // 各入力データを処理
  inputData.forEach(item => {
    // 該当する設定ブロックを見つける
    const settingBlock = settings.find(s => s.id === item.deviceId);

    // 設定ブロックが存在する場合のみ処理
    if (settingBlock) {
      const { start_address, map } = settingBlock;

      // mapを使って入力データをDMXデータに変換
      for (const dmxOffset in map) {
        const paramName = map[dmxOffset];
        const dmxAddress = start_address + parseInt(dmxOffset, 10) - 1;
        
        let value;

        // colorパラメータはRGBに分解して値を設定
        if (paramName === 'red' || paramName === 'green' || paramName === 'blue') {
          // colorプロパティが存在するか確認
          if (item.color) {
            const rgbMatch = item.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              const [, r, g, b] = rgbMatch;
              if (paramName === 'red') value = parseInt(r, 10);
              else if (paramName === 'green') value = parseInt(g, 10);
              else if (paramName === 'blue') value = parseInt(b, 10);
            }
          }
        } else {
          // その他のパラメータは直接値を設定
          value = item[paramName];
        }

        // 変換した値をdmxData配列に格納
        if (value !== undefined) {
          dmxData[dmxAddress - 1] = value;
        }
      }
    }
  });

  // 末尾のゼロを削除して、必要なデータのみを返す ... to be removed
  // const lastIndex = dmxData.length - 1;
  // let trimmedData = [...dmxData];
  // while (trimmedData.length > 0 && trimmedData[trimmedData.length - 1] === 0) {
  //   trimmedData.pop();
  // }

  return dmxData;
}

/**
 * DMXデータ配列と設定を基にパラメータの配列を生成する関数
 * @param {Array<number>} dmxData - DMXデータ配列 - e.g. [128, 128, 255, 255, 0, 0, 0, 0, 0, 132, 145, 255, 0, 255, 255, 128, 0, 0]
 * @param {Array<Object>} settings - DMXアドレスのマッピング設定を含む配列 e.g. [{ id: 0, start_address: 1, map: { 1: "pan", 2: "tilt", 3: "dimmer", 4: "red", 5: "green", 6: "blue", 7: "white", 8: "speed", 9: "reset" } }]
 * @returns {Array<Object>} - 復元されたパラメータオブジェクトの配列 - e.g. [{ deviceId: 0, pan: 128, tilt: 128, dimmer: 255, color: "rgb(255, 0, 0)", white: 0, speed: 0, reset: 0 }, { id: 1, pan: 132, tilt: 145, dimmer: 255, color: "rgb(0, 255, 255)", white: 128, speed: 0, reset: 0 }]
 */
export function parseDMXData(dmxData, settings) {
  const result = [];

  // 各設定ブロックを処理
  settings.forEach(settingBlock => {
    const { id, start_address, map } = settingBlock;
    const item = { deviceId: id };
    const params = {};

    // mapを使ってDMXデータからパラメータに逆変換
    for (const dmxOffset in map) {
      const paramName = map[dmxOffset];
      const dmxAddress = start_address + parseInt(dmxOffset, 10) - 2; // DMXアドレスは1から始まるため、-2で調整
      
      // DMXアドレスがデータ範囲内にあるか確認
      if (dmxAddress < dmxData.length) {
        params[paramName] = dmxData[dmxAddress];
      }
    }

    // パラメータを元の形式に再構築
    let color = null;
    if ('red' in params && 'green' in params && 'blue' in params) {
      color = `rgb(${params.red}, ${params.green}, ${params.blue})`;
    }

    // 最終的なオブジェクトを構築
    const paramNames = Object.values( map )

    paramNames.forEach(name => {
        if( name !== 'red' && name !== 'green' && name !== 'blue' ) {
            item[name] = params[name] !== undefined ? params[name] : 0;
        }
    });
    item.color = color !== null ? color : "rgb(0, 0, 0)";

    result.push(item);
  });

  return result;
}