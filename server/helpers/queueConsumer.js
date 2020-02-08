(function () {
	"use strict";

	const RABBITMQ_URL = require("../configs/rabbitmq-string");
	const amqpLib = require("amqplib");
	const LOGS_QUEUE_TOPIC = process.env.LOGS_QUEUE_TOPIC;
	const RECEIPTS_QUEUE_TOPIC = process.env.RECEIPTS_QUEUE_TOPIC;
	let amqpConn = null;
	let amqpChannel = null;

	module.exports = {
		async connect() {
			if (process.env.TEST_ENV || process.env.NODE_ENV === "test") {
				return true;
			} else {
				amqpConn = await amqpLib.connect(RABBITMQ_URL);
				amqpChannel = await amqpConn.createChannel();
				await amqpChannel.checkQueue(LOGS_QUEUE_TOPIC);
				await amqpChannel.checkQueue(RECEIPTS_QUEUE_TOPIC);
				return amqpConn;
			}
		},

		async listenQueueTopic(topic, cb, options = {}) {
			return await amqpChannel.consume(
				topic,
				cb,
				options
			).bind(this);
		},

		async ackQueueMessage(message) {
			return await amqpChannel.ack(message);
		},

		disconnect(conn = amqpConn) {
			return process.env.TEST_ENV || process.env.NODE_ENV === "test" || !conn ? true : conn.close();
		}
	}

}());