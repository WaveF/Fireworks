var fixedFontEnable;
var fixedFont = [];
var cap = false;
var defaultFontFamily = "Microsoft YaHei";
var defaultFontSize = 12;
var fontString, sizeString;
var setAlpha = false;
var FSize = 12;
var sp = "_and_";
var alphaColor = "#000000";
var initText = "";
var panelPath = (fw.currentScriptDir+"/"+fw.currentScriptFileName).replace(".js",".swf");

if(fixedFontEnable){
	fixedFont[0] = "自定义字体";
	fixedFont[1] = prompt("请输入自定义字体的英文名称：", "Microsoft YaHei");
}else{
	fixedFont = ["微软雅黑", "Microsoft YaHei"];
}

if(fw.selection!=null){
	if(fw.selection.length>0){
		if(fw.selection[0].customData.CTT!=undefined && fw.selection[0]!="[object Text]"){
			var info = fw.selection[0].customData.CTT;
			initText = info.split(sp)[0];
			FSize = Number(info.split(sp)[1]);
		}
		
		if(fw.selection[0]=="[object Text]"){
			initText = fw.selection[0].textChars;
			FSize = fw.selection[0].fontsize;
			if(initText=="" || initText==null){
				initText = "请在文本框中输入文字...";
			}
		}
	}
}

	
fwlib.panel.register({
	size: "500x375",
	events: {
        onFwActiveSelectionChange: function(event){
			if(fw.selection.length>0){
				if(fw.selection[0].customData.CTT!=undefined && fw.selection[0]!="[object Text]"){
					var _info = fw.selection[0].customData.CTT;
					var _initText = _info.split(sp)[0];
					var _fsize = Number(_info.split(sp)[1]);
					event.result.push(["ShowBox", "text", _initText]);
					//event.result.push(["FontSizeBox", "selectedItem.label", _fsize+"px"]);
					if(event.currentValues.FontSizeBox.selectedItem.data==0){
						//event.result.push(["FontSizeBox", "selectedItem.data", _fsize]);
						FSize = _fsize;
					}
					defaultFontSize = Number(event.currentValues.FontSizeBox.selectedItem.data);
					event.result.push(["ShowBox", "styleName", String("fontSize" + _fsize)]);
				}
				
				if(fw.selection[0]=="[object Text]"){
					if(fw.selection[0].fontsize>11 && fw.selection[0].fontsize<24){
						FSize = fw.selection[0].fontsize;
					}else{
						FSize = 14;
					}
					event.result.push(["ShowBox", "text", fw.selection[0].textChars]);
					event.result.push(["ShowBox", "styleName", String("fontSize" + FSize)]);
				}
				
				if(fw.selection[0]!="[object Text]" && fw.selection[0].customData.CTT==undefined){
					event.result.push(["ShowBox", "text", ""]);
				}
			}else{
				event.result.push(["ShowBox", "text", ""]);
			}
        }
    },
	css: {
		"global": {fontFamily: defaultFontFamily, fontSize: defaultFontSize},
		
		".fontSize0": {fontSize: FSize},
		".fontSize12": {fontSize: 12},
		".fontSize13": {fontSize: 13},
		".fontSize14": {fontSize: 14},
		".fontSize16": {fontSize: 16},
		".fontSize18": {fontSize: 18},
		".fontSize20": {fontSize: 20},
		".fontSize22": {fontSize: 22},
		".fontSize24": {fontSize: 24},
		
		".fontFamily1": {fontFamily: defaultFontFamily, fontSize: defaultFontSize},
		".fontFamily2": {fontFamily: "Tahoma", fontSize: defaultFontSize},
		".fontFamily3": {fontFamily: "Arial", fontSize: defaultFontSize},
		".fontFamily4": {fontFamily: "Verdana", fontSize: defaultFontSize},
		".fontFamily5": {fontFamily: "Times New Roman", fontSize: defaultFontSize},
		
		//Button: {height: 30}
	},
	children: [
		{ HBox: {
			percentWidth: 100,
			percentHeight: 100,
			children: [
				{ TextArea: {
					percentWidth: 100,
					percentHeight: 100,
					name: "ShowBox",
					_focused: true,
					text: initText,
					styleName: "fontSize0",
					style: {
						paddingTop: 5,
						paddingBottom: 5,
						paddingLeft: 5,
						paddingRight: 5,
						fontFamily: fixedFont[1],
					},
					events: {
						change: function(event){
							if(fw.selection!=null){
								if(fw.selection.length>0){
									if(fw.selection[0]=="[object Text]"){ fw.selection[0].textChars = event.currentValues.ShowBox; }
								}
							}
						}
					},
					toolTip: "按 Shift+Enter 换行\n按 F5 刷新（面板内）",
				} },
			]
		} },
		{ HBox: {
			percentWidth: 100,
			style: {
				paddingTop: 2,
				paddingBottom: 2,
			},
			children: [
				{ ComboBox: {
					name: "FontFamilyBox",
					percentWidth: 50,
					enabled: false,
					height: 25,
					doubleClickEnabled: true,
					dataProvider: [
						{ label: fixedFont[0], data: "0" },
						{ label: "微软雅黑", data: "1" },
						{ label: "Tahoma", data: "2" },
						{ label: "Arial", data: "3" },
						{ label: "Verdana", data: "4" },
						{ label: "Times New Roman", data: "5" },
					],
					events: {
						change: function(event){
							fontString = String("fontFamily" + event.currentValues.FontFamilyBox.selectedItem.data);
							event.result.push(["ShowBox", "styleName", fontString]);
						},
						doubleClick: function(event){
							fixedFontEnable = !fixedFontEnable;
							if(fixedFontEnable){
								alert("已开启'自定义字体'模式，请在文本框内按 F5 刷新！");
							}else{
								alert("已还原默认字体：微软雅黑，请在文本框内按 F5 刷新！");
							}
						}
					},
					toolTip: "内测版只可以使用 '"+fixedFont[0]+"' 字体\n\n但你仍可以同过以下方法使用自定义字体：\n- 双击此处，然后在面板内按 F5 刷新，\n- 在弹出的对话框中输入字体的英文名称\n\n再次双击此处并按'F5'刷新即可还原默认的 '微软雅黑' 字体",
				} },
				{ ComboBox: {
					name: "FontSizeBox",
					percentWidth: 50,
					height: 25,
					dataProvider: [
						{ label: "默认字号", data: "0" },
						{ label: "12px", data: "12" },
						{ label: "13px", data: "13" },
						{ label: "14px", data: "14" },
						{ label: "16px", data: "16" },
						{ label: "18px", data: "18" },
						{ label: "20px", data: "20" },
						{ label: "22px", data: "22" },
						{ label: "24px", data: "24" },
					],
					events: {
						change: function(event){
							defaultFontSize = Number(event.currentValues.FontSizeBox.selectedItem.data);
							sizeString = String("fontSize" + event.currentValues.FontSizeBox.selectedItem.data);
							event.result.push(["ShowBox", "styleName", sizeString]);
						}
					}
				} },
			]
		} },
		{ HRule: { percentWidth: 100 } },
		{ HBox: {
			percentWidth: 100,
			style: {
				paddingTop: 2,
				paddingBottom: 2,
			},
			children: [
				{ Button: {
					name: "CaptureBtn",
					label: "截图",
					percentWidth: 20,
					height: 30,
					events: {
						click: function(event){
							if(event.currentValues.ShowBox!=""){
								cap = true;
								event.result.push(["CreateBtn", "enabled", true]);
								fw.takeScreenshot();
							}else{
								alert("请在文本框中输入文字...");
							}
						},
						//mouseOver: function(event){
						//	event.result.push(["ShowBox","toolTip",undefined]);
						//},
						//mouseOut: function(event){
						//	event.result.push(["ShowBox","toolTip","按 Shift+Enter 换行\n按 F5 刷新（面板内）"]);
						//},
					},
					toolTip: "面板内文本区域截图",
				} },
				{ Button: {
					name: "CreateBtn",
					label: "渲染文本",
					percentWidth: 30,
					height: 30,
					enabled: false,
					events: {
						click: function(event){
							if(cap){
								event.result.push(["CreateBtn", "enabled", false]);
								createText(event);
							}else{
								alert("请先截图！");
							}
						}
					},
					toolTip: "生成渲染的 ClearTypeTrue 文本图形",
				} },
				{ HBox: {
					percentWidth: 50,
					children: [
						{ CheckBox: {
							name: "SetAlphaBox",
							label: "转换为Alpha",
							height: 30,
							selected: setAlpha,
							style: {
								fontWeight: "bold",
							},
							events: {
								click: function(event){
									setAlpha = event.currentValues.SetAlphaBox;
									event.result.push(["ColorPickerBox","enabled",setAlpha]);
									if(setAlpha){
										event.result.push(["ColorPickerBox","alpha",1]);
									}else{
										event.result.push(["ColorPickerBox","alpha",0]);
									}
								}
							},
							toolTip: "通过转换为Alpha通道进行抠图，\n并且可以修改渲染文本的颜色",
						} },
						{ HBox: {
							style:{
								paddingTop: 5,
							},
							children: [
								{ ColorPicker: {
									name: "ColorPickerBox",
									selectedColor: alphaColor,
									enabled: false,
									alpha: 0,
									events: {
										change: function(event){
											alphaColor = event.currentValues.ColorPickerBox;
										},
									},
								} },
							],
						} },
					],
				} },
				{ Button: {
					percentWidth: 10,
					height: 30,
					label: "加载信息",
					events: {
						click: function(event){
							//fwlib.panel.load(panelPath);
							init(event);
						}
					},
					toolTip: "若文本无法自动加载，请手动读取信息",
				} },
			]
		} },
	]
});

