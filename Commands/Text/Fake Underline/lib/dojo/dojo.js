/* ===========================================================================
	
	File: dojo.js

	Author - John Dunning
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.1 ($Revision: 1.1 $)
	Last update - $Date: 2009/02/22 03:48:34 $

   ======================================================================== */


try {

(function()
{
		// create the root dojo object before loading any bootstrap code so 
		// it'll already have some FW-specific parts
	dojo = {
			// create a place to store FW-specific info
		_fw: {
				// pull the revision from CVS
			revision: "$Revision: 1.1 $".match(/ ([0-9.]+) /)[1]
		}
	};
	
	fw.runScript(fw.currentScriptDir + "/_base/_loader/bootstrap_fireworks.js");
})();

} catch (exception) {
	alert(["dojo.js", exception, exception.lineNumber, exception.fileName].join("\n"));
}
