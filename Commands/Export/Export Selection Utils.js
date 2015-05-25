/* ===========================================================================
	
	File: Export Selection Utils

	Author - John Dunning
	Copyright - 2010 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.1 ($Revision: 1.2 $)
	Last update - $Date: 2010/05/12 05:50:55 $

   ======================================================================== */


// ===========================================================================
//  Main
// ===========================================================================

try {

jdlib = jdlib || {};

jdlib.exportSelection = function(
	inFilename)
{
	var ErrorMsg = "Select one or more elements before running this command.";
	var dom	= fw.getDocumentDOM();

	if (!dom || fw.selection.length == 0) {
		alert(ErrorMsg);
		return;
	}

		// make a copy of the current doc's export options so we can apply them
		// to the new document
	var exportOptions = eval("(" + dom.exportOptions.toSource() + ")");
	var resolution = dom.resolution;
	var resolutionUnits = dom.resolutionUnits;
	var currentBackgroundColor = dom.backgroundColor;

	var originalSelection = [].concat(fw.selection);
	var elements = [];
	var slice = null;
	var sliceBounds = null;
	var selectionBounds = null;

		// check if a slice is selected
	for (var i = 0, len = fw.selection.length; i < len; i++) {
		var element = fw.selection[i];

		if ((element + "") == "[object SliceHotspot]") {
			slice = element;
		} else {
			elements.push(element);
		}
	}

	if (slice) {
		if (originalSelection.length == 1) {
				// the user selected only a slice
			alert(ErrorMsg);
			return;
		}

			// we'll need to know how big the slice is below to make the export
			// document the same size
		fw.selection = slice;
		sliceBounds = dom.getSelectionBounds();
	}

		// create a flattened copy of the selection and then cut it so we don't
		// leave it behind
	fw.selection = elements;
	dom.cloneSelection();
	dom.flattenSelection();
	selectionBounds = dom.getSelectionBounds();
	dom.clipCut();

		// restore the original selection, since we've been messing with it
	fw.selection = originalSelection;

		// create a new document from which we'll export the selection
	fw.createDocument();
	dom	= fw.getDocumentDOM();

		// by default, make the background transparent and use the same
		// resolution as the current doc
	dom.backgroundColor = "#ffffff00";
	dom.setDocumentResolution({ pixelsPerUnit: resolution, units: resolutionUnits });

		// see if the user's specified a different background color in the
		// command's filename.  the color may be 8 chars long if it includes
		// an alpha value at the end.
	var result = inFilename.match(/ (#[a-z0-9]{6,8})/i);

	if (result) {
		dom.backgroundColor = result[1];
	} else {
			// check if they want the same color as the source document
		result = inFilename.match(/ Same/i);

		if (result) {
			dom.backgroundColor = currentBackgroundColor;
		}
	}

		// check if the user wants the background to be transparent (a 6-digit
		// hex color followed by 00 for the alpha).  we have to modify the
		// exportOptions object before applying it to the doc.
	if (/#[a-z0-9]{6}00/i.test(dom.backgroundColor)) {
		if (exportOptions.colorMode == "24 bit") {
				// force 32bit alpha
			exportOptions.colorMode = "32 bit";

				// unless the source doc is in TIFF format, which does support
				// alpha transparency, force the format to PNG so that the
				// background is transparent.  BMPs also have the "custom" format,
				// so we have to check the Mac filetype to figure out whether
				// it's TIFF or BMP.
			if (exportOptions.exportFormat != "custom" ||
					exportOptions.macFileType != "TIFF") {
				exportOptions.exportFormat = "PNG";
			}
		} else if (exportOptions.colorMode == "indexed") {
				// the original doc's export format is 8bit, so set the
				// transparency to index alpha so at least some transparency
				// is maintained
			exportOptions.paletteTransparency = "index alpha";

				// 8bit PNGs support transparency, so leave that format if set, but
				// otherwise, set 8bit TIFFs and BMPs to GIF to get transparency
			if (exportOptions.exportFormat != "PNG") {
				exportOptions.exportFormat = "GIF";
			}
		}
	}

	dom.setExportOptions(exportOptions);

		// paste the pixels in the new document
	dom.clipPaste("do not resample");

	if (slice) {
			// move the flattened pixels to be be in the same relationship to
			// the canvas as they had to the slice.  we have to do this *before*
			// changing the document size; otherwise, the pixels will get
			// clipped prematurely.
		dom.moveSelectionTo({ x: selectionBounds.left - sliceBounds.left,
			y: selectionBounds.top - sliceBounds.top }, false, false);
		
			// set the document to the size of the slice, which might be larger
			// or smaller than the selected elements
		dom.setDocumentCanvasSize({ left: 0, top: 0, 
			right: sliceBounds.right - sliceBounds.left,
			bottom: sliceBounds.bottom - sliceBounds.top }, true);
	} else {
			// make the doc the same size as the flattened pixels
		dom.setDocumentCanvasSizeToDocumentExtents(true);
	}

		// export the doc with its current export options, and ask the user to
		// pick the exported filename
	fw.exportDocumentAs(dom, null, null);

		// the file's not saved, but it's throwaway, so just close it
	dom.close(false);
};

} catch (exception) {
	if (exception.lineNumber) {
		alert([exception, exception.lineNumber, exception.fileName].join("\n"));
	} else {
		throw exception;
	}
}
