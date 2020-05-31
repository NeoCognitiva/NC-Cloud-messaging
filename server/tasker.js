"use strict";

const cron = require("node-cron");

module.exports = {
	"tasks": [{
		"expression": "0 1 * * *",
		"handler": () => {
			return false;
		},
		"options": {
			"scheduled": true,
			"timezone": "America/Sao_Paulo"
		}
	}],
	"init": function () {
		return this.tasks.map(task => cron.schedule(
			task.expression,
			task.handler,
			task.options || {})
		);
	}
}
