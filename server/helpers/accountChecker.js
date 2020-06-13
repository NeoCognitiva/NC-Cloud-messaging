(function () {
	"use strict";

	const ACCOUNT_STATUS_COLLECTION_NAME = "account_status";
	const plans = require("../../root/default_account_plans.json");


	/**
	 * This module will provide methods to gather accounts information and emit notifications based on pre-defined
	 * thresholds.
	 * @module accountChecker
	 * */
	module.exports = function (mongoDB, mailer) {
		if (!mongoDB || !mailer) {
			throw new Error("Can not instantiate accountChecker helper without mongoDB object")
		}
		return {

			/**
			 * Define the routine execution
			 * @see {@link https://en.wikipedia.org/wiki/Cron|Cron definition}
			 * @see {@link https://crontab.guru/|Cron job string builder}
			 * @constant
			 * @type {string}
			 */
			"cronScheduleString": "0 1 * * *",

			/**
			 * Query the accounts status and create a notification request if the interaction quota is lower than a
			 * pre-defined threshold.
			 * Interaction quota will be calculated based on the Client's selected plan.
			 * interactionQuota: -> lower than or equal {20%} of the plan available
			 * lowInteractionQuotaNotified: -> false
			 * accountStatus: != "trial"
			 * renovationDate: >= "now"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function lowInteractionQuota
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent separated by plan status.
			 */
			async lowInteractionQuota() {
				const TASK_ID = "low_interaction_quota";
				try {
					return {
						"task_id": TASK_ID,
						"planTasks": await Promise.all(
							// Iterate over available plans because each one has a different setup that will
							// define the remaining percentage accordingly. Trial accounts are excluded from this process.
							plans.filter(
								plan => plan.accountStatus !== "trial"
							).map(async plan => {
								//Fetch accounts that fall under the pre-established condition based on each plan setup.
								let planOccurrences = await mongoDB.find(
									ACCOUNT_STATUS_COLLECTION_NAME,
									{
										"query": {
											"accountStatus": plan.accountStatus,
											"lowInteractionQuotaNotified": {
												"$ne": true
											},
											"interactionQuota": {
												"$lte": plan.defaultValues.interactionQuota * 0.20
											},
											"renovationDate": {
												// Greater-equals than `now`
												"$gte": new Date()
											}
										},
										"projection": {
											"_id": 1,
											"clientName": 1,
											"accountStatus": 1,
											"interactionQuota": 1
										}
									}
								);

								//For each occurrence found send an email request with the original plan value and client data.
								let emailResults = await Promise.all(
									planOccurrences.map(
										async occurrence => await mailer.postStationData(
											TASK_ID,
											{
												"interactionPlanQuota": plan.defaultValues.interactionQuota,
												...occurrence
											}
										)
									)
								);

								//For each occurrence found also change the document status to control how many times it is notified.
								let dbResults = await Promise.all(
									planOccurrences.map(
										async occurrence => await mongoDB.updateOne(
											ACCOUNT_STATUS_COLLECTION_NAME,
											{
												"_id": occurrence._id
											},
											{
												"lowInteractionQuotaNotified": true
											}
										)
									)
								);

								return {
									"plan": plan.accountStatus,
									"occurrences": planOccurrences.length,
									"emailOperations": emailResults,
									"databaseOperations": dbResults
								};
							})
						)
					};
				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the activity of the account is low based
			 * on the number of interaction quota consumed
			 * renovationDate: -> higher than {today}, lower than next {ten} days,
			 * interactionQuota: -> greater than or equal {90%} available
			 * lowInteractivityNotified: -> false
			 * accountStatus: != "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function accountInactivity
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async accountInactivity() {
				const TASK_ID = "low_interactivity";
				const now = new Date();
				try {
					return {
						"task_id": TASK_ID,
						"planTasks": await Promise.all(
							// Iterate over available plans because each one has a different setup that will
							// define the remaining percentage accordingly. Trial accounts are excluded from this process.
							plans.filter(
								plan => plan.accountStatus !== "trial"
							).map(async plan => {
								//Fetch accounts that fall under the pre-established condition based on each plan setup.
								let planOccurrences = await mongoDB.find(
									ACCOUNT_STATUS_COLLECTION_NAME,
									{
										"query": {
											"accountStatus": plan.accountStatus,
											"lowInteractivityNotified": {
												"$ne": true
											},
											"interactionQuota": {
												"$gte": plan.defaultValues.interactionQuota * 0.90
											},
											"renovationDate": {
												// Greater-equals than `now` and lower-equals than `now + 10 days`
												"$gte": now,
												"$lte": new Date(
													new Date().setDate(
														now.getDate() + 10
													)
												)
											}
										},
										"projection": {
											"clientName": 1,
											"accountStatus": 1,
											"interactionQuota": 1
										}
									}
								);

								//For each occurrence found send an email request with the original plan value and client data.
								let emailResults = await Promise.all(
									planOccurrences.map(
										async occurrence => await mailer.postStationData(
											TASK_ID,
											{
												"interactionPlanQuota": plan.defaultValues.interactionQuota,
												...occurrence
											}
										)
									)
								);

								//For each occurrence found also change the document status to control how many times it is notified.
								let dbResults = await Promise.all(
									planOccurrences.map(
										async occurrence => await mongoDB.updateOne(
											ACCOUNT_STATUS_COLLECTION_NAME,
											{
												"_id": occurrence._id
											},
											{
												"lowInteractivityNotified": true
											}
										)
									)
								);

								return {
									"plan": plan.accountStatus,
									"occurrences": planOccurrences.length,
									"emailOperations": emailResults,
									"databaseOperations": dbResults
								};
							})
						)
					};
				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the pre-defined date.
			 * renovationDate: -> higher than {today}, lower than next {five} days
			 * subscriptionEndNotified: -> false
			 * accountStatus: != "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function subscriptionPeriodCloseToEndFirstWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionPeriodCloseToEndFirstWarning() {
				const TASK_ID = "subscription_close_to_end_first_warning";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": {
									"$ne": "trial"
								},
								"subscriptionAboutToEndNotified": {
									"$ne": true
								},
								"renovationDate": {
									// Greater-equals than `now` and lower-equals than `now + 2 days`
									"$gte": now,
									"$lte": new Date(
										new Date().setDate(
											now.getDate() + 2
										)
									)
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"renovationDate": 1
							}
						}
					);

					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					//For each occurrence found also change the document status to control how many times it is notified.
					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionAboutToEndNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the current date and has been notified before.
			 *
			 * This is valid for both trial and regular accounts.
			 * renovationDate: -> higher than {today} AND lower than next {two} days
			 * subscriptionAboutToEndNotified: -> true
			 * subscriptionAboutToEndLastWarningNotified: -> false
			 * accountStatus: != "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function subscriptionPeriodCloseToEndLastWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionPeriodCloseToEndLastWarning() {
				const TASK_ID = "subscription_close_to_end_last_warning";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": {
									"$ne": "trial"
								},
								"subscriptionAboutToEndNotified": {
									"$eq": true
								},
								"subscriptionAboutToEndLastWarningNotified": {
									"$ne": true
								},
								"renovationDate": {
									// Greater-equals than `now` and lower-equals than `now + 2 days`
									"$gte": now,
									"$lte": new Date(
										new Date().setDate(
											now.getDate() + 2
										)
									)
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"renovationDate": 1
							}
						}
					);

					//For each occurrence found send an email request with the original plan value and client data.
					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					//For each occurrence found also change the document status to control how many times it is notified.
					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionAboutToEndLastWarningNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the subscription has ended
			 * This is notified only once.
			 * Will emit a different notification for `trial accounts`
			 * renovationDate: -> lower than {now}
			 * subscriptionAboutToEndLastWarningNotified: -> true
			 * subscriptionEndNotified: -> false
			 * accountStatus: != "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function subscriptionEnded
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async subscriptionEnded() {
				const TASK_ID = "subscription_ended";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": {
									"$ne": "trial"
								},
								"subscriptionAboutToEndLastWarningNotified": {
									"$eq": true
								},
								"subscriptionEndNotified": {
									"$ne": true
								},
								"renovationDate": {
									"$lte": now
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"renovationDate": 1
							}
						}
					);

					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionEndNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the pre-defined date.
			 * renovationDate: -> higher than {today}, lower than next {five} days
			 * subscriptionEndNotified: -> false
			 * accountStatus: == "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function trialPeriodCloseToEndFirstWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async trialPeriodCloseToEndFirstWarning() {
				const TASK_ID = "trial_close_to_end_first_warning";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": "trial",
								"subscriptionAboutToEndNotified": {
									"$ne": true
								},
								"trialEndDate": {
									"$gte": now,
									"$lte": new Date(
										new Date().setDate(
											now.getDate() + 2
										)
									)
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"trialEndDate": 1
							}
						}
					);

					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionAboutToEndNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the accounts status and create a notification request if the subscription period is near
			 * the current date and has been notified before.
			 *
			 * This is valid for both trial and regular accounts.
			 * renovationDate: -> higher than {today} AND lower than next {two} days
			 * subscriptionAboutToEndNotified: -> true
			 * subscriptionAboutToEndLastWarningNotified: -> false
			 * accountStatus: == "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function trialPeriodCloseToEndLastWarning
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async trialPeriodCloseToEndLastWarning() {
				const TASK_ID = "trial_close_to_end_last_warning";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": "trial",
								"subscriptionAboutToEndNotified": {
									"$eq": true
								},
								"subscriptionAboutToEndLastWarningNotified": {
									"$ne": true
								},
								"trialEndDate": {
									"$gte": now,
									"$lte": new Date(
										new Date().setDate(
											now.getDate() + 2
										)
									)
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"trialEndDate": 1
							}
						}
					);

					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionAboutToEndLastWarningNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
					};

				} catch (e) {
					return {
						"task_id": TASK_ID,
						"error": e.message || e
					}
				}
			},

			/**
			 * Query the trial accounts that are expired and not notified
			 * This is notified only once.
			 * Will emit a different notification for `trial accounts`
			 * renovationDate: -> lower than {now}
			 * subscriptionAboutToEndLastWarningNotified: -> true
			 * subscriptionEndNotified: -> false
			 * accountStatus: ==  "trial"
			 *
			 * @async
			 * @methodOf accountChecker
			 * @function trialEnded
			 * @throws Will throw an error if some exception occurs
			 * @return {Promise<array>} The list of notifications sent.
			 */
			async trialEnded() {
				const TASK_ID = "trial_ended";
				const now = new Date();
				try {
					let accountOccurrences = await mongoDB.find(
						ACCOUNT_STATUS_COLLECTION_NAME,
						{
							"query": {
								"accountStatus": "trial",
								"subscriptionAboutToEndLastWarningNotified": {
									"$eq": true
								},
								"subscriptionEndNotified": {
									"$ne": true
								},
								"trialEndDate": {
									"$lte": now
								}
							},
							"projection": {
								"clientName": 1,
								"accountStatus": 1,
								"trialEndDate": 1
							}
						}
					);

					//For each occurrence found send an email request with the original plan value and client data.
					let emailResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mailer.postStationData(
								TASK_ID,
								{
									...occurrence
								}
							)
						)
					);

					//For each occurrence found also change the document status to control how many times it is notified.
					let dbResults = await Promise.all(
						accountOccurrences.map(
							async occurrence => await mongoDB.updateOne(
								ACCOUNT_STATUS_COLLECTION_NAME,
								{
									"_id": occurrence._id
								},
								{
									"subscriptionEndNotified": true
								}
							)
						)
					);

					return {
						"task_id": TASK_ID,
						"occurrences": accountOccurrences.length,
						"emailOperations": emailResults,
						"databaseOperations": dbResults
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