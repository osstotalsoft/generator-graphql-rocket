const tracing = require("../../tracing");
const opentracing = require("opentracing");
const { envelope } = require("@totalsoft/message-bus");
const { messagingHost } = require("@totalsoft/messaging-host");

describe("Tracing tests", () => {
    beforeEach(() => {
        jest.resetModules()
    });

    it("should create span from received msg: ", async () => {
        //arrange
        const someCorrelationId = "some-correlation-id"
        <%_ if(withMultiTenancy){ _%>
        const someTenantId = "some-tenant-id";
        const msg = envelope({}, { tenantId: someTenantId, correlationId: someCorrelationId })
        const ctx = messagingHost()._contextFactory("topic1", msg)
        ctx.correlationId = someCorrelationId;
        ctx.tenant = {
          id: someTenantId
        }
        <%_} else { _%>
        const msg = envelope({}, { correlationId: someCorrelationId })
        const ctx = messagingHost()._contextFactory("topic1", msg)
        ctx.correlationId = someCorrelationId;
        <%_}_%>
        const next = jest.fn().mockResolvedValue(undefined);

        //act
        await tracing()(ctx, next);

        //assert
        const tracer = opentracing.globalTracer();
        expect(tracer.startSpan.mock.calls).toEqual([["messagingHost topic1", {}]])
        const span = tracer.startSpan.mock.results[0].value
        expect(span.log.mock.calls).toEqual([[{ event: "message", message: ctx.received.msg }]]);
        expect(span.setTag.mock.calls).toEqual([
            [envelope.headers.correlationId, someCorrelationId]<% if(withMultiTenancy){ %>,
            [envelope.headers.tenantId, someTenantId]
            <%_}_%>
        ]);
    })
})
