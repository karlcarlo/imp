(function($) {
	/**
	 * [GanttGrid description]
	 * @param {[HTMLElement]} element
	 * @param {[Object]} options
	 */
	function GanttGrid(element, options) {
		return GanttGrid.fn.init(element, options);
	}

	GanttGrid.templates = {
		layout: ''
	}

	GanttGrid.defaults = {
		version: '0.0.1',
		showWeekends: true,
		cellWidth: 21,
		cellHeight: 31,
		slideWidth: 400,
		vHeaderWidth: 100,
		behavior: {
			clickable: true,
			draggable: true,
			resizable: true
		}
	}

	GanttGrid.fn = GanttGrid.prototype = {

		constructor: GanttGrid,

		init: function(element, options) {
			var that = this;
			this.$element = $(element);
			this.options = $.extend({}, GanttGrid.defaults, options || {});

			this.build();
		},

		build: function() {

			var opts = this.options;

			var minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
			var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
			opts.start = startEnd[0];
			opts.end = startEnd[1];

			var container = this.$element,
				div = $("<div>", {
					"class": "ganttview"
				});

			new Chart(div, opts).render();
			container.append(div);

			var w = $("div.ganttview-vtheader", container).outerWidth() + $("div.ganttview-slide-container", container).outerWidth();
			container.css("width", (w + 2) + "px");

			new Behavior(container, opts).apply();

		}

	}

	GanttGrid.fn.init.prototype = GanttGrid.fn;

	/**
	 * Class Definition
	 */
	var Chart = function(div, opts) {

		function render() {
			addVtHeader(div, opts.data, opts.cellHeight);

			var slideDiv = $("<div>", {
					"class": "ganttview-slide-container",
					"css": {
						"width": opts.slideWidth + "px"
					}
				}),
				dates = getDates(opts.start, opts.end);

			addHzHeader(slideDiv, dates, opts.cellWidth);
			addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.showWeekends);
			addBlockContainers(slideDiv, opts.data);
			addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start);
			div.append(slideDiv);
			applyLastClass(div.parent());
		}

		// var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		var monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

		// Creates a 3 dimensional array [year][month][day] of every day 
		// between the given start and end dates
		function getDates(start, end) {
			var dates = [];
			dates[start.getFullYear()] = [];
			dates[start.getFullYear()][start.getMonth()] = [start]
			var last = start;
			while (last.compareTo(end) == -1) {
				var next = last.clone().addDays(1);
				// 校验next是否为新一年
				if (!dates[next.getFullYear()]) {
					dates[next.getFullYear()] = [];
				}
				// 校验next是否为新一月
				if (!dates[next.getFullYear()][next.getMonth()]) {
					dates[next.getFullYear()][next.getMonth()] = [];
				}
				// 把next插入数组序列
				dates[next.getFullYear()][next.getMonth()].push(next);
				last = next;
			}
			return dates;
		}

		function addVtHeader(div, data, cellHeight) {
			var headerDiv = $("<div>", {
				"class": "ganttview-vtheader"
			});
			for (var i = 0; i < data.length; i++) {
				var itemDiv = $("<div>", {
					"class": "ganttview-vtheader-item"
				});

				itemDiv.append($("<div>", {
					"class": "ganttview-vtheader-item-name",
					"css": {
						"height": cellHeight + "px"
					}
				}).append(data[i].borrower));

				// var seriesDiv = $("<div>", {
				// 	"class": "ganttview-vtheader-series"
				// });

				// seriesDiv.append($("<div>", {
				// 	"class": "ganttview-vtheader-series-name"
				// }).append(data[i].name));

				// itemDiv.append(seriesDiv);
				headerDiv.append(itemDiv);
			}
			div.append(headerDiv);
		}

		function addHzHeader(div, dates, cellWidth) {
			var headerDiv = $("<div>", {
				"class": "ganttview-hzheader"
			});
			var monthsDiv = $("<div>", {
				"class": "ganttview-hzheader-months"
			});
			var daysDiv = $("<div>", {
				"class": "ganttview-hzheader-days"
			});
			var totalW = 0;

			var today = Date.today(),
				current_year = today.getFullYear(),
				current_month = today.getMonth(),
				current_day = today.getDate(),
				is_current_year = false,
				is_current_month = false,
				is_current_day = false;

			for (var y in dates) {
				is_current_year = parseInt(y) === current_year ? true : false;
				for (var m in dates[y]) {
					is_current_month = is_current_year && parseInt(m) === current_month ? true : false;
					var w = dates[y][m].length * cellWidth;
					totalW = totalW + w;
					monthsDiv.append($("<div>", {
						"class": "ganttview-hzheader-month" + (is_current_month ? ' ganttview-hzheader-month-current' : ''),
						"css": {
							"width": w + "px"
						}
					}).append(y + '年，' + monthNames[m]));
					for (var d in dates[y][m]) {
						is_current_day = is_current_year && is_current_month && parseInt(d) === current_day - 1 ? true : false;
						daysDiv.append($("<div>", {
								"class": "ganttview-hzheader-day" + (is_current_day ? ' ganttview-hzheader-day-current' : '')
							})
							.append(dates[y][m][d].getDate()));
					}
				}
			}
			monthsDiv.css("width", totalW + "px");
			daysDiv.css("width", totalW + "px");
			headerDiv.append(monthsDiv).append(daysDiv);
			div.append(headerDiv);
		}

		function addGrid(div, data, dates, cellWidth, showWeekends) {
			var gridDiv = $("<div>", {
				"class": "ganttview-grid"
			});
			var rowDiv = $("<div>", {
				"class": "ganttview-grid-row"
			});
			for (var y in dates) {
				for (var m in dates[y]) {
					for (var d in dates[y][m]) {
						var cellDiv = $("<div>", {
							"class": "ganttview-grid-row-cell"
						});
						if (DateUtils.isWeekend(dates[y][m][d]) && showWeekends) {
							cellDiv.addClass("ganttview-weekend");
						}
						rowDiv.append(cellDiv);
					}
				}
			}
			var w = $("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
			rowDiv.css("width", w + "px");
			gridDiv.css("width", w + "px");
			for (var i = 0; i < data.length; i++) {
				gridDiv.append(rowDiv.clone());
			}
			div.append(gridDiv);
		}

		function addBlockContainers(div, data) {
			var blocksDiv = $("<div>", {
				"class": "ganttview-blocks"
			});
			for (var i = 0; i < data.length; i++) {
				blocksDiv.append($("<div>", {
					"class": "ganttview-block-container"
				}));
			}
			div.append(blocksDiv);
		}

		function addBlocks(div, data, cellWidth, start) {
			var rows = $("div.ganttview-blocks div.ganttview-block-container", div);
			var rowIdx = 0;
			for (var i = 0; i < data.length; i++) {
				var series = data[i];
				var size = DateUtils.daysBetween(series.start, series.end) + 1;
				var offset = DateUtils.daysBetween(start, series.start);
				var block = $("<div>", {
					"class": "ganttview-block",
					"title": series.name + ", " + size + " days",
					"css": {
						"width": ((size * cellWidth) - 9) + "px",
						"margin-left": ((offset * cellWidth) + 3) + "px"
					}
				});
				addBlockData(block, data[i], series);
				if (data[i].color) {
					block.css("background-color", data[i].color);
				}
				block.append($("<div>", {
					"class": "ganttview-block-text"
				}).text(size));
				$(rows[rowIdx]).append(block);
				rowIdx = rowIdx + 1;
			}
		}

		function addBlockData(block, data, series) {
			// This allows custom attributes to be added to the series data objects
			// and makes them available to the 'data' argument of click, resize, and drag handlers
			var blockData = {
				id: data.id,
				name: data.name
			};
			$.extend(blockData, series);
			block.data("block-data", blockData);
		}

		function applyLastClass(div) {
			$("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
			$("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
			$("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
		}

		return {
			render: render
		};
	}

	var Behavior = function(div, opts) {

		function apply() {

			if (opts.behavior.clickable) {
				bindBlockClick(div, opts.behavior.onClick);
			}

			if (opts.behavior.resizable) {
				bindBlockResize(div, opts.cellWidth, opts.start, opts.behavior.onResize);
			}

			if (opts.behavior.draggable) {
				bindBlockDrag(div, opts.cellWidth, opts.start, opts.behavior.onDrag);
			}
		}

		function bindBlockClick(div, callback) {
			$("div.ganttview-block", div).live("click", function() {
				if (callback) {
					callback($(this).data("block-data"));
				}
			});
		}

		function bindBlockResize(div, cellWidth, startDate, callback) {
			$("div.ganttview-block", div).resizable({
				grid: cellWidth,
				handles: "e,w",
				stop: function() {
					var block = $(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) {
						callback(block.data("block-data"));
					}
				}
			});
		}

		function bindBlockDrag(div, cellWidth, startDate, callback) {
			$("div.ganttview-block", div).draggable({
				axis: "x",
				grid: [cellWidth, cellWidth],
				stop: function() {
					var block = $(this);
					updateDataAndPosition(div, block, cellWidth, startDate);
					if (callback) {
						callback(block.data("block-data"));
					}
				}
			});
		}

		function updateDataAndPosition(div, block, cellWidth, startDate) {
			var container = $("div.ganttview-slide-container", div);
			var scroll = container.scrollLeft();
			var offset = block.offset().left - container.offset().left - 1 + scroll;

			// Set new start date
			var daysFromStart = Math.round(offset / cellWidth);
			var newStart = startDate.clone().addDays(daysFromStart);
			block.data("block-data").start = newStart;

			// Set new end date
			var width = block.outerWidth();
			var numberOfDays = Math.round(width / cellWidth) - 1;
			block.data("block-data").end = newStart.clone().addDays(numberOfDays);
			$("div.ganttview-block-text", block).text(numberOfDays + 1);

			// Remove top and left properties to avoid incorrect block positioning,
			// set position to relative to keep blocks relative to scrollbar when scrolling
			block.css("top", "").css("left", "")
				.css("position", "relative").css("margin-left", offset + "px");
		}

		return {
			apply: apply
		};
	}

	var ArrayUtils = {

		contains: function(arr, obj) {
			var has = false;
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] == obj) {
					has = true;
				}
			}
			return has;
		}
	};

	var DateUtils = {

		daysBetween: function(start, end) {
			if (!start || !end) {
				return 0;
			}
			start = Date.parse(start);
			end = Date.parse(end);
			if (start.getYear() == 1901 || end.getYear() == 8099) {
				return 0;
			}
			var count = 0,
				date = start.clone();
			while (date.compareTo(end) == -1) {
				count = count + 1;
				date.addDays(1);
			}
			return count;
		},

		isWeekend: function(date) {
			return date.getDay() % 6 == 0;
		},

		getBoundaryDatesFromData: function(data, minDays) {
			var minStart = new Date(),
				maxEnd = new Date();

			for (var i = 0; i < data.length; i++) {
				var start = Date.parse(data[i].start),
					end = Date.parse(data[i].end);

				if (i == 0) {
					minStart = start;
					maxEnd = end;
				}
				if (minStart.compareTo(start) == 1) {
					minStart = start;
				}
				if (maxEnd.compareTo(end) == -1) {
					maxEnd = end;
				}
			}

			// Insure that the width of the chart is at least the slide width to avoid empty
			// whitespace to the right of the grid
			if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
				maxEnd = minStart.clone().addDays(minDays);
			}

			minStart.addDays(-7);
			maxEnd.addDays(7);

			return [minStart, maxEnd];
		}
	};

	/**
	 * Plugin Definition
	 */
	var old = $.fn.ganttGrid;

	$.fn.ganttGrid = function(option) {
		return this.each(function() {
			var $this = $(this),
				data = $this.data('ganttGrid'),
				options = typeof option == 'object' && option;

			if (!data) $this.data('ganttGrid', (data = new GanttGrid(this, options)));
			if (typeof option == 'string') data[option]();
		})
	}

	$.fn.ganttGrid.constructor = GanttGrid;
	$.fn.ganttGrid.defaults = GanttGrid.defaults;

	/**
	 * no conflict
	 */
	$.fn.ganttGrid.noConflict = function() {
		$.fn.ganttGrid = old;
		return this;
	}

	/**
	 * data api
	 */
	$(function() {
		$('[data-action="ganttGrid"]').ganttGrid();
	})

})(jQuery);