function createText(inEvent){
	if(fw.selection!=null){
		var dom = fw.getDocumentDOM();
		var sel = fw.selection;
		var _x, _y;
	
		if(sel.length != 1){
			_x = 0;
			_y = 0;
		}else{
			_x = sel[0].left;
			_y = sel[0].top;
		}
		
		dom.clipPaste("do not resample", "vector");
		dom.setSelectionBounds({left:_x, top:_y, right:_x+fw.selection[0].width, bottom:_y+fw.selection[0].height}, "autoTrimImages transformAttributes");
		
		if(inEvent.currentValues.FontSizeBox.selectedItem.data!=0){
			fw.selection[0].customData.CTT = inEvent.currentValues.ShowBox + sp + inEvent.currentValues.FontSizeBox.selectedItem.data;
		}else{
			fw.selection[0].customData.CTT = inEvent.currentValues.ShowBox + sp + FSize;
		}
		
		if(setAlpha){
			dom.applyEffects({ category:"UNUSED", effects:[ { EffectIsVisible:true, EffectMoaID:"{2932d5a2-ca48-11d1-8561000502701850}", MB_filter_preview_tile_size:"-1 -1", category:"Other", name:"Convert to Alpha" }, { Blendmode:0, Color:alphaColor, EffectIsVisible:true, EffectMoaID:"{dd54adc0-a279-11d3-b92a000502f3fdbe}", Opacity:100, category:"Adjust Color", name:"Color Fill" } ], name:"UNUSED" });
		}else{
			//dom.setBlendMode("darken");
			dom.setBlendMode("multiply");
		}
		
		dom.moveSelectionBy({x:0, y:0}, false, false);
		dom.setDocumentCanvasSize({left:0, top:0, right:dom.width, bottom:dom.height}, true);
		dom.selectNone();
	}
}

