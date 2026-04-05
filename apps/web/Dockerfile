FROM node:24-alpine

WORKDIR /app

COPY apps/web ./

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
