(function () {
	"use strict";
	/**
	 * Conversation Analytics helper
	 * @module conversationAnalytics
	 * */
	const ACCOUNT_COLLECTION = "platform_users";

	module.exports = function (mongoDB) {
		if (!mongoDB) {
			throw new Error("Can not instantiate accounts helper without mongoDB object")
		}
		return {
			async getCompanyEmail(company) {
				let result =  await mongoDB.findOne(ACCOUNT_COLLECTION,
					{
						"query": {
							"company": company,
							"role": "owner"
						},
						"projection": {
							"email": 1
						}
					}
				);

				return result ? result.email : "test@test.com";
			},
		}
	};

}());