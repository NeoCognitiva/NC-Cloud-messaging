/**
 * Created by danielabrao on 6/9/17.
 */
(function () {
	"use strict";
	require("dotenv").config({
		"silent": true
	});

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

	server.listen(appPort, function () {
		process.stdout.write(`\nServer running on port: ${appPort}\n`);
		require("./server/routes/index")(app);
	});

}());
