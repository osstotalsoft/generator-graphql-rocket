const {
    isAuthenticated,
    isAdmin,
    canViewDashboard
  } = require('../rules')
  const { isRuleFunction } = require('graphql-shield/esm/utils')
  
  describe('Test permission rules to be valid rule functions', () => {
    test('isAuthenticated is valid rule function', () => {
      expect(isRuleFunction(isAuthenticated)).toBeTruthy()
    })
  
    test('isAdmin is valid rule function', () => {
      expect(isRuleFunction(isAdmin)).toBeTruthy()
    })
  
    test('canViewDashboard is valid rule function', () => {
      expect(isRuleFunction(canViewDashboard)).toBeTruthy()
    })
  })
  