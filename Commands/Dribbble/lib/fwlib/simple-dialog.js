/* ===========================================================================
	
	simple-dialog.js

	Copyright 2012 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


/*
	To do:

	Done:
		- make the form scroll when necessary 

		- simple form dialogs

		- rich prompt dialog
*/


// ===========================================================================
define([
	"fwlib/dialog"
], function(
	dialog)
{
	// =======================================================================
	function mixin(
		inDestination,
		inSource)
	{
		if (typeof inSource == "object" && inSource) {
			for (var name in inSource) {
				inDestination[name] = inSource[name];
			}
		}
		
		return inDestination;
	}


	// =======================================================================
	function createSimpleDialog(
		inDialog,
		inContent,
		inSpacerWidth)
	{
		return {
			title: inDialog.title || "",
			subtitle: inDialog.subtitle || "",
			showTitle: (typeof inDialog.showTitle == "boolean") ? inDialog.showTitle : !!inDialog.title,
			buttons: inDialog.buttons,
			size: inDialog.size || "225x150",
			css: inDialog.css || {},
			style: inDialog.style || {},
			events: inDialog.events || {},
			children: [
				{ HBox: {
					percentWidth: 100,
					percentHeight: 100,
					style: {
						paddingLeft: 0,
						paddingTop: 0,
						paddingRight: 0,
						paddingBottom: 0,
						horizontalGap: 0
					},
					children: [
						{ Image: {
							source: inDialog.icon,
							includeInLayout: !!inDialog.icon,
							style: {
								paddingLeft: 0
							}
						} },
						{ Spacer: {
							width: inSpacerWidth || 15,
							includeInLayout: !!inDialog.icon
						} },
						inContent
					]
				} }
			]
		};
	}


	// =======================================================================
	function confirm(
		inDialog)
	{
			// for yes/no dialogs, add key handlers for Y/N
		if (inDialog.buttons && inDialog.buttons[0].toLowerCase() == "yes") {
			inDialog.events = inDialog.events || {};
			inDialog.events.keyDown = function(inEvent)
			{
				if (inEvent.charCode == "y".charCodeAt(0)) {
					inEvent.result.push(["close", true]);
				} else if (inEvent.charCode == "n".charCodeAt(0)) {
					inEvent.result.push(["close", false]);
				}
			};
		}
		
		var jsml = createSimpleDialog(
			inDialog,
			{ Text: {
				percentWidth: 100,
				htmlText: inDialog.message
			} }
		);

			// make sure we return a boolean
		return !!dialog.open(jsml);
	}


	// =======================================================================
	function prompt(
		inDialog)
	{
		var jsml = createSimpleDialog(
			inDialog,
			{ VBox: {
				percentWidth: 100,
				percentHeight: 100,
				style: {
					verticalGap: 10
				},
				children: [
					{ Text: {
						percentWidth: 100,
						htmlText: inDialog.message
					} },
					{ TextArea: {
						name: "Input",
						percentWidth: 100,
						percentHeight: 100,
						text: inDialog.text || "",
						selectionBeginIndex: 0,
						selectionEndIndex: (inDialog.text || "").length,
						_focused: true,
						events: {
							keyDown: function(inEvent)
							{
								if (inEvent.keyCode == 13 && !inEvent.shiftKey) {
									inEvent.result.push(["close", true]);
								}
							}
						}
					} }
				]
			} }
		);
		
		var result = dialog.open(jsml);

		if (result) {
			return result.Input;
		} else {
			return null;
		}
	}
	
	
	// =======================================================================
	function form(
		inDialog)
	{
		function FormItem(
			inLabel,
			inConfig,
			inItem)
		{
				// get the type of the item so we can mixin inConfig on that
				// object, not the item as a whole
			for (var type in inItem) {
				mixin(inItem[type], inConfig); 
				
				return { FormItem: {
					percentWidth: 100,
						// don't show the : if the label is blank
					label: (inLabel && inLabel + ":") || "",
						// RadioButtons pass in an array of items here, so we
						// don't want to wrap them in another array
					children: inItem instanceof Array ? inItem : [inItem]
				} };
			}
		}
		
		
		function dpElement(
			inType,
			inName,
			inLabel,
			inDP,
			inConfig)
		{
			var selectedIndex = 0,
				jsml = {};

				// the last element in the data provider array could be a number
				// specifying which item is selected by default
			if (typeof inDP[inDP.length - 1] == "number") {
				selectedIndex = inDP.pop();
			}
			
			jsml[inType] = {
				name: inName,
				selectedIndex: selectedIndex,
				dataProvider: inDP
			};

			return FormItem(inLabel, inConfig, jsml);
		}
		
		
		var Elements = {
			Button: function(inName, inLabel, inSelected, inConfig)
			{
				return FormItem("", inConfig,
					{ Button: {
						name: inName,
						label: inLabel,
							// we want buttons in the form to always be toggles
						toggle: true,
						selected: !!inSelected
					} }
				);
			},
			CheckBox: function(inName, inLabel, inSelected, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ CheckBox: {
						name: inName,
						selected: !!inSelected
					} }
				);
			},
			ColorPicker: function(inName, inLabel, inSelectedColor, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ ColorPicker: {
						name: inName,
						selectedColor: inSelectedColor || "#000000"
					} }
				);
			},
			ComboBox: function(inName, inLabel, inDP, inConfig)
			{
				return dpElement.apply(this, ["ComboBox"].concat(arguments));
			},
			DateField: function(inName, inLabel, inSelectedDate, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ DateField: {
						name: inName,
						selectedDate: inSelectedDate || new Date().getTime()
					} }
				);
			},
			FormHeading: function(inLabel, inConfig)
			{
				return { FormHeading: mixin(
					{ label: inLabel },
					inConfig)
				};
			},
			Image: function(inLabel, inSource, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ Image: { source: inSource } }
				);
			},
			List: function(inName, inLabel, inDP, inConfig)
			{
				inConfig = mixin(inConfig || {}, {
					rowCount: 4,
					percentWidth: 100
				});

				return dpElement("List", inName, inLabel, inDP, inConfig);
			},
			NumericStepper: function(inName, inLabel, inValue, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ NumericStepper: {
						name: inName,
						maximum: 100000000,
						minimum: -100000000,
						value: inValue || 0
					} }
				);
			},
			PasswordInput: function(inName, inLabel, inText, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ TextInput: {
						name: inName,
						htmlText: inText || "",
						percentWidth: 100,
						displayAsPassword: true
					} }
				);
			},
			RadioButtonGroup: function(inName, inLabel, inButtons, inConfig)
			{
				var radioButtons = [],
					selectedButton = 0;
				
				if (typeof inButtons[inButtons.length - 1] == "number") {
					selectedButton = inButtons.pop();
				}
				
				for (var i = 0; i < inButtons.length; i++) {
					radioButtons.push(
						{ RadioButton: mixin(
							{
								label: inButtons[i],
								value: i,
								groupName: inName,
								selected: i == selectedButton
							},
							inConfig || {})
						}
					);
				}
				
				return FormItem(inLabel, inConfig, radioButtons);
			},
			Slider: function(inName, inLabel, inValues, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ HSlider: {
						name: inName,
						percentWidth: 100,
						minimum: inValues[0],
						maximum: inValues[2],
						labels: inValues,
						value: inValues[1]
					} }
				);
			},
			Spacer: function(inHeight, inConfig)
			{
				return FormItem("", inConfig,
					{ Spacer: {
						height: inHeight || 0
					} }
				);
			},
			Text: function(inLabel, inText, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ Text: {
						percentWidth: 100,
						htmlText: inText || ""
					} }
				);
			},
			TextInput: function(inName, inLabel, inText, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ TextInput: {
						name: inName,
						percentWidth: 100,
						htmlText: inText || ""
					} }
				);
			},
			TextArea: function(inName, inLabel, inText, inConfig)
			{
				return FormItem(inLabel, inConfig,
					{ TextArea: {
						name: inName,
						percentWidth: 100,
						htmlText: inText || ""
					} }
				);
			},
			TileList: function(inName, inLabel, inDP, inConfig)
			{
				return dpElement.apply(this, ["TileList"].concat(arguments));
			},
			ToggleButtonBar: function(inName, inLabel, inDP, inConfig)
			{
				return dpElement.apply(this, ["ToggleButtonBar"].concat(arguments));
			}
		};
		
		var items = [],
			item,
			handler,
			i,
			len;
		
		for (i = 0, len = inDialog.items.length; i < len; i++) {
			item = inDialog.items[i];
			
			if (item instanceof Array) {
				handler = Elements[item[0]];
					
				if (handler) {
					items.push(handler.apply(this, item.slice(1)));
				}
			} else if (item && typeof item == "object") {
				items.push(item);
			}
		}
		
			// focus the first element that is focusable.  controls like a
			// FormHeading can't be focused.
		for (i = 0; i < items.length; i++) {
			item = items[i];

				// make sure this item has a child we can focus
			if (item.FormItem && item.FormItem.children && item.FormItem.children.length) {
				item.FormItem.children[0][inDialog.items[i][0]]._focused = true;
				break;
			}
		}

		var jsml = {
			title: inDialog.title || "",
			subtitle: inDialog.subtitle || "",
			showTitle: (typeof inDialog.showTitle == "boolean") ? inDialog.showTitle : !!inDialog.title,
			buttons: inDialog.buttons,
			size: inDialog.size || "275x200",
			css: {
				FormItem: {
					verticalGap: 0
				},
				FormHeading: {
					fontFamily: "Tahoma",
					fontSize: 11
				}
			},
			children: [
				{ Form: {
					percentWidth: 100,
					percentHeight: 100,
					style: {
						paddingLeft: 0,
						paddingTop: 5,
						paddingRight: 0,
						paddingBottom: 15,
						verticalGap: 5,
						indicatorGap: 4
					},
					children: items
				} }
			]
		};

		return dialog.open(jsml);
	}


	return {
		confirm: confirm,
		prompt: prompt,
		form: form
	};
});
