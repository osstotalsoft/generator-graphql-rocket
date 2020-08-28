const { DataSource } = require("apollo-datasource");

class SQLDataSource extends DataSource {
  constructor() {
    super();
  }

  initialize(config) {
    this.context = config.context
    const ctx = config.context
    if (ctx.dbInstance) {
      this.knex = ctx.dbInstance;
      return
    }
    //skip token validation for playground and introspection query
    if (ctx.method === "GET" || ctx.request.body.operationName === "IntrospectionQuery") {
      return
    }
    throw new TypeError("Knex instance is null")
  }
}

module.exports = { SQLDataSource };