"use strict";

const assert = require("assert");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const accountChecker = require("../../../server/helpers/scheduled/accountChecker");
const ACCOUNT_STATUS_COLLECTION = "account_status";
const mock = require("../../mocks/accountStatus");

module.exports = function (mongoDB, mailer) {

	describe("Account checker module", () => {

		context("Valid instantiation", () => {
			let checker = accountChecker(mongoDB, mailer);
			before((done) => {
				process.log.info("Cleaning up Account status tests DB and loading default before start");
				Promise.all([
					mongoDB.drop(
						ACCOUNT_STATUS_COLLECTION
					)
				]).then(() => {

					mongoDB.bulkInsert(
						ACCOUNT_STATUS_COLLECTION,
						mock.export()
					).then(() => {
						process.log.info("Mock data added");
						done();
					}).catch(err => process.log.error(err));
				});
			});

			after((done) => {
				process.log.info("Cleaning up Account status tests DB after finish");
				Promise.all([
					mongoDB.drop(
						ACCOUNT_STATUS_COLLECTION
					)
				]).then(() => {
					process.log.info("DB Account status cleaned up and data loaded");
					return done();
				}).catch(err => process.log.error(err));
			});


			it("should export an object", function() {
				assert.strictEqual(typeof checker, "object");
			});

			it("should expose a cron schedule string", function() {
				assert.strictEqual(typeof checker.cronScheduleString, "string");
			});

			it("should expose a lowInteractionQuota method", function() {
				assert.strictEqual(typeof checker.lowInteractionQuota, "function");
			});

			it("should expose a accountInactivity method", function() {
				assert.strictEqual(typeof checker.accountInactivity, "function");
			});

			it("should expose a subscriptionPeriodCloseToEndFirstWarning method", function() {
				assert.strictEqual(typeof checker.subscriptionPeriodCloseToEndFirstWarning, "function");
			});

			it("should expose a subscriptionPeriodCloseToEndLastWarning method", function() {
				assert.strictEqual(typeof checker.subscriptionPeriodCloseToEndLastWarning, "function");
			});

			it("should expose a subscriptionEnded method", function() {
				assert.strictEqual(typeof checker.subscriptionEnded, "function");
			});

			it("should expose a trialPeriodCloseToEndFirstWarning method", function() {
				assert.strictEqual(typeof checker.trialPeriodCloseToEndFirstWarning, "function");
			});

			it("should expose a trialPeriodCloseToEndLastWarning method", function() {
				assert.strictEqual(typeof checker.trialPeriodCloseToEndLastWarning, "function");
			});

			it("should expose a trialEnded method", function() {
				assert.strictEqual(typeof checker.trialEnded, "function");
			});

			describe("cronScheduleString must represent a daily task at 05 AM", function () {
				assert.strictEqual(checker.cronScheduleString, "0 1 * * *");
			});

			describe("lowInteractionQuota method", () => {
				it("should detect 04 offenses among the mock data", async () => {
					let results = await checker.lowInteractionQuota();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "low_interaction_quota");
					assert.strictEqual(Array.isArray(results.planTasks), true);
					results.planTasks.forEach(planTask => {
						assert.strictEqual(planTask.occurrences, 2);
						assert.strictEqual(Array.isArray(planTask.emailOperations), true);
						assert.strictEqual(planTask.emailOperations.length, 2);
						assert.strictEqual(Array.isArray(planTask.databaseOperations), true);
						assert.strictEqual(planTask.databaseOperations.length, 2);
					});
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.lowInteractionQuota();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "low_interaction_quota");
					assert.strictEqual(Array.isArray(results.planTasks), true);
					results.planTasks.forEach(planTask => {
						assert.strictEqual(planTask.occurrences, 0);
						assert.strictEqual(Array.isArray(planTask.emailOperations), true);
						assert.strictEqual(planTask.emailOperations.length, 0);
						assert.strictEqual(Array.isArray(planTask.databaseOperations), true);
						assert.strictEqual(planTask.databaseOperations.length, 0);
					});
				});

				it ("should not have any `trial account` amongst the results", async () => {
					let results = await checker.lowInteractionQuota();
					assert.strictEqual(results.planTasks.some(task => task.plan === "trial"), false);
				});

			});

			describe("accountInactivity method", () => {
				it("should detect 06 offenses among the mock data", async () => {
					let results = await checker.accountInactivity();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "low_interactivity");
					assert.strictEqual(Array.isArray(results.planTasks), true);
					results.planTasks.forEach(planTask => {
						assert.strictEqual(planTask.occurrences, 3);
						assert.strictEqual(Array.isArray(planTask.emailOperations), true);
						assert.strictEqual(planTask.emailOperations.length, 3);
						assert.strictEqual(Array.isArray(planTask.databaseOperations), true);
						assert.strictEqual(planTask.databaseOperations.length, 3);
					});
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.accountInactivity();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "low_interactivity");
					assert.strictEqual(Array.isArray(results.planTasks), true);
					results.planTasks.forEach(planTask => {
						assert.strictEqual(planTask.occurrences, 0);
						assert.strictEqual(Array.isArray(planTask.emailOperations), true);
						assert.strictEqual(planTask.emailOperations.length, 0);
						assert.strictEqual(Array.isArray(planTask.databaseOperations), true);
						assert.strictEqual(planTask.databaseOperations.length, 0);
					});
				});

				it ("should not have any `trial account` amongst the results", async () => {
					let results = await checker.accountInactivity();
					assert.strictEqual(results.planTasks.some(task => task.plan === "trial"), false);
				});

			});

			describe("subscriptionPeriodCloseToEndFirstWarning method", () => {
				it("should detect 02 offenses among the mock data", async () => {
					let results = await checker.subscriptionPeriodCloseToEndFirstWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_close_to_end_first_warning");
					assert.strictEqual(results.occurrences, 2);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 2);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 2);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.subscriptionPeriodCloseToEndFirstWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_close_to_end_first_warning");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

			describe("subscriptionPeriodCloseToEndLastWarning method", () => {
				it("should detect 04 offenses among the mock data and changes applied within the tests execution", async () => {
					let results = await checker.subscriptionPeriodCloseToEndLastWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_close_to_end_last_warning");
					assert.strictEqual(results.occurrences, 4);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 4);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 4);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.subscriptionPeriodCloseToEndLastWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_close_to_end_last_warning");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

			describe("subscriptionEnded method", () => {
				it("should detect 02 offenses among the mock data and changes applied within the tests execution", async () => {
					let results = await checker.subscriptionEnded();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_ended");
					assert.strictEqual(results.occurrences, 2);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 2);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 2);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.subscriptionEnded();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "subscription_ended");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

			describe("trialPeriodCloseToEndFirstWarning method", () => {
				it("should detect 02 offenses among the mock data", async () => {
					let results = await checker.trialPeriodCloseToEndFirstWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_close_to_end_first_warning");
					assert.strictEqual(results.occurrences, 1);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 1);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 1);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.trialPeriodCloseToEndFirstWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_close_to_end_first_warning");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

			describe("trialPeriodCloseToEndLastWarning method", () => {
				it("should detect 02 offenses among the mock data and changes applied within the tests execution", async () => {
					let results = await checker.trialPeriodCloseToEndLastWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_close_to_end_last_warning");
					assert.strictEqual(results.occurrences, 2);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 2);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 2);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.trialPeriodCloseToEndLastWarning();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_close_to_end_last_warning");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

			describe("trialEnded method", () => {
				it("should detect 01 offense among the mock data and changes applied within the tests execution", async () => {
					let results = await checker.trialEnded();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_ended");
					assert.strictEqual(results.occurrences, 1);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 1);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 1);
				});

				it("should not detect any changes after the first processing", async () => {
					let results = await checker.trialEnded();
					assert.notEqual(results, undefined);
					assert.strictEqual(results.task_id, "trial_ended");
					assert.strictEqual(results.occurrences, 0);
					assert.strictEqual(Array.isArray(results.emailOperations), true);
					assert.strictEqual(results.emailOperations.length, 0);
					assert.strictEqual(Array.isArray(results.databaseOperations), true);
					assert.strictEqual(results.databaseOperations.length, 0);
				});
			});

		});
	});

}
