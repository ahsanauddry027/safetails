const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/safetails', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Report Schema (simplified for seeding)
const reportSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetPost',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['inappropriate_content', 'spam', 'fake_information', 'harassment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model('Report', reportSchema);

// Sample report data
const sampleReports = [
  {
    postId: '507f1f77bcf86cd799439011', // Replace with actual post ID
    reportedBy: '507f1f77bcf86cd799439012', // Replace with actual user ID
    reason: 'inappropriate_content',
    description: 'This post contains inappropriate language and content that violates community guidelines.',
    status: 'pending'
  },
  {
    postId: '507f1f77bcf86cd799439013', // Replace with actual post ID
    reportedBy: '507f1f77bcf86cd799439014', // Replace with actual user ID
    reason: 'spam',
    description: 'This appears to be a spam post promoting unrelated services.',
    status: 'pending'
  },
  {
    postId: '507f1f77bcf86cd799439015', // Replace with actual post ID
    reportedBy: '507f1f77bcf86cd799439016', // Replace with actual user ID
    reason: 'fake_information',
    description: 'The information in this post seems to be false or misleading.',
    status: 'pending'
  }
];

async function seedReports() {
  try {
    // Clear existing reports
    await Report.deleteMany({});
    console.log('Cleared existing reports');

    // Insert sample reports
    const reports = await Report.insertMany(sampleReports);
    console.log(`Inserted ${reports.length} sample reports`);

    // Display the created reports
    console.log('\nSample reports created:');
    reports.forEach((report, index) => {
      console.log(`${index + 1}. ${report.reason} - ${report.status}`);
    });

    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding reports:', error);
    mongoose.connection.close();
  }
}

// Run the seeding function
seedReports();
