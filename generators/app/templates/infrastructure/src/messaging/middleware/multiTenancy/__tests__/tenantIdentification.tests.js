const { envelope } = require('@totalsoft/message-bus')
const { messagingHost } = require('@totalsoft/messaging-host')

jest.mock('../../../../multiTenancy')
describe('tenant identification tests:', () => {
  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
  })

  it('should identify tenant from nbb tenantId header:', async () => {
    //arrange
    const tenantId = 'some-tenant-id'
    const tenantIdentification = require('../tenantIdentification')
    const { tenantFactory } = require('../../../../multiTenancy')
    tenantFactory.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }))
    const msg = envelope({}, { tenantId })
    const ctx = messagingHost()._contextFactory('topic1', msg)
    const next = jest.fn().mockResolvedValue(undefined)

    //act
    await tenantIdentification()(ctx, next)

    //assert
    expect(ctx.tenantId).toBe(tenantId)
  })

  it('should identify tenant from tid header:', async () => {
    //arrange
    const tenantId = 'some-tenant-id'
    const { tenantFactory } = require('../../../../multiTenancy')
    const tenantIdentification = require('../tenantIdentification')
    tenantFactory.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }))
    const msg = envelope({}, {}, _ => ({ tid: tenantId }))
    const ctx = messagingHost()._contextFactory('topic1', msg)
    const next = jest.fn().mockResolvedValue(undefined)

    //act
    await tenantIdentification()(ctx, next)

    //assert
    expect(ctx.tenantId).toBe(tenantId)
  })
})
