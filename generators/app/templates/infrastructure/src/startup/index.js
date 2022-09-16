<%_ if(dataLayer == "knex") {_%>
const getDataLoaders = require("./dataLoaders");
<%_}_%>
const { getDataSources, initializedDataSources } = require("./dataSources");
const schema = require("./schema");
const logger = require("./logger");

module.exports = {
  schema,
  getDataSources,
  initializedDataSources,
  <%_ if(dataLayer == "knex") {_%>
  getDataLoaders,
  <%_}_%>
  logger
};
