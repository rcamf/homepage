FROM node:lts

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]