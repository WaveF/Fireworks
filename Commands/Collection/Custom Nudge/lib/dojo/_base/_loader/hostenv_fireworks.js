/* ===========================================================================
	
	File: hostenv_fireworks.js

	Author - John Dunning
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.1 ($Revision: 1.2 $)
	Last update - $Date: 2010/05/08 23:57:18 $

   ======================================================================== */


	// make sure we are in right environment
if (typeof fw == 'undefined') {
	throw new Error("Attempt to use Fireworks host environment when fw global doesn't exist.");
}


	// we're in dojo/_base/loader/, so the dojo root is two levels up
dojo.baseUrl = Files.getDirectory(Files.getDirectory(fw.currentScriptDir)) + "/";
dojo._name = "fireworks";
dojo.isFireworks = true;


	// this is a FW-specific method for adding paths on which _loadPath will
	// look for modules.  we need this because the first command to load dojo
	// will establish the baseUrl, but a subsequent command might request a
	// module that wasn't installed with the first.  so we have to look for the
	// module in the second command's dojo directory.  usually we can find it
	// via the second command's fw.currentScriptDir, but sometimes that'll be null
	// if the command has made previous fw.runScript calls.  so before requiring
	// the module, the command can call dojo._fw.addDojoPath() with the path to
	// its dojo directory, which will be added to the set of paths at which
	// _loadPath looks for modules. 
dojo._fw.dojoPaths = {};
dojo._fw.addDojoPath = function(
	inPath)
{
	if (!(inPath in dojo._fw.dojoPaths)) {
		dojo._fw.dojoPaths[inPath] = true;
	}
}

dojo._fw.scriptStack = [];
dojo._fw.currentScriptDir = ""
dojo._fw.currentScriptFileName = "";


dojo._fw.scriptStackPush = function(
	inPath)
{
		// push the current values onto the stack in preparation for setting
		// them to the new path
	dojo._fw.scriptStack.push([dojo._fw.currentScriptDir, dojo._fw.currentScriptFileName]);

	var lastSlashIndex = inPath.lastIndexOf("/") + 1;
	var dir = inPath.slice(0, lastSlashIndex);
	var filename = inPath.slice(lastSlashIndex);

	dojo._fw.currentScriptDir = dir;
	dojo._fw.currentScriptFileName = filename;
}


dojo._fw.scriptStackPop = function()
{
	var previousScript = dojo._fw.scriptStack.pop();

		// make sure the stack isn't empty
	if (previousScript) {
		dojo._fw.currentScriptDir = previousScript[0]
		dojo._fw.currentScriptFileName = previousScript[1];
	}
}


	// we need to customize the _loadPath method for FW, since where we look
	// for modules is different than on a webserver
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

	var uri;
	var loaded = false;
	var searchPaths = [];

	if (relpath.charAt(0) == '/' || relpath.match(/^\w+:/)) {
			// the caller wants to load an absolute path, so there's nothing
			// to prepend the path with
		searchPaths.push("");
	} else {
		if (fw.currentScriptDir) {
			var libPath = fw.currentScriptDir;

				// if currentScriptDir isn't null, check if we're being called from a
				// file inside the lib folder.  if so, remove the /lib/ and anything
				// following, since we'll append /lib/dojo/ next.
			var match = libPath.match(/\/lib(\/|$)/);
			if (match) {
				libPath = libPath.slice(0, match.index);
			}

				// dojo.require() starts looking for modules in the dojo directory
			searchPaths.push(libPath + "/lib/dojo/");
		}

			// add the base directory from the first command to load dojo
		searchPaths.push(this.baseUrl);

			// add the dojo paths from any subsequent commands that have used dojo
		for (var path in dojo._fw.dojoPaths) {
			searchPaths.push(path);
		}
	}

		// try each path until we find the module
	for (var i = 0; i < searchPaths.length; i++) {
		uri = searchPaths[i] + relpath;

		try {
			loaded = !module ? this._loadUri(uri, cb) :
				this._loadUriAndCheck(uri, module, cb); // Boolean
		} catch(e) {
			console.debug("ERROR", uri, e);
		}

		if (loaded) {
			break;
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

		// we have to check whether the file exists, since runScript will create
		// an empty file at that path if it doesn't 
	if (Files.exists(uri)) {
		this._loadedUrls[uri] = true;
		this._loadedUrls.push(uri);

			// since fw.currentScriptDir will become null when one script calls
			// another, the module files won't know their own path.  so set
			// some variables on dojo._fw with the name and path of the script
			// we're loading, which the script can then check if needed.
		dojo._fw.scriptStackPush(uri);

			// loading a URI in FW means running a script.  uri should be a valid
			// file:// URI.
		fw.runScript(uri);

			// now that the script has been loaded, pop back to the previous
			// script path.  this ensures that if module A requires module B,
			// after the dojo.require() call finishes, the dojo._fw.currentScriptDir
			// value is back to A's path.
		dojo._fw.scriptStackPop();

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
