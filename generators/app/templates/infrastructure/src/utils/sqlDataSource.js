class SQLDataSource {
  constructor(context) {
    this.context = context;

    if (context.dbInstance) {
      this.knex = context.dbInstance;
      return
    }
    //skip token validation for playground and introspection query
    if (context.method === "GET" || context.request.body.operationName === "IntrospectionQuery") {
      return
    }
    throw new TypeError("Knex instance is null")
  }
}

module.exports = { SQLDataSource };