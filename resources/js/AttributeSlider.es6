class AttributeSlider {

	static distanceFromCenter(drag) {
		// Pythagorean theorem calculates distance
		// between chart center and drag position.
		return Math.sqrt(Math.pow(drag.x, 2) + Math.pow(drag.y, 2));
	}

	static get SIZE() {return 14;} // pixels
	static get SLIDE_EVENT() {return `slide`;};
	static get CHANGE_EVENT() {return `change`;};

	constructor(parentChart, sliderID, angle, value, name) {
		this.parentChart = parentChart;
		this.$chart = parentChart.$element;
		this.$chartGrid = this.$chart.find(`.grid`);
		this._radius = {}; // set by setter
		this._angle = 0; // set by setter
		this._dragging = false;
		this._vertex = {x:0, y:0};
		this._labelLocation = ``;

		// Create slider element.
		this.$chartGrid.append(`<div class="slider" id="slider-${sliderID}"></div>`);
		this.$slider = $(`#slider-${sliderID}`);
		this.$slider.width(AttributeSlider.SIZE);
		this.$slider.height(AttributeSlider.SIZE);

		// Set initial radius.
		// this.radius = radius;
		this.radius = this.parentChart.radius;

		// Set initial angle.
		this.angle = angle;

		// Set initial value to 0.
		// Ignore the value passed in to the constructor so that
		// RadarChart.config can animate slider into its initial state.
		this.value = 0;

		// Create label.
		// Do this after radius has been set.
		let label = `<label class="attribute" id="label-${sliderID}">${name} <span class="amount">[${this.value}]</span></label>`;
		if (angle === 90) {
			this._labelLocation = "top";
		} else if (angle > 90 && angle < 270)	{
			this._labelLocation = "left";
			// Show amount on the left instead of the right.
			label = `<label class="attribute" id="label-${sliderID}"><span class="amount">[${this.value}]</span> ${name}</label>`;
		} else if (angle === 270) {
			this._labelLocation = "bottom";
		} else {
			this._labelLocation = "right";
		}
		this.$chartGrid.append(label);
		this.$label = $(`#label-${sliderID}`);
		// Slight delay before placing label to account for race condition.
		setTimeout(() => {
			this.placeLabel();
		}, 200);

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
			this.onDrag(this.parentChart.getPointFromCenter({
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			}));
		});
		this.$chart.on(`mousemove`, (event) => {
			event.preventDefault();
			this.onDrag(this.parentChart.getPointFromCenter({
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
		this._value = Math.round(RadarChart.SCALE * dragRadiusRatio);
		this.$label.find(`.amount`).text(`[${Math.round(this._value)}]`);
		this.placeLabel(); // Realigns the label as its width changes.

		// Set vertex.
		this._vertex = correctedDrag;

		// Account for slider dimensions.
		correctedDragWithOffset.x = correctedDrag.x - this.$slider.width()/2;
		correctedDragWithOffset.y = correctedDrag.y + this.$slider.height()/2;

		// Set slider position.
		let transform = `translate(${correctedDragWithOffset.x}px, ${-correctedDragWithOffset.y}px)`;
		this.$slider.css(`transform`, transform);

		// Dispatch slide event.
		this.$slider.trigger(AttributeSlider.SLIDE_EVENT);
	}

	onDrop(drop) {
		if (this._dragging) {
			this._dragging = false;
			this.$chart.removeClass(`is-dragging`);

			// Snap to exact value.
			this.value = this.value;
		}
	}

	placeLabel() {
		// Calculate label base position.
		let labelPosition = {
			x: this._radius.max * Math.cos(Math.radians(this.angle)),
			y: this._radius.max * Math.sin(Math.radians(this.angle))
		};

		// Correct for side.
		switch (this._labelLocation) {
			case `top`:
				labelPosition.x -= this.$label.width()/2;
				labelPosition.y += this.$label.height() + AttributeSlider.SIZE;
				break;
			case `left`:
				labelPosition.x -= this.$label.width() + AttributeSlider.SIZE;
				labelPosition.y += this.$label.height()/2;
				break;
			case `bottom`:
				labelPosition.x -= this.$label.width()/2;
				labelPosition.y -= AttributeSlider.SIZE;
				break;
			case `right`:
				labelPosition.x += AttributeSlider.SIZE;
				labelPosition.y += this.$label.height()/2;
				break;
		}

		// Set label position.
		let transform = `translate(${labelPosition.x}px, ${-labelPosition.y}px)`;
		this.$label.css(`transform`, transform);
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

		// Reposition the label.
		if (this.$label) this.placeLabel();
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

		// Set amount in label.
		if (this.$label) {
			this.$label.find(`.amount`).text(`[${Math.round(this._value)}]`);
			this.placeLabel();
		}

		// Dispatch change event.
		this.$slider.trigger(AttributeSlider.CHANGE_EVENT);
	}

	get vertex() {
		return this._vertex;
	}
	
}


