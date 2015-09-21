var express = require('express');
var router = express.Router();
var assert = require('assert');

/* Add user logic.
 * TODO: Nothing for the moment
 */
router.post('/', function(request, response, next) {
  assert.notEqual(null, request.body);
  assert.strictEqual(request.body.password, request.body.retypePassword, 'The passwords do not match');
  
  var db = require('../databases/tSquareMongoDB.js').db();
  var users = db.collection('users');
  users.find({username: request.body.username}).count(false, function(err, count) {
	assert.equal(null, err);
	if (count === 1) {
		response.send('The username you chose is taken. Please choose another one. ');
	} else {
		users.insertOne({username: request.body.username, password: request.body.password}, function(err, r) {
			assert.equal(null, err);
			assert.equal(1, r.insertedCount);
			response.send('User created successfully!');
		});
	}
  }); 
  
  console.log(request.body);
  //response.send('respond with a resource');

  module.exports = router;
});

module.exports = router;