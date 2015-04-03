/* ===========================================================================
	
	File: bootstrap_fireworks.js

	Author - John Dunning
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.1 ($Revision: 1.1 $)
	Last update - $Date: 2009/02/22 03:48:34 $

   ======================================================================== */


(function()
{
		// save off the current script directory now before running any other
		// scripts, since fw.currentScriptDir will be messed up after 
		// loading the first script.
	var loaderPath = fw.currentScriptDir + "/";
	
		// these files supply the core of dojo
	var scripts = [
		"bootstrap.js",
		"loader.js",
		"hostenv_fireworks.js"
	];
	
		// load the newest version of each file
	for (var i = 0; i < scripts.length; i++) {
		fw.runScript(loaderPath + scripts[i]);
	}

		// load the common libs
	dojo.require("dojo._base");
})();
