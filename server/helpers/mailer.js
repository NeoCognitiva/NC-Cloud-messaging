(function () {
	"use strict";
	/**
	 * Email helper
	 * @module mailer
	 * */
	const EMAIL_QUEUE_TOPIC = process.env.EMAIL_QUEUE_TOPIC;
	const bent = require("bent");
	const RD_STATION_TOKEN = process.env.RD_STATION_TOKEN;
	const RD_STATION_ENDPOINT=`https://api.rd.services/platform/conversions?api_key=${RD_STATION_TOKEN}`;

	module.exports = function (mongoDB, queue) {
		return {

			"queueController": null,

			async postStationData(conversionIdentifier, stationData = {}) {
				const post = bent(
					"POST",
					"json",
					200
				);
				let requestBody = {
					"event_type": "CONVERSION",
					"event_family": "CDP",
					"conversion_identifier": conversionIdentifier,
					...stationData
				};

				// let x = await post(
				// 	RD_STATION_ENDPOINT,
				// 	requestBody
				// );
				// console.log(x)
				console.log(requestBody)
				return requestBody
			},

			async handleEmailArrival(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());
				try {
					await this.postStationData(parsedMessage);
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