/* ===========================================================================

	svg.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./tags",
	"sax/sax",
	"fwlib/underscore"
], function(
	tags,
	sax,
	_
) {
	// =======================================================================
 	var saxHandler = {
		SAXHandlers: ["onOpenTag", "onCloseTag", "onText", "onCData", "onError"],


		tagStack: [],
		containerStack: [],
		currentTag: null,
		currentContainer: null,
		lastTag: null,
		dom: null,
		directory: null,


		init: function(
			inParser,
			inDom,
			inPath)
		{
			this.tagStack = [];
			this.containerStack = [];
			this.dom = inDom;
			this.directory = Files.getDirectory(inPath) + "/";

			_.forEach(this.SAXHandlers, function(name) {
				inParser[name.toLowerCase()] = _.bind(this[name], this);
			}, this);
		},


		onOpenTag: function(
			inNode)
		{
			var tagConstructor = tags[inNode.name];

			if (tagConstructor) {
				this.tagStack.push(this.currentTag = new tagConstructor(inNode,
					this.dom, this.directory));
				this.currentTag.onOpen();

				if (this.currentTag.addChild) {
					this.containerStack.push(this.currentTag);
					this.currentContainer = this.currentTag;
				}
			} else {
					// always push something when a tag is opened, so when we get
					// onCloseTag, we can pop the null tag and keep the stack right
				this.tagStack.push(null);
				this.currentTag = null;
			}
		},


		onText: function(
			inText)
		{
			if (this.currentTag) {
				this.currentTag.onText(inText);
			}
		},


		onCData: function(
			inCData)
		{
			if (this.currentTag) {
				this.currentTag.onCData(inCData);
			}
		},


		onCloseTag: function(
			inNodeName)
		{
			if (this.currentTag) {
				this.currentTag.onClose();

				if (this.currentTag.addChild &&
						this.currentTag == this.currentContainer) {
						// the current container just closed, so pop it from the
						// stack and make the previous container current, so that
						// it can add this container as a child in the next if block
					this.containerStack.pop();
					this.currentContainer = _.last(this.containerStack);
				}

				if (this.currentContainer) {
					this.currentContainer.addChild(this.currentTag);
				}
			}

				// keep track of the last tag we saw so we can recover the svg
				// tag once we're finished
			this.lastTag = this.tagStack.pop();
			this.currentTag = _.last(this.tagStack);
		},


		onError: function(
			inError)
		{
				// ignore character entity errors, as they don't seem to affect
				// the parsing of the file
			if (!inError.message || inError.message.indexOf("Invalid character entity") != 0) {
				if (typeof log == "function") {
					log("Error loading SVG:", inError);
				} else {
					alert("Error loading SVG: " + inError);
				}
			}
		}
	};


	// =======================================================================
	return {
		render: function(
			inSVG,
			inPath,
			inDom)
		{
			inDom = inDom || fw.getDocumentDOM();

				// use strict processing so the tag and attr case is maintained
			var parser = sax.parser(true),
				element;

			try {
				saxHandler.init(parser, inDom, inPath);
				parser.write(inSVG).close();
			} catch (e) {
				saxHandler.onError(e);
			}

			element = fw.selection[0];

			if (element) {
				element.name = inPath ? Files.getFilename(inPath).replace(".svg", "") : null;
			}

			return saxHandler.lastTag;
		},


		saxHandler: saxHandler
	};
});
