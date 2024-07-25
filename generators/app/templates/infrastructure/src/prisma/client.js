const { PRISMA_DEBUG<% if(withMultiTenancy){ %>, IS_MULTITENANT<%if(!hasSharedDb){%>, PRISMA_DB_URL_PATTERN <%}%><%}%>} = process.env
const { PrismaClient } = require('@prisma/client')
<%_ if(withMultiTenancy){ _%>
const { tenantContextAccessor <% if(!hasSharedDb) {%>, tenantConfiguration<%}%> } = require('@totalsoft/multitenancy-core')
<%_ if(hasSharedDb){ _%>
  const { tenantFilterExtension } = require('./tenancyExtension')
<%_}else{_%>
const { sanitizeConnectionInfo } = require('../utils/functions')
<%_}_%>
const isMultiTenant = JSON.parse(IS_MULTITENANT)
<%_}_%>
const isDebug = JSON.parse(PRISMA_DEBUG ?? false)

const cacheMap = new Map()
const prismaOptions = {
  log: isDebug ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
}

function prisma() {
  let prismaClient
  <%_ if(withMultiTenancy){ _%>
  if (isMultiTenant) {
    const tenantContext = tenantContextAccessor.getTenantContext()
    const tenantId = tenantContext?.tenant?.id
    if (!tenantId) throw new Error(`Could not identify tenant!`)

    if (cacheMap.has(tenantId)) return cacheMap.get(tenantId)

    <%_ if(hasSharedDb){ _%>
      prismaClient = new PrismaClient(prismaOptions)
      prismaClient = tenantFilterExtension(prismaClient, tenantId)
      cacheMap.set(tenantId, prismaClient)
    <%_} else { _%>
      const connectionInfo = tenantConfiguration.getConnectionInfo(id, '<%= dbConnectionName %>')
      const { server, port, database, userName, password } = sanitizeConnectionInfo(connectionInfo)
      const url = PRISMA_DB_URL_PATTERN.replace('{server}', server)
        .replace('{port}', port)
        .replace('{database}', database)
        .replace('{user}', userName)
        .replace('{password}', password)

      prismaClient = new PrismaClient({ ...prismaOptions, datasources: { db: { url } } })
      cacheMap.set(id, prismaClient)
    <%_}_%>
    } else {
      if (cacheMap.has('default')) return cacheMap.get('default')
      prismaClient = new PrismaClient(prismaOptions)
      cacheMap.set('default', prismaClient)
    }
  <%_} else { _%>
    if (cacheMap.has('default')) return cacheMap.get('default')
    prismaClient = new PrismaClient(prismaOptions)
    cacheMap.set('default', prismaClient)
  <%_}_%>

  return prismaClient
}

module.exports = { prisma }
