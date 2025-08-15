// scripts/seed-vet-directory.js
import mongoose from 'mongoose';
import VetDirectory from './VetDirectory.js';

// Sample vet directory data
const sampleVets = [
  {
    vetId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
    clinicName: "Emergency Pet Care Center",
    specialization: ["emergency", "surgery", "checkup"],
    services: ["Emergency Care", "Surgery", "Vaccinations", "Checkups", "X-rays"],
    location: {
      coordinates: [90.4125, 23.8103], // Dhaka coordinates
      address: "123 Main Street, Gulshan-2",
      city: "Dhaka",
      state: "Dhaka",
      zipCode: "1212"
    },
    contactInfo: {
      phone: "+880-2-988-1234",
      email: "info@emergencypetcare.com",
      website: "https://emergencypetcare.com",
      emergencyPhone: "+880-17-1234-5678"
    },
    operatingHours: {
      monday: { open: "24h", close: "24h" },
      tuesday: { open: "24h", close: "24h" },
      wednesday: { open: "24h", close: "24h" },
      thursday: { open: "24h", close: "24h" },
      friday: { open: "24h", close: "24h" },
      saturday: { open: "24h", close: "24h" },
      sunday: { open: "24h", close: "24h" }
    },
    isEmergencyAvailable: true,
    is24Hours: true,
    rating: 4.8,
    totalReviews: 156,
    isVerified: true,
    isActive: true
  },
  {
    vetId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
    clinicName: "Pet Wellness Clinic",
    specialization: ["vaccination", "checkup", "dental"],
    services: ["Vaccinations", "Checkups", "Dental Care", "Grooming", "Nutrition"],
    location: {
      coordinates: [90.4225, 23.8203],
      address: "456 Banani Road, Banani",
      city: "Dhaka",
      state: "Dhaka",
      zipCode: "1213"
    },
    contactInfo: {
      phone: "+880-2-988-5678",
      email: "info@petwellness.com",
      website: "https://petwellness.com"
    },
    operatingHours: {
      monday: { open: "9:00 AM", close: "6:00 PM" },
      tuesday: { open: "9:00 AM", close: "6:00 PM" },
      wednesday: { open: "9:00 AM", close: "6:00 PM" },
      thursday: { open: "9:00 AM", close: "6:00 PM" },
      friday: { open: "9:00 AM", close: "6:00 PM" },
      saturday: { open: "9:00 AM", close: "4:00 PM" },
      sunday: { open: "", close: "" }
    },
    isEmergencyAvailable: false,
    is24Hours: false,
    rating: 4.6,
    totalReviews: 89,
    isVerified: true,
    isActive: true
  },
  {
    vetId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
    clinicName: "Animal Surgery Specialists",
    specialization: ["surgery", "orthopedic", "emergency"],
    services: ["Surgery", "Orthopedic Surgery", "Emergency Surgery", "Post-op Care"],
    location: {
      coordinates: [90.4025, 23.8003],
      address: "789 Dhanmondi Road, Dhanmondi",
      city: "Dhaka",
      state: "Dhaka",
      zipCode: "1209"
    },
    contactInfo: {
      phone: "+880-2-988-9012",
      email: "info@animalsurgery.com",
      website: "https://animalsurgery.com",
      emergencyPhone: "+880-17-9012-3456"
    },
    operatingHours: {
      monday: { open: "8:00 AM", close: "8:00 PM" },
      tuesday: { open: "8:00 AM", close: "8:00 PM" },
      wednesday: { open: "8:00 AM", close: "8:00 PM" },
      thursday: { open: "8:00 AM", close: "8:00 PM" },
      friday: { open: "8:00 AM", close: "8:00 PM" },
      saturday: { open: "8:00 AM", close: "6:00 PM" },
      sunday: { open: "10:00 AM", close: "4:00 PM" }
    },
    isEmergencyAvailable: true,
    is24Hours: false,
    rating: 4.9,
    totalReviews: 203,
    isVerified: true,
    isActive: true
  },
  {
    vetId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
    clinicName: "24/7 Pet Emergency Hospital",
    specialization: ["emergency", "surgery", "cardiology"],
    services: ["Emergency Care", "Surgery", "Cardiology", "ICU", "Blood Transfusions"],
    location: {
      coordinates: [90.4325, 23.8303],
      address: "321 Uttara Road, Uttara",
      city: "Dhaka",
      state: "Dhaka",
      zipCode: "1230"
    },
    contactInfo: {
      phone: "+880-2-988-3456",
      email: "info@24petemergency.com",
      website: "https://24petemergency.com",
      emergencyPhone: "+880-17-3456-7890"
    },
    operatingHours: {
      monday: { open: "24h", close: "24h" },
      tuesday: { open: "24h", close: "24h" },
      wednesday: { open: "24h", close: "24h" },
      thursday: { open: "24h", close: "24h" },
      friday: { open: "24h", close: "24h" },
      saturday: { open: "24h", close: "24h" },
      sunday: { open: "24h", close: "24h" }
    },
    isEmergencyAvailable: true,
    is24Hours: true,
    rating: 4.7,
    totalReviews: 178,
    isVerified: true,
    isActive: true
  }
];

async function seedVetDirectory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safetails');
    console.log('Connected to MongoDB');

    // Clear existing data
    await VetDirectory.deleteMany({});
    console.log('Cleared existing vet directory data');

    // Insert sample data
    const insertedVets = await VetDirectory.insertMany(sampleVets);
    console.log(`Successfully inserted ${insertedVets.length} vet directory entries`);

    // Display inserted data
    insertedVets.forEach((vet, index) => {
      console.log(`${index + 1}. ${vet.clinicName} - ${vet.location.city}, ${vet.location.state}`);
      console.log(`   Emergency: ${vet.isEmergencyAvailable ? 'Yes' : 'No'}, 24h: ${vet.is24Hours ? 'Yes' : 'No'}`);
      console.log(`   Rating: ${vet.rating}/5 (${vet.totalReviews} reviews)`);
      console.log(`   Phone: ${vet.contactInfo.phone}`);
      if (vet.contactInfo.emergencyPhone) {
        console.log(`   Emergency: ${vet.contactInfo.emergencyPhone}`);
      }
      console.log('');
    });

    console.log('Vet directory seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding vet directory:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedVetDirectory();
