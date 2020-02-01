(function () {
	"use strict";

	/**
	 * Represents a Log instance.
	 * @module Log
	 * @class Log
	 * @constructor
	 * @param {object} params - The log object to be created.
	 * @param {string} params.action - The log action.
	 * @param {string} params.type - The log type.
	 * @param {string} params.operator - The log operator/submitter.
	 * @param {object} [params.details] - The log details object.
	 * @return {object} Containing log object
	 */
	module.exports = function Constructor(params) {
		if (!params.action || !params.type || !params.operator) {
			throw new Error("Invalid params to build Log Object");
		}
		this.action = params.action;
		this.type = params.type;
		this.operator = params.operator;
		this.timestamp = new Date();
		this.details = params.details || {};
	}
}());