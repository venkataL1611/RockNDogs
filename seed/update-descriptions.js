const mongoose = require('mongoose');
const DogFood = require('../models/dogfood');
const Supplies = require('../models/supply');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping', { useNewUrlParser: true });

// Detailed descriptions for dog food products
const dogfoodDescriptions = {
  Pedigree: 'Pedigree Complete Nutrition Dog Food is crafted with high-quality protein sources and essential nutrients to support your dog\'s overall health. This balanced formula includes real chicken, wholesome grains, and vegetables, providing complete and balanced nutrition for adult dogs. Rich in omega-6 fatty acids for healthy skin and a shiny coat, plus antioxidants to support a strong immune system. Perfect for daily feeding and suitable for all breeds.',

  Victor: 'Victor Dog Food is a premium, nutrient-dense formula designed for active and working dogs. Made with high-quality proteins from multiple sources including beef, chicken, and pork meals, this grain-inclusive recipe provides sustained energy for your active companion. Fortified with vitamins, minerals, chelated minerals, and probiotics for optimal digestion and nutrient absorption. Ideal for dogs with high energy requirements.',

  'Victor Plus': 'Victor Plus High-Performance Dog Food delivers superior nutrition for dogs requiring maximum energy output. This nutrient-dense formula features 78% protein and fat from premium animal sources, with the remaining 22% from vegetables, fruits, and supplements. Enhanced with glucosamine and chondroitin for joint health, plus proprietary VPRO Probiotic blend for digestive support. Perfect for sporting dogs, working dogs, or highly active pets.',

  'Milky Bone': 'Milky Bone Dog Treats are crunchy, tasty snacks that dogs love! These wholesome biscuits are baked with real milk and fortified with 12 essential vitamins and minerals, including calcium for strong bones and teeth. The crunchy texture helps reduce tartar buildup and freshen breath. Perfect as a training reward or between-meal treat. Made with no artificial flavors or preservatives.',

  'Victor Premium': 'Victor Premium Dog Food represents the pinnacle of canine nutrition with carefully selected ingredients for optimal health. This super-premium formula features multiple high-quality protein sources, including beef meal, chicken meal, and fish meal for complete amino acid profile. Enhanced with selenium yeast, vitamin E, and fortified probiotics. Grain-free recipe is ideal for dogs with food sensitivities while providing exceptional taste and nutrition.',

  Drools: 'Drools Premium Dog Food is specially formulated with high-quality protein sources to build and maintain lean muscle mass. This complete and balanced diet includes real chicken as the #1 ingredient, combined with wholesome grains, vegetables, and essential fatty acids. Rich in protein (minimum 26%) to support active lifestyles, plus added vitamins and minerals for immune system support. Contains DHA for brain development and omega fatty acids for healthy skin and coat.',

  'Sensitive Stomach': 'Sensitive Stomach Formula is expertly crafted for dogs with digestive sensitivities. This gentle, easily digestible recipe features limited ingredients with real chicken as the primary protein source and rice as a gentle carbohydrate. Free from corn, wheat, and soy, this formula minimizes potential allergens. Enhanced with prebiotics and probiotics to support healthy digestion and nutrient absorption. Perfect for dogs prone to upset stomachs or food sensitivities.',

  Wilderness: 'Blue Wilderness High Protein Dog Food is inspired by the diet of wild wolves, featuring more of the delicious meat dogs love. This grain-free, high-protein formula contains real chicken as the first ingredient, combined with fish meal and chicken meal for optimal protein content. Packed with antioxidant-rich LifeSource Bits - a precise blend of nutrients selected by veterinarians and animal nutritionists. Supports muscle development, healthy immune system, and sustained energy.',

  'Pup Peroni': 'Pup-Peroni Original Beef Flavor Dog Treats are slow-cooked to perfection with a delicious smoky flavor dogs can\'t resist. Made with real beef as the #1 ingredient, these tender, meaty treats are perfect for training or rewarding good behavior. Each treat is packed with protein and has an irresistible aroma that makes dogs come running. No artificial flavors, and proudly made in the USA.',

  'Alpho Variety Snacks': 'Alpo Variety Snacks Pack offers a delicious assortment of beef, chicken, and liver flavored treats in convenient single-serve pouches. These tender, meaty chunks are made with real meat and provide a protein-rich reward your dog will love. Perfect for training sessions or showing your pet some extra love. The variety pack ensures your dog never gets bored, with three delicious flavors to choose from.',

  'Cake Mix': 'Dog Birthday Cake Mix makes celebrating your furry friend\'s special day easy and fun! This all-natural, dog-safe cake mix is specifically formulated for canine consumption with no artificial colors, flavors, or preservatives. Simply add water and oil, bake, and frost with the included yogurt-based frosting. Made with wholesome ingredients like whole wheat flour, honey, and peanut butter. Perfect for birthdays, gotcha days, or any special occasion!',

  IAMS: 'IAMS ProActive Health Adult Dog Food with Real Chicken features high-quality protein to help maintain strong, lean muscles. This wholesome recipe includes farm-raised chicken as the #1 ingredient, combined with wholesome grains and vegetables for balanced nutrition. Enhanced with a tailored fiber blend including prebiotics and beet pulp to support healthy digestion. Fortified with antioxidants to support a strong immune system, plus omega-6 and omega-3 fatty acids for healthy skin and coat.'
};

