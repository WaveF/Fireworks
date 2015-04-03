/* ===========================================================================
	
	File: Fill With Background Utils

	Author - John Dunning
	Copyright - 2011 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision: 1.3 $)
	Last update - $Date: 2011/04/25 00:17:34 $

   ======================================================================== */

/*
	To do:
		- when selecting multiple paths and a bitmap background, the first time
			the pixels are copied, but then running it again seems to make FW crazy
			starts to eat up all the memory
			this seems to have to do with jiggling the marquee
			instead of saving and restoring the selection repeatedly, maybe copy
				and paste pixels?
			would select all on a pasted bitmap select the individual areas in
				the bitmap?

		- restoring the pointer doesn't seem to work

		- order of selection in array seems to vary depending on whether the
			selection is across sublayers

		- does it cause an internal error with the save selection dialog? 

		- should jiggle the marquee selection before storing it as a target
			so it will snap to bitmap bounds

		- let the user specify a number of pixels to copy, and then repeat those
			within the selection 

		- selecting just the background image and running command causes error

		- when two objects are selected and the background is not a bitmap, the
			copied pixels are placed just above the background element, even if
			there were other elements between it and the target 

		- option to leave bitmap unflattened

	Done:
		- if a paint brush is active, command will try to save its selection
			causing a negative error

		- if user is in paint mode but there's no selection, get a negative error

		- running Cut From Background multiple times doesn't work because the
			source bitmap isn't part of the selection after running the command

		- add Cut From Background command to copy the pixels, fill them with background
			then paste as a separate object

		- when the marquee is the full width of the bitmap, get a negative error

		- reselect original bitmap selection?
			then if command is run again with same selection, select from opposite side
			of selection

		- support multiple objects to define the fill areas

		- support multiple disjoint marquee selections?
			would have to convertMarqueeToPath
			then check if the element has .contours
			if not, treat it as a regular marquee
			if so, store each contour and insert a fill element for each one

*/

// ===========================================================================
//  Main
// ===========================================================================

try {

(function()
{
	jdlib = jdlib || {};
	jdlib.FillWithBackground = jdlib.FillWithBackground || {};
	jdlib.FillWithBackground.lastDirection = jdlib.FillWithBackground.lastDirection || "left";

	
	// =======================================================================
	function createFlattenedCopyByExport(
		inCropBounds)
	{
		var dom	= fw.getDocumentDOM();

			// export as a 32 bit PNG so we get whatever transparency may have been
			// used in the current doc
		var exportOptions = {
			animAutoCrop: true,
			animAutoDifference: true,
			applyScale: false,
			colorMode: "32 bit",
			crop: false,
			cropBottom: 0,
			cropLeft: 0,
			cropRight: 0,
			cropTop: 0,
			ditherMode: "none",
			ditherPercent: 100,
			exportFormat: "PNG",
			frameInfo: [  ],
			interlacedGIF: false,
			jpegQuality: 80,
			jpegSelPreserveButtons: false,
			jpegSelPreserveText: true,
			jpegSelQuality: 90,
			jpegSelQualityEnabled: false,
			jpegSmoothness: 0,
			jpegSubsampling: 0,
			localAdaptive: true,
			lossyGifAmount: 0,
			macCreator: "????",
			macFileType: "????",
			name: null,
			numCustomEntries: 0,
			numEntriesRequested: 0,
			numGridEntries: 6,
			optimized: true,
			paletteEntries: null,
			paletteInfo: null,
			paletteMode: "adaptive",
			paletteTransparency: "none",
			percentScale: 100,
			progressiveJPEG: false,
			savedAnimationRepeat: 0,
			sorting: "none",
			useScale: true,
			webSnapAdaptive: false,
			webSnapTolerance: 14,
			xSize: 0,
			ySize: 0
		};

			// add the .png to the temp path, since exporting to PNG will add it anyway
		var tempPath = Files.getTempFilePath(null) + ".png";

			// remember the current canvas color and then switch it to 100% transparent
			// so that we preserve any transparency in the elements we're copying
		var originalBackground = dom.backgroundColor;
		dom.backgroundColor = "#ffffff00";

		dom.exportTo(tempPath, exportOptions);

		dom.backgroundColor = originalBackground;

		dom.importFile(tempPath, {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0
		}, true);

			// get rid of the temp file
		Files.deleteFileIfExisting(tempPath);

		if (inCropBounds) {
				// crop the bitmap to the bounds of the selection
			dom.cropSelection(inCropBounds);
		}

		var copyBounds = dom.getSelectionBounds();
		var copyPosition = null;

			// make sure there's still a selection after cropping.  if the crop area
			// doesn't intersect with anything in the flattened copy, then there won't be.
		if (copyBounds) {
			copyPosition = { x: copyBounds.left, y: copyBounds.top };

				// cut the bitmap to the clipboard, to make it available to other apps
			dom.clipCut();
			dom.selectNone();
		}

			// return the position of the merged copy so that the caller knows where
			// to move it if they paste it.  if the document is zoomed in or the copy
			// extended off the canvas, dom.clipPaste() will paste it in the middle
			// of the viewport, which is not where we want it.
		return copyPosition;
	}


	// =======================================================================
	function selectPixels(
		inBounds,
		inSourceBitmap)
	{
		var dom	= fw.getDocumentDOM();

			// create a rectangle, convert it to a marquee (which deletes the
			// rect) and save the selection 
		dom.addNewRectangle(inBounds, 0);
		dom.convertPathToMarquee(1, 0);
		dom.saveSelection();
		dom.exitPaintMode();

			// switch to the source bitmap select the pixels in the bitmap
		fw.selection = [inSourceBitmap];
		dom.restoreSelection();
	}


	// =======================================================================
	function copyPixels(
		inBounds,
		inSourceBitmap)
	{
		var dom	= fw.getDocumentDOM();

			// copy the pixels from the bitmap
		selectPixels(inBounds, inSourceBitmap);
		dom.clipCopy();
		dom.exitPaintMode();

			// return the bitmap, even though copying pixels doesn't change
			// its reference
		return fw.selection[0];
	}


	// =======================================================================
	function deletePixels(
		inBounds,
		inSourceBitmap)
	{
		var dom	= fw.getDocumentDOM();

			// delete the pixels from the bitmap
		selectPixels(inBounds, inSourceBitmap);
		dom.deleteSelection(false);
		dom.exitPaintMode();

			// return the bitmap, since deleting pixels changes its reference
		return fw.selection[0];
	}


	// =======================================================================
	function copyNearbyPixels(
		inBounds,
		inDirection,
		inSourceBitmap)
	{
			// we have to create a new bounds rect instead of updating inBounds
			// because that's passed by reference and we don't want to affect
			// the stored target bounds that were passed in
		var bounds;

		if (inDirection == "left") {
				// make sure the copying rectangle is within the bounds of the
				// source bitmap.  if it's not, then nothing will get copied
				// and we'll get a negative error.  we seem to have to shift
				// the rectangle 1 over from the left of the source bitmap, as
				// converting a path right on the left edge of the bitmap to a
				// marquee doesn't seem to work. 
			var left = (inBounds.left > inSourceBitmap.left) ? 
				inBounds.left - 1 : inSourceBitmap.left + 1;

			bounds = {
				left: left,
				top: inBounds.top,
				right: left + 1,
				bottom: inBounds.bottom
			};
		} else {
				// make sure the copying rectangle is within the bounds of the
				// source bitmap.  if it's not, move it to be along the bottom
				// edge. 
			var sourceBottom = inSourceBitmap.top + inSourceBitmap.height;
			var bottom = (inBounds.bottom < sourceBottom) ? 
				inBounds.bottom + 1 : sourceBottom;

			bounds = {
				left: inBounds.left,
				top: bottom - 1,
				right: inBounds.right,
				bottom: bottom
			};
		}

		copyPixels(bounds, inSourceBitmap);
	}


	// =======================================================================
	function insertCopyFromBounds(
		inBounds,
		inSourceBitmap)
	{
		var dom	= fw.getDocumentDOM();

		copyPixels(inBounds, inSourceBitmap);

			// create a bitmap from the copied pixels
		dom.clipPaste();

		return fw.selection[0];
	}


	// =======================================================================
	function handlePaintMode()
	{
		var dom	= fw.getDocumentDOM(),
			sourceBitmap = fw.selection[0],
			sourceIsCopy,
			targetBounds = [],
				// before exiting paint mode, grab the bounds of the current marquee
			allTargetBounds = dom.getSelectionBounds(),
			exception;

		try {
				// save the current marquee selection so that we can exit paint mode
				// to check if an actual bitmap had been selected or whether it was
				// created on demand when the marquee started.  we have to do
				// this in a try/catch because trying to save a selection when
				// there isn't one throws a negative error.  thanks, FW!
			dom.saveSelection();
		} catch (exception) {
			alert("You must select an area of the bitmap before running this command.");
			return null;
		}

		dom.exitPaintMode();

		if (fw.selection.length == 0) {
				// the selection is currently empty, so no bitmap was selected
				// when the marquee was made.  therefore, we'll need to create
				// a flattened copy of the entire document as the source.  it's
				// a little slower, but using createFlattenedCopyByExport lets
				// us support locked elements and sublayers.
			sourceIsCopy = true;
			var copyPosition = createFlattenedCopyByExport();
			dom.clipPaste("do not resample");

				// if the user is zoomed in or if the copy's origin was negative,
				// clipPaste won't put it in the original place, so move it
			dom.moveSelectionTo(copyPosition, false, false)

				// the flattened copy will be the source for the nearby pixels
			sourceBitmap = fw.selection[0];

				// now that we have a source bitmap, apply the marquee selection
				// to it
			dom.restoreSelection();
		} else {
				// there was an actual bitmap selected when the marquee was made,
				// so we'll use that as the source.  restore the marquee and then
				// jiggle it by moving it 0px, which forces the marquee to
				// collapse to the actual pixels in the bitmap.  for instance,
				// if the marquee was made wider than the bitmap, this would
				// adjust its width to be exactly as wide as the bitmap.  this
				// lets the user be a little sloppy in the selection.
				//
				// note that the previous approach of jiggling the marquee,
				// saving the selection, exiting paint more and then restoring
				// the selection below after the if block was a disaster. it
				// might work once or twice, but then could cause FW to flip out
				// and consume all the system memory.  something about saving
				// and restoring that selection an extra time made it mad.
			dom.restoreSelection();
		}

			// now that we have a source bitmap, turn the selection
			// into a path.  if there were multiple disjoint pieces in the
			// marquee, that path will have multiple contours.
		dom.convertMarqueeToPath();

			// create a new layer and move the converted marquee to it.  when
			// it's split below, the component contours are not left selected,
			// so there's no way to know which elements were part of the
			// composite path.  by moving it to its own layer first, we know
			// every element on the layer was in the path.
		var currentLayer = dom.currentLayerNum;
		dom.moveSelectionToNewLayer(false);
		var newLayer = dom.currentLayerNum;

			// split the path to make each selected area its own element
		dom.splitPaths();
		dom.selectAllOnLayer(newLayer, false, false);
		var targetElements = [].concat(fw.selection);

			// store the bounds of each element, which will be filled with
			// background pixels below
		for (var i = 0; i < targetElements.length; i++) {
			fw.selection = [targetElements[i]];
			var currentBounds = dom.getSelectionBounds();

				// converting from a marquee to a path shifts the paths a half
				// pixel from the marquee's bounds, so shift them back before
				// storing the bounds
			targetBounds.push({
				top: Math.floor(currentBounds.top),
				left: Math.floor(currentBounds.left),
				bottom: Math.ceil(currentBounds.bottom),
				right: Math.ceil(currentBounds.right)
			});
		}

			// we don't need the path pieces anymore, so get rid of the new
			// layer we created and switch to the previously selected one
		dom.deleteLayer(-1);
		dom.currentLayerNum = currentLayer;

		return {
			sourceBitmap: sourceBitmap,
			sourceIsCopy: sourceIsCopy,
			targetBounds: targetBounds,
			allTargetBounds: allTargetBounds
		}
	}


	// =======================================================================
	function handleMultipleElements()
	{
		var dom	= fw.getDocumentDOM(),
				// the target objects will be the current selection, minus the
				// source bitmap, which should be the last element in the array
			originalSelection = [].concat(fw.selection),
			targetElements = [].concat(fw.selection),
			targetBounds = [],
			allTargetBounds,
			sourceIsCopy,
			sourceBitmap = targetElements.pop();

		fw.selection = [sourceBitmap];
		var sourceBounds = dom.getSelectionBounds();

			// get each target element's bounds, which we'll fill with the
			// background below
		for (var i = 0; i < targetElements.length; i++) {
			fw.selection = [targetElements[i]];
			var currentBounds = dom.getSelectionBounds();
			targetBounds.push(currentBounds);

				// make sure this target is on top of the source bitmap
			if (currentBounds.left > sourceBounds.right || currentBounds.right < sourceBounds.left ||
					currentBounds.top > sourceBounds.bottom || currentBounds.bottom < sourceBounds.top) {
				alert("One or more of the selected elements did not intersect the bottom-most element, so there was no background to fill them with.");
				fw.selection = originalSelection;
				return null;
			}
		}

			// we need the target elements only to define the bounds, so get
			// rid of them, after saving their full bounding box
		fw.selection = targetElements;
		allTargetBounds = dom.getSelectionBounds();
		dom.deleteSelection(false);

		if (sourceBitmap.toString() != "[object Image]") {
				// the source element is not a bitmap, so clone and flatten it.
				// this enables us to copy the background from a vector object.
			fw.selection = [sourceBitmap];
			dom.cloneSelection()
			dom.flattenSelection();
			sourceIsCopy = true;
			sourceBitmap = fw.selection[0];
		}

		return {
			sourceBitmap: sourceBitmap,
			sourceIsCopy: sourceIsCopy,
			targetBounds: targetBounds,
			allTargetBounds: allTargetBounds
		}
	}


	// =======================================================================
	function handleSingleElement()
	{
		var dom	= fw.getDocumentDOM(),
			targetElements = [].concat(fw.selection),
			targetBounds = [],
			allTargetBounds,
			sourceIsCopy,
			sourceBitmap = targetElements.pop();

			// when only one element is selected, we'll use it as the target and
			// create a flattened copy of the whole doc as the source
		sourceIsCopy = true;
		targetBounds.push(dom.getSelectionBounds());

			// we don't want the targetElement in the flattened copy, so hide it
		var targetElement = fw.selection[0];
		targetElement.visible = false;

			// create the copy and the paste it.  we delete the targetElement only
			// after pasting the copy so that the copy will go onto a layer that
			// we know isn't locked.
		var copyPosition = createFlattenedCopyByExport();
		dom.clipPaste("do not resample");

			// if the user is zoomed in or if the copy's origin was negative,
			// clipPaste won't put it in the original place, so move it
		dom.moveSelectionTo(copyPosition, false, false)

			// the flattened copy will be the source for the nearby pixels
		sourceBitmap = fw.selection[0];

			// we're now done with the targetElement
		fw.selection = [targetElement];
		allTargetBounds = dom.getSelectionBounds();
		dom.deleteSelection(false);

		return {
			sourceBitmap: sourceBitmap,
			sourceIsCopy: sourceIsCopy,
			targetBounds: targetBounds,
			allTargetBounds: allTargetBounds
		}
	}


	// =======================================================================
	jdlib.FillWithBackground.fill = function(
		inCopyPixelsFirst,
		inCopyDirection)
	{
		if (fw.documents.length < 1 || fw.selection.length == 0) {
				// no documents are open or there's no selection
			return;
		}

		var dom	= fw.getDocumentDOM(),
				// save the currently active tool, since going into bitmap mode
				// always sets it to the marquee
			activeTool = fw.activeTool,
			wasInPaintMode = dom.isPaintMode,
			result;

		if (dom.isPaintMode) {
			result = handlePaintMode();
		} else if (fw.selection.length > 1) {
			result = handleMultipleElements();
		} else if (fw.selection.length == 1) {
			result = handleSingleElement();
		}

		if (result) {
			var sourceBitmap = result.sourceBitmap,
				sourceIsCopy = result.sourceIsCopy,
				targetBounds = result.targetBounds,
				allTargetBounds = result.allTargetBounds;
		} else {
				// something went wrong, so bail
			return;
		}

			// default to copying pixels from the left of the targets
		var copyDirection = "left",
			lastFilledBounds = jdlib.FillWithBackground.lastFilledBounds;

		if (inCopyDirection) {
			copyDirection = inCopyDirection;
		} else if (!inCopyPixelsFirst && lastFilledBounds &&
				lastFilledBounds.left == allTargetBounds.left &&
				lastFilledBounds.right == allTargetBounds.right &&
				lastFilledBounds.top == allTargetBounds.top &&
				lastFilledBounds.bottom == allTargetBounds.bottom) {
				// if the same objects as were previously filled are still
				// selected, then switch to the opposite direction.  we do this
				// only if we're not copying the pixels first, as the user has
				// a Cut From Background Vertically command for that. 
			copyDirection = (jdlib.FillWithBackground.lastDirection == "left") ? "bottom" : "left";
		}

		var filledTargets = [],
			originalPixels = [];

		for (var i = 0; i < targetBounds.length; i++) {
			var target = targetBounds[i];

			if (inCopyPixelsFirst) {
					// create a copy of the pixels under this selection
				originalPixels.push(insertCopyFromBounds(target, sourceBitmap));
			}

				// copy the pixels around these bounds
			copyNearbyPixels(target, copyDirection, sourceBitmap);

				// create a filled element the size of the target bounds
			dom.clipPaste("do not resample");
			dom.setSelectionBounds(target, "autoTrimImages transformAttributes");

				// after resizing the bitmap, we have to refresh our reference to it
				// to avoid the dreaded negative error
			filledTargets.push(fw.selection[0]);

				// in case there's transparency in the background pixels, we need to
				// completely delete the target area from the bitmap.  that way,
				// when the copied background pixels are merged with the bitmap,
				// they'll fully replace the bitmap in that area, instead of being
				// merged with the bitmap.  since this changes the bitmap, we have
				// to refresh our reference to it.
			sourceBitmap = deletePixels(target, sourceBitmap);
		}

		if (!sourceIsCopy) {
				// flatten the copied, stretched pixels in each target with the
				// original source bitmap and then remake the reference to it
			fw.selection = [sourceBitmap].concat(filledTargets);
			dom.flattenSelection();
			sourceBitmap = fw.selection[0];

				// since we've flattened everything into one bitmap, go back and
				// reselect the original fill areas, so that the user can rerun the
				// command to switch fill directions
			var targetPaths = [];

			for (var i = 0; i < targetBounds.length; i++) {
					// create a new rectangle the size of the current fill area
				var target = targetBounds[i];
				dom.addNewRectangle(target, 0);
				targetPaths.push(fw.selection[0]);
			}

				// convert the fill area paths to marquee, which will also delete them
			fw.selection = targetPaths;
			dom.convertPathToMarquee(1, 0);

				// converting to a marquee also created a virtual bitmap, so save the
				// selection, re-select the sourceBitmap and apply the selection to
				// it.  otherwise, if the command is re-run, it would be handled as
				// if a marquee selection was made over a locked background.
			dom.saveSelection();
			dom.exitPaintMode();
			fw.selection = [sourceBitmap];
			dom.restoreSelection();
		} else {
				// we no longer need the flattened bitmap we had created
			fw.selection = [sourceBitmap];
			dom.deleteSelection(false);

				// when the source was a non-bitmap or a locked bitmap, we don't
				// have anything to merge the filled pixels with.  so just select
				// those objects.
			fw.selection = filledTargets;
		}

		if (inCopyPixelsFirst) {
				// select the new bitmaps we've created instead of the filled areas
			fw.selection = originalPixels;
		}

			// remember the full bounding box of the last set of objects we filled
		jdlib.FillWithBackground.lastFilledBounds = allTargetBounds;

		if (!inCopyDirection) {
				// we only want to remember the direction if it wasn't specified
				// by the caller
			jdlib.FillWithBackground.lastDirection = copyDirection;
		}

		if (wasInPaintMode) {
				// the user was in paint mode, so restoring the previously active
				// tool works for some reason
			fw.activeTool = activeTool;
		} else {
				// force the tool back to the Pointer, as restoring it to the
				// previously active tool doesn't seem to work if the command shortcut
				// includes the ctrl key.  it just goes to the Marquee instead.
			fw.activeTool = "Pointer";
		}
	}
})();

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
