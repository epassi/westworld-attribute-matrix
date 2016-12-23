class AttributeSlider {
	static dragDistance(drag) {
		// Pythagorean theorem calculates distance
		// between chart center and drag position.
		return Math.sqrt(Math.pow(drag.x, 2) + Math.pow(drag.y, 2));
	}

	constructor(chartSelector, sliderSelector, radius, angle) {
		this.$chart = $(chartSelector);
		this.$slider = $(sliderSelector);
		this._radius = 0; // set by setter
		this._angle = 0; // set by setter
		this._dragging = false;
		this._dragToRadiusRatio = 0; // for responsive positioning of slider 

		// Set initial radius.
		this.radius = radius;

		// Set initial angle.
		this.angle = angle;

		// Capture start of slide.
		this.$slider.on(`touchstart`, (event) => {
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
			if (correctedDrag.x > 0)	correctedDrag.x = 0;
			if (correctedDrag.y < 0)	correctedDrag.y = 0;
		} else if (this.angle > 180 && this.angle <= 270) {
			// Quadrant III.
			if (correctedDrag.x > 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		} else {
			// Quadrant IV.
			if (correctedDrag.x < 0) correctedDrag.x = 0;
			if (correctedDrag.y > 0) correctedDrag.y = 0;
		}

		// Don't drag past map radius.
		if (AttributeSlider.dragDistance(correctedDrag) > this._radius) {
			// If drag distance exceeds map radius,
			// set slider position to map radius.
			correctedDrag.x = this._radius * Math.cos(Math.radians(this.angle));
			correctedDrag.y = this._radius * Math.sin(Math.radians(this.angle));
		}

		// Record drag-to-radius ratio for responsive positioning.
		// Note: drag distance should be based on corrected drag WITHOUT slider offset. 
		this._dragToRadiusRatio = AttributeSlider.dragDistance(correctedDrag) / this._radius;

		// Account for slider dimensions.
		correctedDragWithOffset.x = correctedDrag.x - this.$slider.width()/2;
		correctedDragWithOffset.y = correctedDrag.y + this.$slider.height()/2;

		// Set slider position.
		let transform = `translate(${correctedDragWithOffset.x}px, ${-correctedDragWithOffset.y}px)`;
		this.$slider.css(`transform`, transform);
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
		this._dragToRadiusRatio = 0;
	}

	get radius() {
		return this._radius;
	}

	set radius(length) {
		this._radius = length;

		// Update slider position.
		let newDragDistance = this._radius * this._dragToRadiusRatio;

		// Calculate new slider position.
		let drag = {};
		drag.x = newDragDistance * Math.cos(Math.radians(this.angle)) - this.$slider.width()/2;
		drag.y = newDragDistance * Math.sin(Math.radians(this.angle)) + this.$slider.height()/2;

		// Set slider position.
		let transform = `translate(${drag.x}px, ${-drag.y}px)`;
		this.$slider.css(`transform`, transform);
	}

}


