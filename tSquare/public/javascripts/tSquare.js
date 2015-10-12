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
	horizontalBorderThickness = 0,
	verticalBorderThickness = 0,
	touchStartTime = null,
	touchMinSpeed = 0.9, // Pixels / Millisecond
	touchStartX = 0,
	touchStartY = 0,
	currentPositionIndicator = null,
	nextPositionIndicator = null,
	portfolioItemListeners = [],
	renderTranslationInstance = null,
	renderingQueue = [],
	renderingRunning = false;

	// Queue rendering function

	function renderQueue(timestamp) {
		var renderingChangeSense = false;

		renderingRunning = true;

		for (var renderingIndex = 0; renderingIndex < renderingQueue.length; renderingIndex++) {

			if (renderingQueue[renderingIndex].active) {
				renderingChangeSense = true;
				renderingQueue[renderingIndex].getChanges();
			}
		}

		if (renderingChangeSense) {
			window.requestAnimationFrame(renderQueue);
		} else {
			renderingRunning = false;
		}
	};

	/* Rendering objects */
	function renderTranslationObject() {
		var translationStartTime = null,
		translationEndSelector = [1, 0];
		this.translationDuration = 500;
		this.translationSpeed = 0;
		this.translationFrom = 0;
		this.translationTo = 0;
		this.translationBusy = false;
		this.active = false;

		// Position dependent transletation
		this.translatePoz = function (poz) {
			$("#contentLeft").css({
				'top' : poz + "px"
			});
			$("#contentRight").css({
				'bottom' : ((horizontalBorderThickness * 2) + poz) + "px"
			});
		};

		// Time dependent transletation
		function translate(progress) {
			var pozRadius = 0.5 * (progress / renderTranslationInstance.translationDuration);
			currentPositionIndicator.setAttribute("r", 1 - pozRadius);
			nextPositionIndicator.setAttribute("r", 0.5 + pozRadius);
			renderTranslationInstance.translatePoz(translationEndSelector[0] * (renderTranslationInstance.translationFrom + (renderTranslationInstance.translationSpeed * progress)) +
				translationEndSelector[1] * renderTranslationInstance.translationTo);
		};

		this.getChanges = function () {
			var progress = 0,
			deltaT = 0;

			if (!translationStartTime) {
				translationStartTime = Date.now();
			} else {
				//We want to make sure that pozY is going to reach the translation.translateTo value.
				//Otherwise there is the chance that for the animation to not stop :(.
				deltaT = Date.now() - translationStartTime;
				if (deltaT < renderTranslationInstance.translationDuration) {
					progress = deltaT;
				} else {
					progress = renderTranslationInstance.translationDuration;
					translationEndSelector = [0, 1];
				}

				if (progress == renderTranslationInstance.translationDuration) {
					translationStartTime = null;
					renderTranslationInstance.translationBusy = false;
					currentPositionIndicator = nextPositionIndicator;
					translationEndSelector = [1, 0];
					renderTranslationInstance.active = false;
				}
				translate(progress);
			}
		}
	};
	
	function renderZoomObject(elementId) {
		this.zoomTime = null;
		this.elementId = elementId;
		this.zoomProgress = 0;
		this.zoomDuration = 2000;
		this.zoomSpeed = 0.00001;
		this.zoomNegative = true;
		this.active = false;

		this.zoom = function () {
			var zoomTmp = 1 + this.zoomSpeed * this.zoomProgress ;
			$("#" + this.elementId).css({
				'-webkit-transform' : "scale(" + zoomTmp + " )",
				'-moz-transform' : "scale(" + zoomTmp + " )",
				'-o-transform' : "scale(" + zoomTmp + " )",
				'-ms-transform' : "scale(" + zoomTmp + " )",
				'transform' : "scale(" + zoomTmp + " )"
			});
			document.getElementById(this.elementId + "GradientStop").setAttribute("offset", (8000 * this.zoomSpeed * this.zoomProgress) + "%");
		};

		this.getChanges = function () {
			var zoomIntermediateTime = Date.now();

			if (this.zoomNegative == false) {
				this.zoomProgress += zoomIntermediateTime - this.zoomTime;
				if (this.zoomProgress > this.zoomDuration) {
					this.zoomProgress = this.zoomDuration;
				}
				this.zoomTime = zoomIntermediateTime;
				if (this.zoomProgress == this.zoomDuration) {
					this.zoomTime = null;
					this.active = false;
				}
				this.zoom();
			} else {
				this.zoomProgress += (this.zoomTime - zoomIntermediateTime);
				if (this.zoomProgress < 0) {
					this.zoomProgress = 0;
				}
				this.zoomTime = zoomIntermediateTime;

				if (this.zoomProgress == 0) {
					this.zoomTime = null;
					this.active = false;
				}
				this.zoom();
			}
		};

		this.toggleZoom = function () {
			this.zoomNegative = !this.zoomNegative;
		};
	}
	/* Rendering objects end */

	function scroll(deltaY) {
		if (!renderTranslationInstance.translationBusy) {
			var scrollDirection = 0;
			renderTranslationInstance.translationBusy = true;
			renderTranslationInstance.translationFrom = renderTranslationInstance.translationTo;
			if (deltaY < 0) {
				if (scrollEvents == 0) {
					renderTranslationInstance.translationBusy = false;
					return;
				}
				scrollDirection = 1;
				scrollEvents--;
			} else {
				if (scrollEvents == numberOfElemnts) {
					renderTranslationInstance.translationBusy = false;
					return;
				}
				scrollDirection = -1;
				scrollEvents++;
			}
			renderTranslationInstance.translationTo += (resizeWindowElementHeightBc * scrollDirection);
			// Here I'm getting the magnitude and the direction of the speed vector.
			renderTranslationInstance.translationSpeed = (renderTranslationInstance.translationTo - renderTranslationInstance.translationFrom) / renderTranslationInstance.translationDuration;
			// Set to he position indicators accordingly.
			nextPositionIndicator = $(".positionIndicator")[scrollEvents];

			renderTranslationInstance.active = true;

			if (!renderingRunning) {
				window.requestAnimationFrame(renderQueue);
			}
		}
	};

	function resizeDiv() {
		var tmpResolutionIndex = resizeWindowResolutionIndex,
		devicePixelRatio = window.devicePixelRatio,
		resizeWindowElementHeight = Math.round($(window).height() * devicePixelRatio) / devicePixelRatio,
		resizeWindowElementWidth = Math.round($(window).width() * devicePixelRatio) / devicePixelRatio,
		elementsToload = $(".toLoad").length - 1;

		console.log(resizeWindowElementHeight);
		horizontalBorderThickness = 10 + (resizeWindowElementHeight - (Math.floor(resizeWindowElementHeight))) / 2;
		verticalBorderThickness = 10 + (resizeWindowElementWidth - (Math.floor(resizeWindowElementWidth))) / 2;

		resizeWindowElementHeightBc = resizeWindowElementHeight - (horizontalBorderThickness * 2);
		resizeWindowElementWidthBc = resizeWindowElementWidth - (verticalBorderThickness * 2);

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
			".contentRightDymamic {bottom : " + (horizontalBorderThickness * 2) + "px; " +
			"left : " + resizeWindowElementWidthBc / 2 + "px;" + "}\n" +
			".resizableWindowDynamic {height : " + resizeWindowElementHeight + "px; " +
			"width : " + resizeWindowElementWidthBc + "px; " +
			"margin : " + horizontalBorderThickness + "px " + verticalBorderThickness + "px;}\n" +
			".positionIndicatorsContainerDynamic {width : " + verticalBorderThickness + "px; " +
			"height : " + horizontalBorderThickness * 3.2 + "px;}\n" +
			".borderHorizontalDynamic {height : " + horizontalBorderThickness + "px;}\n");

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

		// Initializing the rendering list
		renderTranslationInstance = new renderTranslationObject();
		renderingQueue[0] = renderTranslationInstance;
		$(".portfolioItem").each(function (index) {
			var portfolioItem = this,
			imageld = this.firstChild.id;
			portfolioItemListeners[imageld] = new renderZoomObject(imageld);
			renderingQueue[index + 1] = portfolioItemListeners[imageld];
			$(portfolioItem).bind("mouseenter mouseleave", function () {
				portfolioItemListeners[this.firstChild.id].zoomTime = Date.now();
				portfolioItemListeners[this.firstChild.id].toggleZoom();
				portfolioItemListeners[this.firstChild.id].active = true;
				if (!renderingRunning) {
					window.requestAnimationFrame(renderQueue);
				}
			});
		});

		// We first want to resize the div to fit the screen.
		resizeDiv();

		// On window resize, we get the new height. Then we calculate and re-position everything that depends on it.
		$(window).resize(function () {
			resizeDiv();
			renderTranslationInstance.translationTo = -1 * scrollEvents * resizeWindowElementHeightBc;
			renderTranslationInstance.translatePoz(renderTranslationInstance.translationTo);
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
		baseWidth = ((resizeWindowElementWidthBc + horizontalBorderThickness) / columns) - horizontalBorderThickness,
		index,
		galleryItemsLength = galleryItems.length;

		for (index = 0; index < galleryItemsLength; index++) {
			var galleryItem = galleryItems[index];
			galleryItem.height = baseWidth * galleryItem.metadata.aspectRatio;
			galleryItem.left = (index % columns) * (baseWidth + horizontalBorderThickness);
			galleryItem.top = (index < columns) ? 0 : (galleryItems[index - columns].top + galleryItems[index - columns].height + horizontalBorderThickness);

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
			/* 'height' : resizeWindowElementHeightBc,
			'width' : resizeWindowElementWidthBc, */
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
