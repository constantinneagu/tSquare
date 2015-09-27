var express = require('express');
var router = express.Router();
var assert = require('assert');
var Busboy = require('busboy');

/* Tags io logic.
 * ToDo: Single and Bulk upload of pictures.
 *       Metadata editing.
 *       Bulk Upload directly in a category.
 *       Category editing
 *       Security ?
 */
var resolutions = [{
		name : 'thumbnail',
		width : 512,
		height : 256
	}, {
		name : 'xga',
		width : 1024,
		height : 768
	}, {
		name : 'wxga',
		width : 1280,
		height : 800
	}, {
		name : 'hd',
		width : 1366,
		height : 768
	}, {
		name : 'fhd',
		width : 1920,
		height : 1080
	}, {
		name : 'original'
	}
], resolutionsNo = 6;

router.get('/', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');

	systemTags.find({}, {
		_id : false
	}).toArray(function (err, tags) {
		assert.equal(null, err);
		console.log(tags)
		res.render('tags', {
			tags : tags
		});
	});
});

router.get('/tags', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');

	systemTags.find({}).toArray(function (err, tags) {
		assert.equal(null, err);
		res.json(tags);
	});
});

router.post('/insert', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');

	console.log(req.headers);

	var busboy = new Busboy({
			headers : req.headers
		});
	busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
		console.log('Fieldname [' + fieldname + ']: val: ' + val);
		assert.equal('tagName', fieldname);
		assert.notEqual(null, val);

		systemTags.insertOne({
			tag : val
		}, function (err, result) {
			assert.equal(null, err);
			assert.equal(1, result.insertedCount);
		});
	});

	busboy.on('finish', function () {
		console.log('Done parsing form!');
		res.writeHead(200, {
			Connection : 'close',
			Location : '/tags'
		});
		res.end();
	});
	req.pipe(busboy);
});

router.post('/delete', function (req, res, next) {
	var tag = req.body.tag;
	console.log(tag);
	assert.notEqual(null, tag);
	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');

	// Verify if the tag exist
	systemTags.deleteOne({
		tag : tag
	}, function (err, result) {
		assert.equal(null, err);
		assert.equal(1, result.deletedCount);
		res.writeHead(200, {
			Connection : 'close',
			Location : '/tags'
		});
		res.end();
	});

});

router.post('/system/set', function (req, res, next) {
	assert.notEqual(null, req.body.tag);
	assert.notEqual(null, req.body.pictureName);

	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');
	var thumbnailCollection = db.collection('thumbnail.files');

	console.log(req.headers);

	systemTags.findOne({
		tag : req.body.tag
	}, function (err, tag) {
		assert.equal(null, err);
		assert.notEqual(null, tag);
		console.log(tag.tag);

		thumbnailCollection.findOne({
			filename : req.body.pictureName
		}, function (err, file) {
			assert.equal(null, err);
			assert.notEqual(null, file);
			console.log(file);

			thumbnailCollection.findOneAndUpdate({
				'metadata.systemTag' : tag.tag
			}, {
				$set : {
					'metadata.systemTag' : null
				}
			}, function (err, result) {
				assert.equal(null, err);
				console.log(result);

				thumbnailCollection.findOneAndUpdate({
					filename : req.body.pictureName
				}, {
					$set : {
						'metadata.systemTag' : tag.tag
					}
				}, function (err, result) {
					assert.equal(null, err);
					assert.notEqual(null, result);
					console.log(result);

					var db = require('../databases/tSquareMongoDB.js').db();
					var GridStore = require('mongodb').GridStore;
					var picture = result.value.filename;

					// Verify if the file exist
					var resolutionIndex = 0;
					function existsCallback(err, result) {
						assert.equal(null, err);
						assert.equal(true, result);
						console.log('File ' + picture + ' exists in collection: ' + resolutions[resolutionIndex].name);
						if (resolutionIndex < resolutionsNo - 1) {
							resolutionIndex++;
							GridStore.exist(db, picture, resolutions[resolutionIndex].name, existsCallback);
						} else {
							// Open the files from all archives (one by one) and stream them to the active collection.
							resolutionIndex = 0;
							function openAndStream() {
								console.log(resolutionIndex);
								var sourceStream = new GridStore(db, picture, 'r', {
										root : resolutions[resolutionIndex].name
									}).stream();
								var targetStream = new GridStore(db, tag.tag, 'w', {
										root : resolutions[resolutionIndex].name + 'System'
									}).stream();
								console.log('Starting to stream : ' + resolutions[resolutionIndex].name);

								targetStream.on('end', function () {
									console.log('File: ' + picture + 'streamed from collection: ' + resolutions[resolutionIndex].name + ' to collection: ' + resolutions[resolutionIndex].name + 'System');
									if (resolutionIndex < resolutionsNo - 1) {
										resolutionIndex++;
										openAndStream();
									} else {
										res.writeHead(200, {
											Connection : 'close'
										});
										res.end();
									}
								});
								sourceStream.pipe(targetStream);
							};
							openAndStream();
						}
					};
					GridStore.exist(db, picture, resolutions[resolutionIndex].name, existsCallback);
				});
			});
		});
	});
});

module.exports = router;
