class RadarChart {

	static get SCALE() {return 20;} // "points" in Westworld terms
	static get MIN_RADIUS_RATIO() {return 0.2;}

	constructor(chartSelector, hostProfile) {
		this.$chart = $(chartSelector);
		this._sliders = [];
		this._firstName = hostProfile.firstName;
		this._lastName = hostProfile.lastName;
		this._radius = {}; // min and max

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

		// Figure out slider angle interval.
		// Sliders are arranged clockwise starting at the 12:00 position (90°). 
		let angleStart = 90; // degrees
		let angleInterval = 360 / this._attributes.length; // degrees

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
		// Set radius (range) based on chart's smallest dimension.
		if (this.$chart.width() > this.$chart.height()) {
			this._radius.max = this.$chart.height()/2 - AttributeSlider.SIZE/2;
		} else {
			this._radius.max = this.$chart.width()/2 - AttributeSlider.SIZE/2;
		}

		this._radius.min = this._radius.max * RadarChart.MIN_RADIUS_RATIO;

		// Update attribute sliders' radius.
		for (let slider of this._sliders) {
			slider.radius = this._radius;
		}
	}

}