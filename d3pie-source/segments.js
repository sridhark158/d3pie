// --------- segments.js -----------
d3pie.segments = {

	/**
	 * Creates the pie chart segments and displays them according to the selected load effect.
	 * @param element
	 * @param options
	 * @private
	 */
	create: function() {

		// we insert the pie chart BEFORE the title, to ensure the title overlaps the pie
		var pieChartElement = _svg.insert("g", "#title")
			.attr("transform", d3pie.math.getPieTranslateCenter)
			.attr("class", "pieChart");

		_arc = d3.svg.arc()
			.innerRadius(_innerRadius)
			.outerRadius(_outerRadius)
			.startAngle(0)
			.endAngle(function(d) {
				var angle = (d.value / _totalSize) * 2 * Math.PI;
				return angle;
			});

		var g = pieChartElement.selectAll(".arc")
			.data(
				_options.data.filter(function(d) { return d.value; }),
				function(d) { return d.label; }
			)
			.enter()
			.append("g")
			.attr("class", function() {
				var className = "arc";
				if (_options.effects.highlightSegmentOnMouseover) {
					className += " arcHover";
				}
				return className;
			});

		// if we're not fading in the pie, just set the load speed to 0
		var loadSpeed = _options.effects.load.speed;
		if (_options.effects.load.effect === "none") {
			loadSpeed = 0;
		}

		g.append("path")
			.attr("id", function(d, i) { return "segment" + i; })
			.style("fill", function(d, index) { return _options.styles.colors[index]; })
			.style("stroke", "#ffffff")
			.style("stroke-width", 1)
			.transition()
			.ease("cubic-in-out")
			.duration(loadSpeed)
			.attr("data-index", function(d, i) { return i; })
			.attrTween("d", d3pie.math.arcTween);

		_svg.selectAll("g.arc")
			.attr("transform",
			function(d, i) {
				var angle = d3pie.math.getSegmentRotationAngle(i, _options.data, _totalSize);
				return "rotate(" + angle + ")";
			}
		);
	},

	addSegmentEventHandlers: function() {
		var $arc = $(".arc");
		$arc.on("click", function(e) {
			var $segment = $(e.currentTarget).find("path");
			var isExpanded = $segment.attr("class") === "expanded";

			d3pie.segments.onSegmentEvent(_options.callbacks.onClickSegment, $segment, isExpanded);

			if (_options.effects.pullOutSegmentOnClick.effect !== "none") {
				if (isExpanded) {
					d3pie.segments.closeSegment($segment[0]);
				} else {
					d3pie.segments.openSegment($segment[0]);
				}
			}
		});

		$arc.on("mouseover", function(e) {
			var $segment = $(e.currentTarget).find("path");
			var isExpanded = $segment.attr("class") === "expanded";
			d3pie.segments.onSegmentEvent(_options.callbacks.onMouseoverSegment, $segment, isExpanded);
		});

		$arc.on("mouseout", function(e) {
			var $segment = $(e.currentTarget).find("path");
			var isExpanded = $segment.attr("class") === "expanded";
			d3pie.segments.onSegmentEvent(_options.callbacks.onMouseoutSegment, $segment, isExpanded);
		});
	},

	// helper function used to call the click, mouseover, mouseout segment callback functions
	onSegmentEvent: function(func, $segment, isExpanded) {
		if (!$.isFunction(func)) {
			return;
		}
		try {
			var index = parseInt($segment.data("index"), 10);
			func({
				segment: $segment[0],
				index: index,
				expanded: isExpanded,
				data: _options.data[index]
			});
		} catch(e) { }
	},

	openSegment: function(segment) {

		// close any open segments
		if ($(".expanded").length > 0) {
			d3pie.segments.closeSegment($(".expanded")[0]);
		}

		d3.select(segment).transition()
			.ease(_options.effects.pullOutSegmentOnClick.effect)
			.duration(_options.effects.pullOutSegmentOnClick.speed)
			.attr("transform", function(d, i) {
				var c = _arc.centroid(d),
					x = c[0],
					y = c[1],
					h = Math.sqrt(x*x + y*y),
					pullOutSize = 8;

				return "translate(" + ((x/h) * pullOutSize) + ',' + ((y/h) * pullOutSize) + ")";
			})
			.each("end", function(d, i) {
				$(this).attr("class", "expanded");
			});
	},

	closeSegment: function(segment) {
		d3.select(segment).transition()
			.duration(400)
			.attr("transform", "translate(0,0)")
			.each("end", function(d, i) {
				$(this).attr("class", "");
			});
	}
};