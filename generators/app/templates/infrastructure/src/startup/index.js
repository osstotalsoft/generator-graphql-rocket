const getDataLoaders = require("./dataLoaders");
const { getDataSources, initializedDataSources } = require("./dataSources");
const schema = require("./schema");

module.exports = {
  schema,
  getDataSources,
  initializedDataSources,
  getDataLoaders
};
