(function (process) {
	"use strict";
	process.env.TEST_ENV = true;

	require("dotenv").config({
		"silent": true
	});

	const mongoDB = require("../server/helpers/mongo");
	const logger = require("../server/helpers/logger");
	const mailer = require("../server/helpers/mailer")(mongoDB, null);
	process.log = require("winston");

	describe("App instantiation", function () {
		return it("Should init mongoDB connection", function (done) {
			Promise.all([
				mongoDB.connect()
			]).then(() => {
				require("./server/helpers/accountChecker-test")(mongoDB, mailer);

				return done();
			}).catch((err) => {
				process.log.error(err.message || err);
			});
		});
	});

}(process));