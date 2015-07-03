/* ===========================================================================
	
	File: io.js

	Author - John Dunning
	Copyright - 2010 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.1.1 ($Revision: 1.6 $)
	Last update - $Date: 2010/07/24 01:40:53 $

   ======================================================================== */


/*
	To do:
		- have saveURLAsFile() method to save remote data to local file
			would probably have to open Flex's save file dialog 
		
	Done:
		- support multiple dojo installations
*/


// ===========================================================================
//  fwlib.dialog
// ===========================================================================

dojo.provide("fwlib.io");
dojo.require("dojo._base.json");


try {

fwlib.io = (function()
{
	var _response = "";
	var _events = {};

		// the path to the current script will be one of these.  since
		// fw.currentScriptDir can be null when one script calls another, we can
		// fallback to the stack of script paths that dojo maintains, or the dojo
		// baseUrl if needed.  we have to remove the .. in the path if it's
		// there (e.g., /dojo/../fwlib/), since runScript seems to get confused
		// by it when running SWFs.
	var _currentScriptDir = fw.currentScriptDir || dojo._fw.currentScriptDir || dojo.baseUrl;
	var _swfPath = _currentScriptDir.replace(/\/dojo\/.*$/, "/fwlib/FWXHR.swf");


	// =======================================================================
	function request(
		inURL,
		inConfig)
	{
			// make sure the response is cleared from the last dialog
		_response = "";
		var response = null;

			// add the URL to the config object so we have just one param to
			// pass to the SWF
		inConfig = inConfig || {};
		inConfig.url = inURL;

			// turn the config object into a string that the SWF can access
		fwlib.io._currentRequest = dojo.toJson(inConfig);

			// open the FWXHR SWF.  it will return its response via _response.
		fw.runScript(_swfPath);
		
			// make sure a _response was set by the dialog.  it may not have if the
			// swf failed for some reason.
		if (_response) {
			response = dojo.fromJson(_response);
			_response = "";
		}
		
		return response;
	}


	// =======================================================================
	function _setResponse(
		inResponse)
	{
		_response = inResponse;
	}
	
	
	return {
		request: request,
		_setResponse: _setResponse,
		_currentRequest: ""
	};
})();

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
  