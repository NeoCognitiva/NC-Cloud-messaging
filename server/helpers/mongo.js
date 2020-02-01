(function () {
	"use strict";


	const MONGO_STRING = require("../configs/mongo-string");
	const MONGO_DB = process.env.TEST_ENV || process.env === "TEST" ? process.env.MONGO_TEST_DB : process.env.MONGO_DB;
	const MongoClient = require("mongodb").MongoClient;
	const ObjectId = require("mongodb").ObjectId;
	const createError = require("http-errors");
	let cachedDb = "";
	/**
	 * MongoDB wrapper
	 * @module mongo
	 * @ignore
	 * */
	module.exports = {
		"connect": function (connectionTarget = MONGO_DB) {
			return new Promise((resolve, reject) => {
				if (cachedDb) {
					resolve(cachedDb);
				}
				MongoClient.connect(MONGO_STRING, {
					"useNewUrlParser": true,
					"useUnifiedTopology": true
				}).then((client) => {
					cachedDb = client.db(connectionTarget);
					return resolve(cachedDb);
				}).catch((err) => {
					return reject(err);
				});
			});
		},
		"disconnect": function (client = {}) {
			if (client && client.close) {
				return client.close(() => {
					cachedDb = "";
				});
			}
		},

		"aggregate": function (collectionName, aggregation, params = {}, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!collectionName || !aggregation) {
					return reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collectionName);

				base.aggregate(aggregation, params).toArray((err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},

		"createCollection": function (collectionName, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!collectionName) {
					return reject(createError(400, "Invalid params"));
				}

				db.createCollection(collectionName, (err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},
		"find": function (collection, params = {}, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!collection) {
					return reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);

				base.find(params.query || {}, {
					"limit": +params.limit || 0,
					"skip": +params.skip || 0,
					"projection": params.projection || null,
					"sort": params.sort || null
				}).toArray((err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},
		"findOne": function (collection, params = {}, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !collection || !params) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.findOne(params.query, {
					"projection": params.projection || null
				}, (err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},
		"insertOne": function (collection, doc, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !collection || !doc) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.insertOne(
					doc,
					null,
					(err, data) => {
						return err ? reject(err) : resolve(data.insertedId);
					}
				);
			});
		},
		"updateOne": function (collection, query, doc, upsert = false, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !query || !collection || !doc) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.updateOne(
					query,
					{
						"$set": doc
					},
					{
						"upsert": upsert
					},
					(err, data) => {
						return err ? reject(err) : resolve(data.insertedId || data);
					}
				);
			});
		},
		"updateOneAtomic": function (collection, query, doc, upsert = false, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !query || !collection || !doc) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.updateOne(
					query,
					doc,
					{
						"upsert": upsert
					},
					(err, data) => {
						return err ? reject(err) : resolve(data.insertedId || data);
					}
				);
			});
		},
		"upsert": function (collection, query, doc, upsert = false, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !query || !collection || !doc) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);

				base.findOneAndReplace(
					query,
					doc,
					{
						"projection": {"_id": 1},
						"upsert": upsert
					},
					(err, data) => {
						return err ? reject(err) : resolve(data.value || data);
					}
				);
			});
		},
		"delete":  function (collection, deleteQuery, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !collection || !deleteQuery) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.deleteOne(
					deleteQuery,
					null,
					(err, data) => {
						return err ? reject(err) : resolve(data.deletedCount);
					}
				);
			});
		},
		"drop": function (collection, db = cachedDb) {
			return new Promise(function (resolve, reject) {
				if (process.env.TEST_ENV || process.env.NODE_ENV === "test") {
					if (!db || !collection) {
						reject(createError(400, "Invalid params"));
					} else {
						let base = db.collection(collection);

						base.removeMany({}).then((result) => {
							return resolve(result);
						}).catch((err) => {
							reject(err);
						});
					}
				} else {
					reject("Can not remove all items without env environment");
				}
			});
		},
		"count": function (collection, params = {}, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !params) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.countDocuments(params.query || {}, null, (err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},
		"findOneById": function (collection, docId, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !collection || !docId) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.findOne({
					"_id": this.ObjectId(docId)
				}, null, (err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
		},
		"deleteOneById": function (collection, docId, db = cachedDb) {
			return new Promise((resolve, reject) => {
				if (!db || !collection || !docId) {
					reject(createError(400, "Invalid params"));
				}
				let base = db.collection(collection);
				base.deleteOne({
					"_id": this.ObjectId(docId)
				}, null, (err, data) => {
					return err ? reject(err) : resolve(data.deletedCount);
				});
			});
		},
		"ObjectId": ObjectId
	}
}());