// Detailed descriptions for supplies
const supplyDescriptions = {
  Bowl: 'Premium Stainless Steel Dog Bowl features a non-slip rubber base to prevent sliding and spills during mealtime. Made from high-quality, rust-resistant stainless steel that\'s dishwasher safe for easy cleaning. The wide base design provides stability, while the smooth edges ensure safe feeding. Durable construction resists chewing and is perfect for both food and water. Available in multiple sizes to suit dogs of all breeds.',

  'Dog Bed': 'Ultra-Plush Orthopedic Dog Bed provides superior comfort and joint support for your beloved pet. Features high-density memory foam core that contours to your dog\'s body, relieving pressure points and easing joint pain. The soft, machine-washable cover is made from premium microfiber fabric that\'s gentle on paws and nose. Non-slip bottom keeps the bed securely in place. Perfect for senior dogs, dogs with arthritis, or any pet deserving premium comfort.',

  'Dog Bowl': 'Elevated Dog Bowl Stand promotes healthy digestion and reduces neck strain during feeding. The raised design allows dogs to eat in a more natural, comfortable position, which is especially beneficial for large breeds and senior dogs. Features two stainless steel bowls that are removable for easy cleaning and dishwasher safe. Sturdy wooden stand with anti-slip feet prevents tipping and sliding. Holds up to 2 quarts per bowl.',

  'Dog Harness': 'No-Pull Dog Harness with Front Clip provides gentle control and discourages pulling during walks. The front attachment redirects your dog\'s forward motion, making training easier and walks more enjoyable. Padded chest and belly straps ensure comfort, while adjustable straps provide a custom fit. Reflective stitching enhances visibility during evening walks. Made from durable, breathable mesh material that\'s machine washable.',

  'Round Bowl': 'Ceramic Round Dog Bowl combines style and functionality with its attractive design and heavyweight construction. Made from food-safe, lead-free ceramic that resists scratches and bacteria buildup. The heavy base prevents tipping and sliding during enthusiastic eating. Microwave and dishwasher safe for convenient heating and cleaning. Features a non-porous glaze that won\'t absorb odors or stains. Available in multiple colors and patterns.',

  'Large Harness': 'Heavy-Duty Large Dog Harness is built tough for strong, powerful breeds. Constructed from military-grade nylon webbing with reinforced stitching at all stress points. Features a padded chest plate and belly strap for maximum comfort during extended wear. Multiple adjustment points ensure a secure, custom fit. Includes a sturdy metal D-ring for leash attachment and a convenient handle for additional control. Perfect for German Shepherds, Rottweilers, and other large breeds.',

  'Net Harness': 'Breathable Mesh Net Harness is ideal for hot weather and active dogs. The lightweight, ventilated design allows maximum airflow to keep your dog cool and comfortable. Soft mesh padding prevents chafing and rubbing, even during extended wear. Features quick-release buckles for easy on and off. Reflective trim enhances visibility in low-light conditions. Machine washable and quick-drying. Perfect for summer walks, hiking, and outdoor adventures.',

  'Dog Frisbee': 'Durable Flying Disc Dog Frisbee is designed specifically for safe, high-flying canine fun. Made from soft, flexible rubber that\'s gentle on dogs\' mouths and teeth. The aerodynamic design ensures stable, predictable flight patterns for successful catches. Floats in water for beach and pool play. Bright, visible color makes it easy to spot in grass or water. Puncture-resistant material stands up to enthusiastic play sessions.',

  Harness: 'Adjustable Step-In Dog Harness makes getting your dog ready for walks quick and easy. Simply lay the harness flat, have your dog step in, and buckle at the back - no need to pull anything over your dog\'s head. Features soft, breathable air mesh padding for all-day comfort. Four adjustment points ensure a perfect fit as your dog grows. Reflective straps provide enhanced visibility. Ideal for dogs who dislike traditional over-the-head harnesses.',

  'Dog Toy': 'Interactive Rubber Chew Toy provides hours of entertainment while promoting dental health. The unique textured surface helps clean teeth and massage gums as your dog chews. Made from durable, non-toxic natural rubber that stands up to aggressive chewing. Can be stuffed with treats or peanut butter for added engagement. Dishwasher safe for easy cleaning. Helps reduce anxiety and boredom while satisfying natural chewing instincts.',

  'Nerf Dog': 'NERF Dog Tennis Ball Blaster launches tennis balls up to 50 feet for exciting, high-energy fetch games. Ergonomic handle and trigger make launching easy and comfortable. Includes three high-quality tennis balls designed for maximum durability and bounce. The bright, high-visibility balls are easy to spot in any terrain. Perfect for giving your dog a great workout while minimizing strain on your throwing arm. Suitable for dogs of all sizes.'
};

async function updateDescriptions() {
  try {
    console.log('Starting description updates...\n');

    // Update dog food descriptions
    console.log('Updating dog food descriptions...');
    for (const [title, description] of Object.entries(dogfoodDescriptions)) {
      const result = await DogFood.updateOne(
        { title },
        { $set: { description } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated: ${title}`);
      } else {
        console.log(`- Skipped: ${title} (not found or already updated)`);
      }
    }

    console.log('\nUpdating supply descriptions...');
    // Update supply descriptions
    for (const [title, description] of Object.entries(supplyDescriptions)) {
      const result = await Supplies.updateOne(
        { Title: title },
        { $set: { description } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated: ${title}`);
      } else {
        console.log(`- Skipped: ${title} (not found or already updated)`);
      }
    }

    console.log('\n✅ All descriptions updated successfully!');

    // Show summary
    const dogfoodCount = await DogFood.countDocuments({ description: { $exists: true, $ne: '' } });
    const suppliesCount = await Supplies.countDocuments({ description: { $exists: true, $ne: '' } });

    console.log('\nSummary:');
    console.log(`  Dog foods with descriptions: ${dogfoodCount}`);
    console.log(`  Supplies with descriptions: ${suppliesCount}`);
  } catch (err) {
    console.error('Error updating descriptions:', err);
  } finally {
    mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
}

// Run the updater
updateDescriptions();
