const { postProcessDbResponse<% if(withMultiTenancy){ %>, parseConnectionString <%}%>} = require("../utils/functions");
<%_ if(withMultiTenancy){ _%>
const { tenantModule } = require("../multiTenancy");
<%_}_%>

const generateKnexConfig = ({ server, port, userId, password, database }) => ({
    client: "mssql",
    connection: {
        host: server,
        port: parseInt(port) || null,
        user: userId,
        password: password,
        database: database,
        options: {
            enableArithAbort: true,
            encrypt: true
        }
    },
    pool: {
        min: 5,
        max: 25,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        createRetryIntervalMillis: 200,
        idleTimeoutMillis: 5000
    },
    useNullAsDefault: true,
    postProcessResponse: postProcessDbResponse
})

const getDbConfig = <% if(withMultiTenancy){ %>async ( tenantId )<%} else { %>()<%}%> => {
    <%_ if(withMultiTenancy){ _%>
    const tenantDsInfo = await tenantModule.getDataSourceInfo(tenantId);

    if (tenantDsInfo) {
        if (!tenantDsInfo.isSharedDb && !tenantDsInfo.connectionString)
            throw new Error(`Could not find database configuration info for tenant id: ${tenantId}`)

        const connection = parseConnectionString(tenantDsInfo.connectionString);
        const dbConfig = generateKnexConfig(connection)
        return [dbConfig, tenantDsInfo.isSharedDb]
    } else {
    <%_}_%>
        const {
            DB_HOST: server,
            DB_PORT: port,
            DB_USER: userId,
            DB_PASSWORD: password,
            DB_DATABASE: database
        } = process.env;

        const dbConfig = generateKnexConfig({ server, port, userId, password, database })
        return [dbConfig, true]
    <%_ if(withMultiTenancy){ _%>
    }
    <%_}_%>
}

module.exports = { getDbConfig, generateKnexConfig }