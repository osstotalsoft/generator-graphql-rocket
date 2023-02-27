FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

ARG imageUser=appuser
ARG imageUserGroup=appgroup
ARG imageUserId=1375
ARG imageUserGroupId=1375

RUN addgroup --system --gid $imageUserGroupId $imageUserGroup && \
    adduser --system --uid $imageUserId --ingroup $imageUserGroup $imageUser

# Install app dependencies
COPY --chown=$imageUser:$imageUserGroup package.json <%=packageManagerLockFile%> ./

RUN <%=packageManager%> install
# If you are building your code for production
# RUN <%=packageManager%> install --only=production

# Bundle app source
COPY --chown=$imageUser:$imageUserGroup . .

<%_ if(dataLayer === "prisma"){ _%>
RUN apt update && apt install openssl -y
RUN npx prisma generate --schema=./prisma/schema.prisma
<%_}_%>

USER $imageUser

EXPOSE 4000

<%_ if(addVaultConfigs){ _%>
CMD ["/bin/bash", "-c", "test -f /vault/secrets/credentials.vault && echo 'INFO: Vault credentials loaded.' && \
    source /vault/secrets/credentials.vault || echo 'INFO: Vault file not loaded.' && <%=packageManager%> run start:production"]
<%_} else {_%>
CMD [ "<%=packageManager%>", "run", "start:production"]
<%_}_%>
