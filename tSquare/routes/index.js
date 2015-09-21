var express = require('express');
var assert = require('assert');
var router = express.Router();

var resolutions = [{
		name : 'thumbnailSystem',
		width : 260,
		height : 130
	}, {
		name : 'xgaSystem',
		width : 1024,
		height : 768
	}, {
		name : 'wxgaSystem',
		width : 1280,
		height : 800
	}, {
		name : 'hdSystem',
		width : 1366,
		height : 768
	}, {
		name : 'fhdSystem',
		width : 1920,
		height : 1080
	}, {
		name : 'originalSystem'
	}
], resolutionsNo = 6;

/* GET home page. */
router.get('/', function (req, res, next) {
	var db = require('../databases/tSquareMongoDB.js').db();
	res.render('index' /* , {
		background : 'url("/images/background.jpg")',
		backgroundAll : 'url("/images/backgroundAll.jpg")',
		backgroundExt : 'url("/images/backgroundExt.jpg")',
		backgroundInt : 'url("/images/backgroundInt.jpg")',
		backgroundArch : 'url("/images/backgroundArch.jpg")',
		backgroundStd : 'url("/images/backgroundStd.jpg")',
		backgroundAboutUs : 'url("/images/backgroundAboutUs.jpg")',
		backgroundAboutYou : 'url("/images/backgroundAboutYou.jpg")'
		} */
	);
});

/* Check the Etag for this request */
function checkEtag(req, res, next) {
	if (req.fileName == null || req.collection == null) {
		res.writeHead(404);
		res.end();
		return;
	}

	var db = require('../databases/tSquareMongoDB.js').db();
	var filesCollection = db.collection(req.collection + '.files');

	filesCollection.findOne({
		filename : req.fileName
	}, {
		_id : true
	}, function (err, file) {
		if (err != null || file == null) {
			res.writeHead(404);
			res.end();
		} else {
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
		}
	});
};
/* File retrieve and send method */
function getFile(req, res) {
	console.log(req.fileName + ' bla');
	if (req.fileName == null || req.collection == null) {
		res.writeHead(404);
		res.end();
		return;
	}

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
			console.log('file.open');
			var fileStream = file.stream();
			fileStream.on('end', function () {
				console.log('fileStream.on');
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
router.get('/pictures/thumbnailSystem/:thumbnail', function (req, res, next) {
	console.log(req.params.thumbnail + ' bla');
	assert.notEqual(null, req.params.thumbnail);
	req.fileName = req.params.thumbnail;
	req.collection = resolutions[1].name;

	next();
}, checkEtag, getFile);

/* Original retrieve method  */
router.get('/pictures/originalSystem/:original', function (req, res, next) {
	console.log(req.params.original + ' bla');
	assert.notEqual(null, req.params.original);
	req.fileName = req.params.original;
	req.collection = resolutions[0].name;
	next();

}, checkEtag, getFile);

/* Xga retrieve method  */
router.get('/pictures/xgaSystem/:xga', function (req, res, next) {
	console.log(req.params.xga + ' bla');
	assert.notEqual(null, req.params.xga);
	req.fileName = req.params.xga;
	req.collection = resolutions[2].name;
	next();

}, checkEtag, getFile);

/* Wxga retrieve method  */
router.get('/pictures/wxgaSystem/:wxga', function (req, res, next) {
	console.log(req.params.wxga + ' bla');
	assert.notEqual(null, req.params.wxga);
	req.fileName = req.params.wxga;
	req.collection = resolutions[3].name;
	next();

}, checkEtag, getFile);

/* Hd retrieve method  */
router.get('/pictures/hdSystem/:hd', function (req, res, next) {
	console.log(req.params.hd + ' bla');
	assert.notEqual(null, req.params.hd);
	req.fileName = req.params.hd;
	req.collection = resolutions[4].name;
	next();

}, checkEtag, getFile);

/* fhd retrieve method  */
router.get('/pictures/fhdSystem/:fhd', function (req, res, next) {
	console.log(req.params.fhd + ' bla');
	assert.notEqual(null, req.params.fhd);
	req.fileName = req.params.fhd;
	req.collection = resolutions[5].name;
	next();

}, checkEtag, getFile);

module.exports = router;
