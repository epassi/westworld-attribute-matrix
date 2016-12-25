class AttributeSlider {

	static distanceFromCenter(drag) {
		// Pythagorean theorem calculates distance
		// between chart center and drag position.
		return Math.sqrt(Math.pow(drag.x, 2) + Math.pow(drag.y, 2));
	}

	static get SIZE() {return 30;} // pixels
	static get SLIDE_EVENT() {return `slide`;};

	constructor(chartSelector, sliderID, radius, angle, value) {
		this.$chart = $(chartSelector);
		this.$chartGrid = $(`${chartSelector} .grid`);
		this._radius = {}; // set by setter
		this._angle = 0; // set by setter
		this._dragging = false;
		this._vertex = {x:0, y:0};

		// Create slider element.
		this.$chartGrid.append(`<div class="slider" id="slider-${sliderID}"></div>`);
		this.$slider = $(`#slider-${sliderID}`);
		this.$slider.width(AttributeSlider.SIZE);
		this.$slider.height(AttributeSlider.SIZE);

		// Set initial radius.
		this.radius = radius;

		// Set initial angle.
		this.angle = angle;

		// Set initial value.
		this.value = value;

		// Capture start of slide.
		this.$slider.on(`touchstart`, (event) => {
			event.preventDefault();
			this.onGrab({
				x: this.$slider.position().left - this.$chart.width()/2 + this.$slider.width()/2,
				y: this.$slider.position().top - this.$chart.height()/2 + this.$slider.height()/2
			});
		});
		this.$slider.on(`mousedown`, (event) => {
			this.onGrab({
				x: this.$slider.position().left - this.$chart.width()/2 + this.$slider.width()/2,
				y: this.$slider.position().top - this.$chart.height()/2 + this.$slider.height()/2
			});
		});

		// Drag slider across chart.
		this.$chart.on(`touchmove`, (event) => {
			event.preventDefault();
			this.onDrag(this.chartPosition({
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			}));
		});
		this.$chart.on(`mousemove`, (event) => {
			this.onDrag(this.chartPosition({
				x: event.pageX,
				y: event.pageY
			}));
		});

		// Capture end of slide.
		this.$chart.on(`touchend`, (event) => {
			event.preventDefault();
			this.onDrop();
		});
		this.$chart.on(`mouseup`, (event) => {
			this.onDrop();
		});

		// Cancel slide.
		this.$chart.on(`mouseleave`, (event) => {
			this.onDrop();
		});
	}

	onGrab(grab) {
		this._dragging = true;
		this.$chart.addClass(`is-dragging`);
	}

	onDrag(drag) {
		if (!this._dragging) return;

		// Correct the drag so that slider only travels along its angle.
		// Drag needs horizontal or vertical drag bias based on angle:
		// - Angles within 45 degrees of the X axis have a horizontal bias.
		// - Angles within 45 degrees of the Y axis have a vertical bias.
		// - Bias makes the drag interaction feel more responsive.
		let correctedDrag = {};
		let correctedDragWithOffset = {};
		let closerToVerticalAxis = (this.angle > 45 && this.angle <= 135) || (this.angle > 215 && this.angle <= 315);
		if (closerToVerticalAxis) {
			// Vertical bias. Use given Y, solve for X.
			correctedDrag.x = drag.y / Math.tan(Math.radians(this.angle));
			correctedDrag.y = drag.y;
		} else {
			// Horizontal bias. Use given X, solve for Y.
			correctedDrag.x = drag.x;
			correctedDrag.y = drag.x * Math.tan(Math.radians(this.angle));
		}

		// Don't drag past center.
		if (this.angle > 0 && this.angle <= 90) {
			// Quadrant I.
			if (correctedDrag.x < 0) correctedDrag.x = 0;
			if (correctedDrag.y < 0) correctedDrag.y = 0;
		} else if (this.angle > 90 && this.angle <= 180) {
			// Quadrant II.
			if (correctedDrag.x > 0) correctedDrag.x = 0;
			if (correctedDrag.y < 0) correctedDrag.y = 0;
		} else if (this.angle > 180 && this.angle <= 270) {
			// Quadrant III.
			if (correctedDrag.x > 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		} else {
			// Quadrant IV.
			if (correctedDrag.x < 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		}

		// Don't drag past min radius.
		if (AttributeSlider.distanceFromCenter(correctedDrag) < this._radius.min) {
			// If drag distance exceeds map radius,
			// set slider position to map radius.
			correctedDrag.x = this._radius.min * Math.cos(Math.radians(this.angle));
			correctedDrag.y = this._radius.min * Math.sin(Math.radians(this.angle));
		}

		// Don't drag past max radius.
		if (AttributeSlider.distanceFromCenter(correctedDrag) > this._radius.max) {
			// If drag distance exceeds map radius,
			// set slider position to map radius.
			correctedDrag.x = this._radius.max * Math.cos(Math.radians(this.angle));
			correctedDrag.y = this._radius.max * Math.sin(Math.radians(this.angle));
		}

		// Set value.
		let dragRadiusRatio = (AttributeSlider.distanceFromCenter(correctedDrag) - this._radius.min) / (this._radius.max - this._radius.min);
		this._value = RadarChart.SCALE * dragRadiusRatio;

		// Set vertex.
		this._vertex = correctedDrag;

		// Account for slider dimensions.
		correctedDragWithOffset.x = correctedDrag.x - this.$slider.width()/2;
		correctedDragWithOffset.y = correctedDrag.y + this.$slider.height()/2;

		// Set slider position.
		let transform = `translate(${correctedDragWithOffset.x}px, ${-correctedDragWithOffset.y}px)`;
		this.$slider.css(`transform`, transform);

		// Dispatch slide event.
		// let slideEvent = new CustomEvent(AttributeSlider.SLIDE_EVENT);
		// this.$slider.element[0].dispatchEvent(slideEvent);
		this.$slider.trigger(AttributeSlider.SLIDE_EVENT);
	}

	onDrop(drop) {
		this._dragging = false;
		this.$chart.removeClass(`is-dragging`);
	}

	chartPosition(screenPosition) {
		return {
			x: screenPosition.x - this.$chart.offset().left - this.$chart.width()/2,
			y: -1 * (screenPosition.y - this.$chart.offset().top - this.$chart.height()/2)
		};
	}

	screenPosition(chartPosition) {
		return {
			x: chartPosition.x + this.$chart.offset().left + this.$chart.width()/2,
			y: -1 * (chartPosition.y + this.$chart.offset().top + this.$chart.height()/2)
		};
	}

	get angle() {
		return this._angle;
	}

	set angle(degrees) {
		this._angle = degrees;

		// Reset slider to center.
		this.$slider.css(`transform`, ``);
		this.value = 0;
	}

	get radius() {
		return this._radius;
	}

	set radius(radius) {
		this._radius = radius;

		// Reposition the slider.
		this.value = this.value; 
	}

	get value() {
		return this._value;
	}

	set value(value) {
		this._value = value;

		// Figure out value-to-scale ratio.
		let valueScaleRatio = value / RadarChart.SCALE;

		// Update slider position.
		let newDragDistance = (this._radius.max-this._radius.min) * valueScaleRatio + this._radius.min;

		// Calculate new slider position.
		let drag = {
			x: newDragDistance * Math.cos(Math.radians(this.angle)),
			y: newDragDistance * Math.sin(Math.radians(this.angle))
		};

		// Set vertex.
		this._vertex = drag;

		// Account for slider dimensions.
		let dragWithOffset = {
			x: drag.x - this.$slider.width()/2,
			y: drag.y + this.$slider.height()/2
		};

		// Set slider position.
		let transform = `translate(${dragWithOffset.x}px, ${-dragWithOffset.y}px)`;
		this.$slider.css(`transform`, transform);
	}

	get vertex() {
		return this._vertex;
	}
	
}


