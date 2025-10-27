#!/bin/bash

echo "========================================="
echo "Elasticsearch Testing for RockNDogs"
echo "========================================="
echo ""

# Test 1: Check Elasticsearch is running
echo "1. Checking Elasticsearch connection..."
ES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200/)
if [ "$ES_STATUS" = "200" ]; then
    echo "   ✓ Elasticsearch is running on port 9200"
else
    echo "   ✗ Elasticsearch is not responding"
    exit 1
fi
echo ""

# Test 2: List indices
echo "2. Elasticsearch Indices:"
curl -s -X GET "localhost:9200/_cat/indices?v" | grep -E "index|dogfoods|canines|supplies"
echo ""

# Test 3: Count documents in dogfoods index
echo "3. Document counts:"
DOGFOOD_COUNT=$(curl -s -X GET "localhost:9200/dogfoods/_count" | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "   Dogfoods: $DOGFOOD_COUNT documents"
CANINES_COUNT=$(curl -s -X GET "localhost:9200/canines/_count" | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "   Canines: $CANINES_COUNT documents"
echo ""

# Test 4: Search functionality through the app
echo "4. Testing search through application API:"
echo ""
echo "   Test A: Search for 'pedigree'"
SEARCH_RESULT=$(curl -s "http://localhost:3000/shop/search-result?q=pedigree")
if echo "$SEARCH_RESULT" | grep -q "Pedigree"; then
    echo "   ✓ Found 'Pedigree' in results"
else
    echo "   ✗ Did not find 'Pedigree'"
fi
echo ""

echo "   Test B: Search for 'victor'"
SEARCH_RESULT=$(curl -s "http://localhost:3000/shop/search-result?q=victor")
if echo "$SEARCH_RESULT" | grep -q -i "victor"; then
    echo "   ✓ Found 'Victor' in results"
else
    echo "   ✗ Did not find 'Victor'"
fi
echo ""

echo "   Test C: Fuzzy search for 'pedegre' (typo)"
SEARCH_RESULT=$(curl -s "http://localhost:3000/shop/search-result?q=pedegre")
if echo "$SEARCH_RESULT" | grep -q "Pedigree"; then
    echo "   ✓ Fuzzy search working! Found 'Pedigree' for typo 'pedegre'"
else
    echo "   ⚠ Fuzzy search may need adjustment"
fi
echo ""

# Test 5: Direct Elasticsearch query
echo "5. Direct Elasticsearch query test:"
DIRECT_SEARCH=$(curl -s -X GET "localhost:9200/dogfoods/_search?q=title:pedigree" | grep -o '"title":"[^"]*"' | head -3)
if [ ! -z "$DIRECT_SEARCH" ]; then
    echo "   ✓ Direct Elasticsearch query working"
    echo "   Sample results: $DIRECT_SEARCH"
else
    echo "   ⚠ No direct results found"
fi
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo ""
echo "To test manually:"
echo "1. Open: http://localhost:3000"
echo "2. Use the search bar to search for:"
echo "   - pedigree"
echo "   - victor"
echo "   - milky bone"
echo "   - wilderness"
echo ""
echo "Check terminal logs for:"
echo "   - 'No hits in Redis!' = Elasticsearch query"
echo "   - 'Data Pulled from Redis!' = Cached result"
