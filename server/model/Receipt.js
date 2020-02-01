(function () {
	"use strict";

	/**
	 * Represents a Receipt instance
	 * @module Receipt
	 * @class Receipt
	 * @constructor
	 * @param {object} params - The receipt information.
	 * @param {string} params.client - The client whose responds to the receipt.
	 * @param {string} params.service - The service consumed.
	 * @param {string} params.workspaceId - The service workspace ID.
	 * @param {object} [params.amount] - The amount consumed, defaults to 1.
	 * @return {object} Containing the Receipt object
	 */
	module.exports = function Constructor(params = {}) {
		if (!params.client || !params.service) {
			throw new Error("Invalid params to build the Receipt object");
		}
		this.timestamp = new Date();
		this.client = params.client;
		this.service = params.service;
		this.workspaceId = params.workspaceId;
		return this;
	}
}());