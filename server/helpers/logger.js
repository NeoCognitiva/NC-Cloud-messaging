(function () {
	"use strict";
	/**
	 * Logger helper
	 * @module logger
	 * */
	require("winston-daily-rotate-file");
	const winston = require("winston");
	const createError = require("http-errors");
	const fs = require("fs");
	const LOGS_COLLECTION =	"logs";
	const mongoDB = require("./mongo");
	const Log = require("../model/Log");
	const errorLogger = new winston.Logger({
		"level": "error",
		"transports": [
			new (winston.transports.Console)(),
			new (winston.transports.DailyRotateFile)({
				"filename": "./root/error_logs/.log",
				"datePattern": "yyyy-MM-dd",
				"prepend": true,
				"level": "error"
			})
		]
	});
	const infoLogger = new winston.Logger({
		"level": "info",
		"transports": [
			new (winston.transports.Console)()
		]
	});

	module.exports = {
		/**
		 * Logs an error message to stdout and log the error in a external .log file
		 * @method error
		 * */
		"error": errorLogger.error,
		/**
		 * Logs an info message to stdout
		 * @method info
		 * */
		"info": infoLogger.info,
		/**
		 * Retrieve error logs files given a day query
		 * @method getErrorLogs
		 * @async
		 * @param {object} params - Configuration object.
		 * @param {string} params.query - Query object to retrieve error logs.
		 * @returns {Promise} Query results.
		 * */
		"getErrorLogs": function (params = {}) {
			return new Promise((resolve, reject) => {
				if (!params.query) {
					return reject(createError(400, "Invalid day to query"));
				} else {
					let filePath = `./root/error_logs/${params.query}.log`;
					let fileExists = fs.existsSync(filePath);
					if (fileExists) {
						if (params.download && fileExists) {
							return resolve(filePath);
						} else {
							fs.readFile(filePath, "utf-8", (err, file) => {
								return err ? reject(err) : resolve(file);
							});
						}
					} else {
						return reject(createError(404, "File not found"));
					}
				}
			});
		},
		/**
		 * Saves a log
		 * @method log
		 * @async
		 * @param {object} log - Log object.
		 * @returns {Promise} State of the operation.
		 * */
		"log": function (log = {}) {
			return new Promise((resolve, reject) => {
				mongoDB.insertOne(
					LOGS_COLLECTION,
					new Log(log)
				).then(response => resolve(response)
				).catch(err => reject(err));
			});
		},
		/**
		 * Remove log
		 * @method removeLog
		 * @async
		 * @param {string} logId - Log object id.
		 * @returns {Promise} State of the operation.
		 * */
		"removeLog": function (logId) {
			return new Promise((resolve, reject) => {
				if (!logId) {
					return reject(createError(400, "Can not proceed without logId"));
				} else {
					mongoDB.deleteOneById(
						LOGS_COLLECTION,
						logId
					).then(result => resolve(result)
					).catch(err => reject(err));
				}
			});
		},
		/**
		 * Query one log by ID
		 * @method getLogById
		 * @async
		 * @param {object} params - Log object.
		 * @param {string} params.logId - Log object id.
		 * @param {boolean} [params.strict] - Should reject if empty results.
		 * @returns {Promise} Log document.
		 * */
		"getLogById": function (params) {
			return new Promise((resolve, reject) => {
				if (!params || !params.logId) {
					return reject(createError(400, "Can not proceed without logId"));
				}
				mongoDB.findOneById(
					LOGS_COLLECTION,
					params.logId
				).then(result => {
					params.strict && !result ?
						reject(createError(404, "Log not found")) :
						resolve(result)
				}).catch(err => reject(err));
			});
		},
		/**
		 * Query multiple logs
		 * @method getLogs
		 * @async
		 * @param {object} params - Log object.
		 * @param {object} params.query - Query object.
		 * @param {number} [params.limit] - Limit query results.
		 * @param {number} [params.skip] - Skip query results.
		 * @param {number} [params.sort] - Sort query results.
		 * @param {boolean} [params.strict] - Should reject if empty results.
		 * @returns {Promise} Logs documents.
		 * */
		"getLogs": function (params) {
			return new Promise((resolve, reject) => {
				let query = {};

				for (let prop in params.query) {
					if (params.query.hasOwnProperty(prop) && params.query[prop]) {
						query[prop] = params.query[prop];
					}
				}

				mongoDB.find(LOGS_COLLECTION, {
					"query": query,
					"limit": params.limit || 100,
					"skip": params.skip || 0,
					"sort": params.sort
				}).then(result => {
					params.strict && !result ?
						reject(createError(404, "Log not found")) :
						resolve(result)
				}).catch(err => reject(err));
			});
		},
		/**
		 * Counts logs documents
		 * @method countLogs
		 * @async
		 * @param {object} params - Log object.
		 * @param {object} params.query - Query object.
		 * @param {number} [params.limit] - Limit query results.
		 * @param {number} [params.skip] - Skip query results.
		 * @param {number} [params.sort] - Sort query results.
		 * @param {boolean} [params.strict] - Should reject if empty results.
		 * @returns {Promise} Logs documents count.
		 * */
		"countLogs": function (params = {}) {
			return new Promise((resolve, reject) => {
				if (!params) {
					return reject(createError(400, "Invalid params"));
				}

				mongoDB.count(LOGS_COLLECTION, {
					"query": params.query,
				}).then(logsCount => resolve(logsCount || 0)
				).catch(err => reject(err));
			});
		}
	};

}());