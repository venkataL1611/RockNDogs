# Elasticsearch Testing Guide for RockNDogs

## Prerequisites
- Elasticsearch running on http://localhost:9200
- MongoDB running on localhost:27017
- Application running on http://localhost:3000

## How to Test Elasticsearch

### Method 1: Using the Web Interface (Easiest)

1. **Open the application**: http://localhost:3000

2. **Use the Search Bar**:
   - Look for the search box in the navigation bar
   - Try searching for dog food products:
     - "Pedigree"
     - "Victor"
     - "Milky Bone"
     - "Wilderness"
     - "pup" (fuzzy search will find "Pup Peroni")

3. **Check Search Results**:
   - Results should display matching products
   - First search will fetch from Elasticsearch/MongoDB
   - Subsequent identical searches will use Redis cache

### Method 2: Using cURL Commands

#### 1. Check Elasticsearch Status
```bash
curl -X GET "localhost:9200/"
```

#### 2. List All Indices
```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

#### 3. Search Using the App's API
```bash
# Search for "pedigree"
curl "http://localhost:3000/shop/search-result?q=pedigree"

# Search for "victor"
curl "http://localhost:3000/shop/search-result?q=victor"

# Fuzzy search (will find similar terms)
curl "http://localhost:3000/shop/search-result?q=pedegre"
```

#### 4. Direct Elasticsearch Search
```bash
# Search the canines index
curl -X GET "localhost:9200/canines/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "fuzzy": {
      "title": "pedigree"
    }
  }
}
'
```

### Method 3: Check Data Synchronization

#### 1. Verify MongoDB Data is Synced to Elasticsearch
The mongoosastic plugin automatically syncs data from MongoDB to Elasticsearch.

To manually trigger synchronization, you can create a sync script:

```javascript
// Run: node sync-to-elasticsearch.js
const mongoose = require('mongoose');
const DogFood = require('./models/dogfood');

mongoose.connect('mongodb://localhost:27017/shopping', { useNewUrlParser: true });

DogFood.synchronize()
  .then(() => {
    console.log('Elasticsearch sync completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Sync error:', err);
    process.exit(1);
  });
```

#### 2. Check Elasticsearch Indices
```bash
# View all documents in the canines index
curl -X GET "localhost:9200/canines/_search?pretty&size=100"
```

### Method 4: Monitor Search Behavior

#### Watch the Console Output
When you perform a search through the web interface, check the terminal where your app is running:

- **First Search**: Should log "No hits in Redis! Data from elasticsearch/mongo"
- **Second Search** (same query): Should log "Data Pulled from Redis!"

This confirms:
1. Elasticsearch is working (first search)
2. Redis caching is working (subsequent searches)

### Method 5: Test Fuzzy Search

Fuzzy search allows for typos and approximate matches:

```bash
# These should all return results for "Pedigree"
curl "http://localhost:3000/shop/search-result?q=pedigree"
curl "http://localhost:3000/shop/search-result?q=pedegre"
curl "http://localhost:3000/shop/search-result?q=pedigre"
```

## Troubleshooting

### Elasticsearch Not Connected
If you see "Elasticsearch cluster is down!", start Elasticsearch:
```bash
# Using Homebrew (macOS)
brew services start elasticsearch-full

# Or manually
elasticsearch
```

### No Search Results
1. Check if data is indexed in Elasticsearch:
```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

2. If `canines` index is missing, the mongoosastic plugin needs to sync data.

### Clear Redis Cache
To test fresh Elasticsearch queries (without cache):
```bash
redis-cli FLUSHALL
```

## Expected Behavior

1. **Search Query Flow**:
   - User enters search term → 
   - Check Redis cache → 
   - If not in cache, query Elasticsearch → 
   - Return results and cache in Redis

2. **Index Structure**:
   - Index name: `canines`
   - Type: `canine`
   - Fields indexed: `title` (with fuzzy search enabled)

3. **Performance**:
   - First search: ~20-50ms (Elasticsearch)
   - Cached search: ~1-5ms (Redis)

## Quick Test Script

Save this as `test-search.sh`:
```bash
#!/bin/bash
echo "Testing Elasticsearch Search..."
echo ""
echo "Test 1: Search for 'pedigree'"
curl -s "http://localhost:3000/shop/search-result?q=pedigree" | grep -o "<h3>[^<]*</h3>" | head -3
echo ""
echo "Test 2: Search for 'victor'"
curl -s "http://localhost:3000/shop/search-result?q=victor" | grep -o "<h3>[^<]*</h3>" | head -3
echo ""
echo "Test 3: Fuzzy search 'pedegre' (typo)"
curl -s "http://localhost:3000/shop/search-result?q=pedegre" | grep -o "<h3>[^<]*</h3>" | head -3
echo ""
echo "Done!"
```

Run with: `bash test-search.sh`
