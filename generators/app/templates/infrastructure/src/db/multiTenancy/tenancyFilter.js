const { createFilter, registerFilter, dbSchema } = require('@totalsoft/knex-filters')

async function registerTenancyFilter(columnTenantId, tenantId, knex) {
  const tableHasColumnTenantId = await dbSchema.mssql.buildTableHasColumnPredicate(
    columnTenantId,
    knex,
  )

  const addWhereTenantIdClause = (table, queryBuilder) => {
    queryBuilder.andWhere(
      `[${table}].[${columnTenantId}]`,
      '=',
      tenantId,
    )
  }

  const filter = createFilter(tableHasColumnTenantId, {
    onSelect: addWhereTenantIdClause,
    onUpdate: addWhereTenantIdClause,
    onDelete: addWhereTenantIdClause,
    onInsert: (inserted) => {
      inserted[columnTenantId] = tenantId
    },
  })

  registerFilter(filter, knex)
}

module.exports = {
  registerTenancyFilter,
}
