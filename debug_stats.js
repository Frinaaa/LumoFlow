const mongoose = require('mongoose');
const { User } = require('./electron/models');
require('dotenv').config();

async function checkStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email linesWritten bugsDetected totalScore').sort({ updatedAt: -1 }).limit(5);
        console.log('--- RECENT USERS & STATS ---');
        users.forEach(u => {
            console.log(`${u.name} (${u.email}): Lines: ${u.linesWritten}, Bugs: ${u.bugsDetected}, Score: ${u.totalScore}, ID: ${u._id}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkStats();
