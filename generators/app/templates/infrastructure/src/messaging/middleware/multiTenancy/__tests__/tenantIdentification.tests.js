const { envelope } = require('@totalsoft/message-bus')
const { messagingHost } = require('@totalsoft/messaging-host')

jest.mock('@totalsoft/multitenancy-core')

const OLD_ENV = process.env
describe('tenant identification tests:', () => {
  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    process.env = { ...process.env, IS_MULTITENANT: 'true' }
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  it('should identify tenant from nbb tenantId header:', async () => {
    //arrange
    const tenantId = "some-tenant-id";
    const tenantIdentification = require("../tenantIdentification");
    const { tenantService, tenantContextAccessor } = require("@totalsoft/multitenancy-core");
    tenantService.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }));
    const msg = envelope({}, { tenantId });
    const ctx = messagingHost()._contextFactory("topic1", msg);

    //act
    await tenantIdentification()(ctx, () => Promise.resolve());

    //assert
    expect(tenantContextAccessor.useTenantContext).toBeCalledWith(
      { tenant: expect.objectContaining({ id: tenantId }) },
      expect.anything()
    );
  })

  it('should identify tenant from tid header:', async () => {
    //arrange
    const tenantId = "some-tenant-id";
    const { tenantService, tenantContextAccessor } = require("@totalsoft/multitenancy-core");
    const tenantIdentification = require("../tenantIdentification");
    tenantService.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }));
    const msg = envelope({}, {}, _ => ({ tid: tenantId }));
    const ctx = messagingHost()._contextFactory("topic1", msg);

    //act
    await tenantIdentification()(ctx, () => Promise.resolve())

    //assert
    expect(tenantContextAccessor.useTenantContext).toBeCalledWith(
      { tenant: expect.objectContaining({ id: tenantId }) },
      expect.anything()
    );
  })
})
