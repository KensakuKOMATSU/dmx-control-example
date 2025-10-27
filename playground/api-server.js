import express from 'express';
import dmxnet from 'dmxnet';

const port = process.env.PORT || 3000;

const app = express();
const net = new dmxnet.dmxnet({
  log: { level: 'info' }
})

const sender = net.newSender({
  ip: "192.168.0.5", //IP to send to, default 255.255.255.255
  subnet: 0, //Destination subnet, default 0
  universe: 0, //Destination universe, default 0
  net: 0, //Destination net, default 0
  port: 6454, //Destination UDP Port, default 6454
  base_refresh_interval: 1000
})

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = this.constructor.name; // 'ApiError'
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

app.use(express.json());

const _prefix = '/api/beta';

app.get(`${_prefix}`, ( _, res ) => {
    res.send('DMX API server is running');
})

// app.get や app.post で受け取ったデータを処理するエンドポイント
// try {} catch {} でエラーハンドリングを行い、エラーが発生したら next(err) を呼び出し、
// エラーハンドラーに処理を委譲します。
app.get(`${_prefix}/dmx/values`, (req, res, next) => {
    try {
        const value = sender.values;
        res.json(value);
    } catch (err) {
        next(err);
    }
});

app.post(`${_prefix}/dmx/prep/:ch/:val`, (req, res, next) => {
    try {
        const ch = parseInt(req.params.ch, 10);
        const val = parseInt(req.params.val, 10);

        console.log(`Preparing channel ${ch} with value ${val}`);

        if( ch < 1 || ch > 512 || ( val & 0xff ) !== val  ) {
            console.log( ch, val & 0xff )
            return next(new BadRequestError('Invalid channel or value'));
        }

        sender.prepChannel(ch - 1, val);

        res.send('ok')
    } catch( err ) {
        next( err )
    }
})

app.post(`${_prefix}/dmx/set/:ch/:val`, (req, res, next) => {
    try {
        const ch = parseInt(req.params.ch, 10);
        const val = parseInt(req.params.val, 10);

        console.log(`Setting channel ${ch} with value ${val}`);

        if( ch < 1 || ch > 512 || ( val & 0xff ) !== val  ) {
            console.log( ch, val & 0xff )
            return next(new BadRequestError('Invalid channel or value'));
        }

        sender.setChannel(ch - 1, val);

        res.send('ok')
    } catch( err ) {
        next( err )
    }
})

app.post(`${_prefix}/dmx/transfer`, (req, res, next) => {
    try {
        sender.transfer();
        res.send('ok')
    } catch (err) {
        next(err);
    }
});

app.post(`${_prefix}/dmx/reset`, (req, res, next) => {
    try {
        sender.reset();
        res.send('ok')
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack); // サーバーログにエラーの詳細を出力

    if (err instanceof ApiError) {
        res.status(err.status).send(err.message);
    } else {
        res.status(500).send(`Internal Server Error::${err.message}`); // 500エラーとしてレスポンスを返す
    }
});


app.listen(port, () => {
  console.log('DMX API server is running on http://localhost:%d', port);
  console.log('============================================');
  console.log('  GET  /api/beta/dmx/values');
  console.log('  POST /api/beta/dmx/set/:ch/:value');
  console.log('  POST /api/beta/dmx/reset');
  console.log('============================================');
});
