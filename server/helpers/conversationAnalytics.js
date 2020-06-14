(function () {
	"use strict";
	/**
	 * Conversation Analytics helper
	 * @module conversationAnalytics
	 * */
	const moment = require("moment");
	const CONVERSATION_ANALYTICS_COLLECTION = "conversation_analytics";
	const CONVERSATION_ANALYTICS_ENGAGE_TOPIC = process.env.CONVERSATION_ANALYTICS_ENGAGE_TOPIC;
	const CONVERSATION_ANALYTICS_INCREMENT_TOPIC = process.env.CONVERSATION_ANALYTICS_INCREMENT_TOPIC;
	const ConversationAnalytics = require("../model/ConversationAnalytics");

	module.exports = function (mongoDB, logger, queue) {
		if (!mongoDB || !logger) {
			throw new Error("Can not instantiate adminUser helper without mongoDB object")
		}
		return {
			async storeConversation(company, workspaceId, conversationId) {
				return await mongoDB.insertOne(CONVERSATION_ANALYTICS_COLLECTION,
					new ConversationAnalytics(company, workspaceId, conversationId)
				);
			},
			async updateConversation(company, workspaceId, conversationId, conversation) {
				let updateDoc = {
					"$inc": {
						"interactionCount": 1
					},
					"$set": {
						"lastUpdatedAt": new Date()
					}
				};

				if (conversation.intents &&
					conversation.intents.length
				) {
					updateDoc.$inc[`intentFrequency.${conversation.intents[0].intent}`] = 1;
				}

				if (conversation.entities &&
					conversation.entities.length
				) {
					updateDoc.$inc[`entityFrequency.${conversation.entities[0].entity}`] = 1;
				}

				if (conversation.output &&
					conversation.output.nodes_visited &&
					conversation.output.nodes_visited.length
				) {
					updateDoc.$inc[`dialogNodeFrequency.${conversation.output.nodes_visited[0]}`] = 1;
				} else {
					updateDoc.$inc.failedInteractionsCount = 1;
				}

				if (conversation.context && conversation.context.shouldAskFeedback) {
					updateDoc.$inc.feedbackRequestCount = 1;
				}

				return await mongoDB.updateOneAtomic(CONVERSATION_ANALYTICS_COLLECTION,
					{company, workspaceId, conversationId},
					updateDoc
				);
			},

			"queueController": null,
			async handleConversationEngagement(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());

				let documentId = await this.storeConversation(
					parsedMessage.company,
					parsedMessage.workspaceId,
					parsedMessage.conversation
				);

				await queue.ackQueueMessage(message, JSON.stringify({
					"type": "conversation_analytics",
					"documentId": parsedMessage.conversation
				}));

				logger.info(`Conversation: ${parsedMessage.conversation} generated and message acknowledged. Document ID is: ${documentId}`);

				return true;
			},

			async handleConversationIncrement(message = {}) {
				let parsedMessage = JSON.parse((message.content).toString());
				let conversationId = parsedMessage.conversation.context.conversation_id;
				await this.updateConversation(
					parsedMessage.company,
					parsedMessage.workspaceId,
					conversationId,
					parsedMessage.conversation
				);

				await queue.ackQueueMessage(message, JSON.stringify({
					"type": "conversation_analytics",
					"documentId": conversationId
				}));
				logger.info(`Conversation: ${conversationId} updated and acknowledged`);
				return true;
			},

			"buildAnalyticsQuery": function (startDate, endDate) {
				let queryObject =  {
					"date": {}
				};

				if (startDate) {
					let parsedStartDate = new Date(startDate);
					if (!parsedStartDate || (parsedStartDate || "").toString() === "Invalid Date") {
						throw new Error("Invalid start date provided");
					}
					queryObject.date.$gte = moment(parsedStartDate).startOf("day").toDate();
				}
				if (endDate) {
					let parsedEndDate = new Date(endDate);
					if (!parsedEndDate || (parsedEndDate || "").toString() === "Invalid Date") {
						throw new Error("Invalid end date provided");
					}
					queryObject.date.$lte = moment(parsedEndDate).endOf("day").toDate();
				}

				if (!startDate && !endDate) {
					delete queryObject.date;
				}
				return queryObject;
			},

			"fetchConversationAnalytics": function (startDate, endDate) {
				return new Promise((resolve, reject) => {
					mongoDB.aggregate(CONVERSATION_ANALYTICS_COLLECTION,
						[{
							"$match": this.buildAnalyticsQuery(startDate, endDate)
						}, {
							"$group": {
								"_id": "$company",
								"averageConversationTimeInMS": {
									"$avg": {
										"$subtract": [
											"$lastUpdatedAt", "$date"
										]
									}
								},
								"conversationWithoutInteractions": {
									"$sum": {
										"$cond":  [
											{ "$gt": [ "$lastUpdatedAt", null ] },
											0,
											1
										]
									}
								},
								"conversationCount": {
									"$sum": 1
								},
								"interactionCount": {
									"$sum": "$interactionCount"
								},
								"failedInteractionCount": {
									"$sum": "$failedInteractionCount"
								},
								"feedbackRequestCount": {
									"$sum": "$feedbackRequestCount"
								}
							}
						}]
					).then(result => resolve(result)
					).catch(err => reject(err));
				});
			},

			async initQueueListener() {
				this.queueController = await queue.listenQueueTopic(
					CONVERSATION_ANALYTICS_ENGAGE_TOPIC,
					this.handleConversationEngagement.bind(this)
				);
				await queue.listenQueueTopic(
					CONVERSATION_ANALYTICS_INCREMENT_TOPIC,
					this.handleConversationIncrement.bind(this)
				)
			}
		}
	};

}());