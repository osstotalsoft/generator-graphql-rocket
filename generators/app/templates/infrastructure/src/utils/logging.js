const { map } = require('ramda')
<%_ if(dataLayer == "prisma") {_%>
  const { prisma } = require('../prisma')
<%_}_%>

const saveLogs = async (context) => {
  <%_ if(dataLayer == "knex") {_%>
      const { dbInstance, logs } = context
      if (logs?.length && dbInstance) {
          const insertLogs = map(({ uid, requestId, code, message, timeStamp, loggingLevel, error = {} }) => ({
              Uid: uid,
              RequestId: requestId,
              Code: code,
              Message: message,
              Details: error ? `${error.message} ${error.stack} ${JSON.stringify(error.extensions)}` : '',
              TimeStamp: timeStamp,
              LoggingLevel: loggingLevel
          }), logs)
          await dbInstance("EventLog")
              .insert(insertLogs)
      }
  <%_ } else if(dataLayer == "prisma") {_%>
      const { logs } = context
      if (logs?.length) {
        const insertLogs = map(
          ({ uid,requestId, code, message, timeStamp, loggingLevel, error = {} }) => ({
            Uid: uid,
            RequestId: requestId,
            Code: code,
            Message: message,
            Details: error ? `${error.message} ${error.stack} ${JSON.stringify(error.extensions)}` : '',
            TimeStamp: timeStamp,
            LoggingLevel: loggingLevel
          }),
          logs
        )
        await prisma().eventLog.createMany({ data: insertLogs })
      }
  <%_}_%>
  }

module.exports = { saveLogs }
