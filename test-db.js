require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n=== MongoDB Connection Test ===\n');
console.log('Connection String:', process.env.MONGO_URI.replace(/:([^:]+)@/, ':****@'));
console.log('\nAttempting connection...\n');

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ SUCCESS! Connected to MongoDB Atlas');
        console.log('Database:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        mongoose.disconnect();
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ FAILED! Could not connect to MongoDB Atlas\n');
        console.error('Error Code:', err.code);
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('\n--- Troubleshooting ---');

        if (err.message.includes('bad auth') || err.code === 8000) {
            console.error('\n🔧 Authentication Failed - Possible causes:');
            console.error('   1. Password in .env does NOT match MongoDB Atlas user password');
            console.error('   2. Username is case-sensitive (check if it should be "frinapv" vs "Frinapv")');
            console.error('   3. Database user does not exist in MongoDB Atlas');
            console.error('\n✅ Solution:');
            console.error('   Go to: https://cloud.mongodb.com/');
            console.error('   → Database Access → Edit user "Frinapv"');
            console.error('   → Reset password to match .env file: Frina149');
            console.error('   → Or create new user if it doesn\'t exist');
        }

        process.exit(1);
    });
