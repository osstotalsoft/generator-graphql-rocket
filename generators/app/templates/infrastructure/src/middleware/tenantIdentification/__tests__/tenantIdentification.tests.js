const tenantIdentification = require('../index')
const jsonwebtoken = require('jsonwebtoken')
const { tenantService } = require('../../../multiTenancy')

jest.mock('jsonwebtoken')
jest.mock('../../../multiTenancy')

describe('tenant identification tests:', () => {
  it('should identify tenant from jwt token:', async () => {
    //arrange
    const tenantId = 'some-tenant-id'
    jsonwebtoken.decode = () => ({ tid: tenantId })
    tenantService.getTenantFromId.mockImplementation((tid) => Promise.resolve({ id: tid }))

    const ctx = {
      request: {
        path: '/graphql',
      },
      method: 'POST',
      token: 'jwt',
    }
    const next = jest.fn().mockResolvedValue(undefined)

    //act
    await tenantIdentification()(ctx, next)

    //assert
    expect(ctx.tenant.id).toBe(tenantId)
  })
})
