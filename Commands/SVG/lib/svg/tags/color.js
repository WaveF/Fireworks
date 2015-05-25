/* ===========================================================================

	color.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./css-colors",
	"./regex",
	"fwlib/utils",
	"fwlib/underscore"
], function(
	cssColors,
	re,
	utils,
	_
) {
	const RGBColorRE = re.RGBColor,
		CommaRE = re.Comma,
		ColorShorthandRE = re.ColorShorthand,
		HexColorRE = re.HexColor;


	var cache = {};


	// =======================================================================
	function color(
		inColor,
		inAlpha)
	{
		if (inColor == "none" || !inColor) {
			return null;
		}

		inColor = inColor.toLowerCase();

		var colorName = "" + inColor + inAlpha,
			cachedColor = cache[colorName];

		if (cachedColor) {
			return cachedColor;
		}

			// some rgb strings have spaces after the commas
		var match = inColor.match(RGBColorRE),
			rgb;

		if (match) {
			rgb = _.map(match[1].split(CommaRE), function(channel) {
				var value = Math.round(utils.parsePercentage(channel, 255)).toString(16);

					// make sure single chars are padded with leading 0s
				return ("0" + value).slice(-2);
			});

			inColor = "#" + rgb.join("");
		}

			// look up the named color and expand any shorthand colors
		inColor = cssColors[inColor] || inColor;
		inColor = inColor.replace(ColorShorthandRE, "#$1$1$2$2$3$3");

		if (!HexColorRE.test(inColor)) {
			return null;
		}

		if (_.isNumber(inAlpha)) {
			inAlpha = ("0" + Math.round(inAlpha * 255).toString(16)).slice(-2);
			inColor = inColor.slice(0, 7) + inAlpha;
		}

		cache[colorName] = inColor;

		return inColor;
	}


	return color;
});
