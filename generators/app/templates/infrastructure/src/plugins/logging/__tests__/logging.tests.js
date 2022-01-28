
const { tests } = require("../loggingUtils")
const { shouldSkipLogging, loggingLevels, logEvent, logDbError } = tests
const { ApolloError } = require('apollo-server-koa')

describe("logging plugin tests:", () => {
    it("should skip logging for introspection: ", async () => {
        const res = shouldSkipLogging("IntrospectionQuery", "LOGGING_LEVEL")

        expect(res).toBe(false)
    })

    it("should not skip logging for info logging level: ", async () => {
        //Arrange
        process.env = { APOLLO_LOGGING_LEVEL: "INFO" }

        //Act
        const res = shouldSkipLogging("OperationName", loggingLevels.INFO)

        ///Assert
        expect(res).toBe(false)
    })

    it("should not skip logging for info when logging level is set to DEBUG: ", async () => {
        //Arrange
        process.env = { APOLLO_LOGGING_LEVEL: "DEBUG" }

        //Act
        const res = shouldSkipLogging("OperationName", loggingLevels.INFO)

        ///Assert
        expect(res).toBe(false)
    })

    it("should not skip logging for debug logging level: ", async () => {
        //Arrange
        process.env = { APOLLO_LOGGING_LEVEL: "DEBUG" }

        //Act
        const res = shouldSkipLogging("OperationName", loggingLevels.DEBUG)

        ///Assert
        expect(res).toBe(false)
    })

    it("should not skip logging for ERROR logging level: ", async () => {
        //Arrange
        process.env = { APOLLO_LOGGING_LEVEL: "ERROR" }

        //Act
        const res = shouldSkipLogging("OperationName", loggingLevels.ERROR)

        ///Assert
        expect(res).toBe(false)
    })

    it("should not skip logging for ERROR when logging level is set to DEBUG: ", async () => {
        //Arrange
        process.env = { APOLLO_LOGGING_LEVEL: "DEBUG" }

        //Act
        const res = shouldSkipLogging("OperationName", loggingLevels.ERROR)

        ///Assert
        expect(res).toBe(false)
    })

    it("logEvent should append the new log to the context: ", async () => {
        //arrange
        const context = { logs: [] }
        const message = "Log message"
        const code = "Message_Code"

        jest.mock("../loggingUtils");
        // const { saveLogs } = require("../loggingUtils")

        //act
        logEvent(context, message, code, loggingLevels.INFO)
        logEvent(context, message, code, loggingLevels.DEBUG)

        //assert
        expect(context.logs[0].message).toBe(message)
        expect(context.logs[0].code).toBe(code)
        expect(context.logs[0].loggingLevel).toBe(loggingLevels.INFO)
        expect(context.logs[1].message).toBe(message)
        expect(context.logs[1].code).toBe(code)
        expect(context.logs[1].loggingLevel).toBe(loggingLevels.DEBUG)
    })

    it("logDbError should clear logs from context, call insert logs and return new ApolloError: ", async () => {
        //arrange
        const message = "Error log message"
        const code = "Error_Message_Code"
        const errorMessage = "ErrorMessage"

        const loggingUtils = require("../loggingUtils")
        jest.mock("../loggingUtils");
        loggingUtils.saveLogs.mockResolvedValue(null);
        global.console = { log: jest.fn(), error: jest.fn() }

        <%_ if(dataLayer == "knex") {_%>
        const context = { logs: [], dbInstance: jest.fn(() => ({ insert: jest.fn(() => []) })) }
        <%_ } else if(dataLayer == "prisma") {_%>
        const context = { logs: [] }
        jest.mock('../../../utils/prisma', () => ({
            eventLog: {
            createMany: jest.fn().mockReturnValue([])
            }
        }))
        <%_}_%>

        //act
        const res = await logDbError(context, message, code, loggingLevels.ERROR, new Error(errorMessage))

        //assert
        expect(context.logs).toBe(null)
        <%_ if(dataLayer == "knex") {_%>
        expect(context.dbInstance.mock.calls.length).toBe(1);
        <%_}_%>
        expect(console.error).toBeCalled()
        expect(res).toBeInstanceOf(ApolloError)

    })
})