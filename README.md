# RockNDogs
An end to end E commerce application
RockNDogs is a Petstore application that stores information about various brands of Petfood. This application was built to get a basic understanding of how NoSQL Database work, how products can be searched using Powerful ElasticSearch, how to cache data that a web server needs and Content Delivery Network for improved performance.
Most of the code is based on Express Documentation , This website is Built by following a Youtube Tutorial  by MaxMillian  Shopping cart using Nodejs.
Link to tutorial : https://www.youtube.com/watch?v=-3vvxn78MH4
References:
https://expressjs.com/
https://www.npmjs.com/
https://docs.mongodb.com/manual/
https://www.compose.com/articles/mongoosastic-the-power-of-mongodb-and-elasticsearch-together/
https://css-tricks.com/adding-a-cdn-to-your-website/

## Requirements & component versions

Minimum required components and the versions used when this project was developed and tested:

- Node.js: 14.x or later (recommended 16.x)
- npm: 6.x or later (bundled with Node)
- MongoDB: 6.0 (see `docker-compose.yml` uses `mongo:6.0`)
- Elasticsearch: 7.17.14 (see `docker-compose.yml`)
- Redis: 7 (docker image `redis:7-alpine` used)

Main backend Node packages (from `package.json`):

- express: ^4.16.3
- mongoose: ^5.3.1
- mongoosastic: ^5.0.0
- @elastic/elasticsearch: ^7.17.14
- passport, passport-local: ^0.4.0, ^1.0.0
- express-session: ^1.15.6
- redis: ^2.8.0

Dev/test:

- mocha: ^5.2.0

Notes:

- Elasticsearch 7.x clients are used in this codebase; if you upgrade to Elasticsearch 8.x you'll need to update the client usage and security settings.
- The project uses Docker Compose to run MongoDB, Elasticsearch and Redis (see `docker-compose.yml`). Using Docker is the recommended way to ensure compatibility.

Quick start (using Docker Compose):

```bash
# start dependencies
docker compose up -d

# install node dependencies (if you run the app locally)
npm install

# run the app
npm start
```

If you prefer not to use Docker, install MongoDB, Elasticsearch and Redis locally matching the versions above. Ensure ES is accessible on port 9200 and MongoDB on 27017.
