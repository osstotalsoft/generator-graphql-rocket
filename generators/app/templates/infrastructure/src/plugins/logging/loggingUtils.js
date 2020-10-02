const { APOLLO_LOGGING_LEVEL } = process.env
const { ApolloError } = require('apollo-server-koa')
const { v4 } = require('uuid');
const { append, map } = require('ramda')
require('colors')

const loggingLevels = {
    INFO: 'INFO',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
}

const shouldSkipLogging = (operationName, logLevel) => {
    if (operationName === 'IntrospectionQuery')
        return false

    const { INFO, ERROR, DEBUG } = loggingLevels
    switch (logLevel) {
        case INFO: return APOLLO_LOGGING_LEVEL === loggingLevels.INFO || APOLLO_LOGGING_LEVEL === loggingLevels.DEBUG
        case DEBUG: return APOLLO_LOGGING_LEVEL === loggingLevels.DEBUG
        case ERROR: return APOLLO_LOGGING_LEVEL === loggingLevels.ERROR || APOLLO_LOGGING_LEVEL === loggingLevels.DEBUG
    }
}

const initializeDbLogging = (context, operationName) => ({
    logInfo: (message, code, autoSave = false) => shouldSkipLogging(operationName, loggingLevels.INFO) && logEvent(context, message, code, loggingLevels.INFO, autoSave),
    logDebug: (message, code, autoSave = false) => shouldSkipLogging(operationName, loggingLevels.DEBUG) && logEvent(context, message, code, loggingLevels.DEBUG, autoSave),
    logError: (message, code, error) => shouldSkipLogging(operationName, loggingLevels.ERROR) && logDbError(context, message, code, loggingLevels.ERROR, error)
})

const saveLogs = async (context) => {
    const { dbInstance, logs, requestId } = context
    if (logs && dbInstance) {
        const insertLogs = map(({ uid, code, message, timeStamp, loggingLevel, error = {} }) => ({
            Uid: uid,
            RequestId: requestId || v4(),
            Code: code,
            Message: message,
            Details: error ? `${error.message} ${error.stack} ${JSON.stringify(error.extensions)}` : '',
            TimeStamp: timeStamp,
            LoggingLevel: loggingLevel
        }), logs)
        await dbInstance("EventLog")
            .insert(insertLogs)
    }
    context.logs = null
}

const logEvent = async (context, message, code, level, error, autoSave) => {
    const { INFO, DEBUG } = loggingLevels
    const logId = v4()
    context.logs = append({
        uid: logId,
        code,
        message,
        timeStamp: new Date(),
        loggingLevel: level,
        error
    }, context.logs)

    switch (level) {
        case INFO: {
            console.log(`${code} ${message}`.green)
            break
        }
        case DEBUG: {
            console.log(`${code} ${message}`.blue)
            break
        }
    }

    if (autoSave) {
        await saveLogs(context)
    }
}

const logDbError = async (context, message, code, level, error) => {
    console.error(`${code} ${message} ${error.message} ${error.stack} ${JSON.stringify(error.extensions)}`.red)

    const logId = v4()
    const messageWithLogId = `${message} For more details check Log Id: < ${logId} > Request Id: < ${context.requestId} >`

    context.logs = append({
        uid: logId,
        code,
        message,
        timeStamp: new Date(),
        loggingLevel: level,
        error
    }, context.logs)
    await saveLogs(context)

    return new ApolloError(messageWithLogId, code)
}

module.exports = { saveLogs, loggingLevels, initializeDbLogging }
module.exports.tests = {
    shouldSkipLogging,
    loggingLevels,
    logEvent,
    logDbError
}
