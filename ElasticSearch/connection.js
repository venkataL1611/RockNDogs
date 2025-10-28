const { Client } = require('@elastic/elasticsearch');

const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const client = new Client({ node: esUrl });

client.ping({}, (error) => {
  if (error) {
    console.error('Elasticsearch cluster is down!');
  } else {
    console.log('Elasticsearch is connected');
  }
});

module.exports = client;
