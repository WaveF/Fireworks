/* ===========================================================================

	image.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./base"
], function(
	base
) {
	// =======================================================================
	base.tag("image", {
		DefaultAttributes: base.defaultAttributes(base.TagBase, {
			opacity: 1,
			x: 0,
			y: 0
		}),


		addElement: function()
		{
			var imagePath = this.directory + this.attr["xlink:href"];

			if (Files.exists(imagePath)) {
				this.dom.importFile(
					imagePath,
					{
						left: this.attr.x,
						top: this.attr.y,
						right: this.attr.x + this.attr.width,
						bottom: this.attr.y + this.attr.height
					},
					this.attr.preserveAspectRatio != "none"
				);
			}
		}
	});
});
