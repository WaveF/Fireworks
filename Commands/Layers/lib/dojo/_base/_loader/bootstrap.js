// $Id: bootstrap.js,v 1.1 2010/05/08 19:21:16 jdunning Exp $

// TODOC: HOW TO DOC THE BELOW?
// @global: djConfig
// summary:
//		Application code can set the global 'djConfig' prior to loading
//		the library to override certain global settings for how dojo works.
// description:  The variables that can be set are as follows:
//			- isDebug: false
//			- libraryScriptUri: ""
//			- locale: undefined
//			- extraLocale: undefined
//			- preventBackButtonFix: true
// note:
//		'djConfig' does not exist under 'dojo.*' so that it can be set before the
//		'dojo' variable exists.
// note:
//		Setting any of these variables *after* the library has loaded does
//		nothing at all.


(function(){
	// make sure djConfig is defined
	if(typeof this["djConfig"] == "undefined"){
		this.djConfig = {};
	}

	// firebug stubs
	if((!this["console"])||(!console["firebug"])){
		this.console = {};
	}
	var cn = [
		"assert", "count", "debug", "dir", "dirxml", "error", "group",
		"groupEnd", "info", "log", "profile", "profileEnd", "time",
		"timeEnd", "trace", "warn"
	];
	var i=0, tn;
	while((tn=cn[i++])){
		if(!console[tn]){
			console[tn] = function(){};
		}
	}

	//TODOC:  HOW TO DOC THIS?
	// dojo is the root variable of (almost all) our public symbols -- make sure it is defined.
	if(typeof this["dojo"] == "undefined"){
		this.dojo = {};
	}

	// summary:
	//		return the current global context object
	//		(e.g., the window object in a browser).
	// description:
	//		Refer to 'dojo.global' rather than referring to window to ensure your
	//		code runs correctly in contexts other than web browsers (eg: Rhino on a server).
	dojo.global = this;

	var _config = {
		isDebug: false,
		libraryScriptUri: "",
		preventBackButtonFix: true,
		delayMozLoadingFix: false
	};

	for(var option in _config){
		if(typeof djConfig[option] == "undefined"){
			djConfig[option] = _config[option];
		}
	}

	var _platforms = ["Browser", "Rhino", "Spidermonkey", "Mobile"];
	var t;
	while(t=_platforms.shift()){
		dojo["is"+t] = false;
	}
})();

// Override locale setting, if specified
dojo.locale = djConfig.locale;

//TODOC:  HOW TO DOC THIS?
dojo.version = {
	// summary: version number of this instance of dojo.
	major: 0, minor: 9, patch: 0, flag: "dev",
	revision: Number("$Rev: 10861 $".match(/[0-9]+/)[0]),
	toString: function(){
		with(dojo.version){
			return major + "." + minor + "." + patch + flag + " (" + revision + ")";	// String
		}
	}
}

// Register with the OpenAjax hub
if(typeof OpenAjax != "undefined"){
	OpenAjax.hub.registerLibrary("dojo", "http://dojotoolkit.org", dojo.version.toString());
}

dojo._getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var obj=context||dojo.global;
	for(var i=0, p; obj&&(p=parts[i]); i++){
		obj = (p in obj ? obj[p] : (create ? obj[p]={} : undefined));
	}
	return obj; // Any
}

dojo.setObject = function(/*String*/name, /*Any*/value, /*Object*/context){
	// summary: 
	//		Set a property from a dot-separated string, such as "A.B.C"
	//	description: 
	//		Useful for longer api chains where you have to test each object in
	//		the chain, or when you have an object reference in string format.
	//		Objects are created as needed along 'path'.
	//	name: 	
	//		Path to a property, in the form "A.B.C".
	//	context:
	//		Optional. Object to use as root of path. Defaults to
	//		'dojo.global'. Null may be passed.
	var parts=name.split("."), p=parts.pop(), obj=dojo._getProp(parts, true, context);
	return (obj && p ? (obj[p]=value) : undefined); // Any
}

dojo.getObject = function(/*String*/name, /*Boolean*/create, /*Object*/context){
	// summary: 
	//		Get a property from a dot-separated string, such as "A.B.C"
	//	description: 
	//		Useful for longer api chains where you have to test each object in
	//		the chain, or when you have an object reference in string format.
	//	name: 	
	//		Path to an property, in the form "A.B.C".
	//	context:
	//		Optional. Object to use as root of path. Defaults to
	//		'dojo.global'. Null may be passed.
	//	create: 
	//		Optional. If true, Objects will be created at any point along the
	//		'path' that is undefined.
	return dojo._getProp(name.split("."), create, context); // Any
}

dojo.exists = function(/*String*/name, /*Object*/obj){
	// summary: 
	//		determine if an object supports a given method
	// description: 
	//		useful for longer api chains where you have to test each object in
	//		the chain
	// name: 	
	//		Path to an object, in the form "A.B.C".
	// obj:
	//		Optional. Object to use as root of path. Defaults to
	//		'dojo.global'. Null may be passed.
	return !!dojo.getObject(name, false, obj); // Boolean
}

dojo["eval"] = function(/*String*/ scriptFragment){
	// summary: 
	//		Perform an evaluation in the global scope.  Use this rather than
	//		calling 'eval()' directly.
	// description: 
	//		Placed in a separate function to minimize size of trapped
	//		evaluation context.
	// note:
	//	 - JSC eval() takes an optional second argument which can be 'unsafe'.
	//	 - Mozilla/SpiderMonkey eval() takes an optional second argument which is the
	//  	 scope object for new symbols.

	// FIXME: investigate Joseph Smarr's technique for IE:
	//		http://josephsmarr.com/2007/01/31/fixing-eval-to-use-global-scope-in-ie/
	//	see also:
	// 		http://trac.dojotoolkit.org/ticket/744
	return dojo.global.eval ? dojo.global.eval(scriptFragment) : eval(scriptFragment); 	// mixed
}

//Real functions declared in dojo._firebug.firebug.
dojo.deprecated = dojo.experimental = function(){};

// vim:ai:ts=4:noet
