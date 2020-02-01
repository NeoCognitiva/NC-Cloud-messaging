(function (process) {
	"use strict";

	module.exports = process.env.TEST_ENV || process.env === "TEST" ?
		`mongodb+srv://${process.env.MONGO_TEST_USER}:${process.env.MONGO_TEST_PASSWORD}@${process.env.MONGO_TEST_URL}` :
		`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;

}(process));
