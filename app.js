/**
 * Created by danielabrao on 6/9/17.
 */
(function () {
	"use strict";
	require("dotenv").config({
		"silent": true
	});

	let retrialCount = 0;
	const appPort = process.env.APP_PORT || process.env.PORT || process.env.VCAP_APP_PORT || 6070;
	const express = require("express");
	const helmet = require("helmet");
	const fs = require("fs");
	const app = express();

	let server;
	if (process.env.LOCAL_HTTPS) {
		server = require("https").createServer({
			"hostname": "localhost",
			"agent": false,
			"key": fs.readFileSync("./root/certificates/local/localhost-privkey.pem"),
			"cert": fs.readFileSync("./root/certificates/local/localhost-cert.pem"),
			"rejectUnauthorized": false
		}, app);
	} else {
		server = require("http").createServer(app);
	}


	const cookieSession = require("cookie-session");
	const cookieParser = require("cookie-parser");
	const compress = require("compression");
	const engines = require("consolidate");
	const morgan = require("morgan");
	const WebSocket = require("ws");
	const wss = new WebSocket.Server({server});
	const mongoDB = require("./server/helpers/mongo");
	const queueConsumer = require("./server/helpers/queueConsumer")(wss);
	const logger = process.logger = require("./server/helpers/logger")(mongoDB, queueConsumer);
	const mailer = process.logger = require("./server/helpers/mailer")(mongoDB, queueConsumer);
	const receipts = require("./server/helpers/receipts")(mongoDB, logger, queueConsumer);
	const conversationAnalytics = require("./server/helpers/conversationAnalytics")(mongoDB, logger, queueConsumer);
	const accountChecker = require("./server/helpers/accountChecker")(mongoDB, mailer);
	const tasker = require("./server/tasker");


	app.use(helmet());
	app.use(compress());
	app.use(cookieParser());
	app.use(cookieSession({
		"secret": process.env.APP_SECRET,
		"maxAge": 86400000,
		"saveUninitialized": false,
		"resave": false,
		"name": "ncCloudMessaging",
		"key": "c0ll!ncCloudMessaging",
		"cookie": {
			"secure": true,
			"httpOnly": true
		}
	}));

	app.engine("html", engines.ejs);
	app.set("view engine", "ejs");
	app.set("views", __dirname + "/client");
	app.use(express.static(__dirname + "/client"));
	app.use(express.json());
	app.use(express.urlencoded({
		"extended": true,
		"limit": "10mb"
	}));

	app.use("/docs/js", express.static(__dirname + "/docs/js"));
	app.use("/docs/test", express.static(__dirname + "/docs/test/lcov-report"));
	app.use("/docs/api", express.static(__dirname + "/docs/api/swagger-ui-dist"));

	if (process.env.DEBUG) {
		app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
	}


	let init = async () => {
		try {
			await Promise.all([
				mongoDB.connect(),
				queueConsumer.connect()
			]);
			await Promise.all([
				conversationAnalytics.initQueueListener(),
				receipts.initQueueListener(),
				logger.initQueueListener(),
				mailer.initQueueListener()
			]);
			tasker.init(
				[{
					"expression": "* * * * *",
					"handler": async () => {
						let results = await Promise.all([
							accountChecker.lowInteractionQuota(),
							accountChecker.accountInactivity(),
							accountChecker.subscriptionPeriodCloseToEndFirstWarning(),
							accountChecker.subscriptionPeriodCloseToEndLastWarning(),
							accountChecker.subscriptionEnded()
						]);
						console.log(results);
						return results;
					},
					"options": {
						"scheduled": true,
						"timezone": "America/Sao_Paulo"
					}
				}]
			);
			require("./server/routes/index")(app, queueConsumer);
			logger.info("MongoDB and RabbitMQ connected successfully");
			logger.info(`API server running at port ${appPort}`);
			logger.info("Automation to handle customer alerts will run every day at 01:00 AM America/Sao_Paulo");

		} catch (err) {
			logger.info({
				"message": "An error occurred initiating a required core service, check the details below:"
			});
			logger.error(err);
			if (retrialCount >= 3) {
				logger.info("Retried three times already, shutting it down");
				process.exit(1);
			} else {
				logger.info("Retrying in 20 seconds");
				setTimeout(() => {
					retrialCount += 1;
					logger.info(`Starting retrial #${retrialCount}`);
					return init();
				}, 20000);
			}
		}
	};

	server.listen(appPort, init);

	process.on("exit", (code) => {
		queueConsumer.disconnect();
		logger.info(`Finishing app with the ${code} status code`);
	});

	process.once("SIGINT", () => {
		logger.info("App closed by the operator");
		process.exit();
	});

}());
