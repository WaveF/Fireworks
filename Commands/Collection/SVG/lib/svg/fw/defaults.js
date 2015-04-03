/* ===========================================================================

	defaults.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./soft-brush",
	"./soft-fill",
	"./textruns",
	"fwlib/utils"
], function(
	softBrush,
	softFill,
	textRuns,
	utils
) {
	return {
		brush: function()
		{
			return utils.copyObject(softBrush);
		},


		fill: function()
		{
			return utils.copyObject(softFill);
		},


		textRuns: function()
		{
			return utils.copyObject(textRuns);
		}
	}
});
