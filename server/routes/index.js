(function () {
	"use strict";


	const swaggerJSDoc = require("swagger-jsdoc");
	const options = require("../configs/swaggerJSDocs");
	const handleError = require("../helpers/errorHandler").handleError;

	module.exports = function (app) {

		app.get("/",
			(req, res) => res.send("oi")
		);

		app.get("/api-docs.json", function(req, res) {
			res.setHeader("Content-Type", "application/json");
			res.send(swaggerJSDoc(options));
		});
	};

}());
