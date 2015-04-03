/* ===========================================================================

	gradient.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./state",
	"./base",
	"./container",
	"./regex",
	"./gl-matrix",
	"./color",
	"../fw/defaults",
	"fwlib/utils",
	"fwlib/underscore"
], function(
	state,
	base,
	Container,
	re,
	glMatrix,
	lookupColor,
	defaults,
	utils,
	_
) {
	var tag = base.tag;


	// =======================================================================
	function GradientNode(
		inColor,
		inPosition,
		inIsOpacityNode)
	{
		this.color = inColor;
		this.position = inPosition;
		this.isOpacityNode = !!inIsOpacityNode;
	}


	// =======================================================================
	var Gradient = tag(Container, {
		Shape: "linear",
		Point1Name: 1,
		Point2Name: 2,
		Pt1: { x: 0, y: .5 },
		Pt2: { x: 1, y: .5 },
		Pt3: { x: 0, y: .5 },
		DefaultPoints: [
			{ x: 0, y: .5 },
			{ x: 1, y: .5 },
			{ x: 0, y: .5 }
		],


		nodes: null,
		opacityNodes: null,
		fill: null,
		fillHandles: null,


		onOpen: function()
		{
				// force the gradient to set up its attr even inside a <defs>
			this.inheritAttr();
			this.nodes = [];
			this.opacityNodes = [];
		},


		onClose: function()
		{
			if (this.id) {
				this.getLinkedAttributes();

				this.fill = defaults.fill();
				this.fill.gradient = {
					dither: false,
					name: "cn_Custom",
					nodes: this.nodes,
					opacityNodes: this.opacityNodes
				};
				this.fill.shape = this.Shape;

				state.addDef(this.id, this);
			}
		},


		getLinkedAttributes: function()
		{
			var currentGradient = this,
				reference = state.getDef(currentGradient.attr["xlink:href"]),
				loops = 0;

			while (reference && loops < 5) {
				this.nodes = this.nodes.concat(reference.nodes);
				this.opacityNodes = this.opacityNodes.concat(reference.opacityNodes);
				currentGradient = reference;
				reference = state.getDef(currentGradient.attr["xlink:href"]);
				loops++;
			}

				// make sure that we have at least 2 opacity nodes.  push the
				// defaults on the end, so that if we already have a node at 0
				// or 1, that one will take precedence
			if (this.opacityNodes.length < 2) {
				this.opacityNodes.push(new GradientNode("#000000", 0, true),
					new GradientNode("#000000", 1, true));
			}

			this.nodes = this.filterNodes(this.nodes);
			this.opacityNodes = this.filterNodes(this.opacityNodes);
		},


		filterNodes: function(
			inNodes)
		{
			var foundPositions = {};

			return _.filter(inNodes.reverse(), function(node) {
				var result = !(node.position in foundPositions);
				foundPositions[node.position] = node.position;
				return result;
			}).reverse();
		},


		getPoints: function()
		{
			return [
				this.point(this.Point1Name),
				this.point(this.Point2Name),
				null
			];
		},


		setHandles: function()
		{
			var element = fw.selection[0],
				width = element.width,
				height = element.height,
				left = element.left,
				top = element.top,
				objectBoundingBox = this.attr.gradientUnits != "userSpaceOnUse",
				points;

			points = _.map(this.getPoints(), function(point, i) {
				if (objectBoundingBox || !point) {
						// make a copy of the point so that we don't modify the
						// DefaultPoints array
					point = point || utils.copyObject(this.DefaultPoints[i]);
					point.x = left + width * point.x;
					point.y = top + height * point.y;
				}

				return point;
			}, this);

				// transform the handle points through the gradient transform,
				// if any, and then set the fill handles
			points = this.transform(points);
			this.dom.setFillVector(points[0], points[1], points[2]);
		},


		addChild: function(
			inNode)
		{
			var position = utils.parsePercentage(inNode.attr.offset),
				color = lookupColor(inNode.attr["stop-color"]),
				opacity = parseFloat(inNode.attr["stop-opacity"]);

			if (color) {
					// always push an opaque opacity node with a color, since
					// the default opacity is 1 if no stop-opacity is specified
				this.nodes.push(new GradientNode(color, position, false));
				opacity = isNaN(opacity) ? 1 : opacity;
			}

			if (!isNaN(opacity)) {
				this.opacityNodes.push(new GradientNode(
					lookupColor("#000000", opacity), position, true));
			}
		},


		transform: function(
			inPoints)
		{
				// we need to get the transform from the node attributes,
				// not our attr object, which may have a transform mixed in
				// from some other parent object
			var transform = this.node.attributes.gradientTransform || "",
				matrix = transform.match(re.MatrixTransform),
				translate = transform.match(re.TranslateTransform),
				values,
				transformPoint = glMatrix.vec2.transformMat2d;

			if (matrix) {
				values = _.map(matrix[1].split(re.WhitespaceComma), parseFloat);
				inPoints = _.map(inPoints, function(point) {
					var vector = transformPoint([], [point.x, point.y], values);
					return {
						x: vector[0],
						y: vector[1]
					};
				})
			} else if (translate) {
				values = _.map(translate[1].split(re.WhitespaceComma), parseFloat);
				this.dom.moveSelectionBy({ x: values[0], y: values[1] }, false, false);
			}

			return inPoints;
		}
	});
	tag("linearGradient", Gradient);


	// =======================================================================
	tag("radialGradient", Gradient, {
		Shape: "radial",
		Point1Name: "c",
		Point2Name: "f",
		DefaultPoints: [
			{ x: .5, y: .5 },
			{ x: 1, y: .5 },
			{ x: .5, y: 0 }
		],


		onClose: function()
		{
			this._super();
			this.fill.shape = this.attr.gradientUnits != "userSpaceOnUse" ?
				"elliptical" : "radial";
		},


		getPoints: function()
		{
			var pt1 = this.point(this.Point1Name),
				r = this.attr.r;

			return [
				pt1,
				pt1 && r ? { x: pt1.x + r, y: pt1.y } : null,
					// always return null for the third point so that we
					// override the fx,fy point set on the gradient, since
					// if it's an elliptical gradient, we need to handle
					// that point differently
				null
			];
		}
	});


	// =======================================================================
	tag("stop", {
		onOpen: function()
		{
				// force the stop to set up its attr even inside a <defs>
			this.inheritAttr();
		},


		onClose: function()
		{
			// make this a noop since there's nothing to render on a stop
		}
	});
});
