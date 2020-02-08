(function () {
	"use strict";
	/**
	 * Admin Users helper
	 * @module adminUsers
	 * */
	const createError = require("http-errors");
	const RECEIPTS_COLLECTION_NAME = "receipts";
	const RECEIPTS_QUEUE_TOPIC = process.env.RECEIPTS_QUEUE_TOPIC;
	const {listenQueueTopic, ackQueueMessage} = require("./queueConsumer");

	const Receipt = require("../model/Receipt");

	module.exports = function (mongoDB, logger) {
		if (!mongoDB || !logger) {
			throw new Error("Can not instantiate adminUser helper without mongoDB object")
		}
		return {

			"buildQuery": function (client, services, startDate, endDate) {
				let query = {};

				if (client) {
					query.client = client;
				}

				if (Array.isArray(services) && services.length) {
					query.service = {
						"$in": services
					}
				}

				if  (startDate || endDate) {
					query.timestamp = {};

					if (startDate) {
						query.timestamp["$gte"] = new Date(startDate);
					}
					if (endDate) {
						query.timestamp["$lte"] = new Date(endDate);
					}

				}
				return query
			},

			/**
			 * Create a new receipt
			 * @method generateReceipt
			 * @async
			 * @return {Promise}
			 */
			"generateReceipt": function (timestamp, client, service, workspaceId) {
				return new Promise((resolve, reject) => {
					mongoDB.insertOne(RECEIPTS_COLLECTION_NAME,
						new Receipt({timestamp, client, service, workspaceId})
					).then((status) => {
						resolve(status)
					}).catch(err => {
						reject(err);
					});
				});
			},

			/**
			 * Fetches client receipts
			 * @method fetchReceipts
			 * @async
			 * @return {Promise}
			 */
			"fetchClientReceipts": function (client, limit, skip, sort, services, startDate, endDate) {
				return new Promise((resolve, reject) => {
					let query = this.buildQuery(client, services, startDate, endDate);
					if (!client) {
						return reject(createError(400, "Invalid params"));
					}
					mongoDB.find(RECEIPTS_COLLECTION_NAME, {
						"query": query,
						"limit": limit,
						"skip": skip,
						"sort": sort

					}).then(result => {
						resolve(result)
					}).catch(err => {
						reject(err);
					});
				});
			},

			/**
			 * Fetches Count client receipts
			 * @method receiptsCount
			 * @async
			 * @return {Promise}
			 */
			"receiptsCount": function (client, services, startDate, endDate) {
				return new Promise((resolve, reject) => {
					let query = this.buildQuery(client, services, startDate, endDate);
					if (!client) {
						return reject(createError(400, "Invalid params"));
					}
					mongoDB.count(RECEIPTS_COLLECTION_NAME, {
						"query": query,
					}).then(result => {
						resolve(result.toString())
					}).catch(err => {
						reject(err);
					});
				});
			},

			aggregateClientReceipts: function (client, services, startDate, endDate) {
				return new Promise((resolve, reject) => {
					if (!client) {
						return reject(createError(400, "Invalid params"));
					}

					mongoDB.aggregate(RECEIPTS_COLLECTION_NAME,
						[{
							"$match": this.buildQuery(client, services, startDate, endDate)
						}, {
							"$group": {
								"_id": "$service",
								"count": {
									"$sum": 1
								}
							}
						}]
					).then(result => resolve(result)
					).catch(err => reject(err));
				});
			},

			aggregateClientReceiptsByWorkspace: function (client, services, startDate, endDate) {
				return new Promise((resolve, reject) => {
					if (!client) {
						return reject(createError(400, "Invalid params"));
					}
					mongoDB.aggregate(RECEIPTS_COLLECTION_NAME,
						[{
							"$match": this.buildQuery(client, services, startDate, endDate)
						}, {
							"$group": {
								"_id": "$workspaceId",
								"count": {
									"$sum": 1
								}
							}
						}]
					).then(result => {
						resolve(result)
					}).catch(err => {
						reject(err);
					});
				});
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
				ackQueueMessage(message);
				logger.info(`Receipt ID: ${receiptId} generated and message acknowledged`);
			},


			async initQueueListener() {
				this.queueController = await listenQueueTopic(
					RECEIPTS_QUEUE_TOPIC,
					this.handleReceiptArrival.bind(this)
				);
			}
		}
	};

}());