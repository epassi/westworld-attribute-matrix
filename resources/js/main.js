// Unexpected challenges:
// - Biasing to a vertical or horizontal axis.
// - Ensuring grabber doesn't exceed radius.
// - Dynamically sizing the map. Making the grabber responsive.

// Fun facts:
// - The most triangle math I've ever used in a single program:
//   sin, cos, tan, Pythagorean theorem.


var Main = function() {
	var $map;
	var $grabber;
	var $angleInput;
	var $angleOutput;
	var $guideMarker;

	var _dragging = false;
	var _angle = 0; // degrees
	var _radius = 0; // set by map
	var _dragToRadiusRatio = 0; // for responsive positioning of grabber 

	function init() {
		$(document).ready(function() {
			console.log("babelTestConstant = " + babelTestConstant);
			
			$map = $(".map");
			$grabber = $(".grabber");
			$angleInput = $(".angle-input");
			$angleOutput = $(".angle-output");
			$guideMarker = $(".guide-marker");

			// Set initial angle.
			updateAngle();

			// Set radius (range) based on map's smallest dimension.
			updateRadius();
			$(window).resize(function(event) {
				updateRadius();
			});

			// Update angle when slider changes.
			$angleInput.on("input", function(event) {
				updateAngle();
			});

			// Capture start of grab.
			$grabber.on("touchstart", function(event) {
				onGrab({
					x: $grabber.position().left - $map.width()/2 + $grabber.width()/2,
					y: $grabber.position().top - $map.height()/2 + $grabber.height()/2
				});
			});
			$grabber.on("mousedown", function(event) {
				onGrab({
					x: $grabber.position().left - $map.width()/2 + $grabber.width()/2,
					y: $grabber.position().top - $map.height()/2 + $grabber.height()/2
				});
			});

			// Drag grabber across map.
			$map.on("touchmove", function(event) {
				onDrag(mapPosition({
					x: event.touches[0].pageX,
					y: event.touches[0].pageY
				}));
			});
			$map.on("mousemove", function(event) {
				onDrag(mapPosition({
					x: event.pageX,
					y: event.pageY
				}));
			});

			// Capture end of grab.
			$map.on("touchend", function(event) {
				onDrop();
			});
			$map.on("mouseup", function(event) {
				onDrop();
			});

			// Cancel grab.
			$map.on("mouseleave", function(event) {
				onDrop();
			});

			// Reposition grabber if viewport is resized.
			$(window).resize(function(event) {
				updateGrabberPosition();
			});
		});
	}

	function onGrab(grab) {
		_dragging = true;
		$map.addClass("is-dragging");
	}

	function onDrag(drag) {
		if (!_dragging) return;

		// Correct the drag so that grabber only travels along its angle.
		// Drag needs horizontal or vertical drag bias based on angle:
		// - Angles within 45 degrees of the X axis have a horizontal bias.
		// - Angles within 45 degrees of the Y axis have a vertical bias.
		// - Bias makes the drag interaction feel more responsive.
		var correctedDrag = {};
		var correctedDragWithOffset = {};
		var closerToVerticalAxis = (_angle > 45 && _angle <= 135) || (_angle > 215 && _angle <= 315);
		if (closerToVerticalAxis) {
			// Vertical bias. Use given Y, solve for X.
			correctedDrag.x = drag.y / Math.tan(Math.radians(_angle));
			correctedDrag.y = drag.y;
		} else {
			// Horizontal bias. Use given X, solve for Y.
			correctedDrag.x = drag.x;
			correctedDrag.y = drag.x * Math.tan(Math.radians(_angle));
		}

		// Don't drag past center.
		if (_angle > 0 && _angle <= 90) {
			// Quadrant I.
			if (correctedDrag.x < 0) correctedDrag.x = 0;
			if (correctedDrag.y < 0) correctedDrag.y = 0;
		} else if (_angle > 90 && _angle <= 180) {
			// Quadrant II.
			if (correctedDrag.x > 0)	correctedDrag.x = 0;
			if (correctedDrag.y < 0)	correctedDrag.y = 0;
		} else if (_angle > 180 && _angle <= 270) {
			// Quadrant III.
			if (correctedDrag.x > 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		} else {
			// Quadrant IV.
			if (correctedDrag.x < 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		}

		// Don't drag past map radius.
		if (dragDistance(correctedDrag) > _radius) {
			// If drag distance exceeds map radius,
			// set grabber position to map radius.
			correctedDrag.x = _radius * Math.cos(Math.radians(_angle));
			correctedDrag.y = _radius * Math.sin(Math.radians(_angle));
		}

		// Record drag-to-radius ratio for responsive positioning.
		// Note: drag distance should be based on corrected drag WITHOUT grabber offset. 
		_dragToRadiusRatio = dragDistance(correctedDrag) / _radius;

		// Account for grabber dimensions.
		correctedDragWithOffset.x = correctedDrag.x - $grabber.width()/2;
		correctedDragWithOffset.y = correctedDrag.y + $grabber.height()/2;

		// Set grabber position.
		var transform = "translate(" + correctedDragWithOffset.x + "px , " + -correctedDragWithOffset.y + "px)";
		$grabber.css("transform", transform);
	}

	function onDrop(drop) {
		_dragging = false;
		$map.removeClass("is-dragging");
	}

	function mapPosition(pagePosition) {
		return {
			x: pagePosition.x - $map.offset().left - $map.width()/2,
			y: -1 * (pagePosition.y - $map.offset().top - $map.height()/2)
		};
	}

	function pagePosition(mapPosition) {
		return {
			x: mapPosition.x + $map.offset().left + $map.width()/2,
			y: -1 * (mapPosition.y + $map.offset().top + $map.height()/2)
		};
	}

	function updateAngle() {
		// Get angle from HTML slider.
		_angle = $angleInput[0].value;

		// Reset grabber to center.
		$grabber.css("transform", "");
		_dragToRadiusRatio = 0;

		// Update angle output.
		$angleOutput.text(Math.round(_angle) + "°");

		// Rotate the guide marker.
		var transform = "rotate(" + -_angle + "deg)";
		$guideMarker.css("transform", transform);
	}

	function updateRadius() {
		// Set radius (range) based on map's smallest dimension.
		if ($map.width() > $map.height()) {
			_radius = $map.height()/2 - $grabber.width()/2;
		} else {
			_radius = $map.width()/2 - $grabber.height()/2;
		}

		// Update guide length.
		$guideMarker.width(_radius);
	}

	function updateGrabberPosition() {
		var newDragDistance = _radius * _dragToRadiusRatio;

		// Calculate new grabber position.
		var drag = {};
		drag.x = newDragDistance * Math.cos(Math.radians(_angle)) - $grabber.width()/2;
		drag.y = newDragDistance * Math.sin(Math.radians(_angle)) + $grabber.height()/2;

		// Set grabber position.
		var transform = "translate(" + drag.x + "px , " + -drag.y + "px)";
		$grabber.css("transform", transform);
	}

	function dragDistance(drag) {
		// Pythagorean theorem.
		return Math.sqrt(Math.pow(drag.x, 2) + Math.pow(drag.y, 2));
	}



	return {
		init:init
	};
}();

Main.init();