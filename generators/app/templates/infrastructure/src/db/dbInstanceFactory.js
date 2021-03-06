const Knex = require("knex")
const knexTinyLogger = require("knex-tiny-logger").default
<%_ if(addTracing){ _%>
const useKnexTracer = require("../tracing/knexTracer")
const { JAEGER_DISABLED } = process.env;
<%_}_%>
const { generateKnexConfig } = require('./dbConfigService')
const { initializeTarnLogging } = require("./logging/tarnLogging")
const { Mutex } = require('async-mutex')

const mutex = new Mutex();
const { KNEX_LOGGING, KNEX_DEBUG } = process.env;

const logger = (_format, duration, query) => {
    console.log(`${duration} ${query}`)
}

let cachedDbInstance
const dbInstanceFactory = async () => {
    return await dbInstanceGetOrAdd(() => {
        const {
            DB_HOST: server,
            DB_PORT: port,
            DB_USER: userId,
            DB_PASSWORD: password,
            DB_DATABASE: database
        } = process.env;
        const dbConfig = generateKnexConfig({ server, port, userId, password, database })
        let dbInstance = new Knex(dbConfig)
        
        if (!dbInstance) {
            throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
        }

        if (JSON.parse(KNEX_DEBUG)) {
            initializeTarnLogging(dbInstance.client.pool)
        }

        if (JSON.parse(KNEX_LOGGING)) {
            knexTinyLogger(dbInstance, { logger });
        }
        <%_ if(addTracing){ _%>
        if (!JSON.parse(JAEGER_DISABLED)) {
            useKnexTracer(dbInstance)
        }
        <%_}_%>
        return dbInstance
    })
}

async function dbInstanceGetOrAdd(factory) {
    if (cachedDbInstance) {
        return cachedDbInstance
    }

    const release = await mutex.acquire();
    try {
        if (cachedDbInstance) {
            return cachedDbInstance
        }

        cachedDbInstance = factory()
      
        return cachedDbInstance
    }
    finally {
        release();
    }
}

module.exports = dbInstanceFactory
