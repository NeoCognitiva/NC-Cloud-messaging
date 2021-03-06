(function () {
	"use strict";
	/**
	 * Email helper
	 * @module mailer
	 * */
	const EMAIL_QUEUE_TOPIC = process.env.EMAIL_QUEUE_TOPIC;
	const bent = require("bent");
	const RD_STATION_TOKEN = process.env.RD_STATION_TOKEN;
	const debug = require("debug")("app:mailer");
	const supportDebugLog = require("debug")("app:debug");
	const RD_STATION_ENDPOINT=`https://api.rd.services/platform/conversions?api_key=${RD_STATION_TOKEN}`;

	module.exports = function (mongoDB, queue) {
		return {

			"queueController": null,

			async postStationData(conversionIdentifier, stationData = {}) {
				if (process.env.TEST_ENV || process.env.NODE_ENV === "test") {
					return stationData;
				}

				const post = bent(
					"POST",
					"json",
					200
				);
				let requestBody = {
					"event_type": "CONVERSION",
					"event_family": "CDP",
					"payload": {
						"conversion_identifier": conversionIdentifier,
						"email": stationData.to || stationData.email,
						[conversionIdentifier]: "ativo",
						"user_email": stationData.to || stationData.email,
						...stationData
					}
				};


				if (process.env.ENABLE_RD_STATION === "yes") {
					supportDebugLog("DEBUGGER")
					supportDebugLog(RD_STATION_ENDPOINT)
					supportDebugLog(requestBody);
					supportDebugLog(JSON.stringify(requestBody));
					try {
						await post(
							RD_STATION_ENDPOINT,
							requestBody
						);
					} catch (e) {
						debug(conversionIdentifier)
						debug(stationData)
						console.log(e);
					}
				} else {
					console.log("Skipping RD station call since it is turned off");
					console.log(new Date());
				}



				return requestBody
			},

			async handleEmailArrival(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());
				try {
					await this.postStationData(parsedMessage.mailType || parsedMessage.conversionIdentifier, parsedMessage);
					queue.ackQueueMessage(message);
					console.log("Email sent and message acknowledged");
				} catch (e) {
					console.log("An error occurred while trying to process the message described below");
					console.log(parsedMessage);
					console.log(e);
				}
			},

			async initQueueListener() {
				this.queueController = await queue.listenQueueTopic(
					EMAIL_QUEUE_TOPIC,
					this.handleEmailArrival.bind(this)
				);
			}
		};
	};

}());