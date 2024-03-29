<%_ if(hasSharedDb){ _%>
const { registerTenancyFilter } = require("./tenancyFilter")
<%_}_%>
const dbConfigService = require("../dbConfigService")
const Knex = require("knex")
const knexTinyLogger = require("knex-tiny-logger").default;
const { initializeTarnLogging } = require("../logging/tarnLogging");
const { Mutex } = require('async-mutex');

const dbInstanceCache = new Map();
const mutex = new Mutex();
const { KNEX_LOGGING, KNEX_DEBUG } = process.env;

const knexLogger = logger => (_format, duration, query) => {
  logger.debug(`${duration} ${query}`)
}

const tenantDbInstanceFactory = async (tenantId, { logger = console } = {}) => {

    return await dbInstanceGetOrAdd(tenantId, async () => {
        const dbConfig = await dbConfigService.getDbConfig(tenantId);

        const dbInstance = Knex(dbConfig)

        if (!dbInstance) {
            throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
        }

        if (JSON.parse(KNEX_DEBUG)) {
            initializeTarnLogging(dbInstance.client.pool, { logger })
        }

        if (JSON.parse(KNEX_LOGGING)) {
            knexTinyLogger(dbInstance, { logger: knexLogger(logger) })
        }

        <%_ if(hasSharedDb){ _%>
        await registerTenancyFilter("TenantId", tenantId, dbInstance)
        <%_}_%>

        return dbInstance
    })
}


async function dbInstanceGetOrAdd(tenantId, factory) {
    const cachedDbInstance = dbInstanceCache.get(tenantId)
    if (cachedDbInstance) {
        return cachedDbInstance
    }

    const release = await mutex.acquire();
    try {
        const cachedDbInstance = dbInstanceCache.get(tenantId)
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
