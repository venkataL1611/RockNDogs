/**
 * Flagsmith Feature Flags Client
 * 
 * Provides centralized feature flag management for the application.
 * Supports both server-side and user-specific feature flags.
 */

const Flagsmith = require('flagsmith-nodejs');
const logger = require('./logger');

// Flagsmith configuration
const FLAGSMITH_ENV_KEY = process.env.FLAGSMITH_ENV_KEY || '';
const FLAGSMITH_API_URL = process.env.FLAGSMITH_API_URL || 'https://edge.api.flagsmith.com/api/v1/';
const FLAGSMITH_ENABLED = process.env.FLAGSMITH_ENABLED !== 'false' && !!FLAGSMITH_ENV_KEY;

let flagsmithClient = null;

/**
 * Initialize Flagsmith client
 */
function initializeFlagsmith() {
  if (!FLAGSMITH_ENABLED) {
    logger.warn('Flagsmith is disabled or FLAGSMITH_ENV_KEY not set');
    return null;
  }

  try {
    flagsmithClient = new Flagsmith({
      environmentKey: FLAGSMITH_ENV_KEY,
      apiUrl: FLAGSMITH_API_URL,
      enableLocalEvaluation: false,
      environmentRefreshIntervalSeconds: 60,
    });

    logger.info({
      apiUrl: FLAGSMITH_API_URL,
      localEvaluation: false,
    }, 'Flagsmith client initialized');

    return flagsmithClient;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Flagsmith client');
    return null;
  }
}

/**
 * Get feature flags for the application (server-side flags)
 * @returns {Promise<Object>} Flags object
 */
async function getFlags() {
  if (!flagsmithClient) {
    return {};
  }

  try {
    const flags = await flagsmithClient.getEnvironmentFlags();
    return flags;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Flagsmith flags');
    return {};
  }
}

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature flag
 * @param {string} [userId] - Optional user ID for user-specific flags
 * @returns {Promise<boolean>} True if enabled, false otherwise
 */
async function isFeatureEnabled(featureName, userId = null) {
  if (!flagsmithClient) {
    // Default behavior when Flagsmith is disabled
    return false;
  }

  try {
    if (userId) {
      const flags = await flagsmithClient.getIdentityFlags(userId);
      return flags.isFeatureEnabled(featureName);
    }
    const flags = await getFlags();
    return flags.isFeatureEnabled(featureName);
  } catch (error) {
    logger.error({ error, featureName, userId }, 'Failed to check feature flag');
    return false;
  }
}

/**
 * Get a feature value (for string/number/json flags)
 * @param {string} featureName - Name of the feature flag
 * @param {*} defaultValue - Default value if flag not found
 * @param {string} [userId] - Optional user ID for user-specific flags
 * @returns {Promise<*>} Feature value or default
 */
async function getFeatureValue(featureName, defaultValue = null, userId = null) {
  if (!flagsmithClient) {
    return defaultValue;
  }

  try {
    if (userId) {
      const flags = await flagsmithClient.getIdentityFlags(userId);
      return flags.getFeatureValue(featureName) || defaultValue;
    }
    const flags = await getFlags();
    return flags.getFeatureValue(featureName) || defaultValue;
  } catch (error) {
    logger.error({ error, featureName, userId }, 'Failed to get feature value');
    return defaultValue;
  }
}

/**
 * Express middleware to attach feature flags to request
 */
function flagsmithMiddleware() {
  return async (req, res, next) => {
    if (!flagsmithClient) {
      req.flags = {
        isEnabled: () => false,
        getValue: (name, defaultValue) => defaultValue,
      };
      return next();
    }

    const userId = req.user ? req.user._id.toString() : null;

    req.flags = {
      isEnabled: async (featureName) => isFeatureEnabled(featureName, userId),
      getValue: async (featureName, defaultValue) => getFeatureValue(featureName, defaultValue, userId),
    };

    next();
  };
}

/**
 * Health check for Flagsmith connectivity
 */
async function healthCheck() {
  if (!FLAGSMITH_ENABLED) {
    return { enabled: false, status: 'disabled' };
  }

  try {
    const flags = await getFlags();
    return {
      enabled: true,
      status: 'healthy',
      flagCount: flags.allFlags ? flags.allFlags().length : 0,
    };
  } catch (error) {
    return {
      enabled: true,
      status: 'unhealthy',
      error: error.message,
    };
  }
}

module.exports = {
  initializeFlagsmith,
  isFeatureEnabled,
  getFeatureValue,
  getFlags,
  flagsmithMiddleware,
  healthCheck,
  get isEnabled() {
    return FLAGSMITH_ENABLED;
  },
};
