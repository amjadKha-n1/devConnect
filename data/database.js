const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connect () {
    const client = await MongoClient.connect(process.env.MONGO_URL);
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
