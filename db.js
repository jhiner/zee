const MongoClient = require('mongodb').MongoClient;

let _db;

module.exports.connect = function(callback) {

    if (_db) {
        console.log('rturn');
        return callback(err, _db);
    }

    // Use connect method to connect to the server
    MongoClient.connect(process.env.MONGO_URI, function(err, client) {
        if (err) return callback(err);
        console.log('DB Connected');
        _db = client.db('zee');
        return callback(null, _db);
    });
};

module.exports.get = function() {
    console.log('Get db');
    return _db;
}