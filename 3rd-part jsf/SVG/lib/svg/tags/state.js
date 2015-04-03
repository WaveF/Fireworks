/* ===========================================================================

	state.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./regex",
	"fwlib/underscore"
], function(
	re,
	_
){
	return {
		defs: {},
		styles: {},
		groupAttrStack: [{}],


		reset: function()
		{
			this.defs = {};
			this.styles = {};
			this.groupAttrStack = [{}];
		},


		pushGroup: function(
			inAttr)
		{
			this.groupAttrStack.push(_.createObject(this.getGroupAttr(), inAttr));
		},


		popGroup: function()
		{
			this.groupAttrStack.pop();
		},


		getGroupAttr: function()
		{
			return _.last(this.groupAttrStack);
		},


		addStyle: function(
			inSelector,
			inRule)
		{
			this.styles[inSelector] = inRule;
		},


		getStyle: function(
			inSelector)
		{
			return this.styles[inSelector] || {};
		},


		addDef: function(
			inID,
			inDef)
		{
			this.defs[inID] = inDef;
		},


		getDef: function(
			inReference)
		{
			var match = (inReference || "").match(re.Reference);

			if (match) {
				return this.defs[match[1]];
			}
		}
	};
});