function init(inEvent){
	if(fw.selection!=null){
		if(fw.selection.length>0){
			if(fw.selection[0].customData.CTT!=undefined && fw.selection[0]!="[object Text]"){
				var _info = fw.selection[0].customData.CTT;
				var _initText = _info.split(sp)[0];
				var _fsize = Number(_info.split(sp)[1]);
				inEvent.result.push(["ShowBox", "text", _initText]);
				inEvent.result.push(["FontSizeBox", "selectedItem.label", _fsize+"px"]);
				if(inEvent.currentValues.FontSizeBox.selectedItem.data==0){
					inEvent.result.push(["FontSizeBox", "selectedItem.data", _fsize]);
					FSize = _fsize;
				}
				defaultFontSize = Number(inEvent.currentValues.FontSizeBox.selectedItem.data);
				inEvent.result.push(["ShowBox", "styleName", String("fontSize" + _fsize)]);
			}
			
			if(fw.selection[0]=="[object Text]"){
				if(fw.selection[0].fontsize>11 && fw.selection[0].fontsize<24){
					FSize = fw.selection[0].fontsize;
				}else{
					FSize = 14;
				}
				inEvent.result.push(["ShowBox", "text", fw.selection[0].textChars]);
				inEvent.result.push(["ShowBox", "styleName", String("fontSize" + FSize)]);
			}
			
			if(fw.selection[0]!="[object Text]" && fw.selection[0].customData.CTT==undefined){
				inEvent.result.push(["ShowBox", "text", ""]);
			}
		}else{
			inEvent.result.push(["ShowBox", "text", ""]);
		}
	}
}