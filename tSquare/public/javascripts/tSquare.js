var tSquareModule = (function () {

	var theModule = {};
	var resolutions = [{
			name : 'thumbnailSystem',
			width : 512,
			height : 256
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
	borderThickness = 0,
	translationStartTime = null,
	translationFrom = 0,
	translationTo = 0,
	translationEndSelector = [1, 0];
	translationSpeed = 0,
	translationDuration = 500,
	translationBusy = false,
	touchStartTime = null,
	touchMinSpeed = 0.9, // Pixels / Millisecond
	touchStartX = 0,
	touchStartY = 0,
	currentPositionIndicator = null,
	nextPositionIndicator = null;

	// Position dependent transletation
	function translatePoz(poz) {
		$("#contentLeft").css({
			'top' : poz + "px"
		});
		$("#contentRight").css({
			'bottom' : (resizeWindowPageHeight + poz) + "px"
		});
	};

	// Time dependent transletation
	function translate(progress) {
		var pozRadius = 0.5 * (progress / translationDuration);
		translatePoz(translationEndSelector[0] * (translationFrom + (translationSpeed * progress)) +
			translationEndSelector[1] * translationTo);
		currentPositionIndicator.setAttribute("r", 1 - pozRadius);
		nextPositionIndicator.setAttribute("r", 0.5 + pozRadius);
	};

	/* Rendering objects */
	function renderTranslation(timestamp) {
		var progress = 0,
		deltaT = 0;

		if (!translationStartTime) {
			translationStartTime = Date.now();
		} else {
			//We want to make sure that pozY is going to reach the translation.translateTo value.
			//Otherwise there is the chance that for the animation to not stop :(.
			deltaT = Date.now() - translationStartTime;
			if (deltaT < translationDuration) {
				progress = deltaT;
			} else {
				progress = translationDuration;
				translationEndSelector = [0, 1];
			}
			translate(progress);
		}
		if (progress != translationDuration) {
			window.requestAnimationFrame(renderTranslation);
		} else {
			translationStartTime = null;
			translationBusy = false;
			currentPositionIndicator = nextPositionIndicator;
			translationEndSelector = [1, 0];
		}
	};
	function renderZoomObject (elementId) {
		this.zoomTime = null,
		zoomLevel = 10,
		zoomDuration = 1000,
		zoomProgress = 0,
		zoomStop = true,
		zoomRunning = false,
		this.elementId = elementId;

		function zoom() {
			var zoomTmp = resizeWindowElementHeightBc * (1 + zoomProgress * (zoomLevel / 100) / zoomDuration);
				$(elementId).css({
					'background-size' : "auto " + zoomTmp + "px"
				});
		};

		function renderZoom(timestamp) {
			var zoomIntermediateTime = Date.now();

			zoomRunning = true;

			if (zoomStop == false) {
				zoomProgress += zoomIntermediateTime - zoomTime;
				if (zoomProgress > zoomDuration) {
					zoomProgress = zoomDuration;
				}
				zoom();
				zoomTime = zoomIntermediateTime;
				if (zoomProgress != zoomDuration) {
					window.requestAnimationFrame(renderZoom);
				} else {
					zoomTime = null;
					zoomRunning = false;
				}
			} else {
				zoomProgress -= zoomIntermediateTime - zoomTime;
				if (zoomProgress > 0) {
					zoomProgress = 0;
				}
				zoom();
				zoomTime = zoomIntermediateTime;

				if (zoomProgress != 0) {
					window.requestAnimationFrame(this.renderZoom);
				} else {
					zoomTime = null;
					zoomRunning = false;
				}
			}
		};

		this.toggleZoom = function () {
			zoomStop = !zoomStop;
			if (!zoomRunning) {
				window.requestAnimationFrame(this.renderZoom);
			}
		};
	}
	/* Rendering objects end */

	function scroll(deltaY) {
		if (!translationBusy) {
			var scrollDirection = 0;
			translationBusy = true;
			translationFrom = translationTo;
			if (deltaY < 0) {
				if (scrollEvents == 0) {
					translationBusy = false;
					return;
				}
				scrollDirection = 1;
				scrollEvents--;
			} else {
				if (scrollEvents == numberOfElemnts) {
					translationBusy = false;
					return;
				}
				scrollDirection = -1;
				scrollEvents++;
			}
			translationTo += (resizeWindowElementHeightBc * scrollDirection);
			// Here I'm getting the magnitude and the direction of the speed vector.
			translationSpeed = (translationTo - translationFrom) / translationDuration;
			// Set to he position indicators accordingly.
			nextPositionIndicator = $(".positionIndicator")[scrollEvents];

			window.requestAnimationFrame(renderTranslation);
		}
	};

	function resizeDiv() {
		var tmpResolutionIndex = resizeWindowResolutionIndex,
		resizeWindowElementHeight = $(window).height(),
		resizeWindowElementWidth = $(window).width(),
		elementsToload = $(".toLoad").length - 1;

		/* borderThickness = Math.floor((0.005 * resizeWindowElementWidth));
		borderThickness -= borderThickness % 2; */
		console.log(resizeWindowElementHeight);
		borderThickness = 10 + (resizeWindowElementHeight - (Math.floor(resizeWindowElementHeight)));

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

		$("#styleDynamic").text(".resizable {height : " + resizeWindowElementHeightBc + "px; " +
			"width : " + resizeWindowElementWidthBc + "px;}\n" +
			".contentDynamic {width : " + resizeWindowElementWidthBc / 2 + "px;}\n" +
			".socialDynamic {height : " + resizeWindowElementHeightBc / 2 + "px; " +
			"width : " + resizeWindowElementWidthBc / 2 + "px;}\n" +
			".contentRightDymamic {bottom : " + resizeWindowPageHeight + "px;}\n" +
			".resizableWindowDynamic {height : " + resizeWindowElementHeight + "px; " +
			"width : " + resizeWindowElementWidthBc + "px; " +
			"margin : " + borderThickness + "px;}\n" +
			".positionIndicatorsContainerDynamic {width : " + borderThickness + "px; " +
			"height : " + borderThickness * 3.2 + "px;}\n" +
			".borderHorizontalDynamic {height : " + borderThickness + "px;}\n");

		if (tmpResolutionIndex !== resizeWindowResolutionIndex) {
			$(".loadingBlind").css({
				'z-index' : 8
			});
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
						console.log(elementsToload);
						if (elementsToload == 0) {
							$(".loadingBlind").css({
								'z-index' : 0
							});
							$("#mapBox").src = 'https://a.tiles.mapbox.com/v4/3picioare.263c8f3b/attribution,zoompan,geocoder,share.html?access_token=pk.eyJ1IjoiM3BpY2lvYXJlIiwiYSI6Ijc0MjMwMjBiOTMxMzk5Nzc4YmMzMmM4N2Q0OWJmZGE1In0.y9eZyD7X2xmYZUJzuyqJwg';
						} else {
							elementsToload--;
						}
					},

					// Code to run if the request fails; the raw request and
					// status codes are passed to the function
					error : function (xhr, status, errorThrown) {
						console.log("Error : " + errorThrown);
					}
				});
			});
		};
	};

	theModule.init = function () {

		// Setting up the position indicators.
		var positionIndicatorsContainer = $(".positionIndicatorsContainer");

		for (var i = 0; i <= 3; i++) {
			var tmpCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

			tmpCircle.setAttribute("class", "positionIndicator");
			tmpCircle.setAttribute("cx", 2.5);
			tmpCircle.setAttribute("cy", i * 4 + 3);
			tmpCircle.setAttribute("r", i == 0 ? 1 : 0.5);

			currentPositionIndicator = i == 0 ? tmpCircle : currentPositionIndicator;
			nextPositionIndicator = i == 1 ? tmpCircle : nextPositionIndicator;

			positionIndicatorsContainer[0].appendChild(tmpCircle);
		}
		/* $("body").append(positionIndicatorsContainer); */
		/* $($(".positionIndicator")[0]).addClass("currentPosition"); */

		// We first want to resize the div to fit the screen.
		resizeDiv();

		// On window resize, we get the new height. Then we calculate and re-position everything that depends on it.
		$(window).resize(function () {
			resizeDiv();
			translationTo = -1 * scrollEvents * resizeWindowElementHeightBc;
			translatePoz(translationTo);
		});
		
		$(".portfolioItem").each(function () {
			var zoomRenderingInstance = new renderZoomObject(this.id);
			this.bind( "mouseenter mouseleave", function() {
				zoomRenderingInstance.zoomTime = Date.now();
				zoomRenderingInstance.toggleZoom();
			});
		});
		// We listen for wheel events and update the scene acordingly.
		$(window).bind("wheel", function (event) {
			console.log("wheel");
			scroll(event.originalEvent.deltaY);
			return false;
		});
		// We listen for key events and update the scene accordingly.
		$(window).bind("keydown", function (event) {
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
	// Gallery management
	function initGallery(galleryItems) {
		var galleryContainer = $(".galleryContainer"),
		columns = 4,
		baseWidth = ((resizeWindowElementWidthBc + borderThickness) / columns) - borderThickness,
		index,
		galleryItemsLength = galleryItems.length;

		for (index = 0; index < galleryItemsLength; index++) {
			var galleryItem = galleryItems[index];
			galleryItem.height = baseWidth * galleryItem.metadata.aspectRatio;
			galleryItem.left = (index % columns) * (baseWidth + borderThickness);
			galleryItem.top = (index < columns) ? 0 : (galleryItems[index - columns].top + galleryItems[index - columns].height + borderThickness);

			var listItem = $("<img class='galleryItem " + galleryItem.filename + "' src='gallery/pictures/thumbnail/" + galleryItem.filename + "'>");
			listItem.css({
				'width' : baseWidth,
				'height' : galleryItem.height,
				'left' : galleryItem.left,
				'top' : galleryItem.top
			});
			galleryItems[index] = galleryItem;
			galleryContainer.append(listItem);
		}
		galleryContainer.css({
			'height' : resizeWindowElementHeightBc,
			'width' : resizeWindowElementWidthBc,
			'z-index' : 6
		});
		$(".galleryContainerShade").css({
			'z-index' : 6
		});
		/* $(".resizableWindow").append(galleryContainer); */
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
