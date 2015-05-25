/* ===========================================================================

	Generate Web Assets.jsf

	Copyright (c) 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- add dialog with options to include hidden elements, all pages, etc.
			also option to create new folder in destination directory
			only export elements on a shared layer once when exporting all states

		- maybe do exportElements() for non PNGs, then open a new document,
			import all the exported images, then export as the correct types
				less switching back and forth, but maybe not any faster

		- maybe do PNG8 export if extension is .png8
			could do .jpg90 to set the quality to 90%
			or foo.jpg | HD JPEG to use the "HD JPEG" option

		- maybe use a slice to export
			move it around over each element, and hide everything else?
			doesn't seem to be a way to export just one slice via the API

		- delete everything in the export directory?

		- option to export CSS to absolutely position all the elements

		- use slices to export an arbitrary set of elements, everything under it
			isn't that just exporting the slice?
			maybe don't include partial overlaps

	Done:
		- don't include hidden elements in the export

		- support locked elements and layers

		- command to export just the selection

		- calling reverseElements on every multi-element selection does the wrong
			thing when the elements are all on the same layer
				not clear how to distinguish the cases
			a named layer might have sublayers, but that doesn't mean the sublayer
				has children that will be part of the export

		- what if all the layers are locked?  might not work for pasting
*/


// ===========================================================================
define([
	"./exportOptions",
	"fwlib/layers",
	"fwlib/prefs",
	"fwlib/DomStorage",
	"fwlib/files",
	"fwlib/underscore"
], function(
	exportOptions,
	layers,
	fwprefs,
	DomStorage,
	files,
	_
) {
	const ExtensionRE = /(.+)\.(png|gif|jpg|jpeg)\s*$/;

	var dom,
		exportPath;


	// =======================================================================
	function getExportPath(
		inDom,
		inUpdateExportPath)
	{
		if (!inDom) {
			return;
		}

		var prefs = new fwprefs.PrefsStorage("WebAssets", { lastExportPath: null }),
			settings = new DomStorage("WebAssets", { exportPath: null }, true),
			exportPath = settings.exportPath;

		if (!exportPath || !Files.exists(exportPath) || inUpdateExportPath) {
			exportPath = fw.browseForFolderURL("Generate Web Assets", exportPath || prefs.lastExportPath);
		}

		if (!exportPath) {
			return null;
		}

		if (prefs.lastExportPath != exportPath || settings.exportPath != exportPath) {
			prefs.lastExportPath = exportPath;
			prefs.save();
			settings.exportPath = exportPath;
			settings.save();
		}

		return exportPath;
	}


	// =======================================================================
	function exportState(
		inDom)
	{
		if (!inDom) {
			return;
		}

			// pass true to ignore web layers
		var tree = new layers.LayerTree(inDom, true),
			originalSelection = [].concat(fw.selection);

		dom = inDom;
		exportPath = getExportPath(dom);

		if (exportPath) {
			_.forEach(tree.topLayers, processLayer);
		}

			// clear out the closure globals, so that subsequent runs get the
			// right data
		dom = null;
		exportPath = null;
		fw.selection = originalSelection;
	}


	// =======================================================================
	function exportSelection(
		inDom)
	{
		if (!inDom) {
			return;
		}

			// pass true to ignore web layers
		var tree = new layers.LayerTree(inDom, true),
			exportedNames = {},
			originalSelection = [].concat(fw.selection);

		dom = inDom;
		exportPath = getExportPath(dom);

		if (exportPath) {
			_.forEach(originalSelection, function(element) {
				var name = processElement(element),
					match;

				if (name) {
					exportedNames[name] = true;
				} else {
					fw.selection = element;

					if (originalSelection.length == 1) {
						currentLayer = tree.currentLayer;
					} else {
							// setting the selection during a command doesn't
							// seem to update dom.currentLayerNum if more than
							// one element was selected when the command started.
							// so to figure out which layer contains the element,
							// we have to loop through all of them in the document,
							// checking their customData each time.  ffs.
						currentLayer = tree.getContainingLayer(element);
					}

					if (!currentLayer) {
							// we couldn't find the element in any layer
						return;
					}

					match = currentLayer.name.match(ExtensionRE);

						// walk up the layer hierarchy until we find a layer
						// named with an image extension
					while (!match && currentLayer.index != -1) {
						currentLayer = currentLayer.parent;
						match = currentLayer.name.match(ExtensionRE);
					}

					if (match && !exportedNames[currentLayer.name]) {
							// only export this layer once, even if multiple
							// children are selected
						exportedNames[currentLayer.name] = true;
						exportLayer(dom, currentLayer, exportPath, match[1], match[2]);
					}
				}
			});
		}

			// clear out the closure globals, so that subsequent runs get the
			// right data
		dom = null;
		exportPath = null;
		fw.selection = originalSelection;
	}


	// =======================================================================
	function processLayer(
		inLayer)
	{
		var match = inLayer.name && inLayer.name.match(ExtensionRE);

		if (match) {
			exportLayer(dom, inLayer, exportPath, match[1], match[2]);

				// we don't need to process any children of this layer, since
				// we've already exported them as a single image, so return
				// false to break out of the forEach
			if (inLayer.isTopLayer) {
				return false;
			}
		} else {
			_.forEach(inLayer.sublayers, processLayer);
			_.forEach(inLayer.elements, processElement);
		}
	}


	// =======================================================================
	function processElement(
		inElement)
	{
		var match = inElement.name && inElement.name.match(ExtensionRE);

		if (match && inElement.visible) {
			exportElements(dom, inElement, exportPath, match[1], match[2]);
			return match[1] + match[2];
		}
	}


	// =======================================================================
	function exportLayer(
		inDom,
		inLayer,
		inExportPath,
		inName,
		inType)
	{
			// get all the elements on all the sublayers as well, and remember
			// the original array length, before filtering
		var allElements = inLayer.allElements,
			allElementsLength = allElements.length;

			// filter out the hidden elements
		allElements = _.filter(inLayer.allElements, function(element) {
			return element.visible;
		});

			// if the number of elements directly on the layer is different
			// than the number on all of its sublayers as well, pass true
			// to exportElements so that it will reverse the duplicated elems
		exportElements(inDom, allElements, inExportPath, inName,
			inType, allElementsLength != inLayer.elements.length);
	}


	// =======================================================================
	function exportElements(
		inDom,
		inElements,
		inExportPath,
		inName,
		inType,
		inReverseSelection)
	{
		var filePath = files.path(inExportPath, inName + "." + inType),
			wasFlattened = false,
			bounds,
			delta,
			image,
			newDom;

		inType = inType.toLowerCase();

		if (inType == "png") {
			fw.selection = inElements;

			if (fw.selection.length > 1) {
				inDom.cloneSelection();

					// group the copies so they're all on the same sublayer and
					// reverse the children of the group so that they maintain the
					// right order, but only if they came from different sublayers
				inDom.group();

				if (inReverseSelection) {
					fw.selection = reverseElements(inDom, fw.selection[0].elements);
				}

				inDom.flattenSelection();
				wasFlattened = true;
			}

				// delete any existing file before exporting so that the user
				// doesn't get a confirmation dialog
			Files.deleteFileIfExisting(filePath);
			inDom.exportElements(fw.selection[0], inExportPath, inName);

			if (wasFlattened) {
				inDom.deleteSelection(false);
			}
		} else if (exportOptions[inType]) {
			fw.selection = inElements;

			if (!fw.selection.length) {
				return;
			}

			inDom.cloneSelection();

				// group the copies so they're all on the same sublayer
			inDom.group();
			bounds = inDom.getSelectionBounds();

			if (inReverseSelection) {
					// reverse the children of the group so that they maintain the
					// right order, if they came from different sublayers
				fw.selection = reverseElements(inDom, fw.selection[0].elements);
			}

				// flatten the elements and remember the offset from the original
				// bounds to the pixel rect, if any, so we can move the pixels
				// to the right place in the new doc
			inDom.flattenSelection();
			image = fw.selection[0];
			delta = {
				x: image.pixelRect.left - bounds.left,
				y: image.pixelRect.top - bounds.top
			};
			inDom.clipCut();

			try {
					// create a new document from which we'll export the selection,
					// using a transparent background and the same resolution.
					// for some reason, this works the first time the module is
					// loaded, but not subsequent times, when it throws an error
					// after creating the document.  so wrap the call in a
					// try/catch and use fw.getDocumentDOM() to get the new dom.
				newDom = fw.createFireworksDocument({
						x: bounds.right - bounds.left,
						y: bounds.bottom - bounds.top
					},
					{ pixelsPerUnit: inDom.resolution, units: inDom.resolutionUnits },
					"#ffffff00"
				);
			} catch (exception) {
				newDom = fw.getDocumentDOM();
			}

				// paste the pixels in the new document
			newDom.clipPaste("do not resample");
			newDom = fw.getDocumentDOM();
			newDom.moveSelectionTo(delta, false, false);

			newDom.setExportOptions(exportOptions[inType]);
			fw.exportDocumentAs(newDom, filePath,
				exportOptions[inType]);

				// the file's not saved, but it's throwaway, so just close it
			newDom.close(false);
		}
	}


	// =======================================================================
	function reverseElements(
		inDom,
		inElements)
	{
		inElements = [].concat(inElements);

		return _.map(inElements, function(element) {
			fw.selection = element;
			inDom.arrange("front");
			return fw.selection[0];
		}, this);
	}


	return {
		getExportPath: getExportPath,
		exportState: exportState,
		exportSelection: exportSelection
	}
});
