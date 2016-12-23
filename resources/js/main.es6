// Unexpected challenges:
// - Biasing to a vertical or horizontal axis.
// - Ensuring grabber doesn't exceed radius.
// - Dynamically sizing the map. Making the grabber responsive.

// Fun facts:
// - The most triangle math I've ever used in a single program:
//   sin, cos, tan, Pythagorean theorem.


let $map;
let $grabber;
let $angleInput;
let $angleOutput;
let $guideMarker;

let _dragging = false;
let _angle = 0; // degrees
let _radius = 0; // set by map
let _dragToRadiusRatio = 0; // for responsive positioning of grabber 

let init = () => {
	$(document).ready(() => {
		$map = $(`.map`);
		$grabber = $(`.grabber`);
		$angleInput = $(`.angle-input`);
		$angleOutput = $(`.angle-output`);
		$guideMarker = $(`.guide-marker`);

		// Set initial angle.
		updateAngle();

		// Set radius (range) based on map's smallest dimension.
		updateRadius();
		$(window).resize((event) => {
			updateRadius();
		});

		// Update angle when slider changes.
		$angleInput.on(`input`, (event) => {
			updateAngle();
		});

		// Capture start of grab.
		$grabber.on(`touchstart`, (event) => {
			onGrab({
				x: $grabber.position().left - $map.width()/2 + $grabber.width()/2,
				y: $grabber.position().top - $map.height()/2 + $grabber.height()/2
			});
		});
		$grabber.on(`mousedown`, (event) => {
			onGrab({
				x: $grabber.position().left - $map.width()/2 + $grabber.width()/2,
				y: $grabber.position().top - $map.height()/2 + $grabber.height()/2
			});
		});

		// Drag grabber across map.
		$map.on(`touchmove`, (event) => {
			onDrag(mapPosition({
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			}));
		});
		$map.on(`mousemove`, (event) => {
			onDrag(mapPosition({
				x: event.pageX,
				y: event.pageY
			}));
		});

		// Capture end of grab.
		$map.on(`touchend`, (event) => {
			onDrop();
		});
		$map.on(`mouseup`, (event) => {
			onDrop();
		});

		// Cancel grab.
		$map.on(`mouseleave`, (event) => {
			onDrop();
		});

		// Reposition grabber if viewport is resized.
		$(window).resize((event) => {
			updateGrabberPosition();
		});
	});
}

let onGrab = (grab) => {
	_dragging = true;
	$map.addClass(`is-dragging`);
}

let onDrag = (drag) => {
	if (!_dragging) return;

	// Correct the drag so that grabber only travels along its angle.
	// Drag needs horizontal or vertical drag bias based on angle:
	// - Angles within 45 degrees of the X axis have a horizontal bias.
	// - Angles within 45 degrees of the Y axis have a vertical bias.
	// - Bias makes the drag interaction feel more responsive.
	let correctedDrag = {};
	let correctedDragWithOffset = {};
	let closerToVerticalAxis = (_angle > 45 && _angle <= 135) || (_angle > 215 && _angle <= 315);
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
	let transform = `translate(${correctedDragWithOffset.x}px, ${-correctedDragWithOffset.y}px)`;
	$grabber.css(`transform`, transform);
}

let onDrop = (drop) => {
	_dragging = false;
	$map.removeClass(`is-dragging`);
}

let mapPosition = (pagePosition) => {
	return {
		x: pagePosition.x - $map.offset().left - $map.width()/2,
		y: -1 * (pagePosition.y - $map.offset().top - $map.height()/2)
	};
}

let pagePosition = (mapPosition) => {
	return {
		x: mapPosition.x + $map.offset().left + $map.width()/2,
		y: -1 * (mapPosition.y + $map.offset().top + $map.height()/2)
	};
}

let updateAngle = () => {
	// Get angle from HTML slider.
	_angle = $angleInput[0].value;

	// Reset grabber to center.
	$grabber.css(`transform`, ``);
	_dragToRadiusRatio = 0;

	// Update angle output.
	$angleOutput.text(`${Math.round(_angle)}°`);

	// Rotate the guide marker.
	let transform = `rotate(${-_angle}deg)`;
	$guideMarker.css(`transform`, transform);
}

let updateRadius = () => {
	// Set radius (range) based on map's smallest dimension.
	if ($map.width() > $map.height()) {
		_radius = $map.height()/2 - $grabber.width()/2;
	} else {
		_radius = $map.width()/2 - $grabber.height()/2;
	}

	// Update guide length.
	$guideMarker.width(_radius);
}

let updateGrabberPosition = () => {
	let newDragDistance = _radius * _dragToRadiusRatio;

	// Calculate new grabber position.
	let drag = {};
	drag.x = newDragDistance * Math.cos(Math.radians(_angle)) - $grabber.width()/2;
	drag.y = newDragDistance * Math.sin(Math.radians(_angle)) + $grabber.height()/2;

	// Set grabber position.
	let transform = `translate(${drag.x}px, ${-drag.y}px)`;
	$grabber.css(`transform`, transform);
}

let dragDistance = (drag) => {
	// Pythagorean theorem.
	return Math.sqrt(Math.pow(drag.x, 2) + Math.pow(drag.y, 2));
}

init();

