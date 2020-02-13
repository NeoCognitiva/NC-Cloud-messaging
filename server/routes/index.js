(function () {
	"use strict";


	const swaggerJSDoc = require("swagger-jsdoc");
	const options = require("../configs/swaggerJSDocs");
	const handleError = require("../helpers/errorHandler").handleError;

	module.exports = function (app, queue) {


		app.get("/", (req, res) => {
			res.status(200).render("./index.html");
		});

		app.get("/queueStatus", (req, res) => {
			return res.status(200).send(queue.getQueueStatus());
		});


		app.get("/api-docs.json", function(req, res) {
			res.setHeader("Content-Type", "application/json");
			res.send(swaggerJSDoc(options));
		});
	};

}());
