/* ===========================================================================
	
	dialog.js

	Copyright 2012 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- catch exceptions in Flex and return them to the JS
			throw them from fwlib.dialog.open?

		- create styleName for Application so that the styles can be overridden
			doesn't seem to work

		- setting the dataProvider on a ComboBox doesn't work

		- maybe have a module of element factories to simplify JSML creation
			jsml.Button("btn", "Click Me")
			jsml.Menu("myMenu", dp)
			jsml.VBox({ style: {} }, [...])

	Done:
		- add styleName to the dialog title so it can be controlled

		- need to extract event handlers from dialog.root

		- simple form dialogs

		- rich prompt dialog

		- add method to event object to add results
			or just event.result = [] and let handlers push results? 

		- move simple dialogs to separate module

		- have way to not show the title

		- support setting an icon for the dialog 
		
		- store current script dir somewhere so we don't have to hard code it
		
*/


// ===========================================================================
define([
	"dojo/json"
], function(
	JSON)
{
	var _result = "",
		_events = {},
		_dialogEvents = {},
		_uniqueID = 0,
		_swfsPath;

		// trigger an exception so we can get an accurate path to this file
	try { 0(); } catch (exception) {
		_swfsPath = Files.getDirectory(exception.fileName) + "/dialog-swfs/";
	}
	
	
	// =======================================================================
	function mixin(
		inDestination,
		inSource)
	{
		if (typeof inSource == "object" && inSource) {
			for (var name in inSource) {
				if (!inDestination.hasOwnProperty(name)) {
					inDestination[name] = inSource[name];
				}
			}
		}
		
		return inDestination;
	}


	// =======================================================================
	function runSWF(
		inDialog)
	{
			// first look for a custom swf named with the dialog title
		var path = _swfsPath + inDialog.title + ".swf";

		if (!Files.exists(path)) {
			path = _swfsPath + "Dialog [" + inDialog.size + "].swf";
		
			if (!Files.exists(path)) {
					// default to the largest dialog if we can't find the
					// requested one
				path = _swfsPath + "Dialog [500x375].swf";
			}
		}

		fw.runScript(path);
	}


	// =======================================================================
	function extractDialogEvents(
		inDialog)
	{
		var events = {},
			eventNames = {};

		if (inDialog.events) {
			events = inDialog.events;

				// create another object that has the same properties as the
				// events object but with the values set to "".  this way, the
				// event names will make it across to the AS.  we'll store the
				// event handler functions here on the JS side.
			for (var name in events) {
				eventNames[name] = "";
			}

			inDialog.events = eventNames;
		}
		
		return events;
	}


	// =======================================================================
	function extractEvents(
		inDialog)
	{
		var events = {},
				// if there's a custom root for the dialog, wrap it an array so
				// we can treat it the same as inDialog.children
			children = (inDialog.root && [inDialog.root]) || inDialog.children;

		if (children) {
			for (var i = 0; i < children.length; i++) {
				extractEventsFromElement(children[i], events);
			}
		}
		
		return events;
	}


	// =======================================================================
	function extractEventsFromElement(
		inElement,
		inEvents)
	{
		for (var typeName in inElement)  {
			break;
		}

		inElement = inElement[typeName];
		
		if (inElement.events) {
			if (!inElement.name) {
					// the element needs a unique name so we can dispatch the
					// event to it from the AS side, but the user didn't supply
					// a name, so give it a unique ID
				inElement.name = getUniqueID(typeName);
			}

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
	function getUniqueID(
		inBaseName)
	{
		return (inBaseName || "") + _uniqueID++;
	}


	// =======================================================================
	function addDefaultJSML(
		inDialog)
	{
		var css = inDialog.css = inDialog.css || {},
			ControlBar = css.ControlBar = css.ControlBar || {},
			DialogPanel = css[".DialogPanel"] = css[".DialogPanel"] || {},
			DialogTitle = css[".DialogTitle"] = css[".DialogTitle"] || {};
		
		mixin(ControlBar, {
			paddingRight: 4,
			paddingBottom: 4,
			paddingLeft: 15,
			horizontalAlign: "right"
		});

		mixin(DialogPanel, {
			paddingTop: 5,
				// add no padding on the left so text in the panel aligns with
				// the text in the title
			paddingLeft: 0,
			paddingRight: 5,
			paddingBottom: 5,
			cornerRadius: 0,
			borderStyle: "none",
			dropShadowEnabled: false,
			backgroundColor: 0xf0f0f0,
			borderAlpha: 1,
			backgroundAlpha: 1
		});
		
		mixin(DialogTitle, {
			fontWeight: "bold"
		});
		
			// wrap the confirm and dismiss button IDs in an array if necessary, 
			// since the AS expects it
		if (inDialog.confirmButton && !(inDialog.confirmButton instanceof Array)) {
			inDialog.confirmButton = [inDialog.confirmButton];
		}

		if (inDialog.dismissButton && !(inDialog.dismissButton instanceof Array)) {
			inDialog.dismissButton = [inDialog.dismissButton];
		}

		if (inDialog.root) {
				// if a root object is specified, we have to assume it contains
				// the necessary buttons
			return;
		}
		
		var buttonBar =
			{ ControlBar: {
				children: [
					{ Button: {
						name: "OKBtn",
						label: "OK",
						width: 75,
						emphasized: true
					} },
					{ Button: {
						name: "CancelBtn",
						label: "Cancel",
						width: 75
					} }
				]
			} },
			buttons = buttonBar.ControlBar.children,
			buttonWidth = inDialog.buttons && inDialog.buttons[2];
			
			// make sure the JSML object includes a children array, since we 
			// assume it does below
		inDialog.children = inDialog.children || [];
			
			// make sure defaultButtons isn't false, in which case we don't 
			// want to show any buttons.  if there's a custom root element, we 
			// don't want to add default buttons, of there's already a ControlBar.
		if (inDialog.defaultButtons !== false && 
				(inDialog.buttons || inDialog.defaultButtons || !inDialog.children.length || 
				!inDialog.children[inDialog.children.length - 1].ControlBar)) {
			if (inDialog.buttons && inDialog.buttons.length) {
				buttons[0].Button.label = inDialog.buttons[0] || "OK";
				buttons[1].Button.label = inDialog.buttons[1] || "Cancel";

				if (!isNaN(buttonWidth)) {
					if (buttonWidth) {
						buttons[0].Button.width = buttons[1].Button.width = buttonWidth;
					} else {
							// if buttonWidth is 0, we won't set a width and the 
							// buttons will resize based on their labels
						delete buttons[0].Button.width 
						delete buttons[1].Button.width;
					}
				}
			}

				// swap the buttons after we've applied the labels
			if (fw.platform == "mac") {
				buttons.reverse();
			}
			
				// add the ButtonBar to the dialog controls and set up the
				// confirm/dismiss button names
			inDialog.children.push(buttonBar);
			inDialog.confirmButton = ["OKBtn"];
			inDialog.dismissButton = ["CancelBtn"];
		}
		
			// use a panel as the default root element
		inDialog.root = { Panel: {
			title: inDialog.subtitle || inDialog.title || "",
			status: inDialog.status || "",
			name: "DialogPanel",
			horizontalScrollPolicy: "off",
			styleName: "DialogPanel",
			style: {
				titleStyleName: "DialogTitle"
			},
			children: inDialog.children
		} };

		if (!inDialog.root.Panel.title || inDialog.showTitle === false) {
				// no title is specified, so hide the header
			inDialog.root.Panel.style.headerHeight = 0;
		}
		
			// we've moved the children to the root panel, so we can delete the
			// array, which would otherwise create unnecessary JSON
		delete inDialog.children;
	}


	// =======================================================================
	function open(
		inDialog)
	{
			// extract any event handlers from the dialog specification.  this 
			// will change the dialog object by removing the event handler functions.
		_events = extractEvents(inDialog);
		_dialogEvents = extractDialogEvents(inDialog);
		
		addDefaultJSML(inDialog);

			// we have to use a proper JSON serializer rather than toSource
			// because the JSON library on the AS side expects properties to
			// be quoted, which toSource doesn't do.  we also make the JSON
			// available as a property of fwlib.dialog so the SWF can access it
			// without calling a function, which seems to avoid triggering the
			// processing dialog when the SWF is first opened. 
		dialog._dialogJSON = JSON.stringify(inDialog);

			// make sure the result is cleared from the last dialog
		_result = "";
		
			// add a global that points at our API so the dialog can access us
		_FWDIALOG = dialog;

		runSWF(inDialog);
		
			// now that the dialog is closed, remove our global and clear the
			// stuff we no longer need
		delete _FWDIALOG;
		dialog._dialogJSON = "";
		_events = null;
		_dialogEvents = null;
		
		var result = null;
		
			// make sure a _result was set by the dialog.  it may not have been
			// set if the swf failed for some reason.
		if (_result) {
			result = JSON.parse(_result);
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
				_events[inEvent.targetName][inEvent.type] : null,
			dialogHandler = _dialogEvents[inEvent.type],
			result = [];
		
			// create an empty result array that the handler can push 
			// statements on to
		inEvent.result = [];

			// due to an incredibly annoying bug, we can't just call the handler
			// and collect its result.  any function that we call from here that
			// returns a result will cause the modal processing dialog to appear.
			// so we have to return results through some other means.  we can 
			// either throw the result from the handler and catch it here, or
			// the handler can set the result as a property of the event object
			// that we pass it.
		try {
			if (handler) {
				handler(inEvent);
				
					// the handler needs to return its result, if any, on the
					// event object, rather than as a return value 
				result = inEvent.result;
			}

			if (dialogHandler) {
					// reset the result, since the element's event handler might 
					// have added to the event, which we don't want the app handler 
					// to see.  we've already stored it in the result var above.
				inEvent.result = [];
				dialogHandler(inEvent);

					// concatenate the new results to the existing one
				result = result.concat(inEvent.result);
			}
		} catch (exception) {
			result = exception;
		}

			// because of the processing dialog bug, we can't return the handler's
			// result directly to the AS side.  instead, we have to set the 
			// result on a property of fwlib.dialog, which the AS can then retrieve
			// through a second MMExecute call.  we also can't use stringify
			// to convert the result, since that returns the JSON as a string.
			// we'd have to rewrite that JSON code to return the string through
			// one of the parameters passed to it in order to make it work.  but
			// we also can't loop, so there's no way to encode a JSON object
			// without trggering the processing dialog pre-CS6.  but... if the
			// result contains an object, like a dataProvider, then the object
			// properties won't get quoted by toSource(), and the JSON decode
			// on the AS3 side will fail.  and we can't loop over the result
			// array to check for objects because that will trigger the processing 
			// dialog.  and, fw.appName is still "Fireworks 10" in CS6.  ffs.  
			// so, check for fw.commonLibraryDir, which is new in CS6.  if we
			// find it, always stringify the result, so we can handle setting a
			// dataProvider via the result.  pre-CS6, that will just fail.
		if (fw.commonLibraryDir) {
			dialog._eventResult = JSON.stringify(result);
		} else {
			dialog._eventResult = result.toSource();
		}
	}
	
	
	var dialog = {
		open: open,
		_setResult: _setResult,
		_handleEvent: _handleEvent,
		_dialogJSON: "",
		_eventResult: ""
	};
	
	return dialog;
});
