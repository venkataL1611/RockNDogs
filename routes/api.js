const express = require('express');

const router = express.Router();
const client = require('../ElasticSearch/connection');
const Review = require('../models/review');

// Helper to safely extract hits from Elasticsearch responses
function getHits(result) {
  if (!result) return [];
  if (result.body && result.body.hits && Array.isArray(result.body.hits.hits)) {
    return result.body.hits.hits;
  }
  if (result.hits && Array.isArray(result.hits.hits)) {
    return result.hits.hits;
  }
  return [];
}

// JSON search endpoint: supports fuzzy and prefix searching
router.get('/search', async function (req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

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
    const dogfoodHits = getHits(dogfoodResult);

    const dogfoodData = dogfoodHits.map((h) => {
      const src = { ...h._source || {} };
      if (!src._id) src._id = h._id;
      src._type = 'dogfood';
      return src;
    });

    // Normalize supply results
    const supplyHits = getHits(supplyResult);

    const supplyData = supplyHits.map((h) => {
      const src = { ...h._source || {} };
      if (!src._id) src._id = h._id;
      src._type = 'supply';
      return src;
    });

    // Combine and return results
    const combinedResults = [...dogfoodData, ...supplyData];
    req.log.info({ q, count: combinedResults.length }, 'Search results');
    res.json({ results: combinedResults });
  } catch (err) {
    req.log.error({ err, q }, 'Search error');
    res.status(500).json({ error: 'search_failed' });
  }
});

// Get reviews for a product
router.get('/reviews/:type/:id', async function (req, res) {
  const { type, id } = req.params;

  try {
    const reviews = await Review.find({
      productId: id,
      productType: type
    }).sort({ createdAt: -1 }).lean();

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Rating distribution
    const distribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    reviews.forEach((r) => {
      distribution[r.rating] += 1;
    });

    res.json({
      reviews,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      distribution
    });
  } catch (err) {
    req.log.error({ err, type, id }, 'Error fetching reviews');
    res.status(500).json({ error: 'fetch_failed' });
  }
});

// Submit a new review
router.post('/review', async function (req, res) {
  const {
    productId, productType, rating, reviewTitle, reviewText
  } = req.body;

  // Validation
  if (!productId || !productType || !rating || !reviewTitle || !reviewText) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const review = new Review({
      productId,
      productType,
      userName: req.user ? req.user.email : 'Anonymous',
      userEmail: req.user ? req.user.email : null,
      userId: req.user ? req.user._id : null,
      rating: parseInt(rating, 10),
      reviewTitle,
      reviewText,
      verified: !!req.user, // Verified if logged in
      helpful: 0,
      createdAt: new Date()
    });

    await review.save();
    req.log.info({ productId, productType, rating }, 'Review submitted');
    res.json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (err) {
    req.log.error({ err, productId, productType }, 'Error saving review');
    res.status(500).json({ error: 'save_failed' });
  }
});

// Mark review as helpful
router.post('/review/:id/helpful', async function (req, res) {
  const { id } = req.params;

  try {
    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, helpful: review.helpful });
  } catch (err) {
    req.log.error({ err, id }, 'Error updating helpful count');
    res.status(500).json({ error: 'update_failed' });
  }
});

module.exports = router;
