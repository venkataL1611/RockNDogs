const mongoose = require('mongoose');
const Review = require('../models/review');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

// Sample review templates
const reviewTemplates = {
  5: [
    { title: 'Excellent Product!', text: 'My dog absolutely loves this! High quality and great value. Would definitely recommend to other pet owners.' },
    { title: 'Best Purchase Ever', text: 'This is hands down the best product I have bought for my pet. The quality is outstanding and my dog is very happy with it.' },
    { title: 'Highly Recommended', text: 'Five stars all the way! Excellent quality, fast shipping, and my furry friend could not be happier. Will buy again!' },
    { title: 'Perfect!', text: 'Exactly what I was looking for. Great quality, reasonable price, and my dog loves it. Could not ask for more!' }
  ],
  4: [
    { title: 'Very Good', text: 'Really good product overall. My dog likes it and the quality is solid. Just a minor issue with packaging but nothing major.' },
    { title: 'Great Quality', text: 'Good value for money. My pet enjoys it and I am satisfied with the purchase. Would buy again.' },
    { title: 'Solid Choice', text: 'Works well for our dog. Good quality and decent price. Lost one star because of slight delay in delivery.' },
    { title: 'Recommended', text: 'Very pleased with this purchase. My dog adapted to it quickly and seems very happy. Good product overall.' }
  ],
  3: [
    { title: 'Decent Product', text: 'It is okay. Does the job but nothing extraordinary. My dog uses it but does not seem overly excited about it.' },
    { title: 'Average', text: 'Average quality for the price. Works as described but there are probably better options available.' },
    { title: 'Not Bad', text: 'Acceptable product. My pet uses it but I expected a bit more based on the reviews. It is fine for now.' }
  ],
  2: [
    { title: 'Disappointed', text: 'Expected better quality for the price. My dog does not seem to like it much. Might try something else next time.' },
    { title: 'Below Expectations', text: 'Not very impressed. The quality could be better and my pet is not too happy with it. Would not buy again.' }
  ],
  1: [
    { title: 'Poor Quality', text: 'Very disappointed with this purchase. Low quality and my dog refused to use it. Would not recommend.' }
  ]
};

const userNames = [
  'Sarah M.', 'John D.', 'Emily R.', 'Michael T.', 'Jessica L.',
  'David W.', 'Amanda K.', 'Chris P.', 'Laura B.', 'Robert H.',
  'Jennifer S.', 'James F.', 'Mary G.', 'Daniel C.', 'Lisa A.',
  'Mark V.', 'Karen N.', 'Thomas J.', 'Nancy E.', 'Paul M.'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomRating() {
  const rand = Math.random();
  if (rand < 0.5) return 5; // 50% 5-star
  if (rand < 0.75) return 4; // 25% 4-star
  if (rand < 0.90) return 3; // 15% 3-star
  if (rand < 0.97) return 2; // 7% 2-star
  return 1; // 3% 1-star
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

setTimeout(async () => {
  try {
    console.log('Starting review seeder...\n');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Cleared existing reviews');

    const reviews = [];

    // Get all dogfoods
    const dogfoods = await DogFood.find();
    console.log(`Found ${dogfoods.length} dog food products`);

    // Generate reviews for each dogfood (3-8 reviews per product)
    for (const product of dogfoods) {
      const numReviews = 3 + Math.floor(Math.random() * 6); // 3-8 reviews
      
      for (let i = 0; i < numReviews; i++) {
        const rating = getRandomRating();
        const template = getRandomElement(reviewTemplates[rating]);
        
        reviews.push({
          productId: product._id,
          productType: 'dogfood',
          userName: getRandomElement(userNames),
          rating: rating,
          reviewTitle: template.title,
          reviewText: template.text,
          helpful: Math.floor(Math.random() * 15),
          verified: Math.random() > 0.3, // 70% verified
          createdAt: getRandomDate(90) // Random date within last 90 days
        });
      }
    }

    // Get all supplies
    const supplies = await Supply.find();
    console.log(`Found ${supplies.length} supply products`);

    // Generate reviews for each supply (3-8 reviews per product)
    for (const product of supplies) {
      const numReviews = 3 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < numReviews; i++) {
        const rating = getRandomRating();
        const template = getRandomElement(reviewTemplates[rating]);
        
        reviews.push({
          productId: product._id,
          productType: 'supply',
          userName: getRandomElement(userNames),
          rating: rating,
          reviewTitle: template.title,
          reviewText: template.text,
          helpful: Math.floor(Math.random() * 15),
          verified: Math.random() > 0.3,
          createdAt: getRandomDate(90)
        });
      }
    }

    // Insert all reviews
    await Review.insertMany(reviews);
    console.log(`\n✅ Successfully created ${reviews.length} reviews!`);

    // Show summary
    const summary = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    console.log('\nReview Summary:');
    summary.forEach(s => {
      console.log(`  ${s._id} stars: ${s.count} reviews`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}, 1000);
