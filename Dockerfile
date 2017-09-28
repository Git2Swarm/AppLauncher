FROM node

WORKDIR /src/
RUN npm install express node-rest-client lodash
ADD src /src/

ENTRYPOINT ["node", "jenkinsdemo.js"]
