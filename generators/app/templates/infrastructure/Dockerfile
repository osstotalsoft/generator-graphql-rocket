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
COPY --chown=$imageUser:$imageUserGroup package.json package-lock.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY --chown=$imageUser:$imageUserGroup . .

RUN apt update && apt install openssl -y
RUN npx prisma generate --schema=./prisma/schema.prisma

USER $imageUser

EXPOSE 4000

CMD [ "npm", "run", "start:production"]
