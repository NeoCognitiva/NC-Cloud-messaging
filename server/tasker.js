"use strict";

const cron = require("node-cron");

module.exports = {
	"init": function (tasks = []) {
		return tasks.map(task => cron.schedule(
			task.expression,
			task.handler,
			task.options || {})
		);
	}
}
