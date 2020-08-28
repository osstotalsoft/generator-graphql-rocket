const { isTenantSpecificTable, introspectDb } = require("./dbIntrospectionService");

const addTenantFilters = async (dbInstance, dbConfig, tenantId) => {
  await introspectDb(dbInstance);

  const initialRunner = dbInstance.client.runner.bind(dbInstance.client)
  dbInstance.client.runner = builder => {
    switch (builder._method) {
      case "insert":
        setTenantIdFor(builder._single.table, builder._single.insert, tenantId);
        break;
      case "select":
        builder._statements.forEach(st => {
          if (st.joinType !== undefined) {
            addTenantFilterFor(builder, st.table, tenantId);
          }
        });
        addTenantFilterFor(builder, builder._single.table, tenantId);
        break;
      default:
        addTenantFilterFor(builder, builder._single.table, tenantId);
    }
    return initialRunner(builder);
  };
};

const getTableName = table => {
  const tableNameComponents = table.split(/ as /i);
  const tableName = tableNameComponents[1] ? tableNameComponents[1] : tableNameComponents[0];
  return tableName.trim().replace('[', '').replace(']', '');
};

const addTenantFilterFor = (builder, table, tenantId) => {
  const tableName = getTableName(table)
  if (isTenantSpecificTable(tableName)) {
    builder.andWhere(`[${tableName}].[TenantId]`, "=", tenantId);
  }
}

const setTenantIdFor = (table, objOrArray, tenantId) => {
  const tableName = getTableName(table)
  if (isTenantSpecificTable(tableName)) {
    if (Array.isArray(objOrArray)) {
      objOrArray.forEach(obj => {
        obj.TenantId = tenantId;
      });
    } else {
      objOrArray.TenantId = tenantId;
    }
  }

}

module.exports = { addTenantFilters };
