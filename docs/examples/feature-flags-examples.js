/**
 * Example: Using Feature Flags in RockNDogs
 *
 * This file demonstrates various ways to use Flagsmith feature flags
 * in your application code.
 *
 * Note: This is an example file with intentional ESLint rule violations
 * for demonstration purposes (global-require, import/no-unresolved).
 */

/* eslint-disable global-require, import/no-unresolved, import/extensions */

const express = require('express');

const router = express.Router();

// ==============================================================================
// EXAMPLE 1: Simple Boolean Flag
// ==============================================================================

router.get('/example/simple', async (req, res) => {
  // Check if a feature is enabled
  const betaFeature = await req.flags.isEnabled('beta_feature');

  if (betaFeature) {
    res.send('Beta feature is enabled!');
  } else {
    res.send('Beta feature is disabled');
  }
});

// ==============================================================================
// EXAMPLE 2: Configuration Value (String/Number)
// ==============================================================================

router.get('/example/config', async (req, res) => {
  // Get configuration values with defaults
  const welcomeText = await req.flags.getValue('welcome_text', 'Welcome!');
  const maxResults = await req.flags.getValue('max_search_results', 10);
  const theme = await req.flags.getValue('site_theme', 'light');

  res.json({
    welcomeText,
    maxResults,
    theme
  });
});

// ==============================================================================
// EXAMPLE 3: A/B Testing
// ==============================================================================

router.get('/example/ab-test', async (req, res) => {
  // Get the variant (A, B, C, etc.)
  const variant = await req.flags.getValue('checkout_variant', 'A');

  switch (variant) {
    case 'B':
      // Variant B: New checkout flow
      res.render('checkout-v2', { variant });
      break;
    case 'C':
      // Variant C: Express checkout
      res.render('checkout-express', { variant });
      break;
    default:
      // Variant A: Original checkout
      res.render('checkout-v1', { variant });
  }
});

// ==============================================================================
// EXAMPLE 4: User-Specific Flags (Personalization)
// ==============================================================================

router.get('/example/personalized', async (req, res) => {
  // When user is authenticated, flags automatically use their user ID
  // You can also segment users in Flagsmith dashboard based on traits

  const premiumFeatures = await req.flags.isEnabled('premium_features');
  const userTier = await req.flags.getValue('user_tier', 'free');

  res.json({
    isPremium: premiumFeatures,
    tier: userTier,
    userId: req.user ? req.user._id : 'guest'
  });
});

// ==============================================================================
// EXAMPLE 5: Feature Rollout with Percentage
// ==============================================================================

router.get('/example/gradual-rollout', async (req, res) => {
  // In Flagsmith, set up percentage-based rollout
  // e.g., enable 'new_feature' for 25% of users

  const newFeature = await req.flags.isEnabled('new_feature');

  if (newFeature) {
    res.send('You\'re in the rollout group!');
  } else {
    res.send('Not yet rolled out to you');
  }
});

// ==============================================================================
// EXAMPLE 6: Circuit Breaker Pattern
// ==============================================================================

router.get('/example/circuit-breaker', async (req, res) => {
  const elasticsearchEnabled = await req.flags.isEnabled('elasticsearch_enabled');

  let results = [];

  if (elasticsearchEnabled) {
    try {
      // Try Elasticsearch search
      const client = require('../ElasticSearch/connection');
      const response = await client.search({
        index: 'dogfoods',
        body: { query: { match_all: {} } }
      });
      results = response.body.hits.hits;
    } catch (err) {
      req.log.error({ err }, 'ES search failed');
      // Fallback to database
      const DogFood = require('../models/dogfood');
      results = await DogFood.find().lean();
    }
  } else {
    // ES is disabled via feature flag - use database directly
    const DogFood = require('../models/dogfood');
    results = await DogFood.find().lean();
  }

  res.json({ results, source: elasticsearchEnabled ? 'elasticsearch' : 'mongodb' });
});

// ==============================================================================
// EXAMPLE 7: JSON Configuration
// ==============================================================================

router.get('/example/json-config', async (req, res) => {
  // Store complex configuration as JSON in Flagsmith
  const paymentConfig = await req.flags.getValue('payment_config', {
    providers: ['stripe'],
    currencies: ['USD'],
    minAmount: 1
  });

  res.json({ paymentConfig });
});

// ==============================================================================
// EXAMPLE 8: Multiple Flags
// ==============================================================================

router.get('/example/dashboard', async (req, res) => {
  // Check multiple flags at once
  const [
    showAnalytics,
    showNotifications,
    showChat,
    maxWidgets
  ] = await Promise.all([
    req.flags.isEnabled('dashboard_analytics'),
    req.flags.isEnabled('dashboard_notifications'),
    req.flags.isEnabled('dashboard_chat'),
    req.flags.getValue('dashboard_max_widgets', 6)
  ]);

  res.render('dashboard', {
    features: {
      analytics: showAnalytics,
      notifications: showNotifications,
      chat: showChat
    },
    maxWidgets
  });
});

// ==============================================================================
// EXAMPLE 9: Feature Flag in Middleware
// ==============================================================================

const featureFlagMiddleware = async (flagName) => async (req, res, next) => {
  const enabled = await req.flags.isEnabled(flagName);

  if (!enabled) {
    return res.status(403).render('error', {
      message: 'This feature is not available yet',
      error: { status: 403 }
    });
  }

  next();
};

// Use the middleware
router.get(
  '/example/protected-feature',
  featureFlagMiddleware('beta_access'),
  (req, res) => {
    res.send('You have access to the beta feature!');
  }
);

// ==============================================================================
// EXAMPLE 10: Logging Flag State
// ==============================================================================

router.get('/example/with-logging', async (req, res) => {
  const flag = 'experimental_feature';
  const enabled = await req.flags.isEnabled(flag);

  req.log.info({
    flag,
    enabled,
    userId: req.user ? req.user._id : 'guest'
  }, 'Feature flag checked');

  res.json({ [flag]: enabled });
});

module.exports = router;
