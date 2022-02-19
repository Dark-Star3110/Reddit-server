FROM node:16.14.0

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production

USER node

CMD [ "node","dist/index.js" ]

