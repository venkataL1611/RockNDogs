var express = require('express');
var router = express.Router();
var client = require('../ElasticSearch/connection');

// JSON search endpoint: supports fuzzy and prefix searching
router.get('/api/search', async function(req, res){
  const q = (req.query.q || '').trim();
  if(!q) return res.json({ results: [] });

  const body = {
    query: {
      bool: {
        should: [
          { match_phrase_prefix: { title: { query: q, boost: 3 } } },
          { fuzzy: { title: { value: q, fuzziness: 'AUTO' } } },
          { match: { description: { query: q, fuzziness: 'AUTO' } } }
        ]
      }
    },
    size: 12
  };

  try {
    const result = await client.search({ index: 'dogfoods', body });
    // normalize result and include id
    const hits = (result.body && result.body.hits && result.body.hits.hits) ? result.body.hits.hits : (result.hits && result.hits.hits ? result.hits.hits : []);
    const data = hits.map(h => {
      const src = Object.assign({}, h._source || {});
      if(!src._id) src._id = h._id;
      return src;
    });
    res.json({ results: data });
  } catch(err) {
    console.error('Search error', err);
    res.status(500).json({ error: 'search_failed' });
  }
});

module.exports = router;
