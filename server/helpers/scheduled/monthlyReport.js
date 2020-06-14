(function () {
	"use strict";

	const moment = require("moment-timezone");
	moment.tz.setDefault("America/Sao_Paulo");

	/**
	 * This module will provide methods to build custom reports on a monthly basis
	 * @module monthlyReports
	 * */
	module.exports = function (mongoDB, mailer, conversationAnalytics) {
		if (!mongoDB || !mailer) {
			throw new Error("Can not instantiate accountChecker helper without mongoDB object")
		}
		return {

			/**
			 * Define the routine execution
			 * @see {@link https://en.wikipedia.org/wiki/Cron|Cron definition}
			 * @see {@link https://crontab.guru/|Cron job string builder}
			 * Run every month on the 1st at 05:00 AM Sao Paulo time
			 * @constant
			 * @type {string}
			 */
			"cronScheduleString": "0 5 1 * *",

			/**
			 * Build a custom report fetching analytics data from all customers considering last month

			 * @async
			 * @methodOf periodReports
			 * @function monthlyReport
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent along with start and end date used as reference.
			 */
			async monthlyReport() {
				const TASK_ID = "monthly_report";
				let startDate = moment().subtract(1, "month").startOf("month");
				let endDate = moment().subtract(1, "month").endOf("month");
				try {
					let customers = await conversationAnalytics.fetchConversationAnalytics(
						startDate,
						endDate
					);

					let emailResults = await Promise.all(
						customers.map(
							async customer => await mailer.postStationData(
								TASK_ID,
								{
									...customer
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"customers": customers.length,
						"emailOperations": emailResults,
						"startDate": startDate,
						"endDate": endDate
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			}
		}
	};

}());