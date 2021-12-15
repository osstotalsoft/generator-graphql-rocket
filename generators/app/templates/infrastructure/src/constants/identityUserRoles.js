module.exports = {
    admin: "tenant_admin",
    user: "tenant_user"<% if(dataLayer == "knex" && withMultiTenancy){ %>,
    globalAdmin: "global_admin"
    <%}%>
}