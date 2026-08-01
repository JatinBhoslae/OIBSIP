import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ingredient from '../models/Ingredient.js';
import Pizza from '../models/Pizza.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';

dotenv.config();

const ingredients = [
  // Bases
  { name: 'Thin Crust', category: 'base', quantity: 100, unit: 'pcs', threshold: 15, price: 40 },
  { name: 'Thick Crust', category: 'base', quantity: 100, unit: 'pcs', threshold: 15, price: 50 },
  { name: 'Gluten-Free Crust', category: 'base', quantity: 50, unit: 'pcs', threshold: 10, price: 80 },
  { name: 'Cheese Burst Crust', category: 'base', quantity: 60, unit: 'pcs', threshold: 12, price: 90 },

  // Sauces
  { name: 'Classic Tomato', category: 'sauce', quantity: 150, unit: 'pcs', threshold: 20, price: 20 },
  { name: 'Spicy Marinara', category: 'sauce', quantity: 100, unit: 'pcs', threshold: 15, price: 25 },
  { name: 'BBQ Sauce', category: 'sauce', quantity: 80, unit: 'pcs', threshold: 10, price: 30 },
  { name: 'Creamy Garlic', category: 'sauce', quantity: 80, unit: 'pcs', threshold: 10, price: 30 },

  // Cheese
  { name: 'Mozzarella', category: 'cheese', quantity: 200, unit: 'pcs', threshold: 25, price: 40 },
  { name: 'Cheddar', category: 'cheese', quantity: 100, unit: 'pcs', threshold: 15, price: 50 },
  { name: 'Parmesan', category: 'cheese', quantity: 100, unit: 'pcs', threshold: 15, price: 50 },
  { name: 'Vegan Cheese', category: 'cheese', quantity: 60, unit: 'pcs', threshold: 10, price: 70 },

  // Vegetables
  { name: 'Onions', category: 'vegetable', quantity: 300, unit: 'pcs', threshold: 30, price: 15 },
  { name: 'Tomatoes', category: 'vegetable', quantity: 300, unit: 'pcs', threshold: 30, price: 15 },
  { name: 'Capsicum', category: 'vegetable', quantity: 250, unit: 'pcs', threshold: 25, price: 15 },
  { name: 'Mushrooms', category: 'vegetable', quantity: 150, unit: 'pcs', threshold: 20, price: 25 },
  { name: 'Jalapenos', category: 'vegetable', quantity: 120, unit: 'pcs', threshold: 15, price: 20 },
  { name: 'Black Olives', category: 'vegetable', quantity: 120, unit: 'pcs', threshold: 15, price: 20 },
  { name: 'Golden Corn', category: 'vegetable', quantity: 180, unit: 'pcs', threshold: 20, price: 20 },

  // Meats
  { name: 'Pepperoni', category: 'meat', quantity: 150, unit: 'pcs', threshold: 20, price: 60 },
  { name: 'Grilled Chicken', category: 'meat', quantity: 120, unit: 'pcs', threshold: 15, price: 50 },
  { name: 'Smoked Bacon', category: 'meat', quantity: 100, unit: 'pcs', threshold: 15, price: 75 },
];

const coupons = [
  { code: 'PIZZA50', discountPercentage: 50, maxDiscount: 150, minOrderValue: 200, expiryDate: new Date('2028-12-31') },
  { code: 'FIRST30', discountPercentage: 30, maxDiscount: 100, minOrderValue: 150, expiryDate: new Date('2028-12-31') },
  { code: 'CRUST20', discountPercentage: 20, maxDiscount: 80, minOrderValue: 100, expiryDate: new Date('2028-12-31') },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pizzahub');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await Ingredient.deleteMany();
    await Pizza.deleteMany();
    await Coupon.deleteMany();
    await User.deleteMany();

    console.log('Data cleared.');

    // Seed Ingredients
    const createdIngredients = await Ingredient.insertMany(ingredients);
    console.log(`${createdIngredients.length} Ingredients seeded.`);

    // Find Ingredient IDs for mapping to preset pizzas
    const getIngId = (name) => createdIngredients.find((i) => i.name === name)._id;

    // Seed Preset Pizzas
    const presetPizzas = [
      {
        name: 'Margherita Classic',
        description: 'Classic delight with 100% real mozzarella cheese, freshly-baked crust, and our signature rich tomato sauce.',
        image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=600',
        category: 'veg',
        basePrice: 199,
        ingredients: [getIngId('Thin Crust'), getIngId('Classic Tomato'), getIngId('Mozzarella')],
      },
      {
        name: 'Farmhouse Special',
        description: 'Delightful combination of fresh onions, crunchy capsicum, juicy tomatoes, golden corn, and mushrooms.',
        image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=600',
        category: 'veg',
        basePrice: 299,
        ingredients: [
          getIngId('Thick Crust'),
          getIngId('Classic Tomato'),
          getIngId('Mozzarella'),
          getIngId('Onions'),
          getIngId('Tomatoes'),
          getIngId('Capsicum'),
          getIngId('Mushrooms'),
        ],
      },
      {
        name: 'Pepperoni Feast',
        description: 'Loads of real pepperoni slices, extra mozzarella cheese, and pizza sauce baked to a crispy golden finish.',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600',
        category: 'non-veg',
        basePrice: 399,
        ingredients: [getIngId('Thin Crust'), getIngId('Spicy Marinara'), getIngId('Mozzarella'), getIngId('Pepperoni')],
      },
      {
        name: 'Veggie Paradise',
        description: 'Loaded with golden corn, black olives, jalapenos, onions, capsicum, and premium cheddar cheese.',
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=600',
        category: 'veg',
        basePrice: 279,
        ingredients: [
          getIngId('Thin Crust'),
          getIngId('Creamy Garlic'),
          getIngId('Cheddar'),
          getIngId('Golden Corn'),
          getIngId('Black Olives'),
          getIngId('Jalapenos'),
          getIngId('Onions'),
        ],
      },
      {
        name: 'Golden Chicken Delight',
        description: 'Tender double portions of grilled chicken, golden sweet corn, mozzarella, and smoky BBQ sauce.',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600',
        category: 'non-veg',
        basePrice: 349,
        ingredients: [
          getIngId('Cheese Burst Crust'),
          getIngId('BBQ Sauce'),
          getIngId('Mozzarella'),
          getIngId('Grilled Chicken'),
          getIngId('Golden Corn'),
        ],
      },
    ];

    const createdPizzas = await Pizza.insertMany(presetPizzas);
    console.log(`${createdPizzas.length} Pizzas seeded.`);

    // Seed Coupons
    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`${createdCoupons.length} Coupons seeded.`);

    // Create a default admin user
    // Email: admin@pizzahub.com, Password: adminpassword
    await User.create({
      name: 'PizzaHub Admin',
      email: 'admin@pizzahub.com',
      password: 'adminpassword',
      role: 'admin',
      isVerified: true,
    });
    console.log('Default Admin User seeded (email: admin@pizzahub.com / password: adminpassword).');

    // Create a default customer user
    // Email: customer@pizzahub.com, Password: customerpassword
    await User.create({
      name: 'John Customer',
      email: 'customer@pizzahub.com',
      password: 'customerpassword',
      role: 'customer',
      isVerified: true,
    });
    console.log('Default Customer User seeded (email: customer@pizzahub.com / password: customerpassword).');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
