const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safetails', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Alert Schema (simplified for seeding)
const alertSchema = new mongoose.Schema({
  type: String,
  title: String,
  description: String,
  urgency: String,
  status: String,
  location: {
    coordinates: [Number, Number],
    address: String,
    city: String,
    state: String,
    radius: Number
  },
  petDetails: {
    petType: String,
    petBreed: String,
    petColor: String,
    petAge: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetAudience: String,
  isActive: Boolean,
  notificationSent: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const Alert = mongoose.model('Alert', alertSchema);

// Sample alert data
const sampleAlerts = [
  {
    type: 'lost_pet',
    title: 'Lost Golden Retriever - Max',
    description: 'Our beloved dog Max went missing from Central Park area. He is friendly and responds to his name. Last seen wearing a red collar.',
    urgency: 'high',
    status: 'active',
    location: {
      coordinates: [-74.0060, 40.7128], // New York City
      address: 'Central Park, New York',
      city: 'New York',
      state: 'NY',
      radius: 15
    },
    petDetails: {
      petType: 'Dog',
      petBreed: 'Golden Retriever',
      petColor: 'Golden',
      petAge: '3 years old'
    },
    targetAudience: 'nearby',
    isActive: true,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'emergency',
    title: 'Injured Cat Found - Needs Immediate Help',
    description: 'Found an injured cat near the subway station. Appears to have a broken leg and needs urgent veterinary care.',
    urgency: 'critical',
    status: 'active',
    location: {
      coordinates: [-74.0060, 40.7128], // New York City
      address: 'Times Square Subway Station',
      city: 'New York',
      state: 'NY',
      radius: 20
    },
    petDetails: {
      petType: 'Cat',
      petBreed: 'Domestic Shorthair',
      petColor: 'Gray and white',
      petAge: 'Unknown'
    },
    targetAudience: 'nearby',
    isActive: true,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'foster_request',
    title: 'Temporary Foster Needed for Puppy',
    description: 'Looking for a temporary foster home for a 2-month-old puppy. Can provide food and supplies. Need help for 2 weeks.',
    urgency: 'medium',
    status: 'active',
    location: {
      coordinates: [-74.0060, 40.7128], // New York City
      address: 'Brooklyn Heights',
      city: 'Brooklyn',
      state: 'NY',
      radius: 25
    },
    petDetails: {
      petType: 'Dog',
      petBreed: 'Mixed Breed',
      petColor: 'Brown and black',
      petAge: '2 months old'
    },
    targetAudience: 'nearby',
    isActive: true,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'found_pet',
    title: 'Found Small Dog - No Collar',
    description: 'Found a small white dog wandering alone in Prospect Park. Very friendly and well-behaved. No identification.',
    urgency: 'medium',
    status: 'active',
    location: {
      coordinates: [-73.9690, 40.6602], // Brooklyn
      address: 'Prospect Park, Brooklyn',
      city: 'Brooklyn',
      state: 'NY',
      radius: 18
    },
    petDetails: {
      petType: 'Dog',
      petBreed: 'Maltese',
      petColor: 'White',
      petAge: 'Adult'
    },
    targetAudience: 'nearby',
    isActive: true,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'adoption',
    title: 'Adorable Kittens Available for Adoption',
    description: 'Three 8-week-old kittens looking for forever homes. All vaccinated and healthy. Great with children.',
    urgency: 'low',
    status: 'active',
    location: {
      coordinates: [-73.9352, 40.7308], // Queens
      address: 'Queens Animal Shelter',
      city: 'Queens',
      state: 'NY',
      radius: 30
    },
    petDetails: {
      petType: 'Cat',
      petBreed: 'Domestic Longhair',
      petColor: 'Various colors',
      petAge: '8 weeks old'
    },
    targetAudience: 'nearby',
    isActive: true,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedAlerts() {
  try {
    // Clear existing alerts
    await Alert.deleteMany({});
    console.log('Cleared existing alerts');

    // Insert sample alerts
    const createdAlerts = await Alert.insertMany(sampleAlerts);
    console.log(`Successfully created ${createdAlerts.length} sample alerts`);

    // Display created alerts
    createdAlerts.forEach(alert => {
      console.log(`- ${alert.type.toUpperCase()}: ${alert.title} (${alert.urgency} urgency)`);
    });

    console.log('\nAlert seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding alerts:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedAlerts();
