(function () {
	"use strict";

	module.exports = {
		"swaggerDefinition": {
			"info": {
				"title": "IBM EPM Calendar",
				"version": "1.0.0",
			},
			"contact": {
				"name": "EPM Calendar support",
				"url": "https://github.ibm.com/epm/calendar/issues",
				"email": "dcerag@br.ibm.com"
			},
			"components": {
				"securitySchemes": {
					"ApiKeyAuth": {
						"type": "apiKey",
						"in": "query",
						"name": "key"
					}
				}
			},
			"servers": [{
				"url": "https://epm-calendar-dev.mybluemix.net",
				"description": "Development server"
			}, {
				"url": "https://epm-calendar.mybluemix.net",
				"description": "Production server"
			},],
			"tags": [{
				"name": "Events",
				"description": "EPM Calendar events"
			}, {
				"name": "Custom dates",
				"description": "EPM Calendar custom dates"
			}],
			"openapi": "3.0.2",
		},
		"apis": ["./server/routes/partials/public/*.js"]
	}
}());