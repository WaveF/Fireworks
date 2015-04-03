/* ===========================================================================
	
	File: pngText.js

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Version - $Id: pngText.js,v 1.4 2007/10/28 04:04:48 jdunning Exp $

   ======================================================================== */

/*
  
  	These functions help you save structured JS data into the dom.pngText storage.
  	Setting dom.pngText.foo to { bar: 42 } works, but you can only store simple
  	data types this way.  Setting dom.pngText.foo to { bar: [1, 2, 3] } fails.
  	fwlib.util.get/setPngTextData() work around this limitation.
  	
	To use these functions, include this at the top of your command:
	
		if (typeof dojo == "undefined") { fw.runScript(fw.appJsCommandsDir + "/lib/dojo/dojo.js"); }
		dojo.require("fwlib.util.pngText");
	
	Then you can save a complex JS object to pngText like this:
	
		fwlib.util.setPngTextData(
			"mystuff.fooData", 
			{ 
				foo: 42, 
				bar: [1, 2, 3],
				baz: {
					text: "hello, world"
				} 
			}
		);
		
	This will convert the second parameter to JSON and save it into 
	dom.pngText.mystuff.fooData as a string.  When the document is saved, this
	string data will be saved with it.  If you later want to retrieve the data 
	as a proper JS object, you'd call:
	
		fwlib.util.getPngTextData("mystuff.fooData");
		
	This automatically converts the string back into an object.

*/


// ===========================================================================
// 	fwlib.util.pngText package
// ===========================================================================

dojo.provide("fwlib.util.pngText");


// ===========================================================================
/*
	Method: fwlib.util.getPngTextData
	
	Parameters:
	inPath - 
	inDefaultData -
	
	Return Value:
	
	Remarks:
	
*/
fwlib.util.getPngTextData = function(
	inPath,
	inDefaultData)
{
	var root = fwlib.util._getPngTextRoot(inPath);
	
	if (!root) {
		return null;
	}
	
	var result = inDefaultData || null;
	var symbols = inPath.split(".");
	var dataName = symbols[1];
	
	if (typeof root[dataName] == "string") {
		result = eval("(" + root[dataName] + ")");
		
		if (inDefaultData) {
			result = dojo.mixin(inDefaultData, result);
		}
	}
	
	return result;
}


// ===========================================================================
fwlib.util.setPngTextData = function(
	inPath,
	inData)
{
	var root = fwlib.util._getPngTextRoot(inPath);
	
	if (!root) {
		return;
	}
	
	var dom	= fw.getDocumentDOM();
	var symbols = inPath.split(".");
	var dataName = symbols[1];
	
	root[dataName] = inData ? inData.toSource() : null;
	
		// force the document to be dirtied since the pngText has been changed
		// and needs to be saved.  simply setting dom.pngText doesn't dirty the doc.
	fw.getDocumentDOM().isDirty = true;
	
	return inData;
}


// ===========================================================================
fwlib.util._getPngTextRoot = function(
	inPath)
{
	if (fw.documents.length < 1 || typeof inPath != "string" || inPath == "") {
			// no documents are open
		return null;
	}
	
	var symbols = inPath.split(".");
	
	if (symbols.length != 2) {
		alert('There must be exactly 2 parts to the path, e.g. "foo.bar".');
		return null;
	}
	
	var dom	= fw.getDocumentDOM();
	var rootName = symbols[0];
	var dataName = symbols[1];
	var root = dom.pngText[rootName];
	
	if (typeof root == "string") {
			// there's saved JS data under the first symbol
		root = dom.pngText[rootName] = eval("(" + root + ")");
	} else if (typeof root == "undefined" || root == null) {
			// this path hasn't been created yet
		root = dom.pngText[rootName] = {};
	} else {
			// the root of the path, at least, is already in memory
		root = dom.pngText[rootName];
	}
	
	return root;
}
