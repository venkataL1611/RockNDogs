# 🔍 CPU & Memory Profiling

Chrome DevTools provides the most beginner-friendly interface for CPU and memory profiling in Node.js applications.

---

## 🚀 Quick Start

### 1. Start App with Profiling Enabled

```bash
npm run start:profile
```

You'll see:
```
Debugger listening on ws://127.0.0.1:9229/...
Server running on port 3000
```

### 2. Open Chrome DevTools

1. Open **Chrome browser** (not any browser, must be Chrome)
2. Go to: `chrome://inspect`
3. Under "Remote Target", click **"inspect"** next to your app
4. A DevTools window will open

---

## 📊 Memory Profiling (Finding Memory Leaks)

### Step-by-Step:

1. **Start profiling:**
   - In DevTools, go to the **"Memory"** tab
   - Select **"Heap snapshot"**
   - Click **"Take snapshot"** (Snapshot 1)

2. **Use your app:**
   - Search for products multiple times
   - Add items to cart 10-20 times
   - Navigate through pages

3. **Take another snapshot:**
   - Click **"Take snapshot"** again (Snapshot 2)

4. **Compare snapshots:**
   - Click on **Snapshot 2**
   - Change dropdown from "Summary" to **"Comparison"**
   - Look at the **"Delta"** column

### What to Look For:

✅ **Normal (not a leak):**
- Delta shows small increases
- "system", "compiled code" categories growing slowly

⚠️ **Potential Memory Leak:**
- **Array** or **Object** with large positive Delta
- **closure** with growing numbers
- Same type growing on every action

### Example of a Real Leak:

```
Constructor    | Delta  | Size Delta
-----------------------------------------
(closure)      | +100   | +2.5 MB    ⚠️ LEAK!
Array          | +50    | +1.2 MB    ⚠️ LEAK!
```

---

## 🔥 CPU Profiling (Finding Slow Code)

### Step-by-Step:

1. **Start profiling:**
   - In DevTools, go to the **"Profiler"** or **"Performance"** tab
   - Click **"Record"** (circle button)

2. **Use your app:**
   - Perform the slow action (e.g., search, checkout)
   - Wait 5-10 seconds

3. **Stop recording:**
   - Click **"Stop"** button

4. **Analyze results:**
   - You'll see a flame graph
   - Wider bars = more CPU time

### What to Look For:

⚠️ **Performance Issues:**
- Very wide bars in your code (not in node_modules)
- Functions taking > 100ms
- Deep call stacks indicating recursive functions

✅ **Good Performance:**
- Most time in I/O (waiting for database, network)
- Your functions are thin bars

### How to Read the Flame Graph:

```
┌────────────────────────────────────┐
│ Your function (100ms total)        │ ← Top = Entry point
│  ┌──────────────┐  ┌────────────┐ │
│  │ Database (70) │  │ Process (30)│ │ ← Wide = Slow
│  └──────────────┘  └────────────┘ │
└────────────────────────────────────┘
```

---

## 🎯 Common Use Cases

### 1. Finding Memory Leaks

**Problem:** App memory keeps growing
```bash
# Start profiling
npm run start:profile

# In Chrome DevTools (Memory tab):
1. Take snapshot
2. Perform action 20 times (e.g., search)
3. Take another snapshot
4. Compare: look for growing Arrays/Objects
```

### 2. Finding Slow Endpoints

**Problem:** Some routes are slow
```bash
# Start profiling
npm run start:profile

# In Chrome DevTools (Performance tab):
1. Click Record
2. Visit the slow page
3. Stop recording
4. Find your route handler in flame graph
```

### 3. Testing Under Load

**Problem:** Want to see memory/CPU under load
```bash
# Terminal 1: Start with profiling
npm run start:profile

# Terminal 2: Generate load
npm run load:test

# Chrome DevTools: Take snapshots/profiles during load
```

---

## 📈 Realistic Example

### Finding Why Search is Slow:

1. **Start profiling:**
   ```bash
   npm run start:profile
   ```

2. **Open Chrome:** `chrome://inspect` → click "inspect"

3. **Record performance:**
   - Go to "Performance" tab
   - Click Record
   - Search for "food" in your app
   - Click Stop

4. **Analyze:**
   - Find the search route handler in flame graph
   - Check if time is spent in:
     - ✅ Elasticsearch query (expected)
     - ✅ Database lookup (expected)
     - ⚠️ Some loop in your code (problem!)

---

## 🔧 Alternative: Allocation Timeline

For continuous memory monitoring:

1. DevTools → **Memory** tab
2. Select **"Allocation instrumentation on timeline"**
3. Click **Start**
4. Use your app
5. Click **Stop**

You'll see:
- Blue bars = memory allocated
- If bars keep growing = potential leak
- Bars go up and down = normal (garbage collection)

---

## 💡 Pro Tips

1. **Profile in production mode:** `NODE_ENV=production npm run start:profile`
2. **Run garbage collection manually:** In Memory tab, click the trash icon before taking snapshots
3. **Focus on deltas:** Don't worry about total memory, focus on what's growing
4. **Combine with load testing:**
   - Terminal 1: `npm run start:profile`
   - Terminal 2: `npm run load:search`
   - Chrome: Profile during load

5. **Save profiles:** You can save and compare profiles from different days

---

## 🆘 Troubleshooting

**"No remote target found"**
- Make sure you ran `npm run start:profile` (not `npm start`)
- Check the terminal shows "Debugger listening"

**DevTools won't open**
- Only Chrome works (not Firefox, Safari, Edge)
- Try closing and reopening `chrome://inspect`

**Too much data**
- Take smaller snapshots (use app less between snapshots)
- Use "Allocation sampling" instead of "Heap snapshot"

**Can't find the issue**
- Use "Comparison" view in Memory tab
- Look for your code in flame graph (not node_modules)
- Try profiling the same action multiple times

---

## 📚 Summary

**For Memory Leaks:**
- Memory tab → Heap snapshots → Comparison view → Check Delta

**For Slow Code:**
- Performance tab → Record → Use app → Stop → Check flame graph

**Best Practice:**
- Profile regularly (weekly)
- Compare before/after code changes
- Test under realistic load

---

**Happy Profiling! 🎯**
