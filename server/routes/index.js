(function () {
	"use strict";


	const swaggerJSDoc = require("swagger-jsdoc");
	const options = require("../configs/swaggerJSDocs");
	const handleError = require("../helpers/errorHandler").handleError;
	const fs = require("fs");
	const path = require("path");
	const LOGS_DUMP_FILE_PATH = path.join("root", "mail_logs", "dump.log");
	const WEEKLY_LOGS_DUMP_FILE_PATH = path.join("root", "mail_logs", "weekly_dump.log");
	const MONTHLY_LOGS_DUMP_FILE_PATH = path.join("root", "mail_logs", "monthly_dump.log");

	module.exports = function (app, queue) {


		app.get("/", (req, res) => {
			res.status(200).render("./index.html");
		});

		app.get("/queueStatus", (req, res) => {
			return res.status(200).send(queue.getQueueStatus());
		});

		app.get("/logs", (req, res) => {
			try {
				const stream = fs.createReadStream(LOGS_DUMP_FILE_PATH);
				stream.pipe(res);
			} catch (e) {
				return res.status(500).send(e.message || e);
			}
		});

		app.get("/monthly_logs", (req, res) => {
			try {
				const stream = fs.createReadStream(MONTHLY_LOGS_DUMP_FILE_PATH);
				stream.pipe(res);
			} catch (e) {
				return res.status(500).send(e.message || e);
			}
		});

		app.get("/weekly_logs", (req, res) => {
			try {
				const stream = fs.createReadStream(WEEKLY_LOGS_DUMP_FILE_PATH);
				stream.pipe(res);
			} catch (e) {
				return res.status(500).send(e.message || e);
			}
		});


		app.get("/api-docs.json", function(req, res) {
			res.setHeader("Content-Type", "application/json");
			res.send(swaggerJSDoc(options));
		});

		app.use((err, req, res, next) => handleError(err, res, next));

	};

}());
