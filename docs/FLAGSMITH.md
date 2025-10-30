# Flagsmith Feature Flags Integration

This document describes how Flagsmith feature flags are integrated into the RockNDogs application and how to use them.

## Overview

[Flagsmith](https://flagsmith.com/) is an open-source feature flag and remote config service that allows you to:
- Toggle features on/off without deploying code
- Perform A/B testing and gradual rollouts
- Configure application behavior remotely
- Segment users and provide personalized experiences

## Setup

### 1. Create a Flagsmith Account

1. Sign up at [https://flagsmith.com/](https://flagsmith.com/)
2. Create a new project (e.g., "RockNDogs")
3. Create an environment (e.g., "Development", "Production")
4. Copy your **Environment Key** from the environment settings

### 2. Configure Locally

Create or update `.env` file in project root:

```bash
FLAGSMITH_ENV_KEY=your_environment_key_here
FLAGSMITH_API_URL=https://edge.api.flagsmith.com/api/v1/
FLAGSMITH_ENABLED=true
```

### 3. Configure for Kubernetes

Update the Flagsmith environment key in your Kubernetes secret:

```bash
# Edit the secret
kubectl edit secret rockndogs-secrets -n rockndogs

# Or create/update via YAML
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: rockndogs-secrets
  namespace: rockndogs
type: Opaque
stringData:
  SESSION_SECRET: "your-session-secret"
  FLAGSMITH_ENV_KEY: "your_flagsmith_environment_key"
EOF
```

Enable Flagsmith in ConfigMap:

```bash
kubectl edit configmap rockndogs-config -n rockndogs
```

Change `FLAGSMITH_ENABLED: "true"` in the ConfigMap data.

### 4. Install Dependencies

```bash
npm install
```

## Feature Flag Examples

### Current Implemented Flags

The following feature flags are already integrated:

#### 1. `show_promo_banner` (Boolean)
- **Route**: `/home`
- **Description**: Show/hide promotional banner on homepage
- **Default**: `false`
- **Usage**: Controls whether promotional messaging appears

#### 2. `promo_message` (String)
- **Route**: `/home`
- **Description**: Promotional message text
- **Default**: `"Welcome to Rock N Dogs!"`
- **Usage**: Customize homepage promotional text

#### 3. `show_discounts` (Boolean)
- **Route**: `/shop/dogfoods`
- **Description**: Enable discount badges on products
- **Default**: `false`
- **Usage**: Toggle discount feature visibility

#### 4. `discount_percentage` (Number)
- **Route**: `/shop/dogfoods`
- **Description**: Percentage discount to display
- **Default**: `0`
- **Usage**: Set discount amount (e.g., 10, 15, 20)

## Usage in Code

### In Routes/Controllers

Feature flags are available on the `req.flags` object:

```javascript
router.get('/my-route', async function (req, res) {
  // Check if a feature is enabled (boolean flag)
  const newFeatureEnabled = await req.flags.isEnabled('new_feature');
  
  // Get a feature value (string, number, or JSON)
  const welcomeMessage = await req.flags.getValue('welcome_message', 'Default Message');
  const maxItems = await req.flags.getValue('max_items', 10);
  
  // Use flags to conditionally render or execute logic
  if (newFeatureEnabled) {
    // New feature code
  } else {
    // Legacy code
  }
  
  res.render('my-view', {
    newFeatureEnabled,
    welcomeMessage,
    maxItems
  });
});
```

### User-Specific Flags (Identity-Based)

Flags automatically use user ID when available:

```javascript
router.get('/dashboard', isAuthenticated, async function (req, res) {
  // If req.user exists, flags will be fetched for that user's identity
  const premiumFeature = await req.flags.isEnabled('premium_feature');
  
  res.render('dashboard', { premiumFeature });
});
```

### In Middleware or Utilities

For non-route code, import the Flagsmith module directly:

```javascript
const { isFeatureEnabled, getFeatureValue } = require('../lib/flagsmith');

async function myUtility() {
  const enabled = await isFeatureEnabled('my_flag');
  const config = await getFeatureValue('my_config', { default: 'value' });
  
  if (enabled) {
    // Feature logic
  }
}
```

## Creating Feature Flags in Flagsmith

### Boolean Flags

1. Go to your Flagsmith project
2. Click "Create Feature"
3. Enter feature name (e.g., `show_promo_banner`)
4. Set initial value: Enabled or Disabled
5. Save

### String/Number Flags

1. Create feature as above
2. Click on the feature
3. Add a "Feature Value" (string, number, or JSON)
4. Example: `"Welcome to our store!"` or `15`

### User Segments

Target specific users or user groups:

1. Create a segment (e.g., "Premium Users")
2. Add conditions (e.g., user trait `plan == "premium"`)
3. Override flag values for that segment

## Health Check

Monitor Flagsmith connectivity:

```bash
curl http://localhost:3000/api/health
```

Response includes Flagsmith status:

```json
{
  "status": "ok",
  "timestamp": "2025-10-29T10:00:00.000Z",
  "uptime": 1234,
  "mongodb": "connected",
  "elasticsearch": "connected",
  "flagsmith": {
    "enabled": true,
    "status": "healthy",
    "flagCount": 4
  }
}
```

## Common Use Cases

### 1. Feature Rollout

Gradually enable new features:
- Start: `new_checkout_flow` = 0% of users
- Test: `new_checkout_flow` = 10% of users
- Expand: `new_checkout_flow` = 50% of users
- Full: `new_checkout_flow` = 100% of users

### 2. A/B Testing

Test different variants:
```javascript
const variant = await req.flags.getValue('homepage_variant', 'A');

if (variant === 'B') {
  res.render('home-v2', { /* ... */ });
} else {
  res.render('home-v1', { /* ... */ });
}
```

### 3. Circuit Breaker

Disable features during incidents:
- Flag: `elasticsearch_search_enabled`
- When ES is down: Disable via Flagsmith dashboard
- Fall back to simpler search or show cached results

### 4. Configuration Management

Store remote config values:
```javascript
const apiTimeout = await req.flags.getValue('api_timeout_ms', 5000);
const maxUploadSize = await req.flags.getValue('max_upload_mb', 10);
```

## Environment-Specific Flags

Use separate Flagsmith environments for different deployment stages:

- **Development**: Experiment freely
- **Staging**: Test with production-like flags
- **Production**: Stable, reviewed flags

Set `FLAGSMITH_ENV_KEY` to the appropriate environment key in each deployment.

## Disabling Flagsmith

To disable feature flags entirely:

```bash
# Local
export FLAGSMITH_ENABLED=false

# Kubernetes
kubectl patch configmap rockndogs-config -n rockndogs \
  --type merge \
  -p '{"data":{"FLAGSMITH_ENABLED":"false"}}'
```

When disabled, all `req.flags.isEnabled()` calls return `false` and `req.flags.getValue()` returns the default value.

## Best Practices

1. **Naming Convention**: Use `snake_case` for flag names (e.g., `show_promo_banner`)
2. **Default Values**: Always provide sensible defaults
3. **Documentation**: Document each flag's purpose and expected values
4. **Cleanup**: Remove flags and code after full rollout
5. **Testing**: Test both enabled and disabled states
6. **Monitoring**: Track flag usage and performance impact
7. **Versioning**: Use flag names that indicate feature scope (e.g., `checkout_v2_enabled`)

## Troubleshooting

### Flags Not Working

1. Check `FLAGSMITH_ENV_KEY` is set and correct
2. Verify `FLAGSMITH_ENABLED=true`
3. Check network connectivity to Flagsmith API
4. Review logs for Flagsmith errors
5. Test with `/api/health` endpoint

### Performance Issues

- Enable local evaluation for high-traffic apps
- Cache flag values in Redis
- Use server-side flags instead of identity flags when possible

### Flag Changes Not Reflecting

- Default refresh interval is 60 seconds
- Restart app to force refresh
- Check if local evaluation cache needs clearing

## Additional Resources

- [Flagsmith Documentation](https://docs.flagsmith.com/)
- [Flagsmith Node.js SDK](https://github.com/Flagsmith/flagsmith-nodejs-client)
- [Feature Flag Best Practices](https://docs.flagsmith.com/guides-and-examples/best-practices)
