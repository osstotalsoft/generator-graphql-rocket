FROM node:14.15-buster

# Create app directory
WORKDIR /usr/src/app

ARG imageUser=appuser
ARG imageUserGroup=appgroup
ARG imageUserId=1375
ARG imageUserGroupId=1375

RUN addgroup --system --gid $imageUserGroupId $imageUserGroup && \     
    adduser --system --uid $imageUserId --ingroup $imageUserGroup $imageUser

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=$imageUser:$imageUserGroup package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY --chown=$imageUser:$imageUserGroup . .

USER $imageUser

EXPOSE 4000

CMD [ "npm", "start", "--config-env", "production"]
