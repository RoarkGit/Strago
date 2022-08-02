FROM node:alpine

WORKDIR /usr

COPY package.json ./
COPY tsconfig.json ./

COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build

FROM node:alpine

WORKDIR /usr
COPY package.json ./
RUN npm install --omit=dev
COPY --from=0 /usr/prod /usr/prod
RUN npm install pm2 -g

CMD ["pm2-runtime", "prod", "index.js"]