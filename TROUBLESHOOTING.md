# Troubleshooting Alert Creation Issues

## Problem: Alerts are disappearing and not being saved to MongoDB

If you're experiencing issues where alert posts disappear and aren't saved to your MongoDB database, follow these troubleshooting steps:

## 1. Check Environment Variables

Make sure you have a `.env.local` file in your project root with the following variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/safetails
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/safetails

# JWT Secret (required for authentication)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Environment
NODE_ENV=development
```

## 2. Test Database Connection

Visit `/api/test-db` in your browser or run the test script:

```bash
node scripts/test-alert-creation.js
```

This will verify:

- MongoDB connection
- Alert creation functionality
- Database schema validation

## 3. Check Browser Console

Open your browser's developer tools and check the console for any error messages when creating alerts. Look for:

- Network request failures
- JavaScript errors
- Authentication errors

## 4. Check Server Logs

Monitor your Next.js server console for:

- Database connection errors
- Authentication failures
- Validation errors
- MongoDB operation failures

## 5. Verify Authentication

Ensure you're logged in before creating alerts. Check that:

- Your user account exists in the database
- Your JWT token is valid
- You're not blocked or inactive

## 6. Common Issues and Solutions

### Issue: "Authentication required" error

**Solution**: Make sure you're logged in and your session hasn't expired.

### Issue: "Validation failed" error

**Solution**: Check that all required fields are filled:

- Alert type
- Title
- Description
- Location (address, city, state)
- Coordinates (if using map)

### Issue: "Invalid coordinates" error

**Solution**: Ensure coordinates are in the correct format:

- Longitude: -180 to 180
- Latitude: -90 to 90
- Format: [longitude, latitude]

### Issue: Database connection timeout

**Solution**: Check your MongoDB connection string and ensure the database is accessible.

## 7. Manual Database Test

If the issue persists, test alert creation directly in MongoDB:

```javascript
// In MongoDB shell or Compass
db.alerts.insertOne({
  type: "test",
  title: "Test Alert",
  description: "Test description",
  location: {
    type: "Point",
    coordinates: [0, 0],
    address: "Test Address",
    city: "Test City",
    state: "Test State",
    radius: 10,
  },
  urgency: "low",
  targetAudience: "all",
  createdBy: ObjectId("000000000000000000000000"),
  status: "active",
  isActive: true,
  notificationSent: false,
});
```

## 8. Reset and Restart

If all else fails:

1. Stop your Next.js server
2. Clear browser cookies and local storage
3. Restart your Next.js server
4. Try logging in again and creating an alert

## 9. Get Help

If you're still experiencing issues:

1. Check the server console for detailed error logs
2. Verify your MongoDB version and compatibility
3. Ensure all required dependencies are installed
4. Check if there are any firewall or network restrictions

## 10. Recent Fixes Applied

The following issues have been fixed in the latest update:

- ✅ Added missing `type: "Point"` field to location objects
- ✅ Enhanced error logging and validation
- ✅ Improved database connection stability
- ✅ Added comprehensive input validation
- ✅ Fixed frontend form data structure
- ✅ Added debug logging for troubleshooting

These fixes should resolve the alert disappearing issue. If problems persist, the enhanced logging will provide more detailed information about what's going wrong.
