const DataLoader = require("dataloader");

const getUserDataLoaders = dbInstance => {
  return {
    userById: new DataLoader(ids =>
      dbInstance
        .select(
          "Id",
          "ExternalId",
          "UserName",
          "FirstName",
          "LastName")
        .from("User")
        .whereIn("Id", ids)
        .then(rows => ids.map(id => rows.find(x => x.id.toUpperCase() === id.toUpperCase())))
    ),
    userByExternalId: new DataLoader(externalIds =>
      dbInstance.select(
        "Id",
        "ExternalId",
        "UserName",
        "FirstName",
        "LastName")
        .from("User")
        .whereIn("ExternalId", externalIds)
        .then(rows => externalIds.map(externalId => rows.find(row => row.externalId.toUpperCase() === externalId.toUpperCase())))
    ),
    userRightsByUserId: new DataLoader(userIds =>
      dbInstance.select(
        "Id",
        "UserId",
        "RightId"
      ).from("UserRight")
        .whereIn("UserId", userIds)
        .then(rows => userIds.map(userId => rows.filter(row => row.userId.toUpperCase() === userId.toUpperCase())))
    ),
    userRightsById: new DataLoader(ids =>
      dbInstance.select("Id", "Name").from("Right")
        .whereIn("Id", ids)
        .then(rows => ids.map(id => rows.find(row => row.id.toUpperCase() === id.toUpperCase())))
    ),
  };
};

module.exports = { getUserDataLoaders };
