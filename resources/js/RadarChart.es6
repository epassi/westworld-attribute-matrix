class RadarChart {

	static get SCALE() {
		return 20; // "points" in Westworld terms
	}

	constructor(chartSelector, hostProfile) {
		this.$chart = $(chartSelector);
		this._sliders = [];
		this._firstName = hostProfile.firstName;
		this._lastName = hostProfile.lastName;
		this._radius = 0;

		// The host profile data structure stays true to Westworld's attribute grouping,
		// but this interactive model will only let you look at the first group.
		// A real implementation would iterate over all groups and allow the user to 
		// switch between groups.
		this._attributes = hostProfile.attributeGroups[0].attributes;

		// Set radius (range) based on map's smallest dimension.
		this.updateRadius();
		$(window).resize((event) => {
			this.updateRadius();
		});

		// Figure out slider angle interval.
		// Sliders are arranged clockwise starting at the 12:00 position (90°). 
		let angleStart = 90; // degrees
		let angleInterval = 360 / this._attributes.length; // degrees

		for (let [index, attribute] of this._attributes.entries()) {
			console.log(`${attribute.name} = ${attribute.amount}`);

			// Calculate angle starting from 12:00 (90°) position.
			let angle = angleStart - index*angleInterval;
			let correctedAngle = (angle+360) % 360;

			// Calculate slider fullness (drag:radius ratio).
			let fullness = attribute.amount / RadarChart.SCALE;

			// Create slider.
			this._sliders.push(new AttributeSlider(`.chart`, index, this._radius, correctedAngle, fullness));
		}
	}

	updateRadius() {
		// Set radius (range) based on chart's smallest dimension.
		if (this.$chart.width() > this.$chart.height()) {
			this._radius = this.$chart.height()/2 - AttributeSlider.SIZE/2;
		} else {
			this._radius = this.$chart.width()/2 - AttributeSlider.SIZE/2;
		}

		// Update attribute sliders' radius.
		for (let slider of this._sliders) {
			slider.radius = this._radius	;
		}
	}

}