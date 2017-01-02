class RadarChart {

	static get SCALE() {return 20;} // "points" in Westworld terms
	static get MIN_RADIUS_RATIO() {return 0.1;}
	static get MAX_RADIUS_RATIO() {return 0.8;}
	static get PRINCIPAL_ATTRIBUTE() {return `Bulk Apperception`;}

	static get COLOR_WW_BLUE_DARK() {return "#263339";}
	static get COLOR_WW_BLUE_MEDIUM() {return "#2f5b74";}
	static get COLOR_WW_BLUE_LIGHT() {return "#499fb6";}
	static get COLOR_WW_GREEN() {return "#3b9b4c";}

	constructor(chartSelector, hostProfile) {
		this.$chart = $(chartSelector);
		this._sliders = [];
		this._firstName = hostProfile.firstName;
		this._lastName = hostProfile.lastName;
		this._radius = {}; // min and max
		this._svgGuides = {};
		this._svgStar = {};
		this._vertices = [];
		this._configs = hostProfile.configs;
		this._config = 0;

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

		// Draw guides.
		this._svgGuides = new Snap(`.guides`);
		this.drawGuides();
		$(window).resize((event) => {
			this.drawGuides();
		});

		// Figure out slider angle interval.
		// Sliders are arranged clockwise starting at the 12:00 position (90°). 
		let angleStart = 90; // degrees
		let angleInterval = 360 / this._attributes.length; // degrees

		// Add sliders.
		for (let [index, attribute] of this._attributes.entries()) {
			// console.log(`${attribute.name} = ${attribute.amount[this._config]}`);

			// Calculate angle starting from 12:00 (90°) position.
			let angle = angleStart - index*angleInterval;

			// Ensure angle is a value between 0-359.
			let correctedAngle = (angle+360) % 360;

			// Create slider.
			let slider = new AttributeSlider(
				this,
				index,
				correctedAngle,
				attribute.amount[this._config],
				attribute.name
			);
			this._sliders.push(slider);
			let svgVertex = this.getPointFromCorner(slider.vertex);
			this._vertices[index] = [svgVertex.x, svgVertex.y];

			// Listen for changes to slider.
			// Record new vertex for drawing star.
			$(`#slider-${index}`).on(AttributeSlider.SLIDE_EVENT + " " + AttributeSlider.CHANGE_EVENT, (event) => {
				let sliderID = event.target.id.split(`-`)[1];
				let vertex = this.getPointFromCorner(this._sliders[sliderID].vertex);
				this._vertices[sliderID] = [vertex.x, vertex.y];
				this.drawStar();

				if (event.type === AttributeSlider.SLIDE_EVENT) {
					this.$chart.trigger(AttributeSlider.SLIDE_EVENT);
				}
			});
		}

		// Draw star.
		this._svgStar = new Snap(`.star`);
		this.drawStar();
		$(window).resize((event) => {
			this.drawStar();
		});
	}

	get $element() {
		return this.$chart;
	}

	getPointFromCenter(pointFromScreenCorner) {
		return {
			x: pointFromScreenCorner.x - this.$chart.offset().left - this.$chart.width()/2,
			y: -1 * (pointFromScreenCorner.y - this.$chart.offset().top - this.$chart.height()/2)
		};
	}

	getPointFromCorner(pointFromCenter) {
		return {
			x: pointFromCenter.x + this.$chart.width()/2,
			y: -pointFromCenter.y + this.$chart.height()/2
		};
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

	get radius() {
		return this._radius;
	}

	drawGuides() {		
		this._svgGuides.clear();

		// Draw scale rings.
		let ringInterval = (this._radius.max - this._radius.min) / RadarChart.SCALE;
		for (let i = 0; i <= RadarChart.SCALE; i++) {
			let ring = this._svgGuides.circle(
				this.$chart.width()/2,
				this.$chart.height()/2,
				this._radius.min + ringInterval * i);
			let attr = {
				fill: "none",
				stroke: "#fff",
				opacity: 0.05,
				strokeWidth: 1
			};

			// Innermost ring has a wider stroke.
			if (i == 0) {
				attr.strokeWidth = 2;
				attr.opacity = 0.5;
				attr.stroke = "#fff";
			}

			ring.attr(attr);
		}

		// Figure out slider angle interval.
		// Sliders are arranged clockwise starting at the 12:00 position (270°). 
		let angleStart = 270; // degrees
		let angleInterval = 360 / this._attributes.length; // degrees

		// Draw slider tracks and terminals.
		for (let [index, attribute] of this._attributes.entries()) {
			// Calculate angle starting from 12:00 (270°) position.
			let angle = angleStart + index*angleInterval;

			// Ensure angle is a value between 0-359.
			let correctedAngle = (angle+360) % 360;

			// Calculate track start and end points.
			let trackStart = {
				x: this._radius.min * Math.cos(Math.radians(correctedAngle)) + this.$chart.width()/2, 
				y: this._radius.min * Math.sin(Math.radians(correctedAngle)) + this.$chart.height()/2
			}
			let trackEnd = {
				x: this._radius.max * Math.cos(Math.radians(correctedAngle)) + this.$chart.width()/2,
				y: this._radius.max * Math.sin(Math.radians(correctedAngle)) + this.$chart.height()/2
			}

			// Draw track.
			let sliderTrack = this._svgGuides.line(
				trackStart.x,
				trackStart.y,
				trackEnd.x,
				trackEnd.y
			);
			sliderTrack.attr({
				stroke: "#fff",
				opacity: 0.1,
				strokeWidth: 2
			});

			// Draw terminal.
			let terminal = this._svgGuides.circle(trackEnd.x, trackEnd.y, AttributeSlider.SIZE/2);
			terminal.attr({
				fill: RadarChart.COLOR_WW_BLUE_DARK,
				stroke: "#fff",
				strokeWidth: 2,
				strokeOpacity: 0.3
			});

			// Emphasize principal attribute.
			if (attribute.name === RadarChart.PRINCIPAL_ATTRIBUTE) {
				sliderTrack.attr({
					opacity: 0.5
				});
				terminal.attr({
					strokeOpacity: 0.5
				});
			} 
		}
	}

	drawStar() {
		this._svgStar.clear();

		let star = this._svgStar.polygon( [].concat.apply([],this._vertices) );
		star.attr({
			fill: RadarChart.COLOR_WW_BLUE_LIGHT,
			fillOpacity: 0.3,
			stroke: RadarChart.COLOR_WW_BLUE_LIGHT,
			strokeWidth: 2,
			strokeOpacity: 0.4
		});
	}

	get config() {
		return this._config;
	}

	set config(index) {
		this._config = index;

		for (let [index, slider] of this._sliders.entries()) {
			TweenLite.to(slider, 0.5, {
				value: this._attributes[index].amount[this._config]
			});		
		}		
	}

	get configs() {
		return this._configs;
	}

}