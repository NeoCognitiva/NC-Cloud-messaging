(function () {
	"use strict";

	module.exports = {
		handleError(err, expressResponse) {
			try {
				if (Object.prototype.hasOwnProperty.call(err, "status")) {
					return expressResponse.status(err.status || 500).send(err.message || err);
				} else {
					let parsedError = JSON.parse(err.message);
					return expressResponse.status(parsedError.status || 500).send(parsedError.message || err.message || "Unknown Error");
				}
			} catch (e) {
				return expressResponse.status(err.status || 500).send(err.message || err);
			}
		},
		handleCloudantError(err) {
			return new Error(JSON.stringify({
				"status": err.statusCode || err.status || 500,
				"message": err.reason || err.message || "Unknown Cloudant error"
			}));
		}
	};

}());
