import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safetails";

// Define Alert Schema (simplified version for testing)
const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "lost_pet",
      "found_pet",
      "foster_request",
      "emergency",
      "adoption",
      "general",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return (
            v.length === 2 &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90
          );
        },
        message:
          "Coordinates must be [longitude, latitude] with longitude between -180 and 180, latitude between -90 and 90",
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: String,
    radius: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 10,
    },
  },
  urgency: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["active", "resolved", "expired"],
    default: "active",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ["all", "nearby", "specific_area"],
    default: "nearby",
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes
AlertSchema.index({ "location.coordinates": "2dsphere" });
AlertSchema.index({ type: 1, status: 1, isActive: 1 });
AlertSchema.index({ urgency: 1, createdAt: -1 });

const Alert = mongoose.model("Alert", AlertSchema);

async function testAlertCreation() {
  try {
    console.log("🔍 Testing Alert Creation...");
    console.log("MongoDB URI:", MONGODB_URI ? "Set" : "Not set");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test 1: Create a simple alert
    console.log("\n📝 Test 1: Creating simple alert...");
    const testAlert1 = new Alert({
      type: "test",
      title: "Test Alert 1",
      description: "This is a test alert",
      location: {
        type: "Point",
        coordinates: [0, 0],
        address: "Test Address",
        city: "Test City",
        state: "Test State",
        radius: 10,
      },
      createdBy: new mongoose.Types.ObjectId(),
    });

    const savedAlert1 = await testAlert1.save();
    console.log("✅ Alert 1 saved successfully:", savedAlert1._id);

    // Test 2: Create another alert with different data
    console.log("\n📝 Test 2: Creating another alert...");
    const testAlert2 = new Alert({
      type: "lost_pet",
      title: "Lost Dog - Max",
      description: "Golden retriever lost in downtown area",
      location: {
        type: "Point",
        coordinates: [90.3564, 23.8103], // Dhaka coordinates
        address: "Downtown Dhaka",
        city: "Dhaka",
        state: "Dhaka",
        radius: 5,
      },
      petDetails: {
        petType: "Dog",
        petBreed: "Golden Retriever",
        petColor: "Golden",
        petAge: "3 years",
      },
      urgency: "high",
      createdBy: new mongoose.Types.ObjectId(),
    });

    const savedAlert2 = await testAlert2.save();
    console.log("✅ Alert 2 saved successfully:", savedAlert2._id);

    // Test 3: Query alerts
    console.log("\n🔍 Test 3: Querying alerts...");
    const allAlerts = await Alert.find({}).sort({ createdAt: -1 });
    console.log(`✅ Found ${allAlerts.length} alerts in database`);

    allAlerts.forEach((alert, index) => {
      console.log(
        `  ${index + 1}. ${alert.title} (${alert.type}) - ${alert.status}`
      );
    });

    // Test 4: Test geospatial query
    console.log("\n🗺️ Test 4: Testing geospatial query...");
    const nearbyAlerts = await Alert.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [90.3564, 23.8103], // Dhaka
          },
          $maxDistance: 10000, // 10km in meters
        },
      },
    });
    console.log(`✅ Found ${nearbyAlerts.length} alerts within 10km of Dhaka`);

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await Alert.deleteMany({ type: "test" });
    await Alert.deleteMany({ title: "Lost Dog - Max" });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);

    if (error.name === "ValidationError") {
      console.error("Validation errors:");
      Object.keys(error.errors).forEach((key) => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }

    if (error.name === "MongoServerError") {
      console.error("MongoDB server error:", error.message);
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  }
}

// Run the test
testAlertCreation();
