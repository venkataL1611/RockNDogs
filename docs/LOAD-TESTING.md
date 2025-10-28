# 🚀 Load Testing with Autocannon

Autocannon is a simple, fast HTTP/1.1 benchmarking tool that provides clear, easy-to-read performance metrics.

## 📦 What's Included

Autocannon is installed as a dev dependency and pre-configured with npm scripts for common testing scenarios.

---

## 🎯 Quick Start

### 1. Start Your Application

```bash
npm start
```

Wait until you see "Server running on port 3000"

### 2. Run Load Tests (in a new terminal)

**Test Homepage Performance:**
```bash
npm run load:test
```

**Test Search Functionality:**
```bash
npm run load:search
```

**Test Product Pages:**
```bash
npm run load:products
```

---

## 📊 Understanding the Results

When you run a load test, you'll see output like this:

```
Running 30s test @ http://localhost:3000
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max      │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────────┤
│ Latency │ 5 ms │ 8 ms │ 15 ms │ 18ms │ 8.42 ms │ 3.21 ms │ 45.12 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────────┘

┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Req/Sec   │ 950     │ 950     │ 1100    │ 1200    │ 1087.5   │ 85.23   │ 945     │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┴─────────┘

32k requests in 30.05s, 125 MB read
```

### Key Metrics Explained:

**Latency:**
- **50% (Median):** Half of requests complete faster than this
- **97.5%:** 97.5% of requests complete within this time
- **Avg:** Average response time
- **Max:** Slowest request
- ✅ **Lower is better**

**Req/Sec (Throughput):**
- **Avg:** Average requests per second your app handles
- ✅ **Higher is better**

**Total:**
- Total requests completed during the test
- Total data transferred

---

## 🎛️ Custom Tests

You can create your own load tests:

```bash
# Basic test
npx autocannon http://localhost:3000

# Test with custom options
npx autocannon -c 20 -d 60 http://localhost:3000/product/dogfood

# With POST requests (like adding to cart)
npx autocannon -m POST -H "Content-Type: application/json" \
  -b '{"productId":"abc123"}' \
  http://localhost:3000/cart/add
```

### Command Options:

- `-c` or `--connections`: Number of concurrent connections (default: 10)
- `-d` or `--duration`: Test duration in seconds (default: 10)
- `-m` or `--method`: HTTP method (GET, POST, etc.)
- `-H` or `--header`: Add HTTP headers
- `-b` or `--body`: Request body for POST/PUT

---

## 📈 What to Look For

### Good Performance Indicators:

✅ **Low latency:** Median (50%) under 100ms for simple pages  
✅ **Consistent:** Small difference between 50% and 97.5%  
✅ **High throughput:** 100+ req/sec for basic pages  
✅ **No errors:** 0 errors, 0 timeouts

### Warning Signs:

⚠️ **High latency:** Median over 500ms  
⚠️ **Large variance:** Big difference between 50% and 97.5% (indicates inconsistent performance)  
⚠️ **Low throughput:** Less than 50 req/sec  
⚠️ **Errors:** Any HTTP errors or timeouts

---

## 🔍 Finding Performance Issues

### 1. Test Different Pages

Compare results across different routes to find slow endpoints:

```bash
# Homepage (should be fast)
npm run load:test

# Search (database + Elasticsearch)
npm run load:search

# Product page (database lookup)
npm run load:products
```

### 2. Increase Load Gradually

Start with low connections, increase until you find the breaking point:

```bash
npx autocannon -c 5 -d 20 http://localhost:3000   # Light
npx autocannon -c 20 -d 20 http://localhost:3000  # Medium
npx autocannon -c 50 -d 20 http://localhost:3000  # Heavy
```

### 3. Compare Before/After Changes

Run tests before and after code changes to measure impact:

```bash
# Before optimization
npm run load:search
# Note the Avg latency and Req/Sec

# Make changes...

# After optimization
npm run load:search
# Compare results
```

---

## 🔧 Troubleshooting

**"Connection refused"**
- Make sure the app is running: `npm start`

**"Too many open files"**
- Reduce connections: `npx autocannon -c 5 ...`

**Very slow results**
- Check if MongoDB, Elasticsearch, and Redis are running
- Check database has data: run seeders if needed

---

## 💡 Pro Tips

1. **Warm up first:** Run a quick test before the "real" test to warm up caches
2. **Test in production mode:** `NODE_ENV=production npm start`
3. **Monitor with Jaeger:** Load tests show up nicely in Jaeger traces
4. **Test authenticated routes:** Use `-H "Cookie: connect.sid=..."` to test logged-in endpoints

---

**Happy Load Testing! 📊**
