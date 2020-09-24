const { gql } = require("apollo-server-koa");

const paginationTypes = gql`
  input PagerInput {
    afterId: ID
    sortBy: String
    direction: Int
    pageSize: Int
  }

  type Page {
    afterId: ID
    sortBy: String
    direction: Int
    pageSize: Int
  }

  type Pagination {
    totalCount: Int
    prevPage: Page
    nextPage: Page
  }
`;

module.exports = paginationTypes;