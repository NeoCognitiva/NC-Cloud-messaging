(function () {
	"use strict";
	/**
	 * Admin Users helper
	 * @module adminUsers
	 * */
	const RECEIPTS_COLLECTION_NAME = "receipts";
	const RECEIPTS_QUEUE_TOPIC = process.env.RECEIPTS_QUEUE_TOPIC;
	const Receipt = require("../model/Receipt");

	module.exports = function (mongoDB, logger, queue) {
		if (!mongoDB || !logger) {
			throw new Error("Can not instantiate adminUser helper without mongoDB object")
		}
		return {
			/**
			 * Create a new receipt
			 * @method generateReceipt
			 * @async
			 * @return {Promise}
			 */
			async generateReceipt(timestamp, client, service, workspaceId) {
				return await mongoDB.insertOne(RECEIPTS_COLLECTION_NAME,
					new Receipt({timestamp, client, service, workspaceId})
				);
			},

			"queueController": null,
			async handleReceiptArrival(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());
				let receiptId = await this.generateReceipt(
					parsedMessage.timestamp,
					parsedMessage.client,
					parsedMessage.service,
					parsedMessage.workspaceId
				);
				await queue.ackQueueMessage(message, JSON.stringify({
					"type": "receipt",
					"documentId": receiptId
				}));
				logger.info(`Receipt ID: ${receiptId} generated and message acknowledged`);
				return true;
			},


			async initQueueListener() {
				this.queueController = await queue.listenQueueTopic(
					RECEIPTS_QUEUE_TOPIC,
					this.handleReceiptArrival.bind(this)
				);
			}
		}
	};

}());