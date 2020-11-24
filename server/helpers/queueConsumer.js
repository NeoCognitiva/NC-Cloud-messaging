(function () {
	"use strict";

	const RABBITMQ_URL = require("../configs/rabbitmq-string");
	const amqpLib = require("amqp-connection-manager");
	const LOGS_QUEUE_TOPIC = process.env.LOGS_QUEUE_TOPIC;
	const RECEIPTS_QUEUE_TOPIC = process.env.RECEIPTS_QUEUE_TOPIC;
	const WebSocket = require("ws");
	let amqpConn = null;
	let amqpChannel = null;
	let onlineSince = null;
	let messagesByTopic = {
		"receipt": 0,
		"log": 0
	};

	module.exports = function (ws) {
		return {
			async connect() {
				if (process.env.TEST_ENV || process.env.NODE_ENV === "test") {
					return true;
				} else {
					amqpConn = await amqpLib.connect(RABBITMQ_URL);
					amqpChannel = await amqpConn.createChannel({
						"json": true,
						"setup": function(channel) {
							return Promise.all([
								channel.checkQueue(LOGS_QUEUE_TOPIC),
								channel.checkQueue(RECEIPTS_QUEUE_TOPIC)
							]);
						}
					});

					amqpConn.on("disconnect", (err) => {
						console.log("MQ channel disconnected");
						console.log(err);
					});

					amqpConn.on("connect", () => {
						console.log("MQ channel connected");
						onlineSince = new Date();
					});

					return amqpConn;
				}
			},

			getQueueStatus() {
				return {onlineSince, messagesByTopic};
			},

			async listenQueueTopic(topic, cb, options = {}) {
				return amqpChannel.addSetup(channel => {
					return channel.consume(
						topic,
						cb,
						options
					).bind(this);
				});
			},

			async ackQueueMessage(message, referenceObject = null) {
				let parsedData = JSON.parse(referenceObject) || {};
				await amqpChannel.ack(message);

				if (referenceObject) {
					ws.clients.forEach(client => {
						if (client !== ws && client.readyState === WebSocket.OPEN) {
							client.send(referenceObject);
						}
					});
				}

				if (parsedData.type) {
					if (messagesByTopic[parsedData.type] >= 0) {
						messagesByTopic[parsedData.type] += 1;
					} else {
						messagesByTopic[parsedData.type] = 1;
					}
				}

				return true;
			},

			disconnect(conn = amqpConn) {
				return process.env.TEST_ENV || process.env.NODE_ENV === "test" || !conn ? true : conn.close();
			}
		}
	}

}());