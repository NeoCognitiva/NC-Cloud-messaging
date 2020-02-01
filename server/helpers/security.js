(function () {
	"use strict";
	/**
	 * Security helper
	 * @module security
	 * */
	const bcrypt = require("bcrypt");
	const jwt = require("jsonwebtoken");
	const uid = new (require("uid-generator"))();
	const request = require("request");
	module.exports = {
		/**
		 * Generate an HMAC hash
		 * @function generateHash
		 * @param {string} password - Raw password string to be hashed.
		 * @param {number} [customSaltRounds] - Optional salt configuration.
		 * @return {Promise} Containing the new hash
		 */
		"generateHash": function (password, customSaltRounds = 6) {
			return new Promise(function (resolve, reject) {
				bcrypt.hash(
					password, customSaltRounds
				).then(hash => resolve(hash)
				).catch(err => reject(err));
			});
		},
		"generateToken": function () {
			return new Promise(function (resolve, reject) {
				uid.generate(
				).then(token => resolve(token)
				).catch(err => reject(err));
			});
		},
		/**
		 * Check if password match the hash
		 * @method validateHash
		 * @param {string} password - Raw password string to be checked.
		 * @param {string} hash - Hash to be compared against.
		 * @return {Promise} Containing the result of comparison
		 */
		"validateHash": function (password, hash) {
			return new Promise(function (resolve, reject) {
				bcrypt.compare(
					password,
					hash
				).then(res => {
					return res ? resolve(res) : reject(res);
				}).catch(err => reject(err));
			});
		},
		/**
		 * Generates a JWT applying app configs
		 * @method generateJWT
		 * @param {object} rawData - Raw data to be hashed.
		 * @param {string} [expiration] - Token expiration date. Default 1d.
		 * @return {Promise} Containing the hashed token.
		 */
		"generateJWT": function (rawData = {}, expiration) {
			return new Promise((resolve, reject) => {
				jwt.sign(
					rawData,
					process.env.APP_SECRET,
					(expiration ?
						{"expiresIn": expiration} :
						{}
					),
					function (err, token) {
						return err ? reject(err) : resolve(token);
					}
				);
			});
		},
		/**
		 * Validates an app generated JWT
		 * @method validateJWT
		 * @param {string} token - Hashed string to be checked.
		 * @return {Promise} Containing the result of comparison
		 */
		"validateJWT": function (token) {
			return new Promise((resolve, reject) => {
				jwt.verify(
					token,
					process.env.APP_SECRET,
					(err, decoded) => {
						return err ? reject(err) : resolve(decoded);
					}
				);
			});
		},
		"validateRecaptcha": function (value) {
			return new Promise((resolve, reject) => {
				request.post("https://www.google.com/recaptcha/api/siteverify", {
					"form": {
						"secret": process.env.RECAPTCHA_KEY,
						"response": value
					}
				}, (err, result) => {
					if (err) {
						return reject(err);
					} else {
						let parsedResult = JSON.parse(result.body || {});
						return parsedResult.success ? resolve(parsedResult) : reject(parsedResult);
					}
				});
			});
		}
	};

}());