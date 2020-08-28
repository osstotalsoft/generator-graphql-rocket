const { SQLDataSource } = require("../../../utils/sqlDataSource");
const { generateTopClause, getSortByValue, generateSortByPkClause, generatePrevPageWhereClause, generateOrderByClause } = require("../../common/dbGenerators")

class UserDb extends SQLDataSource {
  generateFromAndWhereClause(queryBuilder, { afterId, filters = {}, direction = 0, sortBy = "FirstName", sortByValue }) {
    const { firstName, lastName } = filters;

    queryBuilder.from("User");

    if (firstName) { queryBuilder.whereRaw("UPPER(FirstName) LIKE ?", `%${firstName.toUpperCase()}%`); }
    if (lastName) { queryBuilder.whereRaw("UPPER(LastName) LIKE ?", `%${lastName.toUpperCase()}%`); }

    if (afterId) {
      queryBuilder.modify(generateSortByPkClause, { sortBy, pk: "Id", direction, afterId, sortByValue })
    }
  }

  async getUserListTotalCount(filters = {}) {
    return await this.knex
      .count("Id", { as: "TotalCount" })
      .modify(this.generateFromAndWhereClause, { filters })
      .first();
  }

  async getUserListPreviousPageAfterId(pager, filters, sortByValue) {
    const { pageSize, afterId, sortBy = "FirstName", direction = 0 } = pager;
    const prevPage = await this.knex
      .select("Id")
      .modify(this.generateFromAndWhereClause, { filters })
      .modify(generateOrderByClause, { sortBy, direction: !direction, pk: "Id" })
      .modify(generatePrevPageWhereClause, { afterId, direction, sortBy, sortByValue, pk: "Id" })
      .modify(generateTopClause, pageSize);
    return prevPage[pageSize - 1];
  }

  async getUserList(pager, filters) {
    const { pageSize, sortBy = "FirstName", direction = 0, afterId } = pager;
    const sortByValue = await getSortByValue(this.knex, afterId, sortBy, "User", "Id");
    const values = await this.knex
      .select("Id", "FirstName", "LastName")
      .from("Person")
      .modify(this.generateFromAndWhereClause, { filters, afterId, direction, sortBy, sortByValue })
      .modify(generateOrderByClause, { sortBy, direction, pk: "Id" })
      .modify(generateTopClause, pageSize ? pageSize + 1 : null);
    return { values, sortByValue };
  }
}

module.exports = UserDb;
