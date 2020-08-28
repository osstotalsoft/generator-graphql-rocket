const { initializeDbLogging } = require('./loggingUtils')
const { saveLogs } = require('./loggingUtils')
const { v4 } = require('uuid');

module.exports = {
    requestDidStart({ request, context, ..._requestContext }) {
        const { logInfo, logDebug, logError } = initializeDbLogging(context, request.operationName)
        context.requestId = context.requestId || v4()

        logInfo(`Request for operation name <${request.operationName}> started!`, '[REQUEST_STARTED]')
        return {
            parsingDidStart({ request }) {
                logDebug(`The parsing of operation <${request.operationName}> started!`, '[GraphQL_Parsing]')
                return (err) => {
                    if (err) {
                        logError(`[GraphQL_Parsing][Error] ${err}`);
                    }
                }
            },
            validationDidStart({ request }) {
                logDebug(`The validation of operation <${request.operationName}> started!`, '[GraphQL_Validation]')
            },
            executionDidStart({ request }) {
                logDebug(`The execution of operation <${request.operationName}> started!`, '[GraphQL_Execution]')
            },
            didEncounterErrors: async ({ request, errors, ..._requestContext }) => {
                for (const error of errors) {
                    const templateError = await logError(
                        `The server encounters errors while parsing, validating, or executing the operation < ${request.operationName} > \r\n`,
                        '[GraphQL_Execution][Error]',
                        error
                    )
                    error.message = templateError.message
                }
            },
            willSendResponse: async ({ request, context, ..._requestContext }) => {
                logDebug(`A response for the operation <${request.operationName}> was sent!`, '[GraphQL_Response]')
                await saveLogs(context)
            }
        }
    }
}