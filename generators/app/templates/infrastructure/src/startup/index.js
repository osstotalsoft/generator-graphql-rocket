<%_ if(dataLayer == "knex") {_%>
const getDataLoaders = require("./dataLoaders");
<%_}_%>
const { getDataSources } = require("./dataSources");
const schema = require("./schema");
const logger = require("./logger");

module.exports = {
  schema,
  getDataSources,
  <%_ if(dataLayer == "knex") {_%>
  getDataLoaders,
  <%_}_%>
  logger
};
