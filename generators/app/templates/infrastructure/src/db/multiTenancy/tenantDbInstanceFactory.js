const { addTenantFilters } = require("./tenantFilters")
const dbConfigService = require("../dbConfigService")
const Knex = require("knex")
const knexTinyLogger = require("knex-tiny-logger").default;
<%_ if(addTracing){ _%>
const useKnexTracer = require("../../tracing/knexTracer");
const { JAEGER_DISABLED } = process.env;
<%_}_%>
const { initializeTarnLogging } = require("../logging/tarnLogging");
const { Mutex } = require('async-mutex');

const dbInstanceCache = new Map();
const mutex = new Mutex();
const { KNEX_LOGGING, KNEX_DEBUG } = process.env;

const logger = (_format, duration, query) => {
    console.log(`${duration} ${query}`)
}

const tenantDbInstanceFactory = async tenantId => {

    return await dbInstanceGetOrAdd(tenantId, async () => {
        const [dbConfig, isSharedDb] = dbConfigService.getDbConfig(tenantId)

        const dbInstance = Knex(dbConfig)

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
        if (isSharedDb) {
            await addTenantFilters(dbInstance, dbConfig, tenantId)
        }

        return dbInstance
    })
}


async function dbInstanceGetOrAdd(tenantId, factory) {
    let cachedDbInstance = dbInstanceCache.get(tenantId)
    if (cachedDbInstance) {
        return cachedDbInstance
    }

    const release = await mutex.acquire();
    try {
        let cachedDbInstance = dbInstanceCache.get(tenantId)
        if (cachedDbInstance) {
            return cachedDbInstance
        }

        const dbInstance = await factory()
        dbInstanceCache.set(tenantId, dbInstance)
        return dbInstance
    }
    finally {
        release();
    }
}

module.exports = tenantDbInstanceFactory