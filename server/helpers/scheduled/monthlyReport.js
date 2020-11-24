(function () {
	"use strict";

	const moment = require("moment-timezone");
	moment.tz.setDefault("America/Sao_Paulo");

	/**
	 * This module will provide methods to build custom reports on a monthly basis
	 * @module monthlyReports
	 * */
	module.exports = function (mongoDB, mailer, conversationAnalytics, accounts) {
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
				let cf_startDate = moment().subtract(1, "month").startOf("month");
				let cf_endDate = moment().subtract(1, "month").endOf("month");
				try {
					let customers = await conversationAnalytics.fetchConversationAnalytics(
						cf_startDate,
						cf_endDate
					);

					let emailResults = await Promise.all(
						customers.map(
							async customer => await mailer.postStationData(
								TASK_ID,
								{
									"email": await accounts.getCompanyEmail(customer.id || customer._id),
									"name": customer.id || customer._id,
									"cf_average_conversation_time": customer.averageConversationTimeInMS,
									"cf_of_conversation_without_interactions": customer.conversationWithoutInteractions,
									"cf_total_of_conversations": customer.conversationCount,
									"cf_total_of_interactions": customer.interactionCount,
									"cf_of_interactions_that_failed": customer.failedInteractionCount,
									"cf_of_feedback_requested": customer.feedbackRequestCount,
									...{
										cf_startDate,
										cf_endDate
									},
									...customer
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"customers": customers.length,
						"emailOperations": emailResults,
						"startDate": cf_startDate,
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