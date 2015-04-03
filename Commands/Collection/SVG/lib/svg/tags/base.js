/* ===========================================================================

	tags.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- support multiple classes on elements and multiple selectors per rule

		- maybe subclass clipPath from use, so that if it's not used, it won't
			render

		- calculation of elliptical gradient doesn't seem right for Bookmark.svg
			gradient also doesn't look right in dove

		- support transforms with only 2 values

		- read svg files from a URL

		- support all the transform commands

		- support setting font face based on font-weight style

		- support masking

		- support base64 images

		- support hsb, hsl colors

		- maybe turn strokes with gradients into a new path, separate from the fill
			could be an option on import

		- maybe draw strokes on the inside of shapes, which means the shape
			would need to be 1/2 stroke width bigger

		- support stroke-dashoffset:0;

		- support tspan, need to create multiple textRuns

		- radial gradients with missing attributes may not work
			if there's no r, it will default to 50%, but will assumes the center
				point is also at 50%
			radial gradients that are in user space don't correctly get set to
				elliptical gradients

		- support tref tag, to pull text from a defs section

		- support fixing the text length using spacing

		- support multiple x,y values on text elements, to move individual chars

		- support the clipping behavior of symbols

		- support inheriting non node values from linked gradients

		- support non px size units

		- cache results of style parsing

		- refactor shape related methods out of TagBase into Shape

		- center gradient fill handles when they're horizontal or vertical

		- support effects
			not clear FW can emulate these

		- support paths that have multiple movetos in them
			need to add multiple contours
			faster to create multiple contours or just join the subpaths?

	Done:
		- centering the shapes after rendering them doesn't move the fill handles

		- support local images

		- support reading in file by chunks, might be faster for sax parser?
			doesn't seem to be

		- support display:none

		- maybe split tags into their own modules
			or containers, paths, etc.

		- the points object on commands seems, um, pointless

		- support text as clip path by converting it to a path

		- translating elements with a gradient seems to not move the fill handles

		- support rounded rect corners

		- support exponents on curve values

		- support quad curves

		- support use references
			need to suppress creation of the child elements until they're used
			then they need to inherit from their current parents
			probably need to suppress init until the element is actually used
				move the inherit piece to onOpen, then override in defs.onOpen

		- shrink the text a bit to make it look more like a browser's

		- add svg handler, then store all the elements in this module and return
			them when the tag is closed
			maybe move handling of SAX events into this module
				so keep the tag stack here
				add handlers for when a child of a parent tag is closed

		- support radial gradients

		- pull regexes out as consts

		- refactor path commands to remove multiple checks for last command
			being a moveto

		- support transform on paths

		- support transform on groups

		- readline only works up to 2048 chars, so Inkscape paths often fail
			d attribute gets cut off

		- repeated coords don't work, which Inkscape likes to output
			the args array for a command may contain the points for multiple
				commands, so extractPoints doesn't work right

		- don't call addPoint in Tag.init

		- have way to call superclass methods

		- clean up polyline and polygon

		- some shapes have fills by default
			should probably have a class hierarchy where shapes inherit from others
*/


