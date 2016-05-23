FROM node

RUN npm install express node-rest-client

ADD src /src/
WORKDIR /src/

ENTRYPOINT ["node", "jenkinsdemo.js"]
