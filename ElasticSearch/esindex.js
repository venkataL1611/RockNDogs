const client = require('./connection');

client.indices.create({
  index: 'suppliess'
}, function (err, resp, next) {
  if (err) {
    console.log(err);
  } else {
    console.log('create', resp);
  }
});
