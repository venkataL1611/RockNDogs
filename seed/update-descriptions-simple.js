const mongoose = require('mongoose');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');

// Product-specific descriptions
const dogfoodDescriptions = {
  Pedigree: {
    short: 'Complete nutrition for adult dogs with chicken, rice and vegetables',
    long: 'Pedigree Adult Complete Nutrition provides 100% complete and balanced nutrition for adult dogs. Made with real chicken as the #1 ingredient, enriched with vitamins and minerals, and fortified with omega-6 fatty acids for healthy skin and coat. This formula includes whole grains, vegetables, and essential nutrients to support strong muscles, healthy digestion, and overall vitality. Perfect for dogs of all breeds and sizes.'
  },
  Victor: {
    short: 'High-protein formula for active dogs with real meat and grain-free nutrition',
    long: 'Victor Hi-Pro Plus is a nutrient-dense, multi-meat formula designed for active sporting dogs, working dogs, and growing puppies. Features 76% meat protein from beef, chicken, pork and fish meals. Grain-free recipe with sweet potatoes and peas for sustained energy. Enhanced with probiotics for digestive health, glucosamine for joint support, and selenium yeast for immune system function. Made in USA with premium ingredients.'
  },
  'Victor Plus': {
    short: 'Premium performance formula with enhanced protein for peak athletic condition',
    long: 'Victor Performance formula is engineered for dogs requiring superior nutrition for peak athletic performance. Contains 82% protein from premium meat sources including beef meal, chicken meal, and fish meal. Fortified with vitamins E, C, and selenium for immune support. Includes glucosamine and chondroitin for joint health. Enhanced with fortified probiotics for optimal digestive health. Ideal for sporting, working, and highly active dogs.'
  },
  'Milky Bone': {
    short: 'Tasty dog treat biscuits that help clean teeth and freshen breath',
    long: 'Milk-Bone Original Dog Treats are crunchy dog biscuits that have been a trusted favorite for over 100 years. These treats help clean teeth and freshen breath with every bite. Made with 12 vitamins and minerals, plus calcium for strong bones and teeth. Contains no artificial flavors or colors. Perfect as training treats or daily rewards. Fortified with vitamins and minerals to support overall health. Available in various sizes for all dog breeds.'
  },
  'Victor Premium': {
    short: 'Ultra-premium grain-inclusive formula for all life stages',
    long: 'Victor Classic - The Family Dog is a multi-protein, grain-inclusive formula suitable for all life stages. Features beef meal, chicken meal, and pork meal as primary protein sources. Includes gluten-free grains for sustained energy. Fortified with vitamins and chelated minerals for optimal nutrient absorption. Contains selenium yeast and vitamin E for immune support. Ideal for families with multiple dogs of different ages and activity levels.'
  },
  Drools: {
    short: 'Complete balanced nutrition with chicken and rice for healthy growth',
    long: 'Drools Chicken & Rice Adult Dog Food provides complete and balanced nutrition for adult dogs. Made with high-quality chicken protein for lean muscle development. Enriched with omega fatty acids for healthy skin and shiny coat. Contains prebiotics and probiotics for digestive health. Fortified with essential vitamins and minerals. Includes calcium and phosphorus for strong bones and teeth. Free from artificial colors and flavors.'
  },
  'Sensitive Stomach': {
    short: 'Gentle formula for dogs with digestive sensitivities and food allergies',
    long: 'Gentle Nutrition Sensitive Stomach formula is specially designed for dogs with digestive sensitivities. Features easily digestible proteins and carbohydrates to minimize stomach upset. Contains prebiotic fiber to support digestive health and nutrient absorption. Enriched with natural sources of omega fatty acids for skin and coat health. Free from common allergens including corn, wheat, and soy. Veterinarian recommended for dogs with sensitive digestion.'
  },
  Wilderness: {
    short: 'Grain-free, high-protein recipe inspired by the ancestral diet of wolves',
    long: 'Blue Wilderness High Protein Natural Adult Dry Dog Food is inspired by the diet of wolves, featuring more of the meat dogs love. This grain-free recipe contains more protein than traditional Blue Buffalo formulas. Made with real deboned chicken as the first ingredient. Enhanced with LifeSource Bits - a precise blend of antioxidants, vitamins and minerals. Contains omega 3 & 6 fatty acids for healthy skin and coat. No chicken by-product meals, corn, wheat, soy, or artificial flavors.'
  },
  'Pup Peroni': {
    short: 'Original beef flavor dog treats that dogs cannot resist',
    long: 'Pup-Peroni Original Beef Flavor Dog Treats are slow-cooked to perfection for a savory, meaty taste dogs love. Made with real beef as the #1 ingredient. These chewy treats are perfect for training or as special rewards. No artificial flavors added. Resealable bag keeps treats fresh. Great for dogs of all sizes and breeds. The irresistible beef aroma makes these treats perfect for picky eaters or training sessions.'
  },
  'Alpho Variety Snacks': {
    short: 'Variety pack of delicious wet dog food in multiple flavors',
    long: 'Alpo Variety Snaps Pack includes a delicious variety of wet dog food flavors to keep your dog excited at mealtime. Each serving provides complete and balanced nutrition for adult dogs. Made with real meat and wholesome ingredients. Includes essential vitamins and minerals. Convenient single-serve portions for easy feeding. Multiple flavor options including beef, chicken, and lamb. Perfect for dogs who enjoy variety or for mixing with dry food.'
  },
  'Cake Mix': {
    short: 'Special dog-safe cake mix for celebrating your pet special occasions',
    long: 'Puppy Cake Wheat-Free Cake Mix for Dogs makes it easy to celebrate special occasions with your furry friend. Made with dog-safe ingredients and naturally flavored. Simply add water, oil, and egg to create a delicious cake your dog will love. Wheat-free formula is gentle on sensitive stomachs. Perfect for birthdays, adoption days, or any special celebration. Comes with frosting mix for the complete party experience. Makes one 4-inch cake.'
  },
  IAMS: {
    short: 'Complete nutrition with real chicken for healthy, active adult dogs',
    long: 'IAMS Proactive Health Adult MiniChunks provides complete and balanced nutrition tailored for adult dogs. Made with farm-raised chicken as the #1 ingredient. Features a specialized fiber blend including beet pulp and prebiotics for optimal digestive health. Enhanced with omega-6 fatty acids for nourished skin and lustrous coat. Fortified with antioxidants for a strong immune system. Crunchy kibble helps reduce plaque and tartar buildup. Veterinarian recommended.'
  }
};

