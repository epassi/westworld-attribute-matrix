class RadarChart {

	static get SCALE() {return 20;} // "points" in Westworld terms
	static get MIN_RADIUS_RATIO() {return 0.1;}
	static get MAX_RADIUS_RATIO() {return 0.9;}

	constructor(chartSelector, hostProfile) {
		this.$chart = $(chartSelector);
		this._sliders = [];
		this._firstName = hostProfile.firstName;
		this._lastName = hostProfile.lastName;
		this._radius = {}; // min and max
		this._svg = {};

		// The host profile data structure stays true to Westworld's attribute grouping,
		// but this interactive model will only let you look at the first group.
		// A real implementation would iterate over all groups and allow the user to 
		// switch between groups.
		this._attributes = hostProfile.attributeGroups[0].attributes;

		// Set radius (range) based on map's smallest dimension.
		this.setRadius();
		$(window).resize((event) => {
			this.setRadius();
		});

		// Draw guide rings.
		this._svg = new Snap(`.guides`);
		this.drawRings();
		$(window).resize((event) => {
			this.drawRings();
		});


		// Figure out slider angle interval.
		// Sliders are arranged clockwise starting at the 12:00 position (90°). 
		let angleStart = 90; // degrees
		let angleInterval = 360 / this._attributes.length; // degrees

		// Add sliders.
		for (let [index, attribute] of this._attributes.entries()) {
			console.log(`${attribute.name} = ${attribute.amount}`);

			// Calculate angle starting from 12:00 (90°) position.
			let angle = angleStart - index*angleInterval;

			// Ensure angle is a value between 0-359.
			let correctedAngle = (angle+360) % 360;

			// Create slider.
			this._sliders.push(new AttributeSlider(
				`.chart`,
				index,
				this._radius,
				correctedAngle,
				attribute.amount
			));
		}
	}

	setRadius() {
		// There are two radii: min (inner) and max (outer).
		// The max radius represents the highest attribute value.
		// The min radius represents the lowest attribute value (0) and
		// is away from the center to minimize colliding sliders with low values.

		// Set max radius based on chart's smallest dimension.
		if (this.$chart.width() > this.$chart.height()) {
			this._radius.max = this.$chart.height()/2 - AttributeSlider.SIZE/2;
		} else {
			this._radius.max = this.$chart.width()/2 - AttributeSlider.SIZE/2;
		}

		// To make room for attribute labels,
		// reduce max radius a little.
		this._radius.max *= RadarChart.MAX_RADIUS_RATIO;

		// Set min radius proportionally to max radius.
		this._radius.min = this._radius.max * RadarChart.MIN_RADIUS_RATIO;

		// Update attribute sliders' radius.
		for (let slider of this._sliders) {
			slider.radius = this._radius;
		}
	}

	drawRings() {		
		let ringInterval = (this._radius.max - this._radius.min) / RadarChart.SCALE;

		this._svg.clear();

		for (let i = 0; i <= RadarChart.SCALE; i++) {
			let ring = this._svg.circle(this.$chart.width()/2, this.$chart.height()/2, this._radius.min+ringInterval*i);
			ring.attr({
				fill: "none",
				stroke: "#000",
				opacity: 0.1,
				strokeWidth: 1
			});
		}
	}

}