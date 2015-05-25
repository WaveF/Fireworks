/* ===========================================================================

	shape.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./base",
	"./state",
	"../fw/defaults"
], function(
	base,
	state,
	defaults
) {
	var tag = base.tag;


	// =======================================================================
	var FilledShape = tag(base.TagBase, {
		DefaultAttributes: base.defaultAttributes(base.TagBase, {
			fill: "#000000",
			opacity: 1
		})
	});


	// =======================================================================
	tag("rect", FilledShape, {
		addElement: function()
		{
			var radius = Math.min(this.attr.rx || this.attr.ry || 0,
				this.attr.width / 2, this.attr.height / 2);

			this.dom.addNewRectanglePrimitive(this.bounds(), 0);
			this.dom.setRectRoundness(radius, "exact");
		}
	});


	// =======================================================================
	var CircularShape = tag(FilledShape, {
		addElement: function()
		{
			this.dom.addNewOval(this.bounds());
		}
	});


	// =======================================================================
	tag("circle", CircularShape, {
		bounds: function()
		{
			with (this.attr) {
				return { left: cx - r, top: cy - r, right: cx + r, bottom: cy + r };
			}
		}
	});


	// =======================================================================
	tag("ellipse", CircularShape, {
		bounds: function()
		{
			with (this.attr) {
				return { left: cx - rx, top: cy - ry, right: cx + rx, bottom: cy + ry };
			}
		}
	});


	// =======================================================================
	tag("line", {
		DefaultAttributes: base.defaultAttributes(base.TagBase, {
			opacity: 1,
			x: 0,
			y: 0
		}),


		addElement: function()
		{
			var x = this.attr.x,
				y = this.attr.y,
				x1 = this.attr.x1 || x,
				y1 = this.attr.y1 || y,
				x2 = this.attr.x2 || x,
				y2 = this.attr.y2 || y;

			this.dom.addNewLine({ x: x1, y: y1 }, { x: x2, y: y2 });
		}
	});


	// =======================================================================
	tag("text", {
		DefaultAttributes: base.defaultAttributes(FilledShape, {
			"text-anchor": "left",
			"font-family": "Verdana",
			"font-size": 12
		}),


		addElement: function()
		{
			this.dom.addNewText(this.bounds(), false);

			var textRuns = defaults.textRuns(),
				alignment = this.attr["text-anchor"],
				fontWeight = this.attr["font-weight"];

			textRuns.textRuns[0].characters = this.text;

				// reduce the font size by 20%, which seems to make it
				// closer to how a browser renders text
			textRuns.initialAttrs.size = this.attr["font-size"] * .8 + "pt";
			textRuns.initialAttrs.alignment = alignment == "middle" ? "center" : alignment;
			textRuns.initialAttrs.face = this.attr["font-family"];
			textRuns.initialAttrs.italic = this.attr["font-style"] == "italic";
			textRuns.initialAttrs.bold = fontWeight == "bold" || fontWeight == "bolder" || fontWeight > 500;

			this.dom.setTextAutoExpand(true);
			this.dom.setTextRuns(textRuns);
		},


		bounds: function()
		{
			var x = this.attr.x + (this.attr.dx || 0),
				y = this.attr.y + (this.attr.dy || 0);

			return { left: x, top: y, right: 0, bottom: 0 };
		}
	});


	return FilledShape;
});
