/*jslint node: true, nomen:true*/
/*env:node*/
(function () {
	"use strict";
	require("dotenv").config({"silent": true});
	const gulp = require("gulp");
	const argv = require("yargs").argv;
	const fse = require("fs-extra");
	const eslint = require("gulp-eslint");
	const plumber = require("gulp-plumber");
	const path = require("path");
	const log = require("fancy-log");
	const jsdoc = require("gulp-jsdoc3");
	const colors = require("ansi-colors");
	let currentContext = "";
	let modulePath;
	let isProd;


	process.env.NODE_ENV = argv.prod ? "production" : "development";
	isProd = process.env.NODE_ENV === "production";
	let methods = {
		"errorHandler": function errorHandler(module, error, stack) {
			log(colors.red("ERROR FOUND BUILDING THIS ARTIFACT:"), colors.yellow(module));
			log(stack);
			log(error);
			process.exit(1);
		},
		"setCFManifest": function () {
			return fse.copy(path.join("root/manifests", isProd ? "manifest.prod.yml" : "manifest.dev.yml"), "manifest.yml", {
				"overwrite": true
			});
		}
	};

	gulp.task("doc", function (cb) {
		if (!isProd) {
			return cb();
		}
		let config = require("./jsdoc-config.json");
		gulp.src(["README.md", "./server/**/*.js"], {read: false})
			.pipe(jsdoc(config, cb));
	});

	gulp.task("set-manifest", function (done) {
		methods.setCFManifest().then(function () {
			done();
		}).catch(function (error) {
			methods.errorHandler("set-manifest", error, "Check the logs to see where it fails");
		});
	});

	gulp.task("lint:server", function () {
		modulePath = currentContext ? currentContext : ["client" + (argv.module || argv.m || currentContext || "main") + "_module"].join();
		return gulp.src(["./app.js", "./server/**/*.js"])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(eslint.failAfterError())
			.on("error", function (error) {
				methods.errorHandler("lint:server", error, "Check the logs to see where it fails");
			})
	});

	process.on("exit", function (code) {
		log("About to exit with code:", code);
	});

}());