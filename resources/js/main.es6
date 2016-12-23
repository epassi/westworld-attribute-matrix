// Unexpected challenges:
// - Biasing to a vertical or horizontal axis.
// - Ensuring slider doesn't exceed radius.
// - Dynamically sizing the map. Making the slider responsive.

// Fun facts:
// - The most triangle math I've ever used in a single program:
//   sin, cos, tan, Pythagorean theorem.


let $chart;
let $slider;
let $angleInput;
let $angleOutput;
let $guideMarker;

let _radius = 0; // set by chart
let _angle = 0; // degrees
let _attributeSlider = {};

let init = () => {
	$(document).ready(() => {
		$chart = $(`.chart`);
		$slider = $(`.slider`);
		$angleInput = $(`.angle-input`);
		$angleOutput = $(`.angle-output`);
		$guideMarker = $(`.guide-marker`);


		// Set radius (range) based on map's smallest dimension.
		updateRadius();
		$(window).resize((event) => {
			updateRadius();
		});

		// Set initial angle.
		updateAngle();

		// Create the slider.
		_attributeSlider = new AttributeSlider(`.chart`, `.slider`, _radius, _angle);

		// Update angle when slider changes.
		$angleInput.on(`input`, (event) => {
			updateAngle();
		});
	});
}

let updateAngle = () => {
	// Get angle from HTML slider.
	_angle = $angleInput[0].value;

	// Update angle output.
	$angleOutput.text(`${Math.round(_angle)}°`);

	// Rotate the guide marker.
	let transform = `rotate(${-_angle}deg)`;
	$guideMarker.css(`transform`, transform);

	// Update attribute slider angle.
	_attributeSlider.angle = _angle;
}

let updateRadius = () => {
	// Set radius (range) based on chart's smallest dimension.
	if ($chart.width() > $chart.height()) {
		_radius = $chart.height()/2 - $slider.width()/2;
	} else {
		_radius = $chart.width()/2 - $slider.height()/2;
	}

	// Update guide length.
	$guideMarker.width(_radius);

	// Update attribute slider radius.
	_attributeSlider.radius = _radius;
}


init();

