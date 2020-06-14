"use strict";

const assert = require("assert");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const monthlyReport = require("../../../server/helpers/scheduled/monthlyReport");
const CONVERSATION_ANALYTICS_COLLECTION = "conversation_analytics";
// const mock = require("../../mocks/accountStatus");

module.exports = function (mongoDB, mailer, conversationAnalytics) {

	describe("Monthly report module", () => {

		context("Valid instantiation", () => {
			let monthlyReportInstance = monthlyReport(mongoDB, mailer, conversationAnalytics);
			before((done) => {
				process.log.info("Cleaning up Account status tests DB and loading default before start");
				Promise.all([
					mongoDB.drop(
						CONVERSATION_ANALYTICS_COLLECTION
					)
				]).then(() => {
					done();
					// mongoDB.bulkInsert(
					// 	CONVERSATION_ANALYTICS_COLLECTION,
					// 	mock.export()
					// ).then(() => {
					// 	process.log.info("Mock data added");
					// 	done();
					// }).catch(err => process.log.error(err));
				});
			});

			after((done) => {
				process.log.info("Cleaning up Account status tests DB after finish");
				Promise.all([
					mongoDB.drop(
						CONVERSATION_ANALYTICS_COLLECTION
					)
				]).then(() => {
					process.log.info("DB Account status cleaned up and data loaded");
					return done();
				}).catch(err => process.log.error(err));
			});


			it("should export an object", function() {
				assert.strictEqual(typeof monthlyReportInstance, "object");
			});

			it("should expose a cron schedule string", function() {
				assert.strictEqual(typeof monthlyReportInstance.cronScheduleString, "string");
			});

			it("should expose a monthlyReport method", function() {
				assert.strictEqual(typeof monthlyReportInstance.monthlyReport, "function");
			});

			it("cronScheduleString must represent a monthly task at 05 AM every Monday", function () {
				assert.strictEqual(monthlyReportInstance.cronScheduleString, "0 5 1 * *");
			});


		});
	});

}
