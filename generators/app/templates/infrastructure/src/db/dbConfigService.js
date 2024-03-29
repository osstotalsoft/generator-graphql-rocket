const { postProcessDbResponse, sanitizeConnectionInfo} = require("../utils/functions")
<%_ if(withMultiTenancy){ _%>
const { tenantConfiguration } = require('@totalsoft/multitenancy-core')
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')
<%_}_%>

const generateKnexConfig = ({
  server,
  instanceName,
  port,
  userName,
  password,
  database,
  trustServerCertificate
}) => ({
  client: 'mssql',
  connection: {
    server,
    port: parseInt(port) || null,
    user: userName,
    password,
    database,
    options: {
      enableArithAbort: true,
      trustServerCertificate: JSON.parse(trustServerCertificate?.trim().toLowerCase() || 'false'),
      encrypt: true,
      instanceName: instanceName || undefined
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
  let connectionInfo
  <%_ if(withMultiTenancy){ _%>

  if (isMultiTenant) {
    connectionInfo = await tenantConfiguration.getConnectionInfo(tenantId, '<%= dbConnectionName %>')

    if (!connectionInfo)
      throw new Error(`Could not find database configuration info for tenant id: ${tenantId}`)
  } else {
  <%_}_%>
    const {
      DB_HOST: server,
      DB_PORT: port,
      DB_USER: userName,
      DB_PASSWORD: password,
      DB_DATABASE: database,
      DB_INSTANCE_NAME: instanceName,
      DB_TRUST_SERVER_CERTIFICATE: trustServerCertificate
    } = process.env

    connectionInfo = { server, port, userName, password, database, instanceName, trustServerCertificate }
  <%_ if(withMultiTenancy){ _%>
  }
  <%_}_%>

  connectionInfo = sanitizeConnectionInfo(connectionInfo)
  const dbConfig = generateKnexConfig(connectionInfo)
  return dbConfig
}

module.exports = { getDbConfig, generateKnexConfig }
