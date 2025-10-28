#!/usr/bin/env node

/**
 * Seed a default test user for login flows
 */

const mongoose = require('mongoose');
const User = require('../models/user');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_test';
const EMAIL = process.env.TEST_USER_EMAIL || 'test@rockndogs.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'testpass123';
const NAME = process.env.TEST_USER_NAME || 'Test User';

(async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.error('Refusing to seed user in production. Set NODE_ENV!=production to proceed.');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    let user = await User.findOne({ email: EMAIL.toLowerCase() }).exec();
    if (!user) {
      user = new User({ email: EMAIL.toLowerCase(), name: NAME });
      user.password = user.encryptPassword(PASSWORD);
      await user.save();
      console.log(`✅ Created test user: ${EMAIL}`);
    } else {
      console.log(`ℹ️ Test user already exists: ${EMAIL}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding user:', err);
    process.exit(1);
  }
})();
