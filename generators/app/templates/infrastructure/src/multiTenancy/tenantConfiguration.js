<%_if(addQuickStart){ _%>
const { postProcessDbResponse } = require("../utils/functions");
const TenantDataSource = require('./tenantDataSource');

const {
    DB_HOST: TENANT_DB_HOST,
    DB_PORT: TENANT_DB_PORT, 
    DB_USER: TENANT_DB_USER,
    DB_PASSWORD: TENANT_DB_PASSWORD,
    DB_DATABASE: TENANT_DB_DATABASE
} = process.env;

var tenantDbConfig = {
    client: "mssql",
    connection: {
        host: TENANT_DB_HOST,
        port: parseInt(TENANT_DB_PORT) || null,
        user: TENANT_DB_USER,
        password: TENANT_DB_PASSWORD,
        database: TENANT_DB_DATABASE,
        options: {
            encrypt: true
        }
    },
    postProcessResponse: postProcessDbResponse
};

const tenantDb = new TenantDataSource(tenantDbConfig);

module.exports = {
    getTenantFromHost: tenantDb.getTenantFromHost.bind(tenantDb),
    getTenantFromId: tenantDb.getTenantFromId.bind(tenantDb),
    getDataSourceInfo: tenantDb.getDataSourceInfo.bind(tenantDb)
}
<%_} else {_%>
// Implement your tenant configurator data access
module.exports = {
    getTenantFromId: ()=>{},
    getDataSourceInfo: ()=>{}
}
<%_}_%>

