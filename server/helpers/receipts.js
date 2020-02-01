(function () {
	"use strict";
	/**
	 * Admin Users helper
	 * @module adminUsers
	 * */
	const createError = require("http-errors");
	const RECEIPTS_COLLECTION_NAME = "receipts";
	const Receipt = require("../model/Receipt");

	module.exports = function (mongoDB) {
		if (!mongoDB) {
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
			"generateReceipt": function (client, service, workspaceId) {
				return new Promise((resolve, reject) => {
					mongoDB.insertOne(RECEIPTS_COLLECTION_NAME,
						new Receipt({client, service, workspaceId})
					).then(() => {
						resolve()
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


		}
	};

}());