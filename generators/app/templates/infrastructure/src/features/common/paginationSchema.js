const { gql } = require("apollo-server-koa");

const paginationTypes = gql`
  input PagerInput {
    afterId: Int!
    sortBy: String
    direction: Int
    pageSize: Int
  }

  type Page {
    afterId: Int
    sortBy: String
    direction: Int
    pageSize: Int
  }

  type Pagination {
    currentIndex: Int
    totalCount: Int
    prevPage: Page
    nextPage: Page
  }
`;

module.exports = paginationTypes;
