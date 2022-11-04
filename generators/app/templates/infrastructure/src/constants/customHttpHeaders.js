const customHttpHeaders = {
  <%_ if(withMultiTenancy) {_%>
  TenantId: "TenantId",
  <%_}_%>
  UserId: "user-id",
  UserPassport: "user-passport"
};

module.exports = { ...customHttpHeaders };
