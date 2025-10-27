# Database Management Guide

## Database Structure

This project uses two MongoDB databases:

- **`shopping`** (Production): Main database with 23 products
  - 12 Dog Food products
  - 11 Supply products
  
- **`shopping_test`** (Test): Separate database for automated tests
  - Used by CI/CD pipeline
  - Used by test suite
  - Isolated from production data

## 🔄 Restoring Production Data

If your production database gets corrupted or cleared, restore it using:

```bash
node seed/restore-database.js
```

This will:
- ✅ Clear any corrupted data
- ✅ Restore all 12 original dog food products
- ✅ Restore all 11 original supply products
- ✅ Add proper descriptions and pricing

### Verification

Check your data was restored:

```bash
# Connect to MongoDB
mongo shopping

# Count documents
> db.dogfoods.count()
12
> db.supplies.count()
11
```

Or use the verification script:

```bash
node seed/verify-data.js
```

## 🧪 Test Data Seeding

The test seeder **only affects the test database**:

```bash
node tests/seed-test-data.js
```

This uses `shopping_test` database by default and will NOT touch your production data.

### CI/CD Testing

GitHub Actions automatically:
1. Uses `shopping_test` database
2. Seeds test data before running tests
3. Never touches production `shopping` database

## 📋 Original Data Set

### Dog Foods (12 products)

1. **Pedigree** - $14
2. **Victor** - $15
3. **Victor Plus** - $38
4. **Milky Bone** - $40
5. **Victor Premium** - $35
6. **Drools** - $25
7. **Sensitive Stomach** - $28
8. **Wilderness** - $45
9. **Pup Peroni** - $10
10. **Alpho Variety Snacks** - $30
11. **Cake Mix** - $50
12. **IAMS** - $40

### Supplies (11 products)

1. **Bowl** - $13
2. **Dog Bed** - $25
3. **Dog Bowl** - $14
4. **Dog Harness** - $21
5. **Round Bowl** - $31
6. **Large Harness** - $19
7. **Net Harness** - $24
8. **Dog Frisbee** - $34
9. **Harness** - $26
10. **Dog Toy** - $9
11. **Nerf Dog** - $20

## 🛡️ Data Safety

### Production Database Protection

The test seeder has been updated to:
- ❌ Never use `shopping` database by default
- ✅ Always use `shopping_test` database
- ✅ Require explicit `MONGODB_URI` to override

### Best Practices

1. **Never run test seeders in production**
2. **Use separate databases for test and production**
3. **Backup your data regularly**:
   ```bash
   mongodump --db shopping --out backup/$(date +%Y%m%d)
   ```
4. **Restore from backup if needed**:
   ```bash
   mongorestore --db shopping backup/20251027/shopping
   ```

## 🔧 Manual Seeding (Original Scripts)

If you want to use the original seeder scripts:

```bash
# Seed dog foods
node seed/product-seeder.js

# Seed supplies
node seed/supply-seeder\ .js
```

⚠️ **Warning**: These scripts ADD data, they don't clear existing data first!

## 📊 Database Schema

### DogFood Collection
```javascript
{
  imagepath: String,
  title: String,
  description: String,
  shortDescription: String,
  longDescription: String,
  Price: Number
}
```

### Supply Collection
```javascript
{
  imagepath: String,
  Title: String,  // Note: Capital T
  description: String,
  shortDescription: String,
  longDescription: String,
  Price: String   // Note: String type
}
```

## 🆘 Emergency Recovery

If you accidentally cleared your production database:

```bash
# Quick restore
node seed/restore-database.js

# Verify
echo "show dbs" | mongo | grep shopping
echo "db.dogfoods.count()" | mongo shopping
echo "db.supplies.count()" | mongo shopping
```

---

**Remember**: Always use `shopping_test` for testing, `shopping` for production!
