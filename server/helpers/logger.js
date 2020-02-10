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
	const LOGS_QUEUE_TOPIC = process.env.LOGS_QUEUE_TOPIC;

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


	module.exports = function (mongoDB, queue) {
		return {
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

			"queueController": null,

			async handleLogArrival(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());
				let logId = await this.log(
					parsedMessage
				);
				queue.ackQueueMessage(message, JSON.stringify({
					"type": "log",
					"documentId": logId
				}));
				this.info(`Log ID: ${logId} generated and message acknowledged`);
			},

			async initQueueListener() {
				this.queueController = await queue.listenQueueTopic(
					LOGS_QUEUE_TOPIC,
					this.handleLogArrival.bind(this)
				);
			}
		};
	};

}());