"use strict";


module.exports = function (sleepTimeInMS = 100) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, sleepTimeInMS);
	})
};