const supplyDescriptions = {
  Bowl: {
    short: 'Durable stainless steel food and water bowl for dogs',
    long: 'Premium Stainless Steel Dog Bowl is perfect for food and water. Made from high-quality, rust-resistant stainless steel that will not hold odors or bacteria. Dishwasher safe for easy cleaning. Non-skid rubber base prevents sliding and floor scratches. Available in multiple sizes to suit dogs of all breeds. Durable construction ensures years of use. Tip-resistant design prevents spills. Ideal for both indoor and outdoor use.'
  },
  'Dog Bed': {
    short: 'Comfortable orthopedic dog bed with washable cover',
    long: 'Deluxe Orthopedic Dog Bed provides superior comfort and support for your pet. Features high-density memory foam that contours to your dog body, relieving pressure on joints and muscles. Perfect for senior dogs or dogs with arthritis. Removable, machine-washable cover with waterproof liner protects the foam. Non-slip bottom keeps bed in place. Available in multiple sizes and colors. Durable construction stands up to scratching and nesting.'
  },
  'Dog Bowl': {
    short: 'Elevated double bowl stand for comfortable feeding position',
    long: 'Elevated Double Dog Bowl Stand promotes better posture and easier swallowing during meals. Adjustable height settings accommodate dogs of different sizes and can be raised as puppies grow. Includes two stainless steel bowls that are dishwasher safe and rust-resistant. Sturdy wooden or metal construction ensures stability. Reduces neck strain and improves digestion. Non-slip rubber feet prevent sliding. Perfect for large breeds and senior dogs.'
  },
  'Dog Harness': {
    short: 'No-pull adjustable harness for comfortable and safe walking',
    long: 'Premium No-Pull Dog Harness features a front-clip design that gently discourages pulling for better leash control. Made with breathable mesh padding for all-day comfort. Fully adjustable straps ensure perfect fit for growing puppies or dogs of any size. Reflective strips provide visibility during evening walks. Heavy-duty metal D-rings for leash attachment. Easy on/off quick-release buckles. Perfect for training or daily walks. Available in multiple sizes and colors.'
  },
  'Round Bowl': {
    short: 'Classic ceramic bowl perfect for food or water',
    long: 'Classic Ceramic Dog Bowl combines style and functionality. Heavy ceramic construction prevents tipping and sliding during meals. Dishwasher and microwave safe for convenience. Non-porous surface resists bacteria and odors. Available in various colors and decorative patterns to match your home decor. Wide base provides stability. Perfect weight for enthusiastic eaters. Lead-free and chip-resistant. Easy to clean and maintain.'
  },
  'Large Harness': {
    short: 'Heavy-duty harness designed for large and strong breeds',
    long: 'Heavy-Duty Large Dog Harness is engineered for strength and durability. Features reinforced stitching and military-grade nylon webbing. Padded chest and back plates distribute pressure evenly for maximum comfort. Multiple adjustment points ensure perfect fit for large breeds. Includes both front and back leash attachment points. Reflective threading for nighttime visibility. Handle on back for quick control. Ideal for German Shepherds, Labs, Rottweilers, and other large breeds.'
  },
  'Net Harness': {
    short: 'Lightweight mesh harness perfect for small to medium dogs',
    long: 'Breathable Mesh Dog Harness offers maximum comfort for daily wear. Ultra-lightweight design with soft mesh material prevents chafing and overheating. Step-in style makes it easy to put on and take off. Fully adjustable for custom fit. Secure velcro and quick-release buckles. Reflective trim for safety. Perfect for puppies, small breeds, or dogs with sensitive skin. Machine washable for easy care. Available in fun colors and patterns.'
  },
  'Dog Frisbee': {
    short: 'Durable flying disc designed specifically for dogs',
    long: 'Indestructible Dog Frisbee is made from soft, flexible rubber that is gentle on teeth and gums. Floats in water for pool and beach play. Bright colors make it easy to spot in grass or sand. Aerodynamic design flies straight and far. Puncture-resistant material stands up to aggressive chewers. Easy to catch and retrieve. Perfect for fetch, exercise, and bonding. Multiple sizes available. Great for teaching new tricks and burning energy.'
  },
  Harness: {
    short: 'Everyday comfort harness for walks and outdoor adventures',
    long: 'All-Day Comfort Dog Harness features soft padding on chest and belly straps for irritation-free wear. Adjustable at four points for perfect fit. Quick-snap buckles make it easy to put on. Sturdy top handle for quick control in crowds or emergencies. Reflective stitching for visibility. Two leash attachment points - front for training, back for casual walks. Weather-resistant materials. Perfect for daily use, hiking, and training. Machine washable.'
  },
  'Dog Toy': {
    short: 'Interactive squeaky toy for play and entertainment',
    long: 'Premium Interactive Dog Toy features multiple squeakers to keep dogs engaged and entertained. Made from durable, non-toxic materials that are safe for aggressive chewers. Textured surface helps clean teeth and massage gums during play. Bright colors and fun shapes stimulate mental activity. Perfect for fetch, tug-of-war, or solo play. Washable and easy to clean. Helps reduce anxiety and boredom. Great for puppies through adult dogs. Multiple designs available.'
  },
  'Nerf Dog': {
    short: 'Weather-resistant foam tennis ball launcher and ball set',
    long: 'NERF Dog Tennis Ball Blaster Set includes launcher and tennis balls designed for high-flying fun. Lightweight foam construction is safe for indoor and outdoor play. Weather and water-resistant materials for all-season use. Tennis balls have extra-thick rubber core for durability. Bright colors make balls easy to find. Launch balls up to 50 feet for extended fetch sessions. No sharp edges - safe for dogs and humans. Perfect for active play and exercise. Helps burn energy and build bonding.'
  }
};

// Wait for connection then update
setTimeout(async () => {
  try {
    console.log('Starting description updates...\n');

    // Update dogfoods
    for (const [title, descriptions] of Object.entries(dogfoodDescriptions)) {
      const result = await DogFood.updateOne(
        { title },
        {
          $set: {
            shortDescription: descriptions.short,
            longDescription: descriptions.long,
            description: descriptions.short // Also update description field
          }
        }
      );
      console.log(`Updated ${title}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    }

    console.log('\n');

    // Update supplies
    for (const [title, descriptions] of Object.entries(supplyDescriptions)) {
      const result = await Supply.updateOne(
        { Title: title },
        {
          $set: {
            shortDescription: descriptions.short,
            longDescription: descriptions.long,
            description: descriptions.short // Also update description field
          }
        }
      );
      console.log(`Updated ${title}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    }

    console.log('\n✅ All descriptions updated successfully!');
  } catch (err) {
    console.error('❌ Error updating descriptions:', err);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
}, 1000);