// ===========================================================================
define([
	"../fw/defaults",
	"./state",
	"./color",
	"./regex",
	"fwlib/utils",
	"fwlib/underscore"
], function(
	defaults,
	state,
	color,
	re,
	utils,
	_
) {
	const NumberUnitsRE = re.NumberUnits,
		CommaRE = re.Comma,
		WhitespaceCommaRE = re.WhitespaceComma,
		SemiColonRE = re.SemiColon,
		StyleAttributesRE = re.StyleAttributes,
		MatrixTransformRE = re.MatrixTransform,
		TranslateTransformRE = re.TranslateTransform;


	// =======================================================================
	function addAttribute(
		inDestination,
		inProperty,
		inAttr,
		inAttrProperty)
	{
		if (inAttrProperty in inAttr) {
			inDestination[inProperty] = inAttr[inAttrProperty];
		}
	}


	// =======================================================================
	function defaultAttributes(
		inConstructor,
		inDefaults)
	{
		return _.createObject(inConstructor.prototype.DefaultAttributes, inDefaults);
	}


	// =======================================================================
	function tag(
		inName,
		inSuper,
		inPrototype)
	{
		if (typeof inName != "string") {
			inPrototype = inSuper;
			inSuper = inName;
			inName = "";
		}

		if (typeof inSuper == "string") {
			inSuper = tags[inSuper];
		}

		if (typeof inSuper != "function") {
			inPrototype = inSuper;

				// this used to set inSuper directly to TagBase, which was a
				// local variable in the define() call.  that worked when all
				// of the tag() calls were in this define.  but when they were
				// broken out into different modules, calls to tag() that didn't
				// specify a super class failed, because the local TagBase var
				// was null, which was it's value when the tag() function was
				// created, even though it had been updated by the call below to
				// define the base class.  this same code worked in Chrome, but
				// failed in FW.  so instead, set TagBase as a property of the
				// api var below, and when we need it as a default super class,
				// we access through the api object, which works.
			inSuper = api.TagBase;
		}

		var constructor = function()
			{
				this.init.apply(this, arguments);
			};

		constructor.NAME = inName;

		var newClass = utils.defineClass(
			constructor,
			inPrototype,
			inSuper);

		if (inName) {
			tags[inName] = newClass;
		}

		return newClass;
	}


	var tags = {},
		api = {
			tags: tags,
			tag: tag,
			defaultAttributes: defaultAttributes
		},
		parsePercentage = utils.parsePercentage;


	// =======================================================================
	api.TagBase = tag({
		DefaultAttributes: {
			visibility: "visible",
			display: "block"
		},


		node: null,
		attr: null,
		dom: null,
		directory: null,
		element: null,
		text: "",
		cdata: "",


		init: function(
			inNode,
			inDom,
			inDirectory)
		{
			this.node = inNode;
			this.dom = inDom || fw.getDocumentDOM();
			this.directory = inDirectory;
			this.type = inNode.name;
			this.id = inNode.attributes.id;
			this.attr = {};

			var attributes = inNode.attributes;

				// convert all the strings to numbers
			_.forEach(attributes, function(value, name) {
				if (NumberUnitsRE.test(value)) {
					attributes[name] = parsePercentage(value);
				}
			}, this);
		},


		render: function()
		{
			this.addElement();
			this.style();
			this.transform();
			this.filter();

			var element = fw.selection[0];

				// if there's a clipping path, we don't need to store a
				// reference to our shape
			if (element && !this.clip(element)) {
				this.element = element;

					// use the node's ID or class for the name of the element
				this.element.name = this.id || this.attr["class"] || null;
			}
		},


		inheritAttr: function()
		{
				// inherit our attributes from a style attribute on the node,
				// then from individual attributes, then from any matching
				// defined styles, then from our DefaultAttributes.  apply the
				// attributes to a blank object.
			this.attr = _.extend(
				{},
				this.DefaultAttributes,
				state.getStyle(this.type),
				state.getStyle(this.node.attributes["class"]),
				state.getGroupAttr(),
				this.node.attributes,
				this.getNodeStyle(this.attr.style)
			);
		},


		onOpen: function()
		{
			this.dom.selectNone();
			this.inheritAttr();
		},


		onText: function(
			inText)
		{
			this.text += inText;
		},


		onCData: function(
			inCData)
		{
			this.cdata += inCData;
		},


		onClose: function()
		{
			this.render();
		},


		getNodeStyle: function()
		{
			var styleAttr = {},
				style = this.node.attributes.style;

			if (_.isString(style)) {
				_.forEach(style.split(SemiColonRE), function(property) {
					var parts = property.match(StyleAttributesRE),
						num,
						value;

					if (parts) {
						value = parts[2];
						num = parseFloat(value);
						styleAttr[parts[1]] = isNaN(num) ? value : num;
					}
				}, this);
			}

			return styleAttr;
		},


		bounds: function()
		{
			var x = this.attr.x || 0,
				y = this.attr.y || 0;

			return {
				left: x,
				top: y,
				right: x + this.attr.width,
				bottom: y + this.attr.height
			};
		},


		point: function(
			inName,
			inRange)
		{
			var xName,
				yName;

			if (_.isNumber(inName)) {
				xName = "x" + inName;
				yName = "y" + inName;
			} else {
				xName = inName + "x";
				yName = inName + "y";
			}

			if (xName in this.attr) {
				return {
					x: parsePercentage(this.attr[xName], inRange),
					y: parsePercentage(this.attr[yName], inRange)
				}
			}
		},


		filter: function()
		{
				// we don't want to inherit filters, so look at the node, not attr
			var filter = state.getDef(this.node.attributes.filter);

			if (filter) {
				filter.apply();
			}
		},


		clip: function(
			inElement)
		{
			var clipPath = state.getDef(this.node.attributes["clip-path"]);

			if (clipPath && inElement) {
					// add ourselves to the clipping path
				clipPath.addClippedChild(inElement);

				return true;
			} else {
				return false;
			}
		},


		transform: function()
		{
				// we need to get the transform from the node attributes,
				// not our attr object, which may have a transform mixed in
				// from some other parent object
			var transform = this.node.attributes.transform || "",
				matrix = transform.match(MatrixTransformRE),
				translate = transform.match(TranslateTransformRE),
				values;

			if (matrix) {
				values = _.map(matrix[1].split(CommaRE), parseFloat);

				if (values.length == 6) {
						// the values are in column order, but don't include
						// the bottom row, so insert 0 0 1 in the bottom
						// row position
					values = values.slice(0, 2)
						.concat(0, values.slice(2, 4), 0, values.slice(4, 6), 1);
					this.dom.transformSelection({ matrix: values }, "transformAttributes");
				}
			} else if (translate) {
				values = _.map(translate[1].split(CommaRE), parseFloat);
				this.dom.moveSelectionBy({ x: values[0], y: values[1] }, false, false);

					// moving the selection doesn't seem to move the fill handles,
					// so move them by the same amount
				this.dom.moveFillVectorHandleBy({ x: values[0], y: values[1] },
					"start", false, false);
			}
		},


		style: function()
		{
			this.fill();
			this.brush();
			this.dom.setOpacity(this.attr.opacity * 100);

			if (this.attr.visibility == "hidden" || this.attr.display == "none") {
				var element = fw.selection[0];

					// setting an element to invisible deselects it, so reselect
					// it after making it invisible, so that we'll store a
					// reference to it in render
				element.visible = false;
				fw.selection = element;
			}
		},


		fill: function()
		{
			var fill = null,
				fillColor = color(this.attr.fill, this.attr["fill-opacity"]),
				fillGradient = state.getDef(this.attr.fill);

			if (fillColor) {
				fill = defaults.fill();
			} else if (fillGradient) {
				fill = fillGradient.fill;
			}

				// use black as a default color here so that FW doesn't complain
				// when we set a null brush or fill and so that the colors are
				// still null when we check them above
			this.dom.setFillNColor(fill, fillColor || "#000000");

			if (fillGradient) {
				fillGradient.setHandles();
			}
		},


		brush: function()
		{
			var brush = null,
				brushOpacity = this.attr["stroke-opacity"],
				brushColor = color(this.attr.stroke, brushOpacity),
				brushGradient = state.getDef(this.attr.stroke),
				brushDashes = this.attr["stroke-dasharray"];

			if (brushGradient) {
					// FW doesn't support gradients on strokes, so default to the
					// color of the first stop, using an opacity that's an average
					// of half the first and last opacity nodes
				brushOpacity = (utils.hexToRGBA(brushGradient.opacityNodes[0].color)[3] +
						utils.hexToRGBA(_.last(brushGradient.opacityNodes).color)[3]) / 2;
				brushColor = color(brushGradient.nodes[0].color, brushOpacity);
			}

			if (brushColor) {
					// dom.setBrush() wants a regular JS object with all the
					// this.attr on it, so make a deep copy before we make changes
				brush = defaults.brush();
				addAttribute(brush, "diameter", this.attr, "stroke-width");

				if (brush.diameter < 1) {
						// FW doesn't support sub-pixel brushes, so adjust the
						// stroke's opacity by the diameter times the brush
						// opacity, to lessen the weight of the stroke and take
						// into account any stroke gradients.  then reset the
						// diameter to 1.
					brushColor = color(brushColor, brush.diameter * brushOpacity);
					brush.diameter = 1;
				}

				if (brushDashes && brushDashes != "none") {
						// make sure brushDashes is a string, since if it's a
						// single number, it will have been parsed into a float
					brushDashes = String(brushDashes).split(WhitespaceCommaRE).slice(0, 6);

					if (brushDashes.length % 2) {
						brushDashes = brushDashes.concat(brushDashes);
					}

					for (var i = 0, len = brushDashes.length; i < len; i += 2) {
						var on = parseFloat(brushDashes[i]),
							off = parseFloat(brushDashes[i + 1]),
							index = (i / 2) + 1;

						brush["dashOnSize" + index] = Math.round(on);
						brush["dashOffSize" + index] = Math.round(off);
					}

					brush.numDashes = Math.min(Math.round(brushDashes.length / 2), 3);
				}
			}

				// use black as a default color here so that FW doesn't complain
				// when we set a null brush or fill and so that the colors are
				// still null when we check them above
			this.dom.setBrushNColor(brush, brushColor || "#000000");

				// SVG strokes are always centered on the border
			this.dom.setBrushPlacement("center");
		}
	});


	return api;
});
