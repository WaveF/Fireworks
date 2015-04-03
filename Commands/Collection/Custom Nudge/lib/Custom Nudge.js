/* ===========================================================================
	
	File: Custom Nudge 

	Author - John Dunning
	Copyright - 2009 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.4.3 ($Revision: 1.9 $)
	Last update - $Date: 2010/05/20 17:40:35 $

   ======================================================================== */


try {

(function() 
{
	jdlib = jdlib || {};
	jdlib.CustomNudge = jdlib.CustomNudge || {};
	
	
	var k = {
		PrefBaseName: "jdlib_CustomNudge",
		DefaultSmall: 1,
		DefaultLarge: 10,
		NudgeDialog: {
				// the title will be changed in handleSet()
			title: "Set Custom Nudge Values",
			confirmButton: "OKBtn",
			dismissButton: "CancelBtn",
			size: "275x200",
			css: {
				FormItem: {
					labelWidth: 95
				},
				Text: {
					paddingBottom: 5
				}
			},
			children: [
				{ Form: {
					percentWidth: 100,
					style: {
						paddingLeft: 15,
						paddingRight: 15,
						paddingTop: 10,
						paddingBottom: 10,
						verticalGap: 10,
						indicatorGap: 4
					},
					children: [
						{ Text: {
							percentWidth: 100,
							text: "Enter the nudge values in pixels."
						} },
						{ FormItem: {
							label: "Small nudge:",
							children: [
								{ NumericStepper: {
									name: "SmallValue",
									width: 80,
										// the value will be set to the current
										// pref in handleSet()
									value: 1,
									stepSize: .1,
									maximum: 10000,
									minimum: .1,
									toolTip: "Pixels to move on arrow press",
									_focused: true
								} }
							]
						} },
						{ FormItem: {
							label: "Large nudge:",
							children: [
								{ NumericStepper: {
									name: "LargeValue",
									width: 80,
										// the value will be set to the current
										// pref in handleSet()
									value: 10,
									stepSize: .1,
									maximum: 10000,
									minimum: .1,
									toolTip: "Pixels to move on shift+arrow press"
								} }
							]
						} }
					]
				} },
				{ ControlBar: {
					style: {
						horizontalAlign: "right"
					},
					children: [
						{ Button: {
							name: "OKBtn",
							label: "OK",
							emphasized: true,
							width: 75
						} },
						{ Button: {
							name: "CancelBtn",
							label: "Cancel",
							width: 75
						} }
					]
				} }
			]
		}
	};
	
	
	// =======================================================================
	function getNudgePref(
		inSize)
	{
		if (inSize) {
			var defaultNudge = k["Default" + inSize];
			return parseFloat(fw.getPref(k.PrefBaseName + inSize)) || defaultNudge;
		} else {
			return [parseFloat(fw.getPref(k.PrefBaseName + "Small")) || k.DefaultSmall,
				parseFloat(fw.getPref(k.PrefBaseName + "Large")) || k.DefaultLarge];
		}
	}
	
	
	// =======================================================================
	function setNudgePref(
		inSize,
		inValue)
	{
		fw.setPref(k.PrefBaseName + inSize, inValue);
	}
	
	
	// =======================================================================
	jdlib.CustomNudge.handleNudge = function(
		inFilename,
		inBaseDir)
	{
			// the filename should be in the form: 
			// 		Custom Nudge - [Large|Small] - [Up|Left|Down|Right] [numeric amount].jsf
		var match = inFilename.match(/Custom Nudge - (Large|Small) - (\w+)\.jsf/);
		
		var direction = "Left",
			delta = 0;
			
		if (match && match.length >= 3) {
			delta = getNudgePref(match[1]);
			direction = match[2];
		} else {
			match = inFilename.match(/Custom Nudge -\s+(\w+)\s+([0-9.]+)\.jsf/);
			
			if (match && match.length >= 3) {
				direction = match[1];
				delta = parseFloat(match[2]);
			}
		}
		
		if (delta == 0) {
				// something in the filename didn't match, so bail
			alert("An error occurred while using a Custom Nudge command.");
			return;
		}

			// determine whether to move by 0, delta or -delta in the x and y directions
		var multipliers = {
			Up: [0, -1],
			Down: [0, 1],
			Left: [-1, 0],
			Right: [1, 0]
		}[direction];
		var deltaXY = { x: delta * multipliers[0], y: delta * multipliers[1] };
		var dom	= fw.getDocumentDOM();
		
			// move subselected points if the Subselection tool is being used.
			// this will also move the object for elements that are selected but
			// have no subselected points.
		dom.moveSelectionBy(deltaXY, false, (fw.activeTool == "Subselection"));
	}
	
	
	// =======================================================================
	jdlib.CustomNudge.handleSet = function(
		inFilename,
		inBaseDir)
	{
			// the filename should be in the form: 
			// 		Set Custom Nudge - # #.jsf
		var match = inFilename.match(/-\s+([0-9.]+)\s+([0-9.]+)\.jsf/);
			
		if (match) {
			var values = [parseFloat(match[1]), parseFloat(match[2])];
			if (values[0] > values[1]) {
				values.reverse();
			}

			setNudgePref("Small", values[0]);
			setNudgePref("Large", values[1]);
		} else if (inFilename.indexOf("Set Custom Nudge") == 0) {
			var values = getNudgePref();
			var createCommand = inFilename.indexOf("Create New Command") > -1;

				// make sure we have the dialog library loaded.  we need to use
				// inBaseDir as the path, since we're being called by a different
				// script, and the currentScriptDir is null.
			try { dojo.require.call; } catch (exception)
				{ fw.runScript(inBaseDir + "/lib/lib.js"); }

				// add the dojo path relative to inBaseDir as a path dojo should
				// search when loading modules.  we have to explicitly add this
				// as by this time, fw.currentScriptDir is null, so dojo can't
				// automatically look for modules relative to the current script.
				// we wrap this in a try/catch as an older version of dojo may
				// have previously been loaded, without the addDojoPath method.
			try { dojo._fw.addDojoPath(inBaseDir + "/lib/dojo/"); }
				catch (exception) {}

			dojo.require("fwlib.dialog");

				// set the NumericStepper values to the current pref values
			var formChildren = k.NudgeDialog.children[0].Form.children;
			formChildren[1].FormItem.children[0].NumericStepper.value = values[0];
			formChildren[2].FormItem.children[0].NumericStepper.value = values[1];

				// set the title depending on whether the user is creating a
				// new command or just setting the preferences
			k.NudgeDialog.title = createCommand ? "Create Custom Nudge Command" :
				"Set Custom Nudge Values";

			var result = fwlib.dialog.open(k.NudgeDialog);

			if (!result) {
					// the user canceled the dialog
				return;
			} 
			
			values = [result.SmallValue, result.LargeValue];

				// make sure the small value is actually the smaller of the two
			if (values[0] > values[1]) {
				values.reverse();
			}

			setNudgePref("Small", values[0]);
			setNudgePref("Large", values[1]);
			
			if (createCommand) {
					// we're being called by Set Custom Nudge - Create New Command
				var currentPath = inBaseDir + "/";
				var filename = "Set Custom Nudge - " + values.join(" ");
			
				try {
					Files.copy(currentPath + "lib/Set Custom Nudge Template.js",
						currentPath + filename + ".jsf");
				} catch (exception) {
					alert("An error occurred while creating the new shortcut command.");
					return; 
				}
				
					// FW doesn't immediately update the Commands menu, so tell the user
				alert('To see the "' + filename + '" command that was just created, switch to another application and then back to Fireworks.');
			}
		}	
	}
})();

} catch (exception) {
	alert([exception, exception.lineNumber, exception.fileName].join("\n"));
}
