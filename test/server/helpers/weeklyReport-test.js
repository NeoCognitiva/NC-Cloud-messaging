"use strict";

const assert = require("assert");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const weeklyReport = require("../../../server/helpers/scheduled/weeklyReport");
const CONVERSATION_ANALYTICS_COLLECTION = "conversation_analytics";
// const mock = require("../../mocks/accountStatus");

module.exports = function (mongoDB, mailer, conversationAnalytics, accounts) {

	describe("Weekly report module", () => {

		context("Valid instantiation", () => {
			let weeklyReportInstance = weeklyReport(mongoDB, mailer, conversationAnalytics, accounts);
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
				assert.strictEqual(typeof weeklyReportInstance, "object");
			});

			it("should expose a cron schedule string", function() {
				assert.strictEqual(typeof weeklyReportInstance.cronScheduleString, "string");
			});

			it("should expose a weeklyReport method", function() {
				assert.strictEqual(typeof weeklyReportInstance.weeklyReport, "function");
			});

			it("cronScheduleString must represent a weekly task at 05 AM every Monday", function () {
				assert.strictEqual(weeklyReportInstance.cronScheduleString, "0 5 * * 1");
			});


		});
	});

}
