# SafeTails

A comprehensive pet safety and rescue platform built with Next.js, TypeScript, and MongoDB.

## Functional Features

### 🔐 User Management & Authentication
- **User Registration & Login** - Secure authentication with JWT tokens
- **Multi-Role System** - Support for Users, Veterinarians, and Administrators
- **Profile Management** - Users can update their profiles, contact information, and bio
- **Account Status Management** - Admin can block/unblock users with reasons

### 📍 Pet Posts & Rescue System
- **Pet Post Creation** - Create posts for missing, wounded, or emergency pet situations
- **Post Types**:
  - **Missing Pets** - Report lost pets with last seen location and date
  - **Emergency Cases** - Report pets in immediate danger
  - **Wounded Animals** - Report injured animals needing help
- **Geolocation Features** - Location-based post creation and search
- **Nearby Posts Search** - Find posts within specified distance radius
- **Post Management** - Update, resolve, or delete posts
- **Comments System** - Allow community interaction on posts
- **View Tracking** - Track post engagement
- **Status Management** - Posts can be active, resolved, or closed

### 🏥 Veterinary Services
- **Vet Request System** - Users can request veterinary services
- **Request Types**:
  - General checkups
  - Emergency consultations  
  - Vaccinations
  - Surgery consultations
  - Other medical needs
- **Vet Assignment** - Automatic or manual assignment of veterinarians
- **Appointment Scheduling** - Set appointment dates for consultations
- **Request Status Tracking** - Pending, accepted, completed, or cancelled states
- **Vet Dashboard** - Statistics and case management for veterinarians

### 👑 Admin Panel
- **User Management** - View, update, block, and delete user accounts
- **Content Moderation** - Manage and moderate pet posts
- **Statistics Dashboard** - Comprehensive analytics including:
  - Total users, vets, and admins
  - Post statistics by type and status
  - User activity metrics
- **Admin Creation** - Create new administrator accounts

### 🗺️ Location & Mapping
- **Geospatial Indexing** - MongoDB 2dsphere indexing for location queries
- **Interactive Maps** - React Leaflet integration for map display
- **Location-based Search** - Find posts and services near specific coordinates
- **Address Storage** - Store both coordinates and human-readable addresses

### 🔍 Search & Filtering
- **Post Filtering** - Filter by post type, status, and user
- **Pagination** - Efficient data loading with pagination
- **Proximity Search** - Location-based search with customizable radius
- **User Search** - Admin can search and filter users

### 📊 Analytics & Reporting
- **User Statistics** - Track user registrations and activity
- **Post Analytics** - Monitor post creation and resolution rates
- **Vet Performance** - Track veterinarian case loads and completion rates
- **Emergency Response** - Monitor emergency post response times

### 🔒 Security Features
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Different permissions for users, vets, and admins
- **Input Validation** - Server-side validation for all data inputs
- **Password Hashing** - Secure password storage with bcrypt

### 📱 API Architecture
- **RESTful API Design** - Well-structured API endpoints
- **Error Handling** - Comprehensive error responses
- **Database Integration** - MongoDB with Mongoose ODM
- **Response Standardization** - Consistent API response format

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Maps**: Leaflet & React Leaflet
- **Styling**: Tailwind CSS
- **File Uploads**: Formidable
- **HTTP Client**: Axios
