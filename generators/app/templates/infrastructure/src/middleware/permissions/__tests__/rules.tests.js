const { isAuthenticated, isAdmin, canManageFlows, canApproveCancelFlows, canApproveCancelSigningSessions,
    canManageSigningSessions, canManagePersons, canViewLogs } = require('../rules')
const { isRuleFunction } = require('graphql-shield/dist/utils')

describe("Test permission rules to be valid rule functions", () => {
    test("isAuthenticated is valid rule function", () => {
        expect(isRuleFunction(isAuthenticated)).toBeTruthy()
    });

    test("isAdmin is valid rule function", () => {
        expect(isRuleFunction(isAdmin)).toBeTruthy()
    });

    test("canManageFlows is valid rule function", () => {
        expect(isRuleFunction(canManageFlows)).toBeTruthy()
    });

    test("canApproveCancelFlows is valid rule function", () => {
        expect(isRuleFunction(canApproveCancelFlows)).toBeTruthy()
    });

    test("canApproveCancelSigningSessions is valid rule function", () => {
        expect(isRuleFunction(canApproveCancelSigningSessions)).toBeTruthy()
    });

    test("canManageSigningSessions is valid rule function", () => {
        expect(isRuleFunction(canManageSigningSessions)).toBeTruthy()
    });

    test("canManagePersons is valid rule function", () => {
        expect(isRuleFunction(canManagePersons)).toBeTruthy()
    });

    test("canViewLogs is valid rule function", () => {
        expect(isRuleFunction(canViewLogs)).toBeTruthy()
    });
})

