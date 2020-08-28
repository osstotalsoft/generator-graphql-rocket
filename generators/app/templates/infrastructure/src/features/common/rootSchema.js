const { gql } = require("apollo-server-koa");

const rootTypeDefs = gql`
  scalar DateTime
  scalar Byte
  scalar Char
  scalar Upload
  type Query
  type Mutation
  type Subscription

  schema {
    query: Query
    mutation: Mutation
    <%_ if(addSubscriptions){ _%>
    subscription: Subscription
    <%_}_%>
  }
`;

module.exports = rootTypeDefs;
