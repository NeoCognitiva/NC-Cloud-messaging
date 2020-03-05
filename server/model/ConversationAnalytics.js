(function () {
	"use strict";

	/**
	 * Represents a Conversation Analytics instance.
	 * @module ConversationAnalytics
	 * @class ConversationAnalytics
	 * @constructor
	 * @return {object} Containing log object
	 */

	const moment = require("moment");

	module.exports = function Constructor(company, workspaceId, conversationId) {
		let now = moment();
		this.company = company;
		this.workspaceId = workspaceId;
		this.conversationId = conversationId;
		this.interactionCount = 0;
		this.failedInteractionCount = 0;
		this.feedbackRequestCount = 0;
		this.dateString = now.format("YYYYMMDD");
		this.date = now.toDate();
		this.dateComponents = {
			"year": now.year(),
			"month": now.month(),
			"week": now.week(),
			"isoWeek": now.isoWeek(),
			"dayOfMonth": now.date(),
			"dayOfWeek": now.day()
		};
		this.lastUpdatedAt = null;
		this.intentFrequency = {};
		this.entityFrequency = {};
		this.dialogNodeFrequency = {};

		return this;
	}

}());