const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. CORE MIDDLEWARE ---
app.use(cors());

// Parse incoming JSON requests (essential for API bodies)
app.use(express.json({ limit: '50mb' }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- 2. API ROUTE DEFINITIONS ---
app.use('/api/auth', require('./routes/auth'));

// Placeholder: As you create new route files for the new Schema (Projects, Games), 
// uncomment and add them here:
// app.use('/api/projects', require('./routes/projects'));
// app.use('/api/games', require('./routes/games'));


// --- 3. ROOT ROUTE AND SERVER STARTUP ---
app.get('/', (req, res) => res.send('LumoFlow API is running successfully.'));

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
    } catch (error) {
        console.error("🔴 Failed to start server:", error);
        process.exit(1);
    }
};

startServer();