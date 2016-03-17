var express = require('express');
var router = express.Router();
var assert = require('assert');
var Busboy = require('busboy');

/* Gallery io logic.
 * ToDo: Single and Bulk upload of pictures.
 *       Metadata editing.
 *       Bulk Upload directly in a category.
 *       Category editing.
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
], resolutionsNo = 6,
galleryTags = ['interior', 'exterior', 'concepts', 'photography'];

router.get('/', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	var systemTags = db.collection('systemTags');

	systemTags.find({}, {_id : false}).toArray(function (err, tags) {
		assert.equal(null, err);
		res.render('gallery', {
			systemTags : tags,
			galleryTags : galleryTags
		});
	});
});

router.post('/pictures', function (req, res, next) {
	assert.notEqual(null, req.body);
  assert.notEqual(null, req.body.project);

	var db = require('../databases/tSquareMongoDB.js').db();
	// var thumbnailsCollection = db.collection('thumbnail.files');
	//
	// thumbnailsCollection.find({}, {
	// 	_id : false,
	// 	filename : true,
	// 	'metadata.systemTag' : true,
	// 	'metadata.aspectRatio' : true
	// }).toArray(function (err, thumbnails) {
	// 	assert.equal(null, err);
	// 	// // console.log(thumbnails);
	// 	res.json(thumbnails);
	// });

	var projects = db.collection('projects');
  projects.find({name: req.body.project}).limit(1).next(function(err, project) {
  	assert.equal(null, err);
  	console.log(project);
		res.json(project.pictures);
  });
});
/* Check the Etag for this request */
function checkEtag(req, res, next) {
	assert.notEqual(null, req.fileName);
	assert.notEqual(null, req.collection);

	var db = require('../databases/tSquareMongoDB.js').db();
	var filesCollection = db.collection(req.collection + '.files');

	filesCollection.findOne({
		filename : req.fileName
	}, {
		_id : true
	}, function (err, file) {
		assert.equal(null, err);
		var eTag = file._id.getTimestamp().valueOf();
		if (eTag == req.get('If-None-Match')) {
			res.writeHead(304, {
				Etag : eTag
			});
			res.end();
		} else {
			req.eTag = eTag;
			next();
		}
	});
};
/* File retrieve and send method */
function getFile(req, res) {
	// console.log(req.fileName + ' bla');
	assert.notEqual(null, req.fileName);
	assert.notEqual(null, req.collection);

	var db = require('../databases/tSquareMongoDB.js').db();
	var GridStore = require('mongodb').GridStore;

	GridStore.exist(db, req.fileName, req.collection, function (err, result) {
		assert.equal(null, err);
		assert.equal(true, result);
		var file = new GridStore(db, req.fileName, 'r', {
				root : req.collection
			});
		file.open(function (err, file) {
			assert.equal(null, err);
			// console.log('file.open');
			var fileStream = file.stream();
			fileStream.on('end', function () {
				// console.log('fileStream.on');
				res.end();
			});
			res.set({
				'Cache-Control' : 'public, max-age=259200',
				'Etag' : req.eTag
			});
			fileStream.pipe(res);
		});
	});
};

/* Thumbnail retrieve method  */
router.get('/pictures/thumbnail/:thumbnail', function (req, res, next) {
	// console.log(req.params.thumbnail + ' bla');
	assert.notEqual(null, req.params.thumbnail);
	req.fileName = req.params.thumbnail;
	req.collection = resolutions[0].name;

	next();
}, checkEtag, getFile);

/* Original retrieve method  */
router.get('/pictures/original/:original', function (req, res, next) {
	// console.log(req.params.original + ' bla');
	assert.notEqual(null, req.params.original);
	req.fileName = req.params.original;
	req.collection = resolutions[5].name;
	next();

}, checkEtag, getFile);

/* Xga retrieve method  */
router.get('/pictures/xga/:xga', function (req, res, next) {
	// console.log(req.params.xga + ' bla');
	assert.notEqual(null, req.params.xga);
	req.fileName = req.params.xga;
	req.collection = resolutions[1].name;
	next();

}, checkEtag, getFile);

/* Wxga retrieve method  */
router.get('/pictures/wxga/:wxga', function (req, res, next) {
	// console.log(req.params.wxga + ' bla');
	assert.notEqual(null, req.params.wxga);
	req.fileName = req.params.wxga;
	req.collection = resolutions[2].name;
	next();

}, checkEtag, getFile);

/* Hd retrieve method  */
router.get('/pictures/hd/:hd', function (req, res, next) {
	// console.log(req.params.hd + ' bla');
	assert.notEqual(null, req.params.hd);
	req.fileName = req.params.hd;
	req.collection = resolutions[3].name;
	next();

}, checkEtag, getFile);

/* fhd retrieve method  */
router.get('/pictures/fhd/:fhd', function (req, res, next) {
	// console.log(req.params.fhd + ' bla');
	assert.notEqual(null, req.params.fhd);
	req.fileName = req.params.fhd;
	req.collection = resolutions[4].name;
	next();

}, checkEtag, getFile);

router.post('/pictures/insert', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	var GridStore = require('mongodb').GridStore;
	var collectionTarget,
	aspectRatio = null,
	pictureGalleryTags = [];
	// console.log(req.headers);

	var busboy = new Busboy({
			headers : req.headers,
			fileHwm : 1024 * 1024,
			highWaterMark : 1024 * 1024
		});
	busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
		// console.log('Fieldname [' + fieldname + ']: val: ' + val);
		if (fieldname === 'aspectRatio') {
			aspectRatio = val;
		} else {
			if (fieldname === 'collectionTarget') {
				collectionTarget = val;
			} else {
				if (fieldname === 'pictureGalleryTags') {
					pictureGalleryTags = val.split(",");
				} else {
					// console.log('Unknown parameter in request');
					res.writeHead(404, {
						Connection : 'close',
						Location : '/gallery'
					});
					res.end();
				}
			}
		}
	});
	busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
		// console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
		if (fieldname === 'blob') {
			// Add the new metadata.
			var pictures = new GridStore(db, filename, 'w', {
					root : collectionTarget,
					metadata : {
						aspectRatio : aspectRatio,
						pictureGalleryTags : pictureGalleryTags
					}
				});
			pictures.open(function (err, pictures) {
				assert.equal(null, err);
				file.on('data', function (data) {
					file.pause();
					//// console.log('File [' + filename + '] got ' + data.length + ' bytes');
					pictures.write(data, function (err, pictures) {
						assert.equal(null, err);
						//// console.log('data written');
						file.resume();
					});
				});
				file.on('end', function () {
					// console.log('File [' + filename + '] Finished');
					pictures.close(function (err, result) {
						assert.equal(null, err);
						// console.log('File written');
					});
				});
			});
		} else {
			// console.log('Unknown parameter in request');
			res.writeHead(404, {
				Connection : 'close',
				Location : '/gallery'
			});
			res.end();
		}
	});
	busboy.on('finish', function () {
		// console.log('Done parsing form!');
		res.writeHead(200, {
			Connection : 'close',
			Location : '/gallery'
		});
		res.end();
	});
	req.pipe(busboy);
});

router.post('/pictures/delete', function (req, res, next) {
	var picture = req.body.picture;
	// console.log(picture);
	assert.notEqual(null, picture);
	var db = require('../databases/tSquareMongoDB.js').db();
	var GridStore = require('mongodb').GridStore;

	// Verify if the file exist
	var resolutionIndex = 0;
	function existsCallback(err, result) {
		assert.equal(null, err);
		assert.equal(true, result);
		// console.log('File ' + picture + ' exists in collection: ' + resolutions[resolutionIndex].name);
		if (resolutionIndex < resolutionsNo - 1) {
			resolutionIndex++;
			GridStore.exist(db, picture, resolutions[resolutionIndex].name, existsCallback);
		} else {
			// Delete the files from all archives.
			resolutionIndex = 0;
			function openAndDelete(err, pictures) {
				assert.equal(null, err);
				// console.log(resolutionIndex);
				// console.log('Starting to delete : ' + resolutions[resolutionIndex].name);
				pictures.unlink(function (err, result) {
					assert.equal(null, err);
					// console.log('Deleted file: ' + picture + ' from collection: ' + resolutions[resolutionIndex].name);
					if (resolutionIndex < resolutionsNo - 1) {
						resolutionIndex++;
						pictures = new GridStore(db, picture, 'w', {
								root : resolutions[resolutionIndex].name
							});
						pictures.open(openAndDelete);
					} else {
						res.writeHead(200, {
							Connection : 'close'
						});
						res.end();
					}
				});
			};
			var pictures = new GridStore(db, picture, 'w', {
					root : resolutions[resolutionIndex].name
				});
			pictures.open(openAndDelete);
		}
	};
	GridStore.exist(db, picture, resolutions[resolutionIndex].name, existsCallback);

});
module.exports = router;
