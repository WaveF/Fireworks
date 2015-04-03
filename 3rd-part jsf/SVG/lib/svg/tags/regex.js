/*:==========================================================================

	regex.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

  :======================================================================= */


//:==========================================================================
define({
	NumberUnits: /^\s*[-\d.]+(e[-+\d]+)?+\s*[\w%]*\s*$/,
	RGBColor: /\s*rgba?\(([0-9,. ]+)\)/,
	Comma: /\s*,\s*/,
	WhitespaceComma: /[\s,]+/,
	ColorShorthand: /^\s*#([\da-f])([\da-f])([\da-f])\s*$/i,
	Reference: /(?:url\()?#([-\w]+)\)?/i,
	HexColor: /^#[\da-f]{6}([\da-f]{2})?$/i,
	PercentValue: /\s*[\d.]+\s*%/,
	SemiColon: /\s*;\s*/,
	StyleAttributes: /([-\w]+)\s*:\s*(.+?)\s*;?$/,
	MatrixTransform: /^\s*matrix\s*\(([^)]+)\)\s*$/,
	TranslateTransform: /^\s*translate\s*\(([^)]+)\)\s*$/
});
