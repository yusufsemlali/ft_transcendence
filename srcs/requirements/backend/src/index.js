/**
 * ft_transcendence Backend Server
 * Express.js API (NGINX handles HTTPS)
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

// Initialize Express
const app = express()
const PORT = process.env.PORT || 8080

// ===================
// MIDDLEWARE
// ===================

// Security headers (but allow NGINX proxy)
app.use(helmet({
    contentSecurityPolicy: false, // NGINX handles this
}))

// CORS - allow from NGINX
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Trust proxy (NGINX)
app.set('trust proxy', 1)

// ===================
// ROUTES
// ===================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ft_transcendence-backend'
    })
})

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'ft_transcendence API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            users: 'GET /api/users (coming soon)',
            auth: 'POST /api/auth/login (coming soon)'
        }
    })
})

// TODO: Add more routes
// import authRoutes from './routes/auth.js'
// import userRoutes from './routes/users.js'
// app.use('/api/auth', authRoutes)
// app.use('/api/users', userRoutes)

// ===================
// ERROR HANDLING
// ===================
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' })
})

// ===================
// SERVER START
// ===================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     ft_transcendence Backend Started      ║
║                                           ║
║  Internal Port: ${PORT}                       ║
║  Access via NGINX: https://localhost/api  ║
╚═══════════════════════════════════════════╝
  `)
})
