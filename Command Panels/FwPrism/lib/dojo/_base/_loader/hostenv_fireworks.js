/* ===========================================================================
	
	File: hostenv_fireworks.js

	Author - John Dunning
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.1 ($Revision: 1.1 $)
	Last update - $Date: 2010/04/16 05:15:46 $

   ======================================================================== */


	// make sure we are in right environment
if (typeof fw == 'undefined') {
	throw new Error("Attempt to use Fireworks host environment when fw global doesn't exist.");
}


	// we're in dojo/_base/loader/, so the dojo root is two levels up
dojo.baseUrl = Files.getDirectory(Files.getDirectory(fw.currentScriptDir)) + "/";
dojo._name = "fireworks";
dojo.isFireworks = true;


dojo._loadPath = function(/*String*/relpath, /*String?*/module, /*Function?*/cb){
	// 	summary:
	//		Load a Javascript module given a relative path
	//
	//	description:
	//		Loads and interprets the script located at relpath, which is
	//		relative to the script root directory.  If the script is found but
	//		its interpretation causes a runtime exception, that exception is
	//		not caught by us, so the caller will see it.  We return a true
	//		value if and only if the script is found.
	//
	// relpath: 
	//		A relative path to a script (no leading '/', and typically ending
	//		in '.js').
	// module: 
	//		A module whose existance to check for after loading a path.  Can be
	//		used to determine success or failure of the load.
	// cb: 
	//		a callback function to pass the result of evaluating the script

		// first try prefixing relpath with the path to currentScriptDir/lib/dojo/,
		// which is the current script's lib.  the requested file is most likely there.
	var uri = ((relpath.charAt(0) == '/' || relpath.match(/^\w+:/)) ? "" : 
		fw.currentScriptDir + "/lib/dojo/") + relpath;
	var loaded = false;
	
	try{
		loaded = !module ? this._loadUri(uri, cb) : this._loadUriAndCheck(uri, module, cb); // Boolean
	}catch(e){
		console.debug(e);
	}
	
	if (!loaded && uri != relpath) {
			// we couldn't find the module at that uri, and relpath was truly relative
			// (i.e., we prefixed it with the local lib path), so try prefixing it 
			// with this.baseUrl
		uri = ((relpath.charAt(0) == '/' || relpath.match(/^\w+:/)) ? "" : this.baseUrl) + relpath;
	
		try{
			loaded = !module ? this._loadUri(uri, cb) : this._loadUriAndCheck(uri, module, cb); // Boolean
		}catch(e){
			console.debug(e);
		}
	}
	
	return loaded;
}

	// customize the _loadUri method to use fw.runScript to load files
dojo._loadUri = function(uri, cb)
{
	if (this._loadedUrls[uri]){
		return true; 
	}

	if (Files.exists(uri)) {
		this._loadedUrls[uri] = true;
		this._loadedUrls.push(uri);

			// loading a URI in FW means running a script.  uri should be a valid
			// file:// URI.
		fw.runScript(uri);

		return true;
	} else {
		return false;
	}
}


	// we have to patch _getProp because the in operator doesn't seem to work with
	// customData objects on elements.  nor does obj = obj[p] = {} when obj is
	// pointing at customData.
dojo._getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var obj=context||dojo.global;
	for(var i=0, p; obj&&(p=parts[i]); i++){
			// annoyingly, the in operator doesn't work with customData, so we
			// have to test the typeof for undefined
		if (typeof obj[p] != "undefined") {
			obj = obj[p];
		} else if (create) {
				// and obj = obj[p] = {} doesn't work.  ffs!!!
			obj[p] = {};
			obj = obj[p];
		} else {
			obj = undefined;
		}
	}
	return obj; // Any
}


	// there's no way to exit the FW scripting environment
dojo.exit = function(exitcode) {};


//Register any module paths set up in djConfig. Need to do this
//in the hostenvs since hostenv_browser can read djConfig from a
//script tag's attribute.
if(djConfig["modulePaths"]){
	for(var param in djConfig["modulePaths"]){
		dojo.registerModulePath(param, djConfig["modulePaths"][param]);
	}
}
