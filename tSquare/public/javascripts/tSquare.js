var tSquareModule = (function () {

	var theModule = {};
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
	],
	resolutionsNo = 6,
	scrollEvents = 0,
	numberOfElemnts = 3,
	resizeWindowElementHeightBc = 0,
	resizeWindowElementWidthBc = 0,
	resizeWindowPageHeight = 0,
	resizeWindowResolutionIndex = -1,
	translationStartTime = null,
	translationFrom = 0,
	translationTo = 0,
	animationSpeed = 0,
	animationDuration = 500,
	animationBusy = false,
	touchStartTime = null,
	touchMinSpeed = 0.9, // Pixels / Millisecond
	touchStartX = 0,
	touchStartY = 0;

	function translate(poz) {
		$("#content_left").css({
			'top' : poz + "px"
		});
		$("#content_right").css({
			'bottom' : (resizeWindowPageHeight + poz) + "px"
		});
	};

	function renderTranslation(timestamp) {
		var pozY = null;
		var progress = 0;

		if (!translationStartTime) {
			translationStartTime = Date.now();
		} else {
			//We want to make sure that pozY is going to reach the translation.translateTo value.
			//Otherwise there is the chance that for the animation to not stop :(.
			progress = Math.min(Date.now() - translationStartTime, animationDuration);

			pozY = translationFrom + (animationSpeed * progress);
			translate(pozY);
		}
		if (pozY != translationTo) {
			window.requestAnimationFrame(renderTranslation);
		} else {
			translationStartTime = null;
			animationBusy = false;
		}
	};

	function scroll(deltaY) {
		if (!animationBusy) {
			var scrollDirection = 0;
			animationBusy = true;
			translationFrom = translationTo;
			if (deltaY < 0) {
				if (scrollEvents == 0) {
					animationBusy = false;
					return;
				}
				scrollDirection = 1;
				scrollEvents--;
			} else {
				if (scrollEvents == numberOfElemnts) {
					animationBusy = false;
					return;
				}
				scrollDirection = -1;
				scrollEvents++;
			}
			translationTo += (resizeWindowElementHeightBc * scrollDirection);
			// Here I'm getting the magnitude and the direction of the speed vector.
			animationSpeed = (translationTo - translationFrom) / animationDuration;

			window.requestAnimationFrame(renderTranslation);

			// Set to he position indicators accordingly.
			$($(".positionIndicator")[scrollEvents + scrollDirection]).removeClass("currentPosition");
			$($(".positionIndicator")[scrollEvents]).addClass("currentPosition");
		}
	};

	function resizeDiv() {
		var tmpResolutionIndex = resizeWindowResolutionIndex;
		var resizeWindowElementHeight = $(window).height();
		var resizeWindowElementWidth = $(window).width();

		var borderThickness = Math.floor((0.015 * resizeWindowElementWidth));
		borderThickness -= borderThickness % 2;

		resizeWindowElementHeightBc = resizeWindowElementHeight - (borderThickness * 2);
		resizeWindowElementWidthBc = resizeWindowElementWidth - (borderThickness * 2);

		resizeWindowPageHeight = numberOfElemnts * resizeWindowElementHeightBc;

		function searchInterval(resolutionIndex) {
			if (resolutions[resolutionIndex].width === resizeWindowElementWidth ||
				resolutionIndex === 0 || resolutionIndex === 5) {
				resizeWindowResolutionIndex = resolutionIndex;
			}
			if (resolutions[resolutionIndex].width > resizeWindowElementWidth) {
				if (resolutions[resolutionIndex - 1].width < resizeWindowElementWidth) {
					resizeWindowResolutionIndex = resolutionIndex;
				} else {
					searchInterval(resolutionIndex - 1);
				}
			}
			if (resolutions[resolutionIndex].width < resizeWindowElementWidth) {
				if (resolutions[resolutionIndex + 1].width > resizeWindowElementWidth) {
					resizeWindowResolutionIndex = resolutionIndex + 1;
				} else {
					searchInterval(resolutionIndex + 1);
				}
			}
		};
		searchInterval(3);
		console.log(resizeWindowResolutionIndex);

		if (tmpResolutionIndex !== resizeWindowResolutionIndex) {
			var imageURL = "pictures/" + resolutions[resizeWindowResolutionIndex].name + "/";
			$(".image").each(function () {
				var imageElement = this;
				// Using the core $.ajax() method
				$.ajax({

					// The URL for the request
					url : imageURL + imageElement.id,

					// Whether this is a POST or GET request
					type : "GET",

					cache : true,

					// Set process data to false
					processData : false,

					// Code to run if the request succeeds;
					// the response is passed to the function
					success : function (response) {
						imageElement.style.backgroundImage = 'url(' + imageURL + imageElement.id + ')';
					},

					// Code to run if the request fails; the raw request and
					// status codes are passed to the function
					error : function (xhr, status, errorThrown) {
						console.log("Error : " + errorThrown);
					}
				});
			});
		};

		$(".resizable").css({
			'height' : resizeWindowElementHeightBc,
			'width' : resizeWindowElementWidthBc
		});
		$(".content").width(resizeWindowElementWidthBc / 2);

		$(".social").css({
			'height' : resizeWindowElementHeightBc / 2,
			'width' : resizeWindowElementWidthBc / 2
		});
		$("#content_right").css({
			'bottom' : resizeWindowPageHeight + "px"
		});
		$(".resizableWindow").css({
			'height' : resizeWindowElementHeight,
			'width' : resizeWindowElementWidthBc
		});
		$(".borderVertical, .positionIndicatorsContainer").css({
			'width' : borderThickness
		});
		$(".borderHorizontal").css({
			'height' : borderThickness
		});
		$(".globalMargin").css({
			'margin' : borderThickness
		});
		$(".border").css({
			'margin-left' : borderThickness,
			'margin-right' : borderThickness
		});
	};

	theModule.init = function () {

		// We first want to resize the div to fit the screen.
		resizeDiv();

		// Setting up the position indicators.
		var positionIndicatorsContainer = $(".positionIndicatorsContainer");
		for (var i = 0; i <= 3; i++) {
			positionIndicatorsContainer.append($("<div class='positionIndicator'>"));
		}
		$($(".positionIndicator")[0]).addClass("currentPosition");

		// On window resize, we get the new height. Then we calculate and re-position everything that depends on it.
		$(window).resize(function () {
			resizeDiv();
			translationTo = -1 * scrollEvents * resizeWindowElementHeightBc;
			translate(translationTo);
		})
		// We listen for wheel events and update the scene acordingly.
		$(window).bind("wheel", function (event) {
			console.log("wheel");
			scroll(event.originalEvent.deltaY);
			return false;
		})
		// We listen for key events and update the scene accordingly.
		$(window).keydown(function (event) {
			console.log("keydown");
			switch (event.originalEvent.key) {
			case "PageDown":
				scroll(1);
				return false;
			case "ArrowDown":
				scroll(1);
				return false;
			case "ArrowUp":
				scroll(-1);
				return false;
			case "PageUp":
				scroll(-1);
				return false;
			}
		});
		// We listen for touch events and update the scene accordingly.
		$(".resizeable").bind("touchstart", function (event) {
			console.log("touchstart");
			console.log(event.originalEvent.changedTouches.length);
			if (event.originalEvent.changedTouches.length == 1) {
				touchObj = event.originalEvent.changedTouches[0];
				touchStartTime = Date.now();
				touchStartX = touchObj.pageX;
				touchStartY = touchObj.pageY;
			}
		});
		// We listen for touch events and update the scene accordingly.
		$(".resizeable").bind("touchend", function (event) {
			console.log("touchend");
			if (event.originalEvent.changedTouches.length == 1) {
				touchObj = event.originalEvent.changedTouches[0];
				var deltaTouchTime = Date.now() - touchStartTime;
				var deltaTouchX = touchStartX - touchObj.pageX;
				var deltaTouchY = touchStartY - touchObj.pageY;

				if (Math.abs(deltaTouchX) < Math.abs(deltaTouchY)) {
					var touchSpeed = Math.abs(deltaTouchY) / deltaTouchTime;
					if (touchSpeed >= touchMinSpeed)
						scroll(deltaTouchY);
				}
			}
		});

		// We listen for mouse events and update the scene accordingly.
		$(".resizeable").bind("mousedown", function (event) {
			console.log("mousedown");
			touchObj = event.originalEvent;
			touchStartTime = Date.now();
			touchStartX = touchObj.clientX;
			touchStartY = touchObj.clientY;
		});
		// We listen for mouse events and update the scene accordingly.
		$(".resizeable").bind("mouseup", function (event) {
			console.log("mouseup");
			touchObj = event.originalEvent;
			var deltaTouchTime = Date.now() - touchStartTime;
			var deltaTouchX = touchStartX - touchObj.clientX; ;
			var deltaTouchY = touchStartY - touchObj.clientY;

			if (Math.abs(deltaTouchX) < Math.abs(deltaTouchY)) {
				var touchSpeed = Math.abs(deltaTouchY) / deltaTouchTime;
				if (touchSpeed >= touchMinSpeed)
					scroll(deltaTouchY);
			}
		});

		// We listen for events for test purposes.
		$(".resizeable").bind("mousemove", function (event) {
			event.preventDefault();
			console.log("mousemove");
		});

		// We listen for events for test purposes.
		$(".resizeable").bind("drag", function (event) {
			console.log("drag");
		});

		// We listen for events for test purposes.
		$(".resizeable").bind("touchmove", function (event) {
			event.preventDefault();
			console.log("touchmove");
		});

		// We listen for events for test purposes.
		$(".resizeable").bind("scroll", function (event) {
			event.preventDefault();
			console.log("scroll");
		});

		// We listen for events for test purposes.
		$(".resizeable").bind("MSPointerMove", function (event) {
			console.log("MSPointerMove");
		});
	};
	
	function initGallery (galleryItems) {
		var galleryContainer = $("<div class='galleryContainer'>");
		var itemWidth = resizeWindowElementWidthBc / 4;
		
		for (item in galleryItems) {
			console.log(item);
			var listItem = $("<div class='galleryItem" + item.filename + "'>");
			var thumbnail = new Image();
			
			listItem.append(thumbnail);
			thumbnail.src = "gallery/thumbnail/" + item.filename;
			thumbnail.css({
				'width' : itemWidth * item.metadata.occupiedWidthCells
			});
			galleryContainer.append(listItem);
		}
		$(".resizableWindow").append(galleryContainer);
	};

	theModule.galleryFilter = function (filterTag) {
		// Using the core $.ajax() method
		$.ajax({

			// The URL for the request
			url : "gallery/list/" + filterTag,

			// Whether this is a POST or GET request
			type : "GET",

			// The type of data we expect back
			dataType : "json",

			cache : true,

			// Set process data to false
			processData : false,

			// Code to run if the request succeeds;
			// the response is passed to the function
			success : function (response) {
				console.log(response);
				initGallery(response);
			},

			// Code to run if the request fails; the raw request and
			// status codes are passed to the function
			error : function (xhr, status, errorThrown) {
				console.log("Error : " + errorThrown);
			}
		});
	};

	return theModule;
}
	());
