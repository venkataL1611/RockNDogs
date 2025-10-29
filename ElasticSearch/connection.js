const { Client } = require('@elastic/elasticsearch');
const { log } = require('../lib/logger');

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const client = new Client({ node: esUrl });

client.ping({}, (error) => {
  if (error) {
    log.error({ err: error, esUrl }, 'Elasticsearch cluster is down');
  } else {
    log.info({ esUrl }, 'Elasticsearch connected');
  }
});

module.exports = client;
