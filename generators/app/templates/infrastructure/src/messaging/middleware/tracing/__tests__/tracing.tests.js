const { tracing } = require("../../tracing");
const opentracing = require("opentracing");
const { envelope } = require("@totalsoft/message-bus");
const { messagingHost } = require("@totalsoft/messaging-host");
<%_ if(withMultiTenancy){ _%>
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
<%_}_%>
const { correlationManager } = require("@totalsoft/correlation");

describe("Tracing tests", () => {
    beforeEach(() => {
        jest.resetModules()
    });

    it("should create span from received msg:", async () => {
        //arrange
        const someCorrelationId = "some-correlation-id"
        <%_ if(withMultiTenancy){ _%>
        const someTenantId = "some-tenant-id";
        const msg = envelope({}, { tenantId: someTenantId, correlationId: someCorrelationId })
        const ctx = messagingHost()._contextFactory("topic1", msg)
        ctx.correlationId = someCorrelationId;
        const tenant = {
          id: someTenantId
        }
        <%_} else { _%>
        const msg = envelope({}, { correlationId: someCorrelationId })
        const ctx = messagingHost()._contextFactory("topic1", msg)
        ctx.correlationId = someCorrelationId;
        <%_}_%>
        const next = jest.fn().mockResolvedValue(undefined);

        //act
        correlationManager.useCorrelationId(someCorrelationId, () =>
          tenantContextAccessor.useTenantContext({ tenant }, () => tracing()(ctx, next))
        );

        //assert
        const tracer = opentracing.globalTracer();
        expect(tracer.startSpan.mock.calls).toEqual([["messagingHost topic1", {}]])
        const span = tracer.startSpan.mock.results[0].value
        expect(span.log.mock.calls).toEqual([[{ event: "message", message: ctx.received.msg }]]);
        expect(span.setTag.mock.calls).toEqual([
            ["nbb.correlation_id", someCorrelationId]
            <%_ if(withMultiTenancy){ _%>,
            [envelope.headers.tenantId, someTenantId],
            <%_}_%>
            [opentracing.Tags.SPAN_KIND, "consumer"],
            [opentracing.Tags.COMPONENT, "nodebb-messaging"],
            [opentracing.Tags.MESSAGE_BUS_DESTINATION, "topic1"],
            ["messaging_header.nbb-correlationid", "some-correlation-id"],
            <%_ if(withMultiTenancy){ _%>
            ["messaging_header.nbb-tenantid", "some-tenant-id"],
            <%_}_%>
            ["messaging_header.nbb-source", ""]
        ]);
    })
})
