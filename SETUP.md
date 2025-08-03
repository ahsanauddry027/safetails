# SafeTails Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/safetails

# JWT Secret Key (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Environment
NODE_ENV=development
```

## Database Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `safetails`
3. The application will automatically create the necessary collections

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## New Features Implemented

### ✅ User Profile Management
- **Profile Registration**: Enhanced registration with role selection and additional fields
- **Profile Viewing**: Complete profile page with user information display
- **Profile Editing**: Edit profile page for updating user information
- **Profile Deletion**: Secure profile deletion with confirmation

### ✅ Dynamic UI Based on User Roles
- **Guest Users**: See login/register options and general information
- **Logged-in Users**: Access to profile management and basic features
- **Veterinarians**: Special vet dashboard access and role-specific features
- **Admins**: Admin panel access and administrative features

### ✅ Role-Based Navigation
- Different navigation options based on user role
- Role badges and visual indicators
- Conditional rendering of features and links

## User Roles

1. **User** (default): Pet owners and rescuers
2. **Vet**: Veterinarians with special access
3. **Admin**: Administrators with full system access

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Profile Management
- `PUT /api/profile/update` - Update user profile
- `DELETE /api/profile/delete` - Delete user profile (soft delete)

## Pages

- `/` - Home page with dynamic content
- `/login` - Login page
- `/register` - Enhanced registration page
- `/profile` - User profile page
- `/edit-profile` - Edit profile page
- `/delete-profile` - Profile deletion confirmation

## Security Features

- JWT token authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Soft delete for user accounts
- Role-based access control
- Input validation and sanitization 