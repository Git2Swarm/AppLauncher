FROM node

ADD src /src/
WORKDIR /src/
RUN npm install express node-rest-client

ENTRYPOINT ["node", "jenkinsdemo.js"]
