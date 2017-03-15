// - `enqueue` the job is now queued
// - `start` the job is now running
// - `promotion` the job is promoted from delayed state to queued
// - `progress` the job's progress ranging from 0-100
// - `failed attempt` the job has failed, but has remaining attempts yet
// - `failed` the job has failed and has no remaining attempts
// - `complete` the job has completed
// - `remove` the job has been removed

var util = require('util'),
    winston = require('winston'),
    kue = require('kue'),
    Transport = winston.Transport;

// function Kue (options)
// @options {Object} Options for this instance.
// Constructor function for the Kue transport object responsible
// for persisting log messages and metadata to Kue.
//
function Kue(options) {
    Transport.call(this, options);
    options = options || {};
    // this.options = Kue.extend({}, defaultOptions, options);
    if (!options.queueName) {
        throw new Error('[queueName] cannot be empty!');
    }

    this.host = options.host || 'localhost';
    this.port = options.port || '6379';
    this.attempt = options.attempt || 3;
    this.queueName = options.queueName;
    this.isJson = options.json || true;
    this.clientId = options.clientId || 'winston-kue-transport';
    this.compress = !!options.compress ? 1 : 0; // if 1 then compression done using Gzip

};

util.inherits(Kue, winston.Transport);
// Expose the name of this Transport on the prototype
//
Kue.prototype.name = 'kue';
// function _send (message, callback)
// @callback {function} Continuation to respond to when complete.
// Uses the kue producer to send the log message to the kue
//
var queueObj = kue.createQueue({
    redis: {
        host: this.host,
        port: this.port
    }
});

Kue.prototype._send = function (message, callback) {

    var localMessage, cb = (typeof callback === 'function') ? callback : function () { };
    if (!message) cb(new Error('No message to log'));

    if (this.isJson) {
        localMessage = JSON.stringify(message)
    }
    else {
        localMessage = message;
    }
    // attributes: this.compress
    var job = queueObj.create(this.queueName, localMessage).attempts(this.attempt).save(function (err) {
        if (err) {
            console.log('Error occured while adding to queue ' + this.queueName, err);
        }
        else {
            console.log('Message added with job id ' + job.id);
        }
    });
    job.on('complete', function(result){
        console.log('Job completed with result ', result);
    }).on('failed attempt', function (errorMessage, doneAttempts) {
        console.log('Job failed attempt');
    }).on('failed', function (errorMessage) {
        console.log('Job failed');
    }).on('progress', function (progress, data) {
        console.log('job #' + job.id + ' ' + progress + '% complete with data ', data);
    }).on('error', function (err) {
        console.log('Error occured in queue ' + this.queueName, err);
    });
};

// function log (level, msg, [meta], callback)
// @level {string} Level at which to log the message.
// @msg {string} Message to log
// @meta {Object} **Optional** Additional metadata to attach
// @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Kue.prototype.log = function (level, msg, meta, callback) {
    var that = this;
    if (typeof meta === 'function' && meta()) {
        callback = meta;
        meta = {};
    } else {
        callback = (typeof callback === 'function') ? callback : function () { };
    }
    var message = {
        message: msg,
        level: level,
        meta: meta,
        timestamp: new Date().toISOString()
    };

    this._send(message, function (error) {
        if (error) return callback(error);
        that.emit('logged');
        callback(null, true);
    });
};

//Define as a property of winston transports for backward compatibility
winston.transports.Kue = Kue;