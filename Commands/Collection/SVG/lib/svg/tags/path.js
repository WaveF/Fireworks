/* ===========================================================================

	path.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./state",
	"./base",
	"./shape",
	"./regex",
	"./path-parser",
	"fwlib/utils",
	"fwlib/underscore"
], function(
	state,
	base,
	shape,
	re,
	pathParser,
	utils,
	_
) {
	var tag = base.tag;


	// =======================================================================
	tag("path", shape, {
		cp: { x: 0, y: 0 },
		previousCommand: null,
		pointCount: 0,
		subpaths: null,


		addElement: function()
		{
			this.subpaths = [];

			_.forEach(this.commands(), function(command) {
				_.forEach(this.extractSubcommands(command), function(command) {
					if (command.relative) {
						_.forEach(["pt", "pt1", "pt2"], function(name) {
							var point = command.args[name];

								// even if the current name doesn't appear on
								// args, we still have to continue to the next
								// one, since smooth curveto commands don't have
								// pt1, but do have pt2
							if (point) {
								command.args[name] = this.sumPoints(this.cp, point);
							}
						}, this);
					}

					this[command.type](command);
					this.previousCommand = command;
				}, this);
			}, this);

				// add the last created path to our subpath list, since the last
				// command was probably closepath, not moveto, so we haven't
				// added the last one yet
			if (fw.selection.length) {
				this.subpaths.push(fw.selection[0]);
			}

			if (this.subpaths.length > 1) {
					// join all the subpaths, which seems easier than trying to
					// add contours and insert points as we go
				fw.selection = this.subpaths;
				this.dom.joinPaths();
			}
		},


		style: function()
		{
			this._super();

			var element = fw.selection[0];

			if (element) {
					// update the path with our fill winding rule
				element.isEvenOddFill = (this.attr["fill-rule"] == "nonzero") ? false : true;
			}
		},


		moveto: function(
			inCommand)
		{
			var path = fw.selection[0];

			if (path) {
					// if there's an existing element and we're getting a moveto
					// command, it means this is a new sub path, so push the
					// existing one.  we do this here instead of in closepath
					// in case the previous path didn't get closed.
				this.subpaths.push(path);
				this.dom.selectNone();
			}

			this.pointCount = 0;
			this.addPoint(inCommand.args.pt);
		},


		lineto: function(
			inCommand)
		{
			this.addPoint(inCommand.args.pt);
		},


		"horizontal lineto": function(
			inCommand)
		{
			this.hvlineto(inCommand);
		},


		"vertical lineto": function(
			inCommand)
		{
			this.hvlineto(inCommand);
		},


		hvlineto: function(
			inCommand)
		{
			var coord = inCommand.args,
				axis = inCommand.type == "horizontal lineto" ? "x" : "y",
				point = utils.copyObject(this.cp);

				// adjust to global coords, as this won't have been done
				// by addElement, but only for the single axis in the command
			point[axis] = inCommand.relative ? coord + this.cp[axis] : coord;

			inCommand.args = { pt: point };
			this.lineto(inCommand);
		},


		curveto: function(
			inCommand)
		{
			var args = inCommand.args;
			this.addPoint(args.pt2, args.pt, args.pt1);
		},


		"smooth curveto": function(
			inCommand)
		{
			var args = inCommand.args,
				previousType = this.previousCommand && this.previousCommand.type,
				previousSucc,
				previousPred;

			if (previousType == "curveto" || previousType == "smooth curveto") {
					// use distance between the last point's pred control point
					// and the current point as the amount we'll move forward to
					// calculate the last point's succ control point.  otherwise,
					// we default to undefined, so the last point won't get an
					// outgoing handle in that case.
				previousPred = this.previousCommand.args.pt2;
				previousSucc = {
					x: 2 * this.cp.x - previousPred.x,
					y: 2 * this.cp.y - previousPred.y
				}
			}

			this.addPoint(args.pt2, args.pt, previousSucc);
		},


		"quadratic curveto": function(
			inCommand)
		{
			var args = inCommand.args,
				previousSucc = {
					x: this.cp.x / 3 + args.pt1.x * 2 / 3,
					y: this.cp.y / 3 + args.pt1.y * 2 / 3
				},
				pred = {
					x: args.pt.x / 3 + args.pt1.x * 2 / 3,
					y: args.pt.y / 3 + args.pt1.y * 2 / 3
				};

			this.addPoint(pred, args.pt, previousSucc);
		},


		"smooth quadratic curveto": function(
			inCommand)
		{
			var previousType = this.previousCommand && this.previousCommand.type,
				previousSucc = this.cp,
				previousPred;

			if (previousType == "quadratic curveto" || previousType == "smooth quadratic curveto") {
					// use distance between the last point's pred control point
					// and the new point as the amount we'll move forward to
					// calculate the new point's control point
				previousPred = this.previousCommand.args.pt1;
				previousSucc = {
					x: 2 * this.cp.x - previousPred.x,
					y: 2 * this.cp.y - previousPred.y
				}
			}

			inCommand.args.pt1 = previousSucc;
			this["quadratic curveto"](inCommand);
		},


		"elliptical arc": function(
			inCommand)
		{
			function point(
				inX,
				inY)
			{
				return { x: inX, y: inY };
			}


			var args = inCommand.args,
				pt = args.pt,
				coords = this.arcToCurve(this.cp.x, this.cp.y, args.rx, args.ry,
					args.xAxisRotation, args.largeArc, args.sweep, pt.x, pt.y);

			for (var c = coords.splice(0, 6); c.length; c = coords.splice(0, 6)) {
				this.addPoint(point(c[2], c[3]), point(c[4], c[5]), point(c[0], c[1]));
			}
		},


		closepath: function(
			inCommand)
		{
			var element = fw.selection[0];

			if (element) {
				element.contours[0].isClosed = true;
			}
		},


		addPoint: function(
			inPred,
			inMain,
			inPreviousSucc)
		{
			inMain = inMain || inPred;
			inPreviousSucc = inPreviousSucc || inMain;

			if (this.pointCount) {
				this.dom.appendPointToPath(0, this.pointCount, inPred, inMain, inMain);

				if (inPreviousSucc != inMain) {
						// we need to update the previous point's succeeding
						// control point with this new value
					var lastPoint = fw.selection[0].contours[0].nodes[this.pointCount - 1];
					lastPoint.succX = inPreviousSucc.x;
					lastPoint.succY = inPreviousSucc.y;
				}
			} else {
				this.dom.addNewSinglePointPath(inPred, inMain, inMain, false);
			}

			this.pointCount++;
			this.cp = inMain;
		},


		sumPoints: function(
			inPoint1,
			inPoint2)
		{
			return {
				x: inPoint1.x + inPoint2.x,
				y: inPoint1.y + inPoint2.y
			};
		},


		arcToCurve: function a2c(x1, y1, rx, ry, angle, large_arc_flag,
			sweep_flag, x2, y2, recursive)
		{
			// this function is from Raphael.js: https://github.com/DmitryBaranovskiy/raphael/
			// for more information of where this Math came from visit:
			// http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
			var PI = Math.PI,
				_120 = PI * 120 / 180,
				rad = PI / 180 * (+angle || 0),
				res = [],
				xy,
				rotate = function (x, y, rad)
				{
					var X = x * Math.cos(rad) - y * Math.sin(rad),
						Y = x * Math.sin(rad) + y * Math.cos(rad);
					return {x: X, y: Y};
				};
			if (!recursive) {
				xy = rotate(x1, y1, -rad);
				x1 = xy.x;
				y1 = xy.y;
				xy = rotate(x2, y2, -rad);
				x2 = xy.x;
				y2 = xy.y;
				var x = (x1 - x2) / 2,
					y = (y1 - y2) / 2;
				var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
				if (h > 1) {
					h = Math.sqrt(h);
					rx = h * rx;
					ry = h * ry;
				}
				var rx2 = rx * rx,
					ry2 = ry * ry,
					k = (large_arc_flag == sweep_flag ? -1 : 1) *
						Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y -
							ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
					cx = k * rx * y / ry + (x1 + x2) / 2,
					cy = k * -ry * x / rx + (y1 + y2) / 2,
					f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
					f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

				f1 = x1 < cx ? PI - f1 : f1;
				f2 = x2 < cx ? PI - f2 : f2;
				f1 < 0 && (f1 = PI * 2 + f1);
				f2 < 0 && (f2 = PI * 2 + f2);
				if (sweep_flag && f1 > f2) {
					f1 = f1 - PI * 2;
				}
				if (!sweep_flag && f2 > f1) {
					f2 = f2 - PI * 2;
				}
			} else {
				f1 = recursive[0];
				f2 = recursive[1];
				cx = recursive[2];
				cy = recursive[3];
			}
			var df = f2 - f1;
			if (Math.abs(df) > _120) {
				var f2old = f2,
					x2old = x2,
					y2old = y2;
				f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
				x2 = cx + rx * Math.cos(f2);
				y2 = cy + ry * Math.sin(f2);
				res =
					a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old,
						[f2, f2old, cx, cy]);
			}
			df = f2 - f1;
			var c1 = Math.cos(f1),
				s1 = Math.sin(f1),
				c2 = Math.cos(f2),
				s2 = Math.sin(f2),
				t = Math.tan(df / 4),
				hx = 4 / 3 * rx * t,
				hy = 4 / 3 * ry * t,
				m1 = [x1, y1],
				m2 = [x1 + hx * s1, y1 - hy * c1],
				m3 = [x2 + hx * s2, y2 - hy * c2],
				m4 = [x2, y2];
			m2[0] = 2 * m1[0] - m2[0];
			m2[1] = 2 * m1[1] - m2[1];
			if (recursive) {
				return [m2, m3, m4].concat(res);
			} else {
				res = [m2, m3, m4].concat(res).join().split(",");
				var newres = [];
				for (var i = 0, ii = res.length; i < ii; i++) {
					newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y :
						rotate(res[i], res[i + 1], rad).x;
				}
				return newres;
			}
		},


		extractSubcommands: function(
			inCommand)
		{
			var args = inCommand.args,
				type = inCommand.type,
				relative = inCommand.relative;

			if (!args) {
					// handle closepath commands specially
				return [inCommand]
			} else {
				return _.map(args, function(args, i) {
					if (_.isObject(args) && !("pt" in args)) {
							// moveto and lineto command args just contain a bare
							// point object, so make it a subobject called pt, so that
							// all handlers can work the same way
						args = { pt: args };
					}

					return {
						type: (type == "moveto" && i) ? "lineto" : type,
						relative: relative,
						args: args
					};
				});
			}
		},


		commands: function()
		{
			return pathParser.parse(this.attr.d);
		}
	});


	// =======================================================================
	tag("polyline", "path", {
		commands: function()
		{
				// trim the string before splitting so that the first item in
				// the array isn't a blank string
			var coords = utils.trim(this.attr.points).split(re.WhitespaceComma),
				points = [];

				// create a path command out of every 2 coords
			for (var i = 0, len = coords.length; i < len; i += 2) {
				points.push({
					type: i ? "lineto" : "moveto",
					args: [{
						pt: {
							x: parseFloat(coords[i]),
							y: parseFloat(coords[i + 1])
						}
					}]
				});
			}

			return points;
		}
	});


	// =======================================================================
	tag("polygon", "polyline", {
		commands: function()
		{
				// a polygon is just a closed polyline
			return this._super().concat({ type: "closepath" });
		}
	});
});
