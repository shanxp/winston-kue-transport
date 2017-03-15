var chai = require("chai");
var should = chai.should();
var winston = require('winston');
var transport = require('../index.js');
var worker = null, queue = require('kue');

describe('Winston kue transport', function () {
	// beforeEach(function () {
	// });
	// afterEach(function (done) {
	// 	worker.shutdown(50, function () {
	// 		done()
	// 	});
	// });
	it('should NOT be able to initialize without queue name', function () {
		// try {
		//   new transport.Kue();
		// }
		// catch (e) {
		//   chai.assert(e.message == '[queueName] cannot be empty!');      
		// }
		var fn = function () { new transport.Kue(); }
		chai.expect(fn).to.throw(Error);
	});

	it('should be able to add/retrieve messages to queue', function (done) {
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
				// Return string will be passed to logger.
				return options.timestamp() + ' ' + (options.message ? options.message : '') +
					(options.meta && Object.keys(options.meta).length ? ' ' + JSON.stringify(options.meta) : '');
			}
		});

		// // winston.error('test message error');
		winston.info('test message info');
		// winston.info('test message info ADDED2');

		// worker = queue.createQueue({
		// 	redis: {
		// 		host: 'localhost',
		// 		port: 6379
		// 	}
		// });
		// var jobData = {
		// 	title: 'Test Queue',
		// 	to: '"Mike Paul" <mp@web.com>',
		// 	template: 'welcome-email'
		// };
		// worker.create('queue1', jobData).priority('high').save();

		worker.process('queue1', 2, function (job, jobDone) {
			console.log(job.data);
			jobDone(null, "DONE");
			done();
		});

		// kdone();
	});

});
