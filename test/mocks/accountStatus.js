"use strict";

const plans = require("../../root/default_account_plans.json");
const faker = require("faker");
let now = new Date();

module.exports = {
	"export": () => {
		// 1 in the past
		// 5 in the future
		let result = [];
		plans.map(plan => {
			let dateKey = plan.accountStatus === "trial" ? "trialEndDate" : "renovationDate";
			return [
				// expired account status, shouldn't return in any test
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.past(),
					"interactionQuota": 10,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": true,
					"subscriptionAboutToEndLastWarningNotified": true,
					"subscriptionEndNotified": true,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},

				// Active account status with low interaction quota
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						new Date(
							new Date().setDate(
								now.getDate() + 3
							)
						),
						new Date(
							new Date().setDate(
								now.getDate() + 10
							)
						)
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.18,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": false,
					"subscriptionAboutToEndLastWarningNotified": false,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						new Date(
							new Date().setDate(
								now.getDate() + 3
							)
						),
						new Date(
							new Date().setDate(
								now.getDate() + 10
							)
						)
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.18,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": false,
					"subscriptionAboutToEndLastWarningNotified": false,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},

				// Active account status with inactivity pattern
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						new Date(
							new Date().setDate(
								now.getDate() + 3
							)
						),
						new Date(
							new Date().setDate(
								now.getDate() + 10
							)
						)
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.92,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": false,
					"subscriptionAboutToEndLastWarningNotified": false,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},

				// Account about to expire first warning
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						now,
						new Date(
							new Date().setDate(
								now.getDate() + 2
							)
						)
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.90,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": false,
					"subscriptionAboutToEndLastWarningNotified": false,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},

				// Account about to expire second warning
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						now,
						new Date(
							new Date().setDate(
								now.getDate() + 1
							)
						)
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.91,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": true,
					"subscriptionAboutToEndLastWarningNotified": false,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				},

				// Account expired
				{
					"clientName": faker.company.companyName(),
					"accountStatus": plan.accountStatus,
					[dateKey]: faker.date.between(
						new Date(
							new Date().setDate(
								now.getDate() - 1
							)
						),
						now
					),
					"interactionQuota": plan.defaultValues.interactionQuota * 0.92,
					"entityCreationQuota": plan.defaultValues.entityCreationQuota,
					"intentCreationQuota": plan.defaultValues.entityCreationQuota,
					"workspaceCreationQuota": plan.defaultValues.entityCreationQuota,
					"subscriptionAboutToEndNotified": true,
					"subscriptionAboutToEndLastWarningNotified": true,
					"subscriptionEndNotified": false,
					"lowInteractionQuotaNotified": false,
					"lowInteractivityNotified": false
				}
			];
		}
		).forEach(x => {
			result.push(
				...(x.map(doc => {
					return {
						"insertOne": {
							...doc
						}
					}
				}))
			)
		});
		return result;
	}
}
