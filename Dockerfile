FROM library/node:16-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./ /usr/src/app
ENV NODE_ENV production
RUN npm ci && npm cache clean --force
ENV PORT 80
EXPOSE 80
CMD [ "npm", "start" ]
