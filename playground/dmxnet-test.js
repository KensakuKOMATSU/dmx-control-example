import dmxnet from 'dmxnet';

const net = new dmxnet.dmxnet({
  log: { level: 'info' }
})

function arraysAreEqual(arr1, arr2) {
  // 1. 長さを比較
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  // 2. 各要素を比較
  for (let i = 0; i < arr1.length; i++) {
    // ネストされた配列やオブジェクトの場合は再帰的に比較する必要がある
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  
  // 3. すべての要素が同じ
  return true;
}

// 受信機（Receiver）インスタンスの作成
// ここで、CR011Rが送信するArt-Netのユニバース番号を指定します
// 例: Net=0, Subnet=0, Universe=0
const receiver = net.newReceiver({
  net: 0,
  subnet: 0,
  universe: 0
});

let prev = []

// 受信イベントのリスナーを設定
receiver.on('data', (data) => {
    if( arraysAreEqual(prev, data) ){
      return;
    } else {
      prev = data;
      //  console.log(`Detected DMX data changed for Universe 0:[%d] %s`, Date.now(), JSON.stringify(data));
      console.log([ Date.now(), ...data ].join(','));
    }
});

// Art-Netノードが正常に起動したことを確認
console.log('Art-Net receiver is listening...');