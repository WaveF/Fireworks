/* ===========================================================================

	svg-file.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"fwlib/files",
	"fwlib/prefs",
	"./svg"
], function(
	files,
	fwprefs,
	svg
) {
	// =======================================================================
	function chooseSVGFile()
	{
		var prefs = new fwprefs.PrefsStorage("SVG", {
				lastFolder: null
			}),
			path = fw.browseForFileURL("select", "", "", prefs.lastFolder);

		if (path) {
			prefs.lastFolder = Files.getDirectory(path);
			prefs.save();

			if (Files.getExtension(path).toLowerCase() != ".svg") {
				alert("The file must have a .svg extension.");
				return;
			}

			if (!Files.exists(path)) {
				alert("The file cannot be found at: " + path);
				return;
			}
		}

		return path;
	}


	// =======================================================================
	return {
		insert: function()
		{
			if (!fw.documents.length) {
					// there are no open documents, so just do an Open
				this.open();
				return;
			}

			var path = chooseSVGFile(),
				dom = fw.getDocumentDOM();

			if (path) {
					// for some highly annoying and completely bizarre
					// reason, we can't just pass a path to the svg.render
					// method and have it read the file and render the SVG.
					// that works on smaller files, but not larger ones,
					// which will kill the JS engine.  so read the file here
					// and then pass the string to render().  ffs.
				var svgString = files.read(path);

					// render the SVG into this document and center it on the doc
				svg.render(svgString, path, dom);

				var element = fw.selection[0],
					delta = {
						x: Math.round((dom.width - element.width) / 2) - element.left,
						y: Math.round((dom.height - element.height) / 2) - element.top
					};

					// use moveSelectionBy and moveFillVectorHandleBy to center
					// the SVG element in the document, since dom.align doesn't
					// move the fill handles
				dom.moveSelectionBy(delta, false, false);
				dom.moveFillVectorHandleBy(delta, "start", false, false);
			}
		},


		open: function()
		{
			var path = chooseSVGFile();

			if (path) {
				var dom = fw.createFireworksDocument({ x: 500, y: 500 },
						{ pixelsPerUnit: 72, units: "inch" }, "#ffffff"),
					svgString = files.read(path),
					svgTag = svg.render(svgString, path, dom),
					attr = svgTag && svgTag.attr,
					viewBox = attr && attr.viewBox,
					width = attr && (viewBox || attr).width,
					height = attr && (viewBox || attr).height;

				if (width && height) {
					dom.width = width;
					dom.height = height;
				} else {
					dom.setDocumentCanvasSizeToDocumentExtents(true);
				}
			}
		}
	};
});
