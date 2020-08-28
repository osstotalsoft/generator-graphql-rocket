const tenantIdentification = require("../tenantIdentification")
const { tenantService } = require("../../../../multiTenancy")
const { envelope } = require("@totalsoft/message-bus")
const { messagingHost } = require("@totalsoft/messaging-host")

jest.mock("../../../multiTenancy")

describe("tenant identification tests:", () => {
    it("should identify tenant from nbb tenantId header: ", async () => {
        //arrange
        const tenantId = "some-tenant-id"
        tenantService.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }));
        const msg = envelope({}, { tenantId })
        const ctx = messagingHost()._contextFactory("topic1", msg)
        const next = jest.fn().mockResolvedValue(undefined);

        //act
        await tenantIdentification()(ctx, next)

        //assert
        expect(ctx.tenant.id).toBe(tenantId)
    })

    it("should identify tenant from tid header: ", async () => {
        //arrange
        const tenantId = "some-tenant-id"
        tenantService.getTenantFromId.mockImplementation(tid => Promise.resolve({ id: tid }));
        const msg = envelope({}, {}, _ => ({ tid: tenantId }))
        const ctx = messagingHost()._contextFactory("topic1", msg)
        const next = jest.fn().mockResolvedValue(undefined);

        //act
        await tenantIdentification()(ctx, next)

        //assert
        expect(ctx.tenant.id).toBe(tenantId)
    })
})