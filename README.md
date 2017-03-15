## winston-kue-transport

Winston transport module for [Kue](https://github.com/Automattic/kue) (tested with version 0.11.5).

## Usage

```javascript
var transport = require('winston-kue-transport');
var worker = null, queue = require('kue');

worker = new queue({
    redis: 'redis://localhost:6379'
});
winston.add(winston.transports.Kue, {
    queueName: 'queue1',
    level: 'info',
    json: false,
    timestamp: function () {
        return Date.toISOString();
    },
    formatter: function (options) {
        return options.timestamp() + ' ' + (options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? ' ' + JSON.stringify(options.meta) : '');
    }
});

winston.info('test message info');

worker.process('queue1', 2, function (job, jobDone) {
    console.log(job.data);
    jobDone(null, "DONE");
    done();
});
```
All options from Winston module are available here. Additionally **queueName** has been added.
In order to see the queue items there is a web-based module [kue-ui](https://github.com/stonecircle/kue-ui)

## Installation

This module is available on [NPM](https://www.npmjs.com/package/winston-kue-transport)

## Tests

Run **npm test**. 
The current tests check if some dummy values can be put into queue. 
