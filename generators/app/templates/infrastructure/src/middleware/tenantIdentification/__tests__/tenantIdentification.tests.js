jest.mock('jsonwebtoken')
jest.mock('@totalsoft/tenant-configuration')

const OLD_ENV = process.env
describe('tenant identification tests:', () => {
  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    process.env = { ...process.env, IS_MULTITENANT: 'true' }
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  it('should identify tenant from jwt token:', async () => {
    //arrange
    const tenantId = 'some-tenant-id'
    const tenantIdentification = require('../index')
    const { tenantService } = require('@totalsoft/tenant-configuration')
    const { tenantContextAccessor } = require("../../../multiTenancy");
    const jsonwebtoken = require('jsonwebtoken')
    jsonwebtoken.decode = () => ({ tid: tenantId })
    tenantService.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }))

    const ctx = {
      request: {
        path: '/graphql',
      },
      method: 'POST',
      token: 'jwt',
    }

    let resolvedTenantContext;
    const next = async () => {
      resolvedTenantContext = tenantContextAccessor.getTenantContext();
    };

    //act
    await tenantIdentification()(ctx, next)

    //assert
    expect(resolvedTenantContext?.tenant?.id).toBe(tenantId);
  })
})
