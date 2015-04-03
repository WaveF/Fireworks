/* ===========================================================================

	utils.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define(function() {
	// =======================================================================
	function defineClass(
		inConstructor,
		inPrototype,
		inSuper)
	{
		inPrototype = inPrototype || {};

		if (inSuper) {
			var superProto = inSuper.prototype,
				superMethodRE = /\b_super\b/,
				protoValue,
				protoValueIsFn,
				className = inConstructor.NAME ? inConstructor.NAME + "." : "";

				// inherit from inSuper
			inPrototype.__proto__ = superProto;

			for (var name in inPrototype) {
				protoValue = inPrototype[name];
				protoValueIsFn = typeof protoValue == "function";

				if (inPrototype.hasOwnProperty(name) &&
						protoValueIsFn &&
						typeof superProto[name] == "function" &&
						superMethodRE.test(protoValue)) {
					inPrototype[name] = (function(name, fn) {
						return function() {
							var temp = this._super;

								// Add a new ._super() method that is the same method
								// but on the super-class
							this._super = superProto[name];

								// The method only need to be bound temporarily, so we
								// remove it when we're done executing
							var result = fn.apply(this, arguments);
							this._super = temp;

							return result;
						};
					})(name, protoValue);
				}

				if (protoValueIsFn) {
					inPrototype[name].NAME = protoValue.name || className + name;
				}
			}
		}

		inPrototype.constructor = inConstructor;
		inConstructor.prototype = inPrototype;

		return inConstructor;
	}


	// =======================================================================
	function hexToRGBA(
		inHex,
		inAlpha)
	{
		var r = parseInt(inHex.slice(1, 3), 16),
			g = parseInt(inHex.slice(3, 5), 16),
			b = parseInt(inHex.slice(5, 7), 16),
			a = parseInt(inHex.slice(7), 16);

		if (!isNaN(inAlpha)) {
			a = inAlpha / 100;
		} else if (!isNaN(a)) {
			a /= 255;
		} else {
			a = 1;
		}

		return [r, g, b, a];
	}


	// =======================================================================
	function hexToRGBAString(
		inHex,
		inAlpha)
	{
		var components = hexToRGBA(inHex, inAlpha),
			a = "a";

		if (components[3] == 1) {
				// no alpha value was passed in or it's 100%, so output an
				// rgb() color
			components = components.slice(0, 3);
			a = "";
		}

		for (var i = 0, len = components.length; i < len; i++) {
			components[i] = reducePrecision(value);
		}

		return "rgb" + a + "(" + components.join(",") + ")";
	}


	// =======================================================================
	var PercentValueRE = /\s*[\d.]+\s*%/;
	function parsePercentage(
		inValue,
		inRange)
	{
		var value = parseFloat(inValue);

		if (PercentValueRE.test(inValue)) {
			value = (value / 100) * (inRange || 1);
		}

		return value;
	}


	// =======================================================================
	function reducePrecision(
		inValue)
	{
		if (isNaN(inValue)) {
			return inValue;
		} else if (inValue == 0 || inValue < .001) {
			return "0";
		} else if (inValue < 1) {
				// remove trailing 0s
			return inValue.toPrecision(3).replace(/0+$/, "");
		} else {
			var remainder = inValue % 1,
				whole = Math.floor(inValue),
				rounded = Math.round(inValue),
				roundedDifference = Math.abs(Math.round(inValue) - inValue);

			if (roundedDifference < .001) {
				return rounded.toString();
			} else {
					// remove trailing 0s
				return (whole + remainder.toPrecision(3).slice(1)).replace(/0+$/, "");
			}
		}
	}


	// =======================================================================
	function copyObject(
		inObject)
	{
		if (typeof inObject == "object" && inObject !== null) {
			return eval("(" + inObject.toSource() + ")");
		} else {
			return inObject;
		}
	}


	// =======================================================================
	function trim(
		inString)
	{
			// make the .+ non-greedy, so that it doesn't eat any spaces at the
			// end of the string.  only look for actual spaces, not \s, since
			// we don't want to remove a return that's at the beginning or end.
		return inString.replace(/^\s*(.+?)\s*$/m, "$1");
	}


	// =======================================================================
	function supplant(
		inString,
		inObject)
	{
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
						valueType = typeof value;

					if (valueType == "function") {
						return value.call(inObject, inName);
					} else if (valueType != "undefined") {
						return value;
					} else {
						return inToken;
					}
				}
			);
		} else {
			var objects = Array.prototype.slice.call(arguments, 1);
			var len = objects.length;

			return inString.replace(
				tokenPattern,
				function (inToken, inName)
				{
					var value, valueType;

					for (var i = 0; i < len; i++) {
						var currentObject = objects[i] || {};
						value = currentObject[inName];
						valueType = typeof value;

						if (valueType == "function") {
							return value.call(currentObject, inName, i, objects);
						} else if (valueType != "undefined") {
							return value;
						}
					}

					return inToken;
				}
			);
		}
	}


	return {
		defineClass: defineClass,
		hexToRGBA: hexToRGBA,
		hexToRGBAString: hexToRGBAString,
		parsePercentage: parsePercentage,
		reducePrecision: reducePrecision,
		copyObject: copyObject,
		trim: trim,
		supplant: supplant
	};
});
