/* ===========================================================================

	textvars.js

	Copyright (c) 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:
		- to support formatting, maybe copy the initial textRuns object
			identify which ones have vars and rebuild the text from that
			would have to reset the text element to modify it
			wouldn't allow the template to be modified in the panel

		- seem to get a lot of internal errors when saving after running the command

		- maybe store the vars in a .json file as well as in DomStorage
			fall back to the DomStorage if the file can't be found

		- drill into symbols to refresh text?

		- need to keep one line text on one line, and area text as area

		- maybe name each element that contains a var and have a way of just
			selecting those by name, rather than checking every element

	Done:
		- 1 page doc seems to return wrong name for page1Name

		- add commands for reset and remove

		- when refreshing an element, check its textChars for tokens and use
			that as the template, refreshing its customData?

		- add vars for docTitle, docFilename, docPath
			docModDate?

		- remove prefs lib, which isn't used

		- drill into groups to refresh text

		- should call getData only once per refresh
			gets called once per frame

		- maybe call it Template Text?  Text Templates?
*/


// ===========================================================================
define([
	"fwlib/DomStorage",
	"fwlib/files",
	"moment",
	"fwlib/underscore"
], function(
	DomStorage,
	files,
	moment,
	_)
{
	var k = {
			TagRE: /\{\{[^}]+\}\}/
		},
		forEach = _.forEach,
		map = _.map;


	// =======================================================================
	function checkForOpenDocument()
	{
			// check fw.documentList to see if a doc is open, since calling
			// fw.getDocumentDOM() throws an error if nothing is open
		if (!fw.documentList.length) {
			alert("Please open a document before running this command.");
			return false;
		} else {
			return true;
		}
	}


	// =======================================================================
	function getData()
	{
		var data = new DomStorage("TextVariables", {
					variables: []
				},
					// pass true to check all pages for the data
				true
			),
			lastItem = data.variables.slice(-1)[0];

			// if the user clicked in the last line of the variable grid but
			// didn't enter anything, the last item will have empty values, so
			// clean it up
		if (lastItem && lastItem.name == "" && lastItem.value == "") {
			data.variables.pop();
		}

		return data;
	}


	// =======================================================================
	function getVariables()
	{
		var dom = fw.getDocumentDOM(),
			data = getData(),
			masterPageAdjustment = dom.hasMasterPage() ? 1 : 0,
			now = new Date(),
			variables = {
				pageName: dom.pageName,
				pageNum: dom.currentPageNum + 1 - masterPageAdjustment,
				pageCount: dom.pagesCount - masterPageAdjustment,
				stateName: dom.frames[dom.currentFrameNum].name,
				stateNum: dom.currentFrameNum + 1,
				stateCount: dom.frames.length,
				docTitle: "",
				docFilename: "",
				docPath: "",
				docModDate: "",
				docModDate24: "",
				currentTime: moment(now).format("YYYY-MM-DD h:mm A"),
				currentTime24: moment(now).format("YYYY-MM-DD HH:mm")
			};

		if (dom.filePathForRevert) {
				// the file's been saved, so we have info for these variables
			variables.docTitle = dom.docTitleWithoutExtension.replace(/\.fw$/, "");
			variables.docFilename = Files.getFilename(dom.filePathForRevert);
			variables.docModDate = moment(files.getModifiedDate(dom.filePathForRevert)).format("YYYY-MM-DD h:mm A");
			variables.docModDate24 = moment(files.getModifiedDate(dom.filePathForRevert)).format("YYYY-MM-DD HH:mm");

				// don't quote the path and add a trailing / before the call to
				// convertURLToOSPath so it's converted into the correct / or \
			variables.docPath = files.convertURLToOSPath(Files.getDirectory(dom.filePathForRevert) + "/", true);
		}

		_.extend(variables, getPageNames());
		_.extend(variables, getStateNames());

			// data.variables is a list of objects with name and value
			// attributes, so we can't pass it to _.extend
		forEach(data.variables, function(variable) {
			variables[variable.name] = variable.value;
		});

		return variables;
	}


	// =======================================================================
	function getElementTextVariables(
		inElement)
	{
		var info = inElement && inElement.customData.TextVariables;

			// in setElementTemplate, we change the data to a JSON string so
			// we don't have to worry about the object being shared when a
			// text element with TextVariables on its customData is duplicated
		if (info && typeof info == "string") {
			return eval("(" + info + ")");
		} else {
			return null;
		}
	}


	// =======================================================================
	function getElementTemplate(
		inElement)
	{
		var info = getElementTextVariables(inElement),
			template = info && info.template;

		return template || null;
	}


	// =======================================================================
	function setElementTemplate(
		inElements,
		inTemplate)
	{
		inElements = [].concat(inElements);

		var firstElement = inElements[0];

		if (inElements.length) {
			var info = getElementTextVariables(firstElement);

			if (!inTemplate && info) {
					// we can't actually delete a key from customData, so we
					// just have to set it to undefined
				forEach(inElements, function(element) {
					element.customData.TextVariables = undefined;
				});
			} else {
					// use an empty object if there's no existing info
				info = info || {};
				info.template = inTemplate;

				forEach(inElements, function(element) {
					element.customData.TextVariables = info.toSource();
				});
			}
		}
	}


	// =======================================================================
	function resetElementText(
		inElements)
	{
		inElements = [].concat(inElements);

		_.forEach(inElements, function(element) {
			var info = getElementTextVariables(element);

			if (info && _.isText(element)) {
				element.textChars = info.template;
				element.customData.TextVariables = undefined;
			}
		});

		forceRefresh();
	}


	// =======================================================================
	function getPageNames()
	{
		var dom = fw.getDocumentDOM(),
			originalPage = dom.currentPageNum,
			pageSetter = dom.getPageSetter(),
			masterPageAdjustment = dom.hasMasterPage() ? 1 : 0,
			names = {};

		for (var i = masterPageAdjustment, len = dom.pagesCount; i < len; i++) {
			pageSetter.pageNum = i;

				// we want to increment i by 1 when there's no master page, so
				// that page1Name is page 0's name.  but if there's a master
				// page, we've already made that adjustment.
			names["page" + (i + 1 - masterPageAdjustment) + "Name"] = fw.getDocumentDOM().pageName;
		}

			// combine all the names, separated by returns, into one string.
			// using \n doesn't work with FW text elements.
		names.pageNames = _.values(names).join("\r");

		pageSetter.pageNum = originalPage;

		return names;
	}


	// =======================================================================
	function getStateNames()
	{
		var dom = fw.getDocumentDOM(),
			names = {};

		forEach(dom.frames, function(frame, i) {
			names["state" + (i + 1) + "Name"] = frame.name;
		});

			// combine all the names, separated by returns, into one string.
			// using \n doesn't work with FW text elements.
		names.stateNames = _.values(names).join("\r");

		return names;
	}


	// =======================================================================
	function refreshElement(
		inElement,
		inVariables)
	{
		if (inElement.textChars) {
			var info = getElementTextVariables(inElement),
				template = getElementTemplate(inElement),
				newText,
				oldText,
				loops = 0;

			if (k.TagRE.test(inElement.textChars)) {
					// this element still has tokens in it, so use the current
					// text as the new template, and kill any existing
					// TextVariables on customData.  this will cause an element
					// with one bad token and one good one to lose the good
					// token if the element is refreshed twice, but it may be
					// less confusing than not respecting tokens inserted by the
					// user into the text.
				template = inElement.textChars;
				info = null;
			} else if (!template) {
					// bail only if we didn't get a template out of customData
				return;
			}

			if (!info) {
				setElementTemplate(inElement, template);
			}

			oldText = newText = supplant(template, inVariables);

				// we shouldn't normally need to track the loops, but if two vars
				// reference each other, they'll keep replacing each other, always
				// leaving a var in the text
			while (k.TagRE.test(newText) && loops < 10) {
				newText = supplant(newText, inVariables);

				if (newText == oldText) {
						// the text hasn't changed, which means the element
						// contains a variable that isn't defined, so bail
					break;
				}

				oldText = newText;
				loops++;
			}

			if (newText != inElement.textChars) {
				inElement.textChars = newText;
			}
		} else if (inElement.elements) {
			forEach(inElement.elements, function(element) {
					// we can't use arguments.callee to refer to refreshElement
					// because we're in an anonymous function, which is what
					// callee refers to
				refreshElement(element, inVariables);
			});

				// groups don't update correctly when we change the text of an
				// element inside, so hide it and show it, which repaints it.
				// select none, since showing also selects it.
			inElement.visible = false;
			inElement.visible = true;
			fw.getDocumentDOM().selectNone();
		}
	}


	// =======================================================================
	function refreshSelection()
	{
		if (checkForOpenDocument()) {
			var variables = getVariables(),
				originalSelection = [].concat(fw.selection);

			if (fw.selection.length) {
				forEach(fw.selection, function(element) {
					refreshElement(element, variables);
				});

				fw.selection = originalSelection;
				forceRefresh();
			}
		}
	}


	// =======================================================================
	function refreshAllOnFrames(
		inFrameInfo)
	{
		var dom = fw.getDocumentDOM(),
			originalFrame = dom.currentFrameNum,
			variables = getVariables();

		forEach(inFrameInfo, function(frameInfo) {
			var frame = frameInfo.frame,
					// store the selection on this frame, since refreshElement
					// will call selectNone() to deselect a group that's been
					// hidden and shown, which selects it
				originalSelection = [].concat(fw.selection);

			variables.stateName = frame.name;
			variables.stateNum = frameInfo.index + 1;
			dom.currentFrameNum = frameInfo.index;

			forEach(frame.layers, function(layer) {
				forEach(layer.elements, function(element) {
					refreshElement(element, variables);
				});
			});

			fw.selection = originalSelection;
		});

			// switch back to the original frame and then add a rectangle and
			// then delete it, which is a kludgy way to force the canvas to
			// repaint, since changing a text element's textChars to a shorter
			// string seems to leave behing the pixels from the original string
		dom.currentFrameNum = originalFrame;
		forceRefresh();
	}


	// =======================================================================
	function refreshAllOnFrame()
	{
		if (checkForOpenDocument()) {
			var dom = fw.getDocumentDOM();

			refreshAllOnFrames([{
				frame: dom.frames[dom.currentFrameNum],
				index: dom.currentFrameNum
			}]);
		}
	}


	// =======================================================================
	function refreshAllOnPage()
	{
		if (checkForOpenDocument()) {
			var dom = fw.getDocumentDOM();

			refreshAllOnFrames(
					// create a series of objects containing a frame and its
					// index, so refreshAllOnFrames knows where it came from
				map(dom.frames, function(frame, i) {
					return { frame: frame, index: i };
				})
			);
		}
	}


	// =======================================================================
	function refreshAllInDoc()
	{
		if (checkForOpenDocument()) {
			var dom = fw.getDocumentDOM(),
				pageSetter = dom.getPageSetter(),
				originalPage = dom.currentPageNum;

			if (dom.hasMasterPage()) {
					// for some reason, if there's a master page and
					// dom.currentPageNum is not 0, then calling forceRefresh()
					// throws an error.  so call changeCurrentPage() to switch
					// to the master page, which seems to do something different
					// than using the pageSetter to change pages.
				dom.changeCurrentPage(0);
			}

			for (var i = 0, len = dom.pagesCount; i < len; i++) {
					// go to the page and update the dom reference
				pageSetter.pageNum = i;
				dom = fw.getDocumentDOM();

				refreshAllOnFrames(
						// create a series of objects containing a frame and its
						// index, so refreshAllOnFrames knows where it came from
					map(dom.frames, function(frame, i) {
						return { frame: frame, index: i };
					})
				);
			}

			pageSetter.pageNum = originalPage;
		}
	}


	// =======================================================================
	function forceRefresh()
	{
		var dom = fw.getDocumentDOM(),
			originalSelection = [].concat(fw.selection);

		dom.addNewRectangle(
			{
				left: 0,
				top: 0,
				right: dom.width,
				bottom: dom.height
			},
			0
		);
		dom.deleteSelection(false, false);

		fw.selection = originalSelection;
	}


	// =======================================================================
	function supplant(
		inString,
		inObject)
	{
		function reverse(
			inString)
		{
			return inString.split("").reverse().join("");
		}


		var tokenPattern = /\{\{([^{}]*)\}\}/g;

		if (typeof inString !== "string") {
			return "";
		} else if (arguments.length == 2) {
				// short-circuit the common case to avoid the loop
			inObject = inObject || {};
			return inString.replace(
				tokenPattern,
				function (inToken, inName)
				{
					var value = inObject[inName],
						valueType = typeof value,
						values;

					if (inName[0] == "*") {
							// variable names starting with * should return a
							// random item from the comma-delimited list in
							// value.  the reverse business is to workaround the
							// lack of lookbehind in JS regexes, which we need to
							// allow commas to be escaped by "\,".
						values = reverse(value).split(/\s*,(?!\\)\s*/);
						value = values[Math.floor(values.length * Math.random())];
						value = reverse(value).replace(/\\,/g, ",");
					}

					if (valueType == "function") {
						return value.call(inObject, inName);
					} else if (valueType != "undefined") {
						return value;
					} else {
						return inToken;
					}
				}
			);
		}
	}


	return {
		getData: getData,
		getElementTextVariables: getElementTextVariables,
		getElementTemplate: getElementTemplate,
		setElementTemplate: setElementTemplate,
		resetElementText: resetElementText,
		refreshSelection: refreshSelection,
		refreshAllOnFrame: refreshAllOnFrame,
		refreshAllOnPage: refreshAllOnPage,
		refreshAllInDoc: refreshAllInDoc
	};
})
