/* ===========================================================================
	
	Copy Merged Utilities.jsf

	Copyright 2012 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- if selection doesn't intersect anything, the whole document is copied
			for bitmap selections, there's nothing to do, because the flattened
				copy has already been copied to the clipboard, and restoring a
				selection and then copying it doesn't affect the clipboard if the
				selection doesn't intersect.  so the whole bitmaps is still on
				the clipboard.

		- maybe turn a selected element into a marquee and then use that to 
			select the flattened bitmap
			so a feathered edge on a rectangle would be applied to the bitmap
			or a circle would crop the selection to that circle, not the 
				element's bounding box

		- a drop shadow on an element used for coyping merged wouldn't be 
			included in the flattened bitmap
	
		- doesn't work with empty web sublayers
			seems to copy the slice as well 

	Done:
		- paste copied pixels into same layer as destination object, not source object
			the problem is there's no way to tell which layer an element is on,
				since dom.currentLayerNum doesn't update while the command is running
			so there's no way to move the new destination object to the original
				layer
			this seems to work now
		
		- select all now seems to select elements on some hidden shared layers?!?
			it seems like if sublayers on a hidden layer still have the eye icon 
				next to them, their contents are included in the select all
			doesn't matter if the parent layer is shared or not 
			the select all command in the UI does the same thing, ffs
			instead of select all, would have to loop through top layers, select
				all on layer if it's visible and add to selection

		- support locked elements when layer isn't locked
			would have to keep track of all locked elements and relock them 
*/


// ===========================================================================
try { (function() {
	jdlib = jdlib || {};
	jdlib.CopyMerged = jdlib.CopyMerged || {};


	// =======================================================================
	function createFlattenedCopy(
		inCropBounds)
	{
		var dom	= fw.getDocumentDOM(),
				// use the layers array from the current frame so we can check
				// the layer visibility and locked state
			layers = dom.frames[dom.currentFrameNum].layers,
			lockedLayers = [],
			layer,
			copyBounds,
			copyPosition = null;

			// check which layers are locked
		for (var i = 0; i < layers.length; i++) {
			layer = layers[i];

				// check if the layer is locked in the current frame
			if (layer.locked) {
				lockedLayers.push(i);
			}
		}

			// unlock all the layers
		dom.setLayerLocked(-1, -1, false, true);

			// lock the web layer so we don't copy any slices
		dom.setLayerLocked(dom.layers.length - 1, -1, true, false);

			// make a copy of everything and flatten it into a bitmap.  we first
			// select none to make sure any temp bitmap from a marquee selection 
			// is gone.
		dom.selectNone();

			// annoyingly, selectAll() selects elements on visible sublayers of
			// a layer that's been hidden, so the old selectAll() method would
			// copy the wrong elements.  instead, loop through each layer and
			// manually add it to the selection if it's visible. 
		for (var i = 0, len = layers.length; i < len; i++) {
			layer = layers[i];

			if (layer.visible && dom.getParentLayerNum(i) == -1) {
				dom.selectAllOnLayer(i, true, false);
			}
		}

		dom.cloneSelection();
		dom.flattenSelection();
		
		if (inCropBounds) {
				// crop the bitmap to the bounds of the selection
			dom.cropSelection(inCropBounds);
		}

		copyBounds = dom.getSelectionBounds();

			// make sure there's still a selection after cropping.  if the crop area
			// doesn't intersect with anything in the flattened copy, then there won't be.
		if (copyBounds) {
			copyPosition = { x: copyBounds.left, y: copyBounds.top };

				// cut the bitmap to the clipboard, to make it available to other apps
			dom.clipCut();
			dom.selectNone();
		}

			// unlock the web layer.  if it was locked previously, it will be
			// re-locked below
		dom.setLayerLocked(dom.layers.length - 1, -1, false, false);

			// relock all the layers that we unlocked, possibly including the web layer
		for (var i = 0; i < lockedLayers.length; i++) {
				// use the dom method rather than .locked so that we handle sublayers
			dom.setLayerLocked(lockedLayers[i], dom.currentFrameNum, true, false);
		}

			// return the position of the merged copy so that the caller knows where
			// to move it if they paste it.  if the document is zoomed in or the copy
			// extended off the canvas, dom.clipPaste() will paste it in the middle
			// of the viewport, which is not where we want it.
		return copyPosition;
	}


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

		var copyBounds = dom.getSelectionBounds(),
			copyPosition = null;

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
	jdlib.CopyMerged.handleCopy = function(
		inFilename)
	{
		if (fw.documents.length < 1) {
				// no documents are open
			return;
		}

		var dom	= fw.getDocumentDOM(),
			cropBounds = null,
			cropToMarquee = false;

			// we handle marquee selections differently than an object selection so
			// that the feathering and shape of the marquee is respected, since
			// createFlattenedCopy can only crop to rectangular bounds
		if (dom.isPaintMode) {
			dom.saveSelection();
			cropToMarquee = true;
		} else if (fw.selection.length > 0) {
				// we'll use the bounds of the selected objects to crop the pixels
			cropBounds = dom.getSelectionBounds();
		}

			// if there's a marquee selection, make sure we exit the paint mode
			// before storing the selection.  otherwise, the virtual bitmap that
			// FW creates when marqueeing over open canvas would be part of the
			// selection, and restoring it would cause an error.
		dom.exitPaintMode();

			// store the current selection so we can restore it later, since we'll
			// be doing a select all below
		var originalSelection = [].concat(fw.selection);

			// make sure that pesky virtual bitmap is gone
		dom.selectNone();

		if (inFilename.indexOf("Locked") > -1) {
				// save the original location of the selection so that we can put in the
				// right place if we paste below
			var copyPosition = createFlattenedCopyByExport(cropBounds);
		} else {
			var copyPosition = createFlattenedCopy(cropBounds);
		}

		if (!copyPosition) {
			alert("No elements intersected the selection, so nothing was copied.");
		} else if (cropToMarquee) {
			dom.clipPaste("do not resample", null);

				// if the user is zoomed in or if the copy's origin was negative,
				// clipPaste won't put it in the original place
			dom.moveSelectionTo(copyPosition, false, false)
			dom.restoreSelection();
			dom.clipCopy();
			dom.exitPaintMode();
			dom.deleteSelection(false);
		}

			// restore the original selection
		fw.selection = originalSelection;
	}


	// =======================================================================
	jdlib.CopyMerged.handleCopySelection = function(
		inFilename)
	{
		if (fw.documents.length < 1 || fw.selection.length == 0) {
				// no documents are open or there's no selection
			return;
		}

		var dom	= fw.getDocumentDOM(),
			sourceIsCopy = false,
			sourceBitmap = null,
			destinationObjects = [],
			boundsElement,
			copyPosition;

			// the stuff we need to do for a single element vs. a marquee 
			// selection is mostly similar, so handle them in a single branch
		if (fw.selection.length < 2) {
			if (dom.isPaintMode) {
				dom.saveSelection();
				dom.exitPaintMode();
			} else {
				boundsElement = fw.selection[0];
				destinationObjects = [boundsElement];
				boundsElement.visible = false;
				dom.selectNone();
			}

			if (inFilename.indexOf("Locked") > -1) {
					// save the original location of the selection so that we 
					// can put it in the right place if we paste below
				copyPosition = createFlattenedCopyByExport();
			} else {
				copyPosition = createFlattenedCopy();
			}

			if (boundsElement) {
					// createFlattenedCopy copies the pixels to the clipboard so that
					// it doesn't get stuck in a locked layer.  we paste it on to the
					// boundsElement's layer, which is guaranteed to not be locked.
				boundsElement.visible = true;
			}
			
			dom.clipPaste("do not resample");

				// if the user is zoomed in or if the copy's origin was negative,
				// clipPaste won't put it in the original place, so move it
			dom.moveSelectionTo(copyPosition, false, false);
			
			if (boundsElement) {
					// remember that we created a copy of the whole doc so that we can
					// delete it after copying it into each of the destination objects
				sourceBitmap = fw.selection[0];
				sourceIsCopy = true;
			} else {
					// there was a marquee selection, so restore it, invert it,
					// and delete those pixels
				dom.restoreSelection();
				dom.selectInverse();
				dom.deleteSelection(false);
				dom.exitPaintMode();
				
					// since we've created the bitmap by modifying the flattened
					// copy, there's no destination element into which we have
					// to paste it.  so we can bail here. 
				return;
			}
		} else {
				// the destination objects will be the current selection, minus the
				// source bitmap, which should be last
			destinationObjects = [].concat(fw.selection);
			sourceBitmap = destinationObjects.pop();

			if (sourceBitmap.toString() != "[object Image]") {
					// the source isn't a bitmap, so make a bitmap copy of it 
					// from which we can copy pixels
				fw.selection = [sourceBitmap];
				dom.cloneSelection();
				dom.flattenSelection();

				sourceBitmap = fw.selection[0];
				sourceIsCopy = true;
			}
		}

		fw.selection = [sourceBitmap];
		
		var sourceBounds = dom.getSelectionBounds(),
			foundNonintersection = false;

		for (var i = 0; i < destinationObjects.length; i++) {
			var destination = destinationObjects[i],
				destinationType = getElementType(destination);

			fw.selection = [destination];
			var destinationBounds = dom.getSelectionBounds();

			if (destinationBounds.left > sourceBounds.right || destinationBounds.right < sourceBounds.left ||
					destinationBounds.top > sourceBounds.bottom || destinationBounds.bottom < sourceBounds.top) {
				foundNonintersection = true;
				destinationObjects[i] = null;
				continue;
			}
			
			if (destinationType != "Image") {
					// rather than special case paths, just turn everything
					// into a bitmap, which will preserve the anti-aliasing
					// and feathering
				dom.flattenSelection();
			}

				// convert the destination object into a bitmap selection
			dom.enterPaintMode();
			dom.selectAll();

				// force the marquee to snap to the actual pixels by "moving"
				// the selection by 0
			dom.moveSelectionBy({ x: 0, y: 0 }, false, true);
			dom.saveSelection();
			dom.exitPaintMode();

				// we're done with the destination bitmap now
			dom.deleteSelection(false);

				// copy the pixels in the stored selection from the source bitmap
			fw.selection = [sourceBitmap];
			dom.restoreSelection();
			dom.clipCopy();
			dom.exitPaintMode();
			dom.selectNone();

			dom.clipPaste("do not resample", null);

				// store the new bitmap so we select it when we're done
			destinationObjects[i] = fw.selection[0];
		}

		if (sourceIsCopy) {
				// we created the source using createFlattenedCopy, so now we need
				// to delete the copy so it doesn't hang around
			fw.selection = [sourceBitmap];
			dom.deleteSelection(false);
		}

		fw.selection = destinationObjects;

			// force the tool back to the Pointer, as restoring it to the
			// previously active tool doesn't seem to work if the command shortcut
			// includes the ctrl key.  going into bitmap mode seems to always
			// set the tool to the marquee.
		fw.activeTool = "Pointer";

		if (foundNonintersection) {
			alert("One or more of the selected elements did not intersect the bottom-most element, so there are no merged pixels to copy into them.");
		}

		function getElementType(
			inElement)
		{
			return (inElement + "").match(/object (.+)\]/)[1];
		}
	}


	// =======================================================================
	jdlib.CopyMerged.handleCopyNewDocument = function(
		inFilename)
	{
		var dom = fw.getDocumentDOM();
		var bounds = dom.getSelectionBounds();

			// copy the flatened selection to the clipboard.  pass our filename to
			// handleCopy so it knows which version of createFlattenedCopy to use.
		jdlib.CopyMerged.handleCopy(inFilename);

			// paste the flattened pixels to see where they are in relation to the
			// object that specified the selection bounds (e.g., a slice).  we need
			// this to position the pixels correctly in the new document, if the
			// pixel area is smaller than the selection area.
		dom.clipPaste();
		var pastedBounds = dom.getSelectionBounds();
		var deltaX = pastedBounds.left - bounds.left;
		var deltaY = pastedBounds.top - bounds.top;
		dom.deleteSelection(false);

			// create a new doc as large as the selection, not the pixels.  make the
			// dpi the same as the current document.
		fw.createFireworksDocument({ x: bounds.right - bounds.left, y: bounds.bottom - bounds.top },
			{ pixelsPerUnit: dom.resolution, units: dom.resolutionUnits }, "#ffffff");

			// use getDocumentDOM() again here because the dom has changed, so we need
			// to reference the new one
		dom = fw.getDocumentDOM();
		dom.clipPaste("do not resample");
		dom.moveSelectionTo({ x: deltaX, y: deltaY }, false, false);
	}
})(); } catch (exception) {
	if (exception.lineNumber) {
		alert([exception, exception.lineNumber, exception.fileName].join("\n"));
	} else {
		throw exception;
	}
}
