/* ===========================================================================
	
	File: dialog

	Author - John Dunning
	Copyright - 2010 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.1.1 ($Revision: 1.6 $)
	Last update - $Date: 2009/08/16 20:11:28 $

   ======================================================================== */


/*
	To do:
		- catch exceptions in Flex and return them to the JS
			throw them from fwlib.dialog.open?
		
	Done:
		- store current script dir somewhere so we don't have to hard code it
		
*/


// ===========================================================================
//  fwlib.dialog
// ===========================================================================

try {

dojo.provide("fwlib.dialog");
dojo.require("dojo._base.json");

fwlib.dialog = (function()
{
	var _result = "";
	var _events = {};

		// the path to the current script will be one of these.  since
		// fw.currentScriptDir can be null when one script calls another, we can
		// fallback to the stack of script paths that dojo maintains, or the dojo
		// baseUrl if needed.  we have to remove the .. in the path if it's
		// there (e.g., /dojo/../fwlib/), since runScript seems to get confused
		// by it when running SWFs.
	var _currentScriptDir = fw.currentScriptDir || dojo._fw.currentScriptDir || dojo.baseUrl;
	var _swfsPath = _currentScriptDir.replace(/\/dojo\/.*$/, "/fwlib/dialog-swfs/");


	// =======================================================================
	function runSWF(
		inSize)
	{
		var path = _swfsPath + "Command Dialog - " + inSize + ".swf";

		if (!Files.exists(path)) {
				// default to the largest dialog if we can't find the requested one
			path = _swfsPath + "Command Dialog - 500x375.swf";
		}

		fw.runScript(path);
	}


	// =======================================================================
	function extractEvents(
		inDialog)
	{
		var events = {};

		if (inDialog.children) {
			for (var i = 0; i < inDialog.children.length; i++) {
				extractEventsFromElement(inDialog.children[i], events);
			}
		}
		
		return events;
	}


	// =======================================================================
	function extractEventsFromElement(
		inElement,
		inEvents)
	{
		inEvents = inEvents || {};

		for (var typeName in inElement)  {
			break;
		}

		inElement = inElement[typeName];
		
		if (inElement.events && inElement.name) {
			var elementEvents = {};
			
			for (var eventType in inElement.events) {
				if (typeof inElement.events[eventType] != "function") {
					continue;
				}
				
				elementEvents[eventType] = inElement.events[eventType];
					
					// clear the event handler, since the function won't make
					// it across the JSON and we'll let the AS decide how to 
					// handle passing the event back to the JS
				inElement.events[eventType] = "";
			}
			
			inEvents[inElement.name] = elementEvents;
		}
		
		if (inElement.children) {
			for (var i = 0; i < inElement.children.length; i++) {
				arguments.callee(inElement.children[i], inEvents);
			}
		}
	}


	// =======================================================================
	function open(
		inDialog)
	{
			// extract any event handlers from the dialog specification.  this 
			// will change the dialog object by removing the event handler functions.
		_events = extractEvents(inDialog);

			// we have to use a proper JSON serializer rather than toSource
			// because the JSON library on the AS side expects properties to
			// be quoted, which toSource doesn't do.  we also make the JSON
			// available as a property of fwlib.dialog so the SWF can access it
			// without calling a function, which seems to avoid triggering the
			// processing dialog when the SWF is first opened. 
		fwlib.dialog._dialogJSON = dojo.toJson(inDialog);
		
			// make sure the result is cleared from the last dialog
		_result = "";

		runSWF(inDialog.size);

		fwlib.dialog._dialogJSON = "";
		_events = null;
		
		var result = null;
		
			// make sure a _result was set by the dialog.  it may not have if the
			// swf failed for some reason.
		if (_result) {
				// add parens to the string, since it's an object notation and
				// eval will confusingly say "Invalid label" without parens
			result = eval("(" + _result + ")");
			_result = "";
		}
		
		return result;
	}


	// =======================================================================
	function _setResult(
		inResult)
	{
		_result = inResult;
	}


	// =======================================================================
	function _handleEvent(
		inEvent)
	{
		var handler = _events[inEvent.targetName] ? 
			_events[inEvent.targetName][inEvent.type] : null;
			
		var result = null;
		
			// due to an incredibly annoying bug, we can't just call the handler
			// and collect its result.  any function that we call from here that
			// returns a result will cause the modal processing dialog to appear.
			// so we have to return results through some other means.  we can 
			// either throw the result from the handler and catch it here, or
			// the handler can set the result as a property of the event object
			// that we pass it.
		if (handler) {
			try {
				handler(inEvent);
				
					// the handler needs to return its result, if any, on the
					// event object, rather than as a return value 
				result = inEvent.result;
			} catch (exception) {
				result = exception;
			}
		}

			// because of the processing dialog bug, we can't return the handler's
			// result directly to the AS side.  instead, we have to set the 
			// result on a property of fwlib.dialog, which the AS can then retrieve
			// through a second MMExecute call.  we also can't use dojo.toJson
			// to convert the result, since that returns the JSON as a string.
			// we'd have to rewrite that JSON code to return the string through
			// one of the parameters passed to it.
		fwlib.dialog._eventResult = result.toSource();
	}
	
	
	return {
		open: open,
		_setResult: _setResult,
		_handleEvent: _handleEvent,
		_dialogJSON: "",
		_eventResult: ""
	};
})();

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
  