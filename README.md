# Vrai - Luxury Bag Authentication Platform

A modern Express.js-based authentication platform for luxury bag verification with user registration, login, and file upload functionality.

## 🌟 Features

- **User Registration & Login**: Secure authentication system with email and password
- **Admin Dashboard**: Dedicated admin interface for managing authentication requests
- **File Upload System**: Support for uploading additional documentation and photos
- **Phone Number Validation**: International phone input with country detection
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Session Management**: Secure session handling and user state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm package manager

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd vrai-authentication-system
npm install
```

2. **Configure environment**:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (optional - defaults work for local development)
```

3. **Start the server**:
```bash
npm start
# or for development with auto-restart:
npm run dev
```

4. **Open in browser**:
Navigate to `http://localhost:3000`

## 📁 Project Structure

```
├── server.js                    # Express server with all API routes
├── package.json                 # Dependencies and scripts
├── .env                         # Environment configuration
├── .env.example                 # Environment template
├── index.html                   # Login page (main entry point)
├── signup.html                  # User registration page
├── signup.js                    # Registration form logic
├── script.js                    # Login form logic
├── dashboard.html               # User dashboard
├── dashboard-admin.html         # Admin dashboard
├── admin-session.js             # Session management
├── styles.css                   # Additional styles
├── uploads/                     # File upload directory
└── public/                      # Additional static files
    ├── authenticate-*.html      # Authentication workflow pages
    ├── admin-*.html            # Admin management pages
    └── settings.html           # User settings pages
```

## 🔧 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login

### User Data
- `GET /user/requests` - Get user's authentication requests

### File Upload
- `POST /api/requests/:id/upload` - Upload documents for authentication requests (standardized endpoint)

### System
- `GET /health` - Health check endpoint

## 🎯 Usage

### User Registration
1. Navigate to `http://localhost:3000/signup.html`
2. Fill in the registration form with:
   - Full name
   - Display name
   - Email address
   - Phone number (with international country detection)
   - Password
3. Submit to create account

### User Login
1. Navigate to `http://localhost:3000` (main login page)
2. Enter email and password
3. Regular users redirect to `dashboard.html`
4. Admin users redirect to `dashboard-admin.html`

### Test Credentials
```
Email: annabella.gray1980@gmail.com
Password: testing123
Role: Admin
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# API URLs (auto-detected by default)
API_BASE_URL_DEVELOPMENT=http://localhost:3000
API_BASE_URL_PRODUCTION=https://your-domain.com

# External APIs
IPINFO_TOKEN=eeba6ab611395d

# File Upload
MAX_FILE_SIZE=10485760          # 10MB
MAX_FILES_PER_UPLOAD=5
UPLOAD_DIR=uploads

# Security
CORS_ORIGIN=*
HELMET_ENABLED=true
SESSION_SECRET=your-secret-key
```

### Phone Number Integration
The registration form uses [intl-tel-input](https://github.com/jackocnr/intl-tel-input) for international phone number handling with:
- Automatic country detection via IP geolocation
- Full country list support
- Phone number validation
- Mobile-responsive interface

## 🔒 Security Features

- **Helmet.js**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **File Validation**: Type and size restrictions for uploads
- **Session Management**: Secure user session handling

## 🎨 Styling

Built with **Tailwind CSS** for:
- Responsive design system
- Consistent component styling
- Dark/light theme support
- Mobile-first approach

Custom color scheme:
- Primary: `#89CFF0` (Baby Blue)
- Fonts: Inter (body), Playfair Display (headings)

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface elements
- Optimized phone number input
- Mobile-specific validations

## 🛠️ Development

### Scripts
```bash
npm start        # Start production server
npm run dev      # Start development server (same as start)
npm test         # Run tests (placeholder)
```

## 📊 File Upload System

Supports uploading additional documentation with:
- **File Types**: JPG, PNG, PDF, DOC, DOCX
- **Size Limit**: 10MB per file
- **Quantity**: Up to 5 files per upload
- **Storage**: Local filesystem (`uploads/` directory)

## 🔄 Session Management

- Browser session storage for user state
- Admin role detection and routing
- Automatic session validation
- Secure logout handling

## 🚦 Error Handling

- Comprehensive server-side validation
- User-friendly error messages
- File upload error handling
- Network failure recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 