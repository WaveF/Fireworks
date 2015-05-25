/* ===========================================================================

	container.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./base",
	"./state",
	"./regex",
	"fwlib/underscore"
], function(
	base,
	state,
	re,
	_
) {
	var tag = base.tag,
		TagBase = base.TagBase;


	// =======================================================================
	var Container = tag(TagBase, {
		children: null,


		init: function(
			inNode,
			inDom)
		{
			this._super(inNode, inDom);
			this.children = [];
		},


		addChild: function(
			inChild)
		{
			this.children.push(inChild);
		}
	});


	// =======================================================================
	tag("svg", Container, {
		onOpen: function()
		{
			this._super();
			state.reset();

			if (this.attr.viewBox) {
				var values = this.attr.viewBox.split(re.WhitespaceComma);

				this.attr.viewBox = {
					x: values[0],
					y: values[1],
					width: values[2],
					height: values[3]
				}
			}
		},


		onClose: function()
		{
			fw.selection = _.compact(_.pluck(this.children, "element"));

				// only group if there is more than one child, to avoid
				// unnecessary groups
			if (fw.selection.length > 1) {
				this.dom.group();
			}
		}
	});


	// =======================================================================
	tag("defs", Container, {
		onOpen: function()
		{
			this._super();

				// save the original onOpen/Close handlers and replace them
				// with a noop so that nothing gets rendered inside the defs
			this.originalOnOpen = TagBase.prototype.onOpen;
			this.originalOnClose = TagBase.prototype.onClose;
			TagBase.prototype.onOpen = TagBase.prototype.onClose = function() {};
		},


		onClose: function()
		{
			TagBase.prototype.onOpen = this.originalOnOpen;
			TagBase.prototype.onClose = this.originalOnClose;
		},


		addChild: function(
			inChild)
		{
			if (inChild.id) {
				state.addDef(inChild.id, inChild);
			}
		}
	});


	// =======================================================================
	tag("g", Container, {
		addElement: function()
		{
			fw.selection = _.compact(_.pluck(this.children, "element"));

				// only group if there is more than one child, to avoid
				// unnecessary groups
			if (fw.selection.length > 1) {
				this.dom.group();
			}
		},


		style: function()
		{
			// this is a noop to avoid the base method from applying the
			// group's fill and color, which would then override the fill
			// and color of its children that were just grouped together
		},


		onOpen: function()
		{
			this._super();

				// inherit the attr of the current group, add ours to that,
				// and push it on the stack
			state.pushGroup(this.attr);
		},


		onClose: function()
		{
				// call close first, so that a use tag's addElement gets called
				// while its attr is still on the stack
			this._super();

				// pop the group stack to get the previous one's attr
			state.popGroup();
		}
	});
	tag("symbol", "g");


	// =======================================================================
	tag("use", "g", {
		addElement: function()
		{
			function open(
				inTag)
			{
				inTag.onOpen();

				_.forEach(inTag.children, function(child) {
					open(child);
				}, this);
			}


			function close(
				inTag)
			{
				_.forEach(inTag.children, function(child) {
					close(child);
				}, this);

				inTag.onClose();
			}

			var reference = state.getDef(this.attr["xlink:href"]),
				attributes = this.node.attributes;

			if (reference) {
				open(reference);
				close(reference);

				var bounds = this.dom.getSelectionBounds();

				if ("x" in attributes || "y" in attributes) {
					this.dom.moveSelectionTo(
						{ x: attributes.x || bounds.left, y: attributes.y || bounds.top },
						false, false
					);
				}

					// symbols referenced by a use can be resized to a width and height
				if (reference.type == "symbol" && "width" in attributes &&
						"height" in attributes) {
					this.dom.resizeSelection(attributes.width, attributes.height);
				}
			}
		}
	});


	// =======================================================================
	tag("clipPath", "g", {
		clipGroup: null,


		addElement: function()
		{
			fw.selection = _.compact(_.pluck(this.children, "element"));

			if (fw.selection.length > 1) {
				this.dom.pathUnion();
			}
		},


		onClose: function()
		{
			this._super();

			if (this.id) {
				state.addDef(this.id, this);
			}
		},


		addChild: function(
			inChild)
		{
			if (inChild.type == "text") {
					// converting a text string to a path leaves each individual
					// letter grouped together, so ungroup them and then turn
					// them into a compound path, which we'll then add as a child
					// instead of the text block
				this.dom.convertToPaths();
				this.dom.ungroup();
				this.dom.pathUnion();
				inChild = fw.selection[0];
			}

			this._super(inChild);
		},


		addClippedChild: function(
			inElement)
		{
			if (!this.clipGroup) {
					// we haven't been grouped with anything yet, so move our
					// element to the front, so it will mask inElement and group
					// it as a mask
				fw.selection = [this.element];
				this.dom.arrange("front");
				fw.selection = [inElement, this.element];
				this.dom.group("mask to image");
			} else {
					// cut the element and paste it into our existing group.  we
					// do it this way because pasting inside the first element
					// leaves nothing selected, so we can't get a reference to
					// the clip group.
				fw.selection = [inElement];
				this.dom.clipCut();
				fw.selection = [this.clipGroup];
				this.dom.clipPasteInside("do not resample");
			}

				// we always have to update our reference to the clip group and
				// our element after adding to the clip so that our group gets
				// included in the overall svg group
			this.element = this.clipGroup = fw.selection[0];
		},


		getNodeStyle: function()
		{
			return {
				fill: "#ffffff",
				stroke: "none"
			};
		}
	});


	return Container;
});
