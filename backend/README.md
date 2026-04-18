# Backend Setup Instructions

## Environment Variables

Create a `.env` file in this directory with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/anantaware
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

## Installation

```bash
npm install
```

## Start Server

```bash
npm start
```

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- cors: Cross-origin resource sharing
- dotenv: Environment variable management
- jsonwebtoken: JWT tokens (for future use)
- nodemailer: Email service (optional)

## API Routes

- `/` - Authentication routes (login, register, profile)
- `/admin` - Admin management routes
- `/manager` - Manager operations routes

