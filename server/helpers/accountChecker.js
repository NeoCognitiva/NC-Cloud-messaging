(function () {
	"use strict";
	/**
	 * This module will provide methods to gather accounts information and emit notifications based on pre-defined
	 * thresholds.
	 * @module accountChecker
	 * */
	const ACCOUNT_STATUS_COLLECTION_NAME = "account_status";
	const plans = require("../../root/default_account_plans.json");

	// - Monthly report


	module.exports = function (mongoDB, mailer) {
		if (!mongoDB || !mailer) {
			throw new Error("Can not instantiate accountChecker helper without mongoDB object")
		}
		return {

			/**
			 * Query the accounts status and create a notification request if the interaction quota is lower than a
			 * pre-defined threshold.
			 * interactionQuota: -> lower than or equal {20%} of the plan available
			 * lowInteractivityNotified: -> false
			 *
			 * @async
			 * @function lowInteractionQuota
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent separated by plan status.
			 */
			async lowInteractionQuota() {
				return await Promise.all(
					plans.map(async plan => {
						let planOccurrences = await mongoDB.find(
							ACCOUNT_STATUS_COLLECTION_NAME,
							{
								"query": {
									"accountStatus": plan.accountStatus,
									"lowInteractivityNotified": {
										"$ne": true
									},
									"interactionQuota": {
										"$lte": plan.defaultValues.interactionQuota * 1
									}
								},
								"projection": {
									"clientName": 1,
									"accountStatus": 1,
									"interactionQuota": 1
								}
							}
						)
						return await Promise.all(
							planOccurrences.map(
								async occurrence => await mailer.postStationData(
									"low_interaction_quota",
									{
										"interactionPlanQuota": plan.defaultValues.interactionQuota,
										...occurrence
									}
								)
							)
						);
					})
				);
			},

			/**
			 * Query the accounts status and create a notification request if the activity of the account is low based
			 * on the number of interaction quota consumed
			 * trialEndDate: -> higher than {today}, lower than next {ten} days,
			 * interactionQuota: -> greater than or equal {90%} available
			 *
			 * @async
			 * @function accountInactivity
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async accountInactivity() {

				// - Account inactivity
				//

				return [];
			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the pre-defined date.
			 * This is valid for both trial and regular accounts.
			 * trialEndDate: -> higher than {today}, lower than next {five} days
			 * subscriptionEndNotified: -> false
			 *
			 * @async
			 * @function subscriptionPeriodCloseToEndFirstWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionPeriodCloseToEndFirstWarning() {
				// - Trial period close to the end (pre-defined threshold required)
				// - Subscription close to the end (pre-defined threshold required)
				// , subscriptionEndNotified false
				return [];

			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the current date and has been notified before.
			 *
			 * This is valid for both trial and regular accounts.
			 * trialEndDate: -> higher than {today} AND lower than next {two} days
			 * subscriptionAboutToEndNotified: -> true
			 * subscriptionAboutToEndLastWarningNotified: -> false
			 *
			 * @async
			 * @function subscriptionPeriodCloseToEndLastWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionPeriodCloseToEndLastWarning() {
				// - Subscription close to the end (last warning) (pre-defined threshold required)
				// trialEndDate: -> higher than {today}, lower than next {2} days, subscriptionEndNotified true
				return [];
			},

			/**
			 * Query the accounts status and create a notification request if the subscription has ended
			 * This is notified only once.
			 * Will emit a different notification for `trial accounts`
			 * trialEndDate: -> lower than {now}
			 * subscriptionAboutToEndLastWarningNotified: -> true
			 * subscriptionEndNotified: -> true
			 *
			 * @async
			 * @function subscriptionEnded
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionEnded() {
				// - Subscription ended
				return [];
			}
		}
	};

}());