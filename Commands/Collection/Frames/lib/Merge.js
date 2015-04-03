/* ===========================================================================
	
	File: Merge 

	Author - John Dunning
	Copyright - 2009 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 1.1.1 ($Revision: 1.1 $)
	Last update - $Date: 2009/02/22 23:30:06 $

   ======================================================================== */


try {

jdlib = jdlib || {};


// ===========================================================================
jdlib.mergeFrames = function(
	inStartFrame,
	inEndFrame)
{
	var dom	= fw.getDocumentDOM();

	var layerCount = dom.layers.length;
	var frameCount = Math.abs(inEndFrame - inStartFrame) + 1;

	var targetFrameIndex = inEndFrame;

		// create a list of the visible layers
	var unsharedLayers = [];

	for (var i = 0; i < layerCount; i++) {
			// check if the current layer is unshared
		if (dom.layers[i].sharing == "not shared" && 
				dom.layers[i].layerType != "web") {
			unsharedLayers.push(i);
		}
	}

	if (inStartFrame < inEndFrame) {
		var step = -1;
	} else {
		var step = 1;
	}

	for (sourceFrameIndex = targetFrameIndex + step; (inStartFrame - sourceFrameIndex) * step >= 0; sourceFrameIndex += step) {
			// go to the source frame so we can copy the elements
		dom.currentFrameNum = sourceFrameIndex;

		for (i = 0; i < unsharedLayers.length; i++) {
			dom.selectNone();
			var sourceLayerIndex = unsharedLayers[i];

				// make sure we unlock the source and target layers so that 
				// we can copy from one to the other 
			dom.layers[sourceLayerIndex].frames[sourceFrameIndex].locked = false;
			dom.layers[sourceLayerIndex].frames[targetFrameIndex].locked = false;

				// select every element on the source layer.  we have to call
				// exitPaintMode() because if a single bitmap is on the layer,
				// selectAllOnLayer() will enter paint mode.
			dom.selectAllOnLayer(sourceLayerIndex);
			dom.exitPaintMode();

				// only go and copy something if the layer isn't empty
			if (fw.selection.length > 0) {
					// copy the selected contents of the layer to the target frame
				dom.moveSelectionToFrame(targetFrameIndex, true);
			}
		}
	}

	dom.currentFrameNum = targetFrameIndex;

		// now that we've copied everything, delete the original frames.  
		// the Math.min() handles both the front to back and back to front cases.
	dom.deleteFrames(Math.min((targetFrameIndex + step), inStartFrame), frameCount - 1);
}

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
