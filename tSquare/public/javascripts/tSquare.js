var tSquareModule = (function () {

	var theModule = {};
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
	],
	resolutionsNo = 6,
	scrollEvents = 0,
	numberOfElemnts = 3,
	resizeWindowElementHeightBc = 0,
	resizeWindowElementWidthBc = 0,
	resizeWindowPageHeight = 0,
	resizeWindowResolutionIndex = -1,
	resizeWindowAspectRatio = 0,
	horizontalBorderThickness = 0,
	verticalBorderThickness = 0,
	touchStartTime = null,
	touchMinSpeed = 0.9, // Pixels / Millisecond
	touchStartX = 0,
	touchStartY = 0,
	currentPositionIndicator = null,
	nextPositionIndicator = null,
	portfolioItemListeners = [],
	renderVerticalTranslationInstance = null,
	renderHorizontalTranslationInstance = null,
  renderVerticalGalleryTranslationInstance = null,
	renderingQueue = [],
  renderingQueueGallery = [],
	renderingRunning = false,
	galleryCurrentFilter = null,
	galleryItems = [];

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
	function renderVerticalTranslationObject() {
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
			var pozRadius = 0.5 * (progress / renderVerticalTranslationInstance.translationDuration);
			currentPositionIndicator.setAttribute("r", 1 - pozRadius);
			nextPositionIndicator.setAttribute("r", 0.5 + pozRadius);
			renderVerticalTranslationInstance.translatePoz(translationEndSelector[0] * (renderVerticalTranslationInstance.translationFrom + (renderVerticalTranslationInstance.translationSpeed * progress)) +
				translationEndSelector[1] * renderVerticalTranslationInstance.translationTo);
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
				if (deltaT < renderVerticalTranslationInstance.translationDuration) {
					progress = deltaT;
				} else {
					progress = renderVerticalTranslationInstance.translationDuration;
					translationEndSelector = [0, 1];
				}

				if (progress == renderVerticalTranslationInstance.translationDuration) {
					translationStartTime = null;
					renderVerticalTranslationInstance.translationBusy = false;
					currentPositionIndicator = nextPositionIndicator;
					translationEndSelector = [1, 0];
					renderVerticalTranslationInstance.active = false;
				}
				translate(progress);
			}
		}
	};

  function renderVerticalGalleryTranslationObject() {
		var translationStartTime = null;
		this.translationDuration = 500;
		this.translationSpeed = 0;
		this.translationFrom = 0;
		this.translationTo = 0;
		this.translationBusy = false;
		this.active = false;

		// Position dependent transletation
		this.translatePoz = function (poz) {
			$(".imagesContainer").css({
				'top' : poz + "px"
			});
		};

		// Time dependent transletation
		function translate(progress) {
			renderVerticalGalleryTranslationInstance.translatePoz(renderVerticalGalleryTranslationInstance.translationFrom + (renderVerticalGalleryTranslationInstance.translationSpeed * progress));
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
				if (deltaT < renderVerticalGalleryTranslationInstance.translationDuration) {
					progress = deltaT;
				} else {
					progress = renderVerticalGalleryTranslationInstance.translationDuration;
				}

				if (progress == renderVerticalGalleryTranslationInstance.translationDuration) {
					translationStartTime = null;
					renderVerticalGalleryTranslationInstance.translationBusy = false;
					currentPositionIndicator = nextPositionIndicator;
					translationEndSelector = [1, 0];
					renderVerticalGalleryTranslationInstance.active = false;
				}
				translate(progress);
			}
		}
	};

