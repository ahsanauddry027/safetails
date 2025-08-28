// scripts/migrate-alerts.js
// Migration script to update existing alerts to include GeoJSON type field

const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/safetails",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

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

async function migrateAlerts() {
  try {
    console.log("Starting alert migration...");

    // Find all alerts that don't have the type field in location
    const alertsToUpdate = await Alert.find({
      $or: [
        { "location.type": { $exists: false } },
        { "location.type": { $ne: "Point" } },
      ],
    });

    console.log(`Found ${alertsToUpdate.length} alerts to migrate`);

    if (alertsToUpdate.length === 0) {
      console.log(
        "No alerts need migration. All alerts are already in the correct format."
      );
      return;
    }

    // Update each alert to include the type field
    let updatedCount = 0;
    for (const alert of alertsToUpdate) {
      try {
        await Alert.updateOne(
          { _id: alert._id },
          {
            $set: {
              "location.type": "Point",
              updatedAt: new Date(),
            },
          }
        );
        updatedCount++;
        console.log(`Updated alert: ${alert.title}`);
      } catch (error) {
        console.error(`Failed to update alert ${alert._id}:`, error.message);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} alerts.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Run the migration
migrateAlerts();
