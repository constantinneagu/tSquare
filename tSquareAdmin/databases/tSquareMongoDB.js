var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var MONGODB_URI = 'mongodb://tSquaredUser:tSquaredUser@localhost:27017/tSquared'
var mongoDB = null;

exports.init = function (callback) {
	MongoClient.connect(MONGODB_URI, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to server");
		//console.log(db);
		mongoDB = db;
		callback();
	});
}

exports.db = function () {
	//console.log(mongoDB);
	return mongoDB;
}