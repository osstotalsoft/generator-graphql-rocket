const { Mutex } = require('async-mutex');
const { ApolloError } = require('apollo-server-koa');

const mutex = new Mutex();
let tenantAgnosticTables = null;
let dbIntrospectionPerformed = false;

const introspectDb = async knex => {
    if (dbIntrospectionPerformed) {
        return
    }

    const release = await mutex.acquire();
    try {
        if (dbIntrospectionPerformed) {
            return
        }
        await loadTenantAgnosticTables(knex);
        dbIntrospectionPerformed = true;
    }
    finally {
        release();
    }
}

const loadTenantAgnosticTables = async knex => {
    const data = await knex
        .select("t.name")
        .from("sys.tables as t")
        .whereNotExists(function () {
            this
                .select('*')
                .from('sys.columns as c')
                .whereRaw('c.object_id = t.object_id')
                .andWhere(`c.name`, "=", 'TenantId')
        })

    tenantAgnosticTables = new Set(data.map(x => x.name));
}

const isTenantSpecificTable = table => {
    if(!dbIntrospectionPerformed){
        throw new ApolloError("Db introspection not performed!", "DbIntrospectionError"); // temporal coupling
    }
    return !tenantAgnosticTables.has(table);
}

module.exports = { introspectDb, isTenantSpecificTable }