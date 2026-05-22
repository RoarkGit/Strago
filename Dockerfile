FROM node:alpine

WORKDIR /usr

RUN apk add --no-cache git

COPY package.json ./
COPY tsconfig.json ./
COPY .git .git
COPY .gitmodules .gitmodules

COPY src ./src
RUN git submodule update --init --recursive
COPY src/data/Blue-Mage-Data ./data/Blue-Mage-Data
RUN npm install
RUN npm run build

FROM node:alpine

WORKDIR /usr
COPY package.json ./
RUN npm install --omit=dev
COPY --from=0 /usr/dist /usr/dist
RUN npm install pm2 -g

CMD ["pm2-runtime", "dist", "index.js"]