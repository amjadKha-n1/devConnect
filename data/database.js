const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connect () {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not defined. Check your environment variables!");
    }
    const client = await MongoClient.connect(mongoUri);
    database = client.db();
};

function getDb() {
    if(!database) {
        throw{ message: "Database connection not established!" };
    };
    return database;
};

module.exports = {
    connectToDatabase: connect,
    getDb: getDb
};
