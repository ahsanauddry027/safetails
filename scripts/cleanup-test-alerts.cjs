// scripts/cleanup-test-alerts.cjs
// Script to clean up any test alerts created by seed scripts

const mongoose = require("mongoose");

// Connect to MongoDB (using default localhost)
mongoose.connect("mongodb://localhost:27017/safetails", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the Alert schema (same as in models/Alert.ts)
const AlertSchema = new mongoose.Schema({
  type: String,
  title: String,
  description: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: [Number],
    address: String,
    city: String,
    state: String,
    zipCode: String,
    radius: Number,
  },
  petDetails: {
    petType: String,
    petBreed: String,
    petColor: String,
    petAge: String,
    petGender: String,
  },
  urgency: String,
  status: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  targetAudience: String,
  expiresAt: Date,
  isActive: Boolean,
  notificationSent: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

const Alert = mongoose.model("Alert", AlertSchema);

async function cleanupTestAlerts() {
  try {
    console.log("Starting cleanup of test alerts...");

    // Find all alerts
    const allAlerts = await Alert.find({});
    console.log(`Found ${allAlerts.length} total alerts in database`);

    if (allAlerts.length === 0) {
      console.log("No alerts found. Database is already clean.");
      return;
    }

    // Display all alerts before deletion
    console.log("\nAlerts found:");
    allAlerts.forEach((alert, index) => {
      console.log(
        `${index + 1}. ${alert.title} (${alert.type || "unknown type"}) - Created: ${alert.createdAt}`
      );
    });

    // Delete all alerts
    const deleteResult = await Alert.deleteMany({});
    console.log(`\nDeleted ${deleteResult.deletedCount} alerts successfully`);

    // Verify deletion
    const remainingAlerts = await Alert.find({});
    console.log(`Remaining alerts: ${remainingAlerts.length}`);

    if (remainingAlerts.length === 0) {
      console.log("✅ Database cleanup completed successfully!");
    } else {
      console.log("⚠️ Some alerts could not be deleted");
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Run the cleanup function
cleanupTestAlerts();
