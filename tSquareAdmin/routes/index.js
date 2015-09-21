var express = require('express');
var router = express.Router();
var assert = require('assert');

/* Entry point logic. 
 * ToDo: Check session cookie.
 *       Confront the data from the cookie with the data from the database.
 *       If session is expired or cookie not present or cookie invalid, request authentication.
 *       Reset cookie and timestamp for every request.(This might need a more generalized router.)
*/
router.get('/', function(req, res, next) {
  var db = require('../databases/tSquareMongoDB.js').db();
  var users = db.collection('users');
  users.find({}).count(false, function(err, count) {
	assert.equal(null, err);
	if (count === 0) {
		res.render('addUser');
	} else {
		res.render('login');
	}
  });
  
});

module.exports = router;