/**
 * Firestore Database Seeding Script
 * Seeds initial mock garment factories, buyer categories, and demo data into Firestore.
 * Run with: npm run seed
 */
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { COLLECTIONS } from '../constants/collections.js';
import { config } from '../config/env.js';

const sampleFactories = [
  {
    id: 'factory_apex_textiles',
    companyName: 'Apex Textiles & Apparels Ltd',
    fullName: 'Mohammad Rahim',
    email: 'factory@threadline.demo',
    phone: '+880 1711 000111',
    country: 'Bangladesh',
    city: 'Dhaka',
    address: 'Plot 42, Tejgaon Industrial Area, Dhaka',
    website: 'https://apextextiles.example.com',
    processes: ['Cutting', 'Sewing', 'Knitting', 'Dyeing', 'Finishing', 'Quality Control'],
    products: ['T-shirt', 'Polo shirt', 'Hoodie', 'Sweater'],
    monthlyCapacity: 150000,
    certifications: ['OEKO-TEX Standard 100', 'WRAP', 'BSCI', 'Sedex'],
    moq: 500,
    verified: true,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'factory_horizon_denim',
    companyName: 'Horizon Denim Mills',
    fullName: 'Farhana Ahmed',
    email: 'horizon@garments.example.com',
    phone: '+880 1812 222333',
    country: 'Bangladesh',
    city: 'Chittagong',
    address: 'CEPZ, Chittagong',
    website: 'https://horizondenim.example.com',
    processes: ['Cutting', 'Sewing', 'Washing', 'Finishing', 'Laser Whisker'],
    products: ['Jeans', 'Jacket', 'Denim Shirts'],
    monthlyCapacity: 80000,
    certifications: ['GOTS', 'OEKO-TEX', 'WRAP'],
    moq: 1000,
    verified: true,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleBuyers = [
  {
    id: 'buyer_urban_style',
    fullName: 'Alex Morgan',
    email: 'buyer@threadline.demo',
    phone: '+1 (555) 345-6789',
    companyName: 'Urban Style Studios',
    buyerType: 'Clothing Brand',
    country: 'United States',
    website: 'https://urbanstylestudios.example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleProducts = [
  {
    id: 'prod_heavyweight_cotton_tee',
    factoryId: 'factory_apex_textiles',
    factoryName: 'Apex Textiles & Apparels Ltd',
    name: '240 GSM Heavyweight Organic Cotton T-Shirt',
    category: 'Men',
    productType: 'T-shirt',
    description: 'Premium combed compact organic cotton jersey. Pre-shrunk, drop-shoulder relaxed silhouette.',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
    materials: ['100% Combed Organic Cotton', '240 GSM Single Jersey'],
    minOrderQuantity: 500,
    priceRange: { min: 4.5, max: 6.2, currency: 'USD' },
    leadTimeDays: 30,
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    availableColors: ['Black', 'Vintage White', 'Sage Green', 'Navy'],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log('\n=============================================');
  console.log('   🌱 TechGarments Firestore Seeding Tool');
  console.log('=============================================');
  console.log(`Target Project: ${config.firebase.projectId}`);

  if (!isFirebaseConfigured) {
    console.log('⚠️ Credentials not found. To seed live Firestore, place serviceAccountKey.json in backend/');
    process.exit(0);
  }

  try {
    console.log('\nSeeding sample factories...');
    for (const f of sampleFactories) {
      await db.collection(COLLECTIONS.FACTORIES).doc(f.id).set(f, { merge: true });
      console.log(`  ✓ Factory: ${f.companyName}`);
    }

    console.log('\nSeeding sample buyers...');
    for (const b of sampleBuyers) {
      await db.collection(COLLECTIONS.BUYERS).doc(b.id).set(b, { merge: true });
      console.log(`  ✓ Buyer: ${b.companyName}`);
    }

    console.log('\nSeeding sample products...');
    for (const p of sampleProducts) {
      await db.collection(COLLECTIONS.PRODUCTS).doc(p.id).set(p, { merge: true });
      console.log(`  ✓ Product: ${p.name}`);
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
  }
}

seed().catch(console.error);
