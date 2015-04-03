/* ===========================================================================
	
	File: Set Custom Nudge Template

	Author - John Dunning
	Copyright - 2009 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision: 1.1 $)
	Last update - $Date: 2009/03/14 00:55:06 $

   ======================================================================== */


/*
	Note: this command file was auto-created by the 
		  "Set Custom Nudge - Create New Shortcut" command.
*/


// ===========================================================================
//  Main
// ===========================================================================

try {

(function()
{
		// first store the current script's filename, since if we need to load
		// the JS file below, the fw.currentScriptFileName gets messed up
	var filename = fw.currentScriptFileName;
	var baseDir = fw.currentScriptDir;
	
	if (typeof jdlib == "undefined" || !jdlib.CustomNudge || typeof jdlib.CustomNudge.handleSet != "function") {
		fw.runScript(fw.currentScriptDir + "/lib/Custom Nudge.js"); 
	}

		// handleSet will determine what to do based on this script's filename
	jdlib.CustomNudge.handleSet(filename, baseDir);
})();

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