function renderZoomOpacityObject(elementId) {
	this.zoomTime = null;
	this.elementId = elementId;
	this.zoomProgress = 0;
	this.zoomDuration = 2000;
	this.zoomSpeed = 0.00001;
	this.opacitySpeed = 0.0005;
	this.zoomNegative = true;
	this.active = false;

	this.zoom = function () {
		var zoomTmp = 1 + this.zoomSpeed * this.zoomProgress,
		opacity = 1 - this.opacitySpeed * this.zoomProgress;
		$("#" + this.elementId).css({
			'-webkit-transform' : "scale(" + zoomTmp + " )",
			'-moz-transform' : "scale(" + zoomTmp + " )",
			'-o-transform' : "scale(" + zoomTmp + " )",
			'-ms-transform' : "scale(" + zoomTmp + " )",
			'transform' : "scale(" + zoomTmp + " )",
			'opacity' : opacity
		});
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

	function renderZoomObject(elementId) {
		this.zoomTime = null;
		this.elementId = elementId;
		this.zoomProgress = 0;
		this.zoomDuration = 2000;
		this.zoomSpeed = 0.00001;
		this.zoomNegative = true;
		this.active = false;

		this.zoom = function () {
			var zoomTmp = 1 + this.zoomSpeed * this.zoomProgress;
			$("#" + this.elementId).css({
				'-webkit-transform' : "scale(" + zoomTmp + " )",
				'-moz-transform' : "scale(" + zoomTmp + " )",
				'-o-transform' : "scale(" + zoomTmp + " )",
				'-ms-transform' : "scale(" + zoomTmp + " )",
				'transform' : "scale(" + zoomTmp + " )"
			});
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

	function renderHorizontalTranslationObject() {
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
				'left' : (- this.translationFrom - poz) + "px"
			});
			/*(x)(a + b / 2) = a + b
			x = (a+b) / (a + b/2)*/
			$("#contentRight").css({
				'left' : (this.translationFrom * (horizontalBorderThickness + resizeWindowElementWidthBc) / (horizontalBorderThickness + resizeWindowElementWidthBc / 2) + renderHorizontalTranslationInstance.translationTo + poz) + "px"
			});
		};

		// Time dependent transletation
		function translate(progress) {
			renderHorizontalTranslationInstance.translatePoz(translationEndSelector[0] * (renderHorizontalTranslationInstance.translationSpeed * progress) +
				translationEndSelector[1] * renderHorizontalTranslationInstance.translationTo);
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
				if (deltaT < renderHorizontalTranslationInstance.translationDuration) {
					progress = deltaT;
				} else {
					progress = renderHorizontalTranslationInstance.translationDuration;
					translationEndSelector = [0, 1];
				}

				if (progress == renderHorizontalTranslationInstance.translationDuration) {
					translationStartTime = null;
					renderHorizontalTranslationInstance.translationBusy = false;
					translationEndSelector = [1, 0];
					renderHorizontalTranslationInstance.active = false;
				}
				translate(progress);
			}
		}
	};
	/* Rendering objects end */

	function scroll(deltaY) {
		if (!renderVerticalTranslationInstance.translationBusy) {
			var scrollDirection = 0;
			renderVerticalTranslationInstance.translationBusy = true;
			renderVerticalTranslationInstance.translationFrom = renderVerticalTranslationInstance.translationTo;
			if (deltaY < 0) {
				if (scrollEvents == 0) {
					renderVerticalTranslationInstance.translationBusy = false;
					return;
				}
				scrollDirection = 1;
				scrollEvents--;
			} else {
				if (scrollEvents == numberOfElemnts) {
					renderVerticalTranslationInstance.translationBusy = false;
					return;
				}
				scrollDirection = -1;
				scrollEvents++;
			}
			renderVerticalTranslationInstance.translationTo += (resizeWindowElementHeightBc * scrollDirection);
			// Here I'm getting the magnitude and the direction of the speed vector.
			renderVerticalTranslationInstance.translationSpeed = (renderVerticalTranslationInstance.translationTo - renderVerticalTranslationInstance.translationFrom) / renderVerticalTranslationInstance.translationDuration;
			// Set to he position indicators accordingly.
			nextPositionIndicator = $(".positionIndicator")[scrollEvents];

			renderVerticalTranslationInstance.active = true;

			if (!renderingRunning) {
				window.requestAnimationFrame(renderQueue);
			}
		}
	};

	theModule.horizontalPart = function () {
		renderHorizontalTranslationInstance.translationFrom = 0;
		renderHorizontalTranslationInstance.translationTo = horizontalBorderThickness + resizeWindowElementWidthBc / 2;
		// Here I'm getting the magnitude and the direction of the speed vector.
		renderHorizontalTranslationInstance.translationSpeed = renderHorizontalTranslationInstance.translationTo / renderVerticalTranslationInstance.translationDuration;
		console.log(renderHorizontalTranslationInstance.translationSpeed);
		renderHorizontalTranslationInstance.active = true;
		if (!renderingRunning) {
			window.requestAnimationFrame(renderQueue);
		}
		$(".positionIndicatorsContainer").css({
			'display' : 'none'
		});
	};

	theModule.horizontalJoin = function () {
		renderHorizontalTranslationInstance.translationTo = 0;
		renderHorizontalTranslationInstance.translationFrom = horizontalBorderThickness + resizeWindowElementWidthBc / 2;
		// Here I'm getting the magnitude and the direction of the speed vector.
		renderHorizontalTranslationInstance.translationSpeed = -renderHorizontalTranslationInstance.translationFrom / renderVerticalTranslationInstance.translationDuration;
		console.log(renderHorizontalTranslationInstance.translationSpeed);
		renderHorizontalTranslationInstance.active = true;
		if (!renderingRunning) {
			window.requestAnimationFrame(renderQueue);
		}
		setHomePageListeners();
		$(".positionIndicatorsContainer").css({
			'display' : 'block'
		});
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
		resizeWindowAspectRatio = resizeWindowElementHeightBc / resizeWindowElementWidthBc;

		resizeWindowPageHeight = numberOfElemnts * resizeWindowElementHeightBc;

		function searchInterval(resolutionIndex) {
			if (resolutions[resolutionIndex].width === resizeWindowElementWidth ||
				resolutionIndex === 0 || resolutionIndex === 5) {
				resizeWindowResolutionIndex = resolutionIndex;
			} else {
				if (resolutions[resolutionIndex].width > resizeWindowElementWidth) {
					if (resolutions[resolutionIndex - 1].width < resizeWindowElementWidth) {
						resizeWindowResolutionIndex = resolutionIndex;
					} else {
						searchInterval(resolutionIndex - 1);
					}
				} else {
					if (resolutions[resolutionIndex].width < resizeWindowElementWidth) {
						if (resolutions[resolutionIndex + 1].width > resizeWindowElementWidth) {
							resizeWindowResolutionIndex = resolutionIndex + 1;
						} else {
							searchInterval(resolutionIndex + 1);
						}
					}
				}
			}
		};
		searchInterval(3);

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
			var imageURL = "pictures/" + resolutions[resizeWindowResolutionIndex].name + "System/";
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
							console.log($("#mapBox").src);
							$("#mapBox")[0].src = 'https://a.tiles.mapbox.com/v4/3picioare.263c8f3b/attribution.html?access_token=pk.eyJ1IjoiM3BpY2lvYXJlIiwiYSI6Ijc0MjMwMjBiOTMxMzk5Nzc4YmMzMmM4N2Q0OWJmZGE1In0.y9eZyD7X2xmYZUJzuyqJwg';
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

	function setHomePageListeners() {
		// On window resize, we get the new height. Then we calculate and re-position everything that depends on it.
		$(window).resize(function () {
			console.log("resize");
			resizeDiv();
			renderVerticalTranslationInstance.translationTo = -1 * scrollEvents * resizeWindowElementHeightBc;
			renderVerticalTranslationInstance.translatePoz(renderVerticalTranslationInstance.translationTo);
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
		$(window).bind("touchstart", function (event) {
			if (event.originalEvent.changedTouches.length == 1) {
				touchObj = event.originalEvent.changedTouches[0];
				touchStartTime = Date.now();
				touchStartX = touchObj.pageX;
				touchStartY = touchObj.pageY;
			}
		});
		// We listen for touch events and update the scene accordingly.
		$(window).bind("touchend", function (event) {
			event.preventDefault();
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
		renderVerticalTranslationInstance = new renderVerticalTranslationObject();
		renderingQueue[0] = renderVerticalTranslationInstance;
		renderHorizontalTranslationInstance = new renderHorizontalTranslationObject();
		renderingQueue[1] = renderHorizontalTranslationInstance;
		$(".portfolioItem").each(function (index) {
			var portfolioItem = this;
			portfolioItemListeners[portfolioItem.firstChild.id] = new renderZoomObject(portfolioItem.firstChild.id);
			portfolioItemListeners[portfolioItem.lastChild.id] = new renderZoomOpacityObject(portfolioItem.lastChild.id);
			renderingQueue[2*index + 2] = portfolioItemListeners[portfolioItem.firstChild.id];
			renderingQueue[2*index + 3] = portfolioItemListeners[portfolioItem.lastChild.id];
			$(portfolioItem).bind("mouseenter mouseleave", function () {
				imageId = this.firstChild.id,
				imageIdBlack = this.lastChild.id;
				portfolioItemListeners[imageId].zoomTime = Date.now();
				portfolioItemListeners[imageId].toggleZoom();
				portfolioItemListeners[imageId].active = true;

				portfolioItemListeners[imageIdBlack].zoomTime = portfolioItemListeners[imageId].zoomTime;
				portfolioItemListeners[imageIdBlack].toggleZoom();
				portfolioItemListeners[imageIdBlack].active = true;
				if (!renderingRunning) {
					window.requestAnimationFrame(renderQueue);
				}
			});
		});

		// We first want to resize the div to fit the screen.
		resizeDiv();
		setHomePageListeners();

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

		// We read the current state of the history and see if we have to move to the gallery
		if (window.history.state != null) {
			this.galleryFilter(window.history.state);
		}
	};
	////////////////////////
////////            ////////////////////////////////////////////////////////////////////////////////////////////////////
//////                ////                                            //////                                          //
//// Gallery management ////////////////////////////////////////////////////////////////////////////////////////////////                                                                                            //
//////                ////                                            //////                                          //
////////            ////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////

	// Scroll rendering function
	function renderQueueGallery(timestamp) {
		var renderingChangeSense = false;

		renderingRunning = true;

		for (var renderingIndex = 0; renderingIndex < renderingQueueGallery.length; renderingIndex++) {
			if (renderingQueueGallery[renderingIndex].active) {
				renderingChangeSense = true;
				renderingQueueGallery[renderingIndex].getChanges();
			}
		}

		if (renderingChangeSense) {
			window.requestAnimationFrame(renderQueueGallery);
		} else {
			renderingRunning = false;
		}
	};

	function putBigDisplay(pictureId) {
		var bigDisplayDiv = $("<div id='bigDisplay'>"),
		galleryItem = galleryItems[pictureId],
		imageURL = "gallery/pictures/" + resolutions[resizeWindowResolutionIndex].name + "/" +  galleryItem.filename,
		bigImage = $("<img id='bigImage' src='" + imageURL + "'>");
		bigImage.css({
			'width' : galleryItem.bigWidth,
			'height' : galleryItem.bigHeight,
			'left' : galleryItem.bigLeft,
			'top' : galleryItem.bigTop
		});
		bigImage.bind("click", function (event) {
			bigImage.remove();
			bigDisplayDiv.remove();
		});
		$(".galleryContainer").append(bigDisplayDiv);
		$(".galleryContainer").append(bigImage);
	};

  // Initialisation of the Gallery
	function initGallery(resp) {
		galleryItems = resp;
		var imagesContainer = $(".imagesContainer"),
		columns = (resizeWindowElementHeightBc < resizeWindowElementWidthBc) ? 4 : 3,
		baseWidth = ((resizeWindowElementWidthBc + verticalBorderThickness) / columns) - verticalBorderThickness,
		index,
		galleryItemsLength = galleryItems.length;

    renderVerticalGalleryTranslationInstance = new renderVerticalGalleryTranslationObject();
		renderingQueueGallery[0] = renderVerticalGalleryTranslationInstance;

		imagesContainer.empty();

		imagesContainer.css({
			'top' : (35 + horizontalBorderThickness) + "px"
		});

		for (index = 0; index < galleryItemsLength; index++) {
			var galleryItem = galleryItems[index];
			galleryItem.height = baseWidth * galleryItem.metadata.aspectRatio;
			galleryItem.left = (index % columns) * (baseWidth + verticalBorderThickness);
			galleryItem.top = (index < columns) ? 0 : (galleryItems[index - columns].top + galleryItems[index - columns].height + horizontalBorderThickness);

			if (galleryItem.metadata.aspectRatio > resizeWindowAspectRatio) {
				var tmpWidth = resizeWindowElementHeightBc / galleryItem.metadata.aspectRatio;
				galleryItem.bigHeight = "100%";
				galleryItem.bigWidth = tmpWidth + "px";
				galleryItem.bigLeft = (resizeWindowElementWidthBc - tmpWidth) / 2 + "px";
				galleryItem.bigTop = "0px";
			} else {
				var tmpHeight = resizeWindowElementWidthBc * galleryItem.metadata.aspectRatio;
				galleryItem.bigHeight = tmpHeight + "px";
				galleryItem.bigWidth = "100%";
				galleryItem.bigLeft = "0px";
				galleryItem.bigTop = (resizeWindowElementHeightBc - tmpHeight) / 2 + "px";
			}

			var listItem = $("<img id='" + index + "' class='galleryItem' src='gallery/pictures/thumbnail/" + galleryItem.filename + "'>");
			listItem.css({
				'width' : baseWidth,
				'height' : galleryItem.height,
				'left' : galleryItem.left,
				'top' : galleryItem.top,
				'display' : 'none'
			});
			listItem.bind("load", function (event) {
				$(event.target).css({
					'display' : 'block'
				});
			});
			listItem.bind("click", function (event) {
				putBigDisplay(event.target.id);
			});
			galleryItems[index] = galleryItem;

			// We listen for wheel events and update the scene acordingly.
			$(window).unbind();

			imagesContainer.append(listItem);
		}
	};

	theModule.galleryFilter = function (filterTag) {
		// Using the core $.ajax() method
		if (window.history.state == null) {
			window.history.pushState(filterTag, "BackToMain", window.location);
		} else {
			window.history.replaceState(filterTag, "BackToMain", window.location);
		}
		window.onpopstate = function(event) {
			theModule.horizontalJoin();
		};

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
				$("." + galleryCurrentFilter + "Button > h3").removeClass("galleryH3Selected")
				galleryCurrentFilter = filterTag;
				$("." + galleryCurrentFilter + "Button > h3").addClass("galleryH3Selected")
				console.log($("." + galleryCurrentFilter + "Button > h3"));
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
