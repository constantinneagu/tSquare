var express = require('express');
var router = express.Router();
var assert = require('assert');

/* Login logic.
 * ToDo: Store the timestamp of the login event.
 *       Set a cookie on the client with expiration time and session ID.
 *       Generate and store (in the DB ) a unique session ID.
 */
router.post('/', function(request, response, next) {
  assert.notEqual(null, request.body.username);
  assert.notEqual(null, request.body.password);
  var db = require('../databases/tSquareMongoDB.js').db();
  var users = db.collection('users');
  users.findOne({$and: [{username: request.body.username}, {password: request.body.password}]}, function(err, user) {
	assert.equal(null, err);
	if (user == null) {
		response.send('Unknown username and password combination');
	} else {
		response.redirect('/gallery');
	}
  });
});

module.exports = router;