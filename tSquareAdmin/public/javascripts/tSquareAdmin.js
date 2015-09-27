/* Verify if the password and retype password fields are the same.
The check should happen when clicking the submit button.
There will be another check on the sever side.
Placeholder should be removed on click.
Escaping characters should be handled on the server side.
 */

function initGallery(tags) {
	/* *Testing area!!* Begin */
	var tagsList = $("<div id='tagsList'>");

	for (var i = 0; i < tags.length; i++) {
		tagsList.append($("<div id='" + tags[i].tag + "' class='tagUnselected' onclick='setSystemTag(event.currentTarget.id, event.currentTarget.parentElement.parentElement.id)'>").text(tags[i].tag));
	}

	/* *Testing area!!* End */
	var pictureList = $("#picturesListContainer"),
	pictureIndex,
	resolutionIndex,
	picturesFiles,
	pictureGalleryTags = [],
	resolutionsNo = 6,
	resolutions = [{
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
	];

	function scaleImage(img) {
		console.log(img.complete);

		if (resolutions[resolutionIndex].name !== 'original') {
			var height,
			width,
			aspectRatio = img.height / img.width,
			i;
			if (img.height < img.width) {
				width = resolutions[resolutionIndex].width;
				height = resolutions[resolutionIndex].width * img.height / img.width;
				/* aspectRatio = 2; */
			} else {
				width = resolutions[resolutionIndex].width * img.width / img.height;
				height = resolutions[resolutionIndex].width;
				/* aspectRatio = 1; */
			}

			var canvas = $("<canvas width='" + img.width + "' height='" + img.height + "'>")[0];
			var canvasCtx = canvas.getContext('2d');

			canvasCtx.drawImage(img, 0, 0);

			console.log(picturesFiles[pictureIndex].name + "width : " + width + ", height : " + height + ", occupiedCells : " + aspectRatio);
			resample_hermite(canvas, img.width, img.height, width, height);

			canvas.toBlob(function (blob) {
				console.log(blob);
				canvas = null;
				sendPictureData(blob, img, aspectRatio);
			}, "image/jpeg", 1.0);
		} else {
			sendPictureData(picturesFiles[pictureIndex], img, null);
		}
	};

	function loadImage() {
		var reader = new FileReader();
		reader.onloadend = function () {
			var img = new Image();
			var interval;
			
			img.src = reader.result;
			interval = window.setInterval(function () {
				if(img.complete) {
					window.clearInterval(interval);
					reade = null;
					scaleImage(img);
				}
			}, 100);
			console.log(reader.result);
			console.log(picturesFiles[pictureIndex].name + " width : " + img.naturalWidth + ", height : " + img.naturalHeight);
		}
		reader.readAsDataURL(picturesFiles[pictureIndex]);
	};

	function sendPictureData(blob, img, aspectRatio) {
		var formData = new FormData();

		console.log(resolutions[resolutionIndex].name);
		console.log(picturesFiles[pictureIndex].name);
		formData.append("collectionTarget", resolutions[resolutionIndex].name);
		
		if (aspectRatio != null) {
			formData.append("aspectRatio", aspectRatio);
		}
		if(pictureGalleryTags != null) {
			formData.append("pictureGalleryTags", pictureGalleryTags);
		}
		
		formData.append("blob", blob, picturesFiles[pictureIndex].name);

		// Using the core $.ajax() method
		$.ajax({

			// The URL for the request
			url : "gallery/pictures/insert",

			// Whether this is a POST or GET request
			type : "POST",

			// Set process data to false
			processData : false,

			// The data we send to the server
			data : formData,

			contentType : false /*  "multipart/form-data" */
		,

			// Code to run if the request succeeds;
			// the response is passed to the function
			success : function (response) {
				console.log(pictureIndex);
				console.log(picturesFiles.length);
				blob = null;

				if (resolutionIndex < resolutionsNo - 1) {
					resolutionIndex++;
					scaleImage(img);
				} else {
					resolutionIndex = 0;
					if (pictureIndex < picturesFiles.length - 1) {
						pictureIndex++;
						img = null;
						loadImage();
					} else {
						picturesFiles = [];
						pictureGalleryTags = [];
						
						location.reload();
					}
				}
			},

			// Code to run if the request fails; the raw request and
			// status codes are passed to the function
			error : function (xhr, status, errorThrown) {
				console.log("Error uplosding: " + errorThrown);
				console.log("Status: " + status);
				console.dir(xhr);
			}
		});
	};

	$("#submit").bind("click", function (event) {
		event.preventDefault();
		
		picturesFiles = [];
		pictureGalleryTags = [];

		picturesFiles = $("#addPictures")[0].files;
		$("#addFileForm > input:checked").each(function () {
			pictureGalleryTags.push(this.id);
		});
		console.log(picturesFiles);
		console.log(pictureGalleryTags);
		pictureIndex = 0;
		resolutionIndex = 0;
		if (picturesFiles.length !== 0)
			loadImage();
	});

	function deletePicture(id) {
		// Using the core $.ajax() method
		$.ajax({

			// The URL for the request
			url : "gallery/pictures/delete",

			// Whether this is a POST or GET request
			type : "POST",

			// The data we send to the server
			data : {
				picture : id
			},

			// Code to run if the request succeeds;
			// the response is passed to the function
			success : function (response) {
				location.reload();
			},

			// Code to run if the request fails; the raw request and
			// status codes are passed to the function
			error : function (xhr, status, errorThrown) {
				console.log("Error deleting: " + errorThrown);
				console.log("Status: " + status);
				console.dir(xhr);
			}
		});
	};

	function getPictureThumbnail(picture) {
		$.ajax({

			// The URL for the request
			url : "gallery/pictures/thumbnail/" + picture.filename,

			// Whether this is a POST or GET request
			type : "GET",

			cache : true,

			// Code to run if the request succeeds;
			// the response is passed to the function
			success : function (response) {
				var listItem = $("<div class='picture resizable' id='" + picture.filename + "'>");
				var deleteButton = $("<div id='" + picture.filename + "' class='deleteButton'>");
				var thumbnailDisplay = new Image();
				deleteButton.append($("<p>").text("Delete"));

				listItem.append(thumbnailDisplay);
				listItem.append($("<p>").text(picture.filename));
				listItem.append(tagsList[0].outerHTML);
				console.log(picture);
				if (picture.metadata != null) {
					if (picture.metadata.systemTag != null) {
						var tag = listItem.find("#" + picture.metadata.systemTag);
						tag.addClass("tagSelected");
						tag.bind("click", function (event) {
							setSystemTag(picture.metadata.systemTag, picture.filename);
						});
					}
				}
				listItem.append(deleteButton);

				pictureList.append(listItem);

				deleteButton.bind("click", function (event) {
					deletePicture(event.currentTarget.id);
				});
				thumbnailDisplay.src = "gallery/pictures/thumbnail/" + picture.filename;
			},

			// Code to run if the request fails; the raw request and
			// status codes are passed to the function
			error : function (xhr, status, errorThrown) {
				console.log("Error uplosding: " + errorThrown);
				console.log("Status: " + status);
				console.dir(xhr);
			}
		});
	};
	// Using the core $.ajax() method
	$.ajax({

		// The URL for the request
		url : "gallery/pictures",

		// Whether this is a POST or GET request
		type : "GET",

		// The type of data we expect back
		dataType : "json",

		// Code to run if the request succeeds;
		// the response is passed to the function
		success : function (response) {
			var index;
			var responseLength = response.length;
			for (index = 0; index < responseLength; index++) {
				getPictureThumbnail(response[index]);
			}
		},

		// Code to run if the request fails; the raw request and
		// status codes are passed to the function
		error : function (xhr, status, errorThrown) {

			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		} //,

		// Code to run regardless of success or failure
		/* complete: function( xhr, status ) {
		alert( "The request is complete!" );
		} */
	});

	function resizeDiv() {
		var resizeWindowElementWidth = ($(window).width() - (0.1 * $(window).width())) / 4;
		console.log($(".resizable"));
		$("#resizableElement").text(".resizable {width : " + resizeWindowElementWidth + "px;}");
	};
	/* $(".border").css({
	'height' : resizeWindowElementHeight,
	'width' : resizeWindowElementWidt
	};h
	}); */

	// We first want to resize the div to fit the screen.
	resizeDiv();
	// On window resize, we get the new height. Then we calculate and re-position everything that depends on it.
	$(window).resize(function () {
		resizeDiv();
		/* translationTo = scrollEvents * resizeWindowElementHeight;
		translate(translationTo); */
	});
}

function deleteTag(tagName) {
	// Using the core $.ajax() method
	$.ajax({

		// The URL for the request
		url : "tags/delete",

		// Whether this is a POST or GET request
		type : "POST",

		// Data payload
		data : {
			tag : tagName
		},

		// Code to run if the request succeeds;
		// the response is passed to the function
		/* success : function (response) {
		var index;
		var responseLength = response.length;
		for (index = 0; index < responseLength; index++) {
		getPictureThumbnail(response[index]);
		}
		}, */

		// Code to run if the request fails; the raw request and
		// status codes are passed to the function
		error : function (xhr, status, errorThrown) {

			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		} //,

		// Code to run regardless of success or failure
		/* complete: function( xhr, status ) {
		alert( "The request is complete!" );
		} */
	});
}

function setSystemTag(tag, id) {
	// Using the core $.ajax() method
	$.ajax({

		// The URL for the request
		url : "tags/system/set",

		// Whether this is a POST or GET request
		type : "POST",

		// The data we send to the server
		data : {
			tag : tag,
			pictureName : id
		},

		// Code to run if the request succeeds;
		// the response is passed to the function
		success : function (response) {
			// location.reload();
		},

		// Code to run if the request fails; the raw request and
		// status codes are passed to the function
		error : function (xhr, status, errorThrown) {
			console.log("Error deleting: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		}
	});
}
