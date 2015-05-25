/* ===========================================================================

	style.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./base",
	"./state",
	"./color",
	"./css-parser",
	"fwlib/underscore"
], function(
	base,
	state,
	color,
	CSSParser,
	_
) {
	// =======================================================================
	base.tag("style", {
		onClose: function()
		{
			var sheet = new CSSParser().parse(this.cdata || this.text);

			if (sheet) {
				_.forEach(sheet.cssRules, function(rule) {
						// strip the leading . from class selectors
					var selector = rule.selectorText().replace(/^\./, ""),
						ruleProperties = {};

					_.forEach(rule.declarations, function(declaration) {
						var value = declaration.values[0].value,
							num = parseFloat(value);

							// convert the color name to a hex value
						value = color(value) || value;
						ruleProperties[declaration.property] = isNaN(num) ? value : num;
					});

					state.addStyle(selector, ruleProperties);
				}, this);
			}
		}
	});
});
