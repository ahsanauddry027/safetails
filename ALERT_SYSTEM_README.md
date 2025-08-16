# Geolocation-Based Alert System

## Overview
The SafeTails platform now includes a comprehensive geolocation-based alert system that notifies users about nearby pet-related activities and emergencies. This system helps users stay informed about lost pets, found pets, foster requests, and other pet-related situations in their area.

## Features

### 🚨 **Alert Types**
- **Lost Pet**: Alerts for missing pets with detailed descriptions
- **Found Pet**: Notifications about found pets needing identification
- **Foster Request**: Temporary foster care needs
- **Emergency**: Urgent pet-related situations requiring immediate attention
- **Adoption**: Pets available for adoption
- **General**: Other pet-related announcements

### 📍 **Geolocation Features**
- **Location-based Filtering**: Alerts are filtered based on user's current location
- **Configurable Radius**: Users can set search radius from 1km to 100km
- **Real-time Updates**: Alerts are updated every 5 minutes
- **Map Integration**: Visual representation of alert locations using Leaflet.js

### 🔔 **Notification System**
- **Real-time Notifications**: Instant alerts for nearby activities
- **Urgency Levels**: Critical, High, Medium, and Low priority alerts
- **Smart Filtering**: Only shows relevant alerts based on user preferences
- **Auto-expiration**: Alerts can be set to expire automatically

## Technical Implementation

### Database Schema
```typescript
interface Alert {
  type: 'lost_pet' | 'found_pet' | 'foster_request' | 'emergency' | 'adoption' | 'general';
  title: string;
  description: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    city: string;
    state: string;
    radius: number; // Alert radius in kilometers
  };
  petDetails?: {
    petType: string;
    petBreed?: string;
    petColor?: string;
    petAge?: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'expired';
  createdBy: ObjectId;
  targetAudience: 'all' | 'nearby' | 'specific_area';
  expiresAt?: Date;
  isActive: boolean;
}
```

### API Endpoints
- `GET /api/alerts` - Retrieve alerts with geolocation filtering
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts?id={id}` - Update alert status
- `DELETE /api/alerts?id={id}` - Soft delete alert

### Geolocation Queries
The system uses MongoDB's `$near` operator with 2dsphere indexes for efficient location-based queries:

```javascript
filter.location = {
  $near: {
    $geometry: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    $maxDistance: radius * 1000 // Convert km to meters
  }
};
```

## User Experience

### Creating Alerts
1. Navigate to `/alerts` page
2. Click "Create Alert" button
3. Fill in alert details including:
   - Alert type and urgency
   - Pet details (if applicable)
   - Location with map integration
   - Target audience and expiration
4. Submit to create the alert

### Viewing Alerts
1. Visit `/alerts` page
2. Use filters to narrow down results:
   - Alert type
   - Urgency level
   - Status
   - Search radius
3. View alerts on map or in list format
4. Click on alerts for detailed information

### Real-time Notifications
- Notification bell appears in top-right corner
- Shows unread alert count
- Displays nearby alerts in dropdown
- Auto-refreshes every 5 minutes
- Click to mark as read

## Setup and Configuration

### Prerequisites
- MongoDB with 2dsphere indexes
- Leaflet.js for map integration
- User authentication system

### Installation
1. Ensure all dependencies are installed:
   ```bash
   npm install date-fns
   ```

2. Create the Alert model and controller files
3. Add the alerts API endpoint
4. Include AlertNotification component in your app layout

### Database Setup
The system automatically creates the necessary indexes:
- `location: '2dsphere'` for geospatial queries
- `type: 1, status: 1, isActive: 1` for filtering
- `urgency: 1, createdAt: -1` for sorting
- `expiresAt: 1` with TTL for automatic expiration

### Sample Data
Run the seeding script to populate sample alerts:
```bash
node scripts/seed-alerts.js
```

## Security Features

### Authentication
- All alert operations require user authentication
- Users can only edit/delete their own alerts
- Admin users have additional privileges

### Data Validation
- Required field validation
- Coordinate validation
- Radius limits (1-100km)
- Input sanitization

### Privacy Controls
- Location data is stored securely
- Users control their alert radius
- Target audience options for privacy

## Performance Optimizations

### Database Indexes
- Geospatial indexes for location queries
- Compound indexes for common filter combinations
- TTL indexes for automatic cleanup

### Caching Strategy
- Client-side caching of user location
- Periodic refresh of nearby alerts
- Efficient pagination for large result sets

### Query Optimization
- Location-based queries use geospatial indexes
- Filter combinations are optimized
- Pagination prevents large result sets

## Future Enhancements

### Planned Features
- **Push Notifications**: Browser and mobile push notifications
- **Email Alerts**: Email notifications for critical alerts
- **SMS Integration**: Text message alerts for emergencies
- **Alert Categories**: User-defined alert categories
- **Social Sharing**: Share alerts on social media
- **Analytics Dashboard**: Alert statistics and insights

### Scalability Considerations
- **Geographic Sharding**: Distribute alerts by region
- **Real-time Updates**: WebSocket integration for live updates
- **Machine Learning**: Smart alert matching and recommendations
- **Mobile App**: Native mobile application with push notifications

## Troubleshooting

### Common Issues
1. **Location Permission Denied**: Ensure browser allows location access
2. **No Alerts Showing**: Check if user location is available
3. **Map Not Loading**: Verify Leaflet.js is properly imported
4. **Database Errors**: Ensure MongoDB indexes are created

### Debug Mode
Enable debug logging in the AlertController for troubleshooting:
```javascript
console.log('Location query:', filter.location);
console.log('Query results:', alerts.length);
```

## Support and Maintenance

### Monitoring
- Monitor alert creation rates
- Track user engagement with notifications
- Monitor database performance for geospatial queries

### Maintenance
- Regular cleanup of expired alerts
- Database index optimization
- Performance monitoring and tuning

---

For technical support or feature requests, please contact the development team or create an issue in the project repository.
