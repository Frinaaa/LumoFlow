const mongodb = require('mongodb');
require('dotenv').config();

const MongoClient = mongodb.MongoClient;
const mongoUrl = process.env.MONGO_URL;
let db;
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(process.env.DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });

module.exports = {
  getDb: () => db,
};
