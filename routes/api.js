var express = require('express');
var router = express.Router();
var client = require('../ElasticSearch/connection');

// JSON search endpoint: supports fuzzy and prefix searching
router.get('/api/search', async function(req, res){
  const q = (req.query.q || '').trim();
  if(!q) return res.json({ results: [] });

  // Search dogfoods
  const dogfoodBody = {
    query: {
      bool: {
        should: [
          { match_phrase_prefix: { title: { query: q, boost: 3 } } },
          { fuzzy: { title: { value: q, fuzziness: 'AUTO' } } },
          { match: { description: { query: q, fuzziness: 'AUTO' } } }
        ]
      }
    },
    size: 10
  };

  // Search supplies
  const supplyBody = {
    query: {
      bool: {
        should: [
          { match_phrase_prefix: { Title: { query: q, boost: 3 } } },
          { fuzzy: { Title: { value: q, fuzziness: 'AUTO' } } },
          { match: { description: { query: q, fuzziness: 'AUTO' } } }
        ]
      }
    },
    size: 10
  };

  try {
    // Search both indices in parallel
    const [dogfoodResult, supplyResult] = await Promise.all([
      client.search({ index: 'dogfoods', body: dogfoodBody }).catch(() => ({ hits: { hits: [] } })),
      client.search({ index: 'supplies', body: supplyBody }).catch(() => ({ hits: { hits: [] } }))
    ]);

    // Normalize dogfood results
    const dogfoodHits = (dogfoodResult.body && dogfoodResult.body.hits && dogfoodResult.body.hits.hits) 
      ? dogfoodResult.body.hits.hits 
      : (dogfoodResult.hits && dogfoodResult.hits.hits ? dogfoodResult.hits.hits : []);
    
    const dogfoodData = dogfoodHits.map(h => {
      const src = Object.assign({}, h._source || {});
      if(!src._id) src._id = h._id;
      src._type = 'dogfood';
      return src;
    });

    // Normalize supply results
    const supplyHits = (supplyResult.body && supplyResult.body.hits && supplyResult.body.hits.hits) 
      ? supplyResult.body.hits.hits 
      : (supplyResult.hits && supplyResult.hits.hits ? supplyResult.hits.hits : []);
    
    const supplyData = supplyHits.map(h => {
      const src = Object.assign({}, h._source || {});
      if(!src._id) src._id = h._id;
      src._type = 'supply';
      return src;
    });

    // Combine and return results
    const combinedResults = [...dogfoodData, ...supplyData];
    res.json({ results: combinedResults });
  } catch(err) {
    console.error('Search error', err);
    res.status(500).json({ error: 'search_failed' });
  }
});

module.exports = router;
