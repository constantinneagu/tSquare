var express = require('express');
var router = express.Router();
var assert = require('assert');

/* Add user logic.
 * TODO: Nothing for the moment
 */
router.post('/add', function(request, response, next) {
  assert.notEqual(null, request.body);
  assert.notEqual(null, request.body.newProjectName);

  var db = require('../databases/tSquareMongoDB.js').db();
  var projects = db.collection('projects');
  projects.find({name: request.body.newProjectName}).count(false, function(err, count) {
  	assert.equal(null, err);
  	if (count === 1) {
  		response.send('The project is already in the system. Please choose another one. ');
  	} else {
  		projects.insertOne({name: request.body.newProjectName}, function(err, r) {
  			assert.equal(null, err);
  			assert.equal(1, r.insertedCount);
  			response.send('Project added!');
  		});
  	}
  });
});

router.post('/list', function(request, response, next) {
  var db = require('../databases/tSquareMongoDB.js').db();
  var projectsCollection = db.collection('projects');

  projectsCollection.find({}, {_id : false}).toArray(function (err, projects) {
    assert.equal(null, err);
    console.log(err);
    console.log(projects);
    response.send(projects);
  });
});

module.exports = router;
