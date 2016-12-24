// Unexpected challenges:

// 0.0 Biasing to a vertical or horizontal axis.
// 0.0 Ensuring slider doesn't exceed radius.
// 0.0 Dynamically sizing the map. Making the slider responsive.

// 0.1 ES6 integration took longer than I thought. Still unable to get ESLint to work.

// 0.2 Now that we're building the actual chart, needed to think about a data-driven model.
//     Recreated the attribute grouping from Westworld as a JSON file.
// 0.2 Per Westworld design, slider 0 value starts a little further out from center.
//     Max radius also leaves room for attribute labels on the sides.


// Fun facts:
// - The most triangle math I've ever used in a single program:
//   sin, cos, tan, Pythagorean theorem.
// - First time using ES6.


let _chart = {};

let init = () => {
	$(document).ready(() => {
		// Get host profile and create the chart.
		$.getJSON("resources/data/host-profile.json", (hostProfile) => {
			_chart = new RadarChart(`.chart`, hostProfile);
		});
	});
}

init();