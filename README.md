# 🐾 SafeTails - Pet Safety & Rescue Platform

<div align="center">

![SafeTails Logo](https://img.shields.io/badge/SafeTails-Pet%20Safety%20Platform-blue?style=for-the-badge&logo=heart)

**A comprehensive pet safety and rescue platform built with Next.js, TypeScript, and MongoDB**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-blue?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

---

## 🚀 **Project Overview**

SafeTails is a comprehensive pet safety and rescue platform that connects pet owners, veterinarians, and animal lovers in times of need. Built with modern web technologies, it provides real-time location-based services for missing pets, emergency situations, and veterinary care coordination.

---

## ✨ **Core Features**

### 🔐 **User Management & Authentication**

- **🔑 Secure Registration & Login** - JWT-based authentication with bcrypt password hashing
- **👥 Multi-Role System** - Support for Users, Veterinarians, and Administrators
- **📝 Profile Management** - Complete profile editing with bio, contact info, and profile images
- **🗑️ Account Deletion** - Soft delete functionality with proper cleanup
- **🚫 User Blocking** - Admin controls for managing problematic users
- **✅ Email Verification** - OTP-based email verification system

### 📍 **Pet Posts & Rescue System**

- **🐕 Pet Post Creation** - Create detailed posts for missing, wounded, or emergency pet situations
- **📸 Multiple Photo Uploads** - Support for multiple high-quality pet images
- **📍 Location Pinning** - Interactive map integration for precise location marking
- **🔍 Advanced Search** - Filter by post type, location, pet category, and urgency
- **📱 Real-time Updates** - Live status tracking and resolution management
- **💬 Community Interaction** - Comments system for community engagement

#### **Post Types Supported:**

- **🔍 Missing Pets** - Report lost pets with last seen location and date
- **🚨 Emergency Cases** - Report pets in immediate danger
- **🏥 Wounded Animals** - Report injured animals needing medical attention
- **🏠 Foster Requests** - Temporary care and foster home requests
- **❤️ Adoption Posts** - Pet adoption opportunities

### 🏥 **Veterinary Services**

- **👨‍⚕️ Vet Request System** - Request veterinary consultations and services
- **📋 Request Types** - Checkups, emergency consultations, vaccinations, surgery consultations
- **📅 Appointment Scheduling** - Set and manage appointment dates
- **📊 Status Tracking** - Pending, accepted, completed, or cancelled states
- **📱 Vet Dashboard** - Comprehensive statistics and case management for veterinarians
- **📍 Location-based Matching** - Find nearby veterinarians for emergency situations

### 🗺️ **Advanced Mapping & Geolocation**

- **🌍 Interactive Maps** - React Leaflet integration with OpenStreetMap
- **📍 Location Services** - GPS-based location detection and manual pinning
- **🔍 Proximity Search** - Find posts and services within customizable radius
- **📱 Mobile Optimized** - Responsive design for mobile devices
- **🗺️ Geospatial Indexing** - MongoDB 2dsphere indexing for efficient location queries

### 🚨 **Alert System**

- **📢 Geolocation-based Alerts** - Location-aware alert notifications
- **🎯 Radius Filtering** - Smart filtering based on alert coverage area
- **⚡ Real-time Updates** - Instant notification system for urgent situations
- **📍 Location Tracking** - Precise location-based alert distribution
- **🔔 Smart Notifications** - Intelligent alert prioritization and delivery

### 🔍 **Search & Discovery**

- **🔎 Advanced Filtering** - Filter by post type, status, pet category, location, and date
- **📍 Location-based Search** - Find posts and services near specific coordinates
- **📱 Responsive Search** - Optimized search experience across all devices
- **🔄 Real-time Results** - Instant search results with live updates
- **📊 Smart Sorting** - Intelligent result ranking and relevance scoring

### 👑 **Admin Panel & Moderation**

- **👨‍💼 User Management** - Comprehensive user administration tools
- **🚫 Content Moderation** - Review and manage reported content
- **📊 Analytics Dashboard** - Detailed statistics and performance metrics
- **🔒 Security Controls** - Advanced security and access management
- **📈 Performance Monitoring** - Real-time system performance tracking

#### **Admin Features:**

- **👥 User Statistics** - Track registrations, activity, and engagement
- **📝 Post Analytics** - Monitor creation, resolution, and engagement rates
- **🏥 Vet Performance** - Track veterinarian case loads and completion rates
- **🚨 Emergency Response** - Monitor emergency post response times
- **🚫 Content Flagging** - Review and moderate inappropriate content

### 📧 **Email Services**

- **📨 OTP Verification** - Secure email verification with 6-digit codes
- **🔐 Password Reset** - Secure password recovery system
- **🎉 Welcome Emails** - Personalized welcome messages for new users
- **📱 Multiple Providers** - Support for Resend and SendGrid email services
- **⚡ Fast Delivery** - Optimized email delivery and delivery tracking

### 🔒 **Security Features**

- **🔐 JWT Authentication** - Secure token-based authentication system
- **🔒 Role-based Access Control** - Granular permissions for different user types
- **🛡️ Input Validation** - Comprehensive server-side validation
- **🔐 Password Security** - Secure password storage with bcrypt hashing
- **🚫 Rate Limiting** - Protection against brute force attacks
- **🔒 HTTPS Enforcement** - Secure communication protocols

---

## 🛠️ **Technology Stack**

### **Frontend**

- **⚛️ Next.js 15** - Full-stack React framework with App Router
- **⚛️ React 19** - Latest React with concurrent features
- **📝 TypeScript 5.0** - Type-safe JavaScript development
- **🎨 Tailwind CSS 3.3** - Utility-first CSS framework
- **🗺️ React Leaflet** - Interactive map components
- **📱 Responsive Design** - Mobile-first responsive layouts

### **Backend**

- **🚀 Next.js API Routes** - Serverless API endpoints
- **🗄️ MongoDB** - NoSQL database with Mongoose ODM
- **🔐 JWT Authentication** - JSON Web Token authentication
- **📧 Email Services** - Resend and SendGrid integration
- **📍 Geospatial Queries** - MongoDB 2dsphere indexing

### **Development Tools**

- **📦 Package Manager** - npm with package-lock.json
- **🔧 ESLint** - Code quality and consistency
- **🎯 TypeScript** - Static type checking
- **📱 Responsive Testing** - Cross-device compatibility
- **🚀 Performance Optimization** - Next.js optimization features

---

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js 18+
- MongoDB 6.0+
- npm or yarn package manager

### **Installation**

1. **Clone the repository**

```bash
git clone https://github.com/ahsanauddry027/safetails.git
cd safetails
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
cp .env.example .env.local
```

4. **Configure environment variables**

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

5. **Database Setup**

```bash
npm run db:setup
```

6. **Run the development server**

```bash
npm run dev
```

7. **Open your browser**

```
http://localhost:3000
```

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run db:seed      # Seed database with sample data
```

---

## 📱 **Features in Detail**

### **User Experience**

- **🎨 Modern UI/UX** - Clean, intuitive interface design
- **📱 Mobile-First** - Responsive design for all devices
- **⚡ Fast Performance** - Optimized loading and rendering
- **♿ Accessibility** - WCAG compliant accessibility features
- **🌙 Dark Mode** - Optional dark theme support

### **Location Services**

- **📍 GPS Integration** - Automatic location detection
- **🗺️ Interactive Maps** - Click-to-pin location selection
- **🔍 Proximity Search** - Find nearby services and posts
- **📱 Offline Support** - Basic offline functionality
- **🌍 Global Coverage** - Worldwide map support

### **Content Management**

- **📝 Rich Text Support** - Enhanced content creation
- **🖼️ Image Optimization** - Automatic image compression and optimization
- **📊 Content Analytics** - Engagement and performance tracking
- **🔄 Version Control** - Content revision history
- **📱 Multi-format Support** - Various content format support

---

## 🔧 **API Documentation**

### **Authentication Endpoints**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset

### **Post Management**

- `GET /api/posts` - Fetch posts with filtering
- `POST /api/posts` - Create new post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

### **User Management**

- `GET /api/profile` - Get user profile
- `PUT /api/profile/update` - Update profile
- `DELETE /api/profile/delete` - Delete profile

### **Admin Endpoints**

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/block-user` - Block/unblock user
- `GET /api/admin/posts` - Get all posts for moderation

---

## 📊 **Performance & Scalability**

- **⚡ Fast Loading** - Optimized bundle sizes and lazy loading
- **🔄 Caching** - Intelligent caching strategies
- **📱 PWA Ready** - Progressive Web App capabilities
- **🌐 CDN Ready** - Content Delivery Network optimization
- **📊 Analytics** - Comprehensive performance monitoring

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Standards**

- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Include proper documentation

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Next.js Team** - For the amazing framework
- **React Team** - For the powerful UI library
- **MongoDB Team** - For the robust database
- **Tailwind CSS Team** - For the utility-first CSS framework
- **Leaflet Team** - For the excellent mapping library

---

## 📞 **Support & Contact**

- **📧 Email**: ahsanauddry.ndc@gmail.com
- **🌐 Phone**: +8801601580044
- **📱 Discord**: [Send Me DM](@ahsanauddry)
- **🐙 GitHub**: [@ahsanauddry027](https://github.com/ahsanauddry027)
- **🐛 Issues**: [GitHub Issues](https://github.com/ahsanauddry027/safetails/issues)

---

<div align="center">

**Made with ❤️ by the SafeTails Team**

[![GitHub stars](https://img.shields.io/github/stars/ahsanauddry027/safetails?style=social)](https://github.com/ahsanauddry027/safetails)
[![GitHub forks](https://img.shields.io/github/forks/ahsanauddry027/safetails?style=social)](https://github.com/ahsanauddry027/safetails)
[![GitHub issues](https://github.com/ahsanauddry027/safetails/issues)](https://github.com/ahsanauddry027/safetails/issues)

</div>
