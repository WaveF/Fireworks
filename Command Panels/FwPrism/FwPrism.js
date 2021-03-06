INFO = { version:'1.2.5', type:'panel' };

(function() {

	//================================================================ 初始化设定
	
	var newNameList = [];

	var mAdd = true;
	var mRemove = true;
	var mReplace = true;
	var mNumber = true;
	
	var lang = (Files.getLanguageDirectory().split("/")[Files.getLanguageDirectory().split("/").length-1]).toLowerCase();

	var REMOVE = {};
	var REPLACE = {};
	var ADD = {};
	var NUMBER = {};
	var COMMON = {};

	REMOVE.str = [];
	REPLACE.str = [];
	ADD.str = [];
	NUMBER.str = [];
	COMMON.str = [];

	if(lang.indexOf("chinese")!=-1){
		//中文
		COMMON.str[0] = "重置";
		COMMON.str[1] = "操作";
		COMMON.str[2] = "重命名";
		COMMON.str[3] = "预览";
		
		REMOVE.str[0] = "删除字符";
		REMOVE.str[1] = "开始:";
		REMOVE.str[2] = "结束:";
		REMOVE.str[3] = "长度:";
		
		REPLACE.str[0] = "替换字符";
		REPLACE.str[1] = "关键字:";
		REPLACE.str[2] = "替换:";
		
		ADD.str[0] = "追加字符";
		ADD.str[1] = "前缀:";
		ADD.str[2] = "后缀:";
		ADD.str[3] = "强制:";
		ADD.str[4] = "强制设置对象名字;\n留空则会保留原名.";
		
		NUMBER.str[0] = "数字序号";
		NUMBER.str[1] = "模式:";
		NUMBER.str[2] = "前缀";
		NUMBER.str[3] = "后缀";
		NUMBER.str[4] = "插入";
		NUMBER.str[5] = "于:";
		NUMBER.str[6] = "分隔:";
		NUMBER.str[7] = "开始:";
		NUMBER.str[8] = "递增:";
		NUMBER.str[9] = "位数:";
	}else{
		//英文
		COMMON.str[0] = "Reset";
		COMMON.str[1] = "Operation";
		COMMON.str[2] = "Rename";
		COMMON.str[3] = "Preview";
		
		REMOVE.str[0] = "Remove";
		REMOVE.str[1] = "Start:";
		REMOVE.str[2] = "End:";
		REMOVE.str[3] = "Length:";
		REMOVE.str[4] = "Reset";
		
		REPLACE.str[0] = "Replace";
		REPLACE.str[1] = "Keyword:";
		REPLACE.str[2] = "With:";
		REPLACE.str[3] = "Reset";
		
		ADD.str[0] = "Append";
		ADD.str[1] = "Prefix:";
		ADD.str[2] = "Suffix:";
		ADD.str[3] = "Force:";
		ADD.str[4] =  "Force rename selected objects;\nLeave blank for original name.";
		
		NUMBER.str[0] = "Number";
		NUMBER.str[1] = "Mode:";
		NUMBER.str[2] = "Prefix";
		NUMBER.str[3] = "Suffix";
		NUMBER.str[4] = "Insert";
		NUMBER.str[5] = "at:";
		NUMBER.str[6] = "Sep:";
		NUMBER.str[7] = "Start:";
		NUMBER.str[8] = "Increase:";
		NUMBER.str[9] = "Digit:";
	}


	//================================================================== 功能函数

	function Renamer(inEvent, process){
		if(!fw.selection){ alert("No object was selected!"); return }
		if(fw.selection.length<1){ alert("You must select one object at least!");return }
		if(!mAdd && !mRemove && !mReplace && !mNumber){ alert("You should setup something first.");return }
		
		newNameList = [];
		UpdateSetting(inEvent);
		
		var i, j, oldName, newName, startIdx, endIdx, insertAt, nPad, opr;
		
		var sel = fw.selection;
		var newSel = [];
		var strArr = [];
		
		for(i=0; i<sel.length; i++){
			objName = "";
			
			//---- 初始旧名 ----
			if(sel[i]=="[object SliceHotspot]"){
				if(sel[i].baseName==null){ objName="" }else{ objName=sel[i].baseName }
			}else{
				if(sel[i].name==null){ objName="" }else{ objName=sel[i].name }
			}
			
			
			//---- 删除字符 ----
			if(mRemove){
				/* 如果旧名为空，那新名也必定为空 */
				if(objName != ""){
					var remWord = "";
					
					if(REMOVE.Length!=0){
						if(REMOVE.Length > objName.length){
							/* 如果设置长度超出字符长度，就按照字符长度去删减 */
							remWord = objName.substr(REMOVE.Start, objName.length);
						}else{
							remWord = objName.substr(REMOVE.Start, REMOVE.End);
						}
						objName = objName.split(remWord).join("");
					}
				}
			}
			
			
			//---- 替换字符 ----
			if(mReplace){
				objName = objName.split(REPLACE.Keyword).join(REPLACE.With);
			}
			
			
			//---- 追加字符 ----
			if(mAdd){
				if(ADD.Original!=""){ objName = ADD.Original }
				objName = ADD.Prefix + objName;
				objName = objName + ADD.Suffix;
			}
			
			
			//---- 数字序号 ----
			if(mNumber){
				nPad = "";
				if(NUMBER.Start+NUMBER.Increase*i>=0){ opr="" }else{ opr="-" }
				
				if(NUMBER.Pad>0){
					for(j=1; j<NUMBER.Pad; j++){ nPad += "0" }
					if(NUMBER.Start+NUMBER.Increase*i>=0){
						nPad = nPad.substr(String(NUMBER.Start+NUMBER.Increase*i).length-1, nPad.length);
					}else{
						nPad = nPad.substr(String(NUMBER.Start+NUMBER.Increase*i).length-2, nPad.length);
					}
				}
				
				/* 前缀 */
				if(NUMBER.Mode==NUMBER.str[2]){
					objName = opr + nPad + Math.abs(NUMBER.Start+NUMBER.Increase*i) + NUMBER.Sep + objName;
				}
				
				/* 后缀 */
				if(NUMBER.Mode==NUMBER.str[3]){
					objName = objName + NUMBER.Sep + opr + nPad + Math.abs(NUMBER.Start+NUMBER.Increase*i);
				}
				
				/* 插入 */
				if(NUMBER.Mode==NUMBER.str[4]){
					if(NUMBER.At > objName.length){ insertAt = objName.length }
					else{ insertAt = NUMBER.At }
					
					strArr[0] = objName.substr(0, insertAt);
					strArr[1] = objName.substr(insertAt, objName.length);
					
					objName = strArr[0] + NUMBER.Sep + opr + nPad + Math.abs(NUMBER.Start+NUMBER.Increase*i) + NUMBER.Sep + strArr[1];
				}
			}
			
			newNameList.push(objName);
			
			//---- 命名对象 ----
			if(process){
				if(sel[i]=="[object SliceHotspot]"){ sel[i].baseName = objName }
				else{ sel[i].name = objName }
			}
			
		}
		
		fw.selection = sel;
	}


	function UpdateSetting(inEvent){
		REMOVE.Start = inEvent.currentValues.remStart;
		REMOVE.End = inEvent.currentValues.remEnd;
		REMOVE.Length = inEvent.currentValues.remLength;
		
		REPLACE.Keyword = inEvent.currentValues.repKeyword;
		REPLACE.With = inEvent.currentValues.repWith;
		
		ADD.Prefix = inEvent.currentValues.addPrefix;
		ADD.Suffix = inEvent.currentValues.addSuffix;
		ADD.Original = inEvent.currentValues.addOriginal;
		
		NUMBER.Mode = inEvent.currentValues.numMode.selectedItem;
		NUMBER.At = inEvent.currentValues.numAt;
		NUMBER.Sep = inEvent.currentValues.numSep;
		NUMBER.Start = inEvent.currentValues.numStart;
		NUMBER.Increase = inEvent.currentValues.numIncrease;
		NUMBER.Pad = inEvent.currentValues.numPad;
	}



	//================================================================== 界面函数

	function CreateHeader(inLabel, bgColor){
		if(bgColor==0xFFFFFF){ bgColor=0xCCCCCC }
		return { HBox: {
			percentWidth: 100,
			height: 30,
			style: {
				paddingLeft: 4,
				backgroundAlpha: 1,
				backgroundColor: String(bgColor),
			},
			children: [
				{ Label: {
					percentWidth: 100,
					text: inLabel,
					style: {
						paddingLeft: 4,
						paddingTop: 6,
						fontWeight: "bold",
						color: 0xFFFFFF,
						fontSize: 12,
					},
				} },
				{ Image: {
					width: 30,
					height: 30,
					buttonMode: true,
					source: fw.currentScriptDir + "/images/back.png",
					events:{
						click: function(event){
							fw.launchApp(fw.appDir+((fw.platform=="win")?"/Fireworks.exe":"/Adobe Fireworks CS6.app"), [fw.currentScriptDir+"/core/restore.jsf"]);
						}
					}
				} }
			],
		} };
	}

	function CreateCaption(inLabel){
		return { HBox: {
			percentWidth: 100,
			height: 22,
			style: {
				paddingLeft: 4,
				//backgroundAlpha: .2,
				//backgroundColor: "0x74BA41",
				backgroundColor: "0xA4A4A4",
			},
			children: [
				{ Label: {
					percentWidth: 100,
					text: inLabel,
					style: {
						paddingLeft: 4,
						paddingTop: 2,
						fontWeight: "bold",
						color: 0xFFFFFF,
						fontSize: 11,
					},
				} },
			],
		} };
	}

	function Col(inChildren,pw){
		if(!pw){ pw=100 };
		return { VBox: {
			percentWidth: pw,
			//styleName: "Col",
			children: inChildren
		} };
	}

	function Row(inChildren,pw){
		if(!pw){ pw=100 };
		return { HBox: {
			percentWidth: pw,
			//styleName: "Row",
			children: inChildren
		} };
	}



	//===================================================================================================================== 用户界面


	fwlib.panel.register({
		css: {
			"TextInput": {  },
			"Label": { paddingLeft:10, paddingTop:2, width:40 }
		},
		children:[
			CreateHeader("Renamer", 0x4DCD70),
			

	//------------------------------------------------------------------ 删除字符
			{ HBox: {
				percentWidth: 100,
				height: 22,
				style: {
					paddingLeft: 4,
					backgroundAlpha: .2,
					backgroundColor: "0xA4A4A4",
				},
				children: [
					{ CheckBox: {
						name: "cbRemove",
						selected: mRemove,
						style:{
							paddingTop:4,
							paddingRight:4
						},
						events:{
							click: function(event){
								mRemove = event.currentValues.cbRemove;
								event.result.push(["remStart","enabled",mRemove],
												  ["remEnd","enabled",mRemove],
												  ["remLength","enabled",mRemove]);
							}
						}
					} },
					
					{ Label: {
						percentWidth: 100,
						/* 删除字符 */
						text: REMOVE.str[0],
						style: {
							paddingLeft: -10,
							paddingTop: 2,
							fontWeight: "bold",
							color: 0x555555,
							fontSize: 11,
						},
						events: {
							click: function(event){
								mRemove = !mRemove;
								event.result.push(["cbRemove","selected",mRemove],
												  ["remStart","enabled",mRemove],
												  ["remEnd","enabled",mRemove],
												  ["remLength","enabled",mRemove]);
							}
						}
					} },
					
					{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
					
					{ Button: {
						/* 重置 */
						label: COMMON.str[0],
						height: 22,
						alpha: 0,
						buttonMode: true,
						events: {
							click: function(event){
								event.result.push(["remStart","value",0],
												  ["remEnd","value",0],
												  ["remLength","value",0]);
							}
						},
						style: { color:0x888888, paddingRight:-10 }
					} },
					
					{ Spacer: { width:6 } },
				],
			} },
			Row([
				{ Label: {
					/* 删除 - 开始 */
					text: REMOVE.str[1],
					width: 48,
				} },
				{ NumericStepper: {
					name: "remStart",
					enabled: mRemove,
					width: 60,
					value: 0,
					stepSize: 1,
					minimum: 0,
					maximum: 9999,
					events: {
						change: function(event){
							var cal = event.currentValues.remEnd - event.currentValues.remStart;
							event.result.push(["remLength","value",cal]);
							
							if(event.currentValues.remStart > event.currentValues.remEnd){
								event.result.push(["remStart","value",event.currentValues.remEnd]);
							}
						}
					}
				} },
				
				{ Label: {
					/* 删除 - 结束 */
					text: REMOVE.str[2],
					width: 48,
				} },
				{ NumericStepper: {
					name: "remEnd",
					enabled: mRemove,
					width: 60,
					value: 0,
					stepSize: 1,
					minimum: 0,
					maximum: 9999,
					events: {
						change: function(event){
							var cal = event.currentValues.remEnd - event.currentValues.remStart;
							event.result.push(["remLength","value",cal]);
							
							if(event.currentValues.remEnd < event.currentValues.remStart){
								event.result.push(["remEnd","value",event.currentValues.remStart]);
							}
						}
					}
				} },
				
				{ Label: {
					/* 删除 - 长度 */
					text: REMOVE.str[3],
					width: 58,
				} },
				{ NumericStepper: {
					name: "remLength",
					enabled: mRemove,
					percentWidth: 100,
					value: 0,
					stepSize: 1,
					minimum: 0,
					maximum: 9999,
					events: {
						change: function(event){
							var cal = event.currentValues.remStart + event.currentValues.remLength;
							event.result.push(["remEnd","value",cal]);
						}
					}
				} },
			]),
			{ Spacer: { height:2 } },
			
			
	//------------------------------------------------------------------ 替换字符
			{ HBox: {
				percentWidth: 100,
				height: 22,
				style: {
					paddingLeft: 4,
					backgroundAlpha: .2,
					backgroundColor: "0xA4A4A4",
				},
				children: [
					{ CheckBox: {
						name: "cbReplace",
						selected: mReplace,
						style:{
							paddingTop:4,
							paddingRight:4
						},
						events:{
							click: function(event){
								mReplace = event.currentValues.cbReplace;
								event.result.push(["repKeyword","enabled",mReplace],
												  ["repWith","enabled",mReplace]);
							}
						}
					} },
					
					{ Label: {
						/* 替换字符 */
						text: REPLACE.str[0],
						percentWidth: 100,
						style: {
							paddingLeft: -10,
							paddingTop: 2,
							fontWeight: "bold",
							color: 0x555555,
							fontSize: 11,
						},
						events: {
							click: function(event){
								mReplace = !mReplace;
								event.result.push(["cbReplace","selected",mReplace],
												  ["repKeyword","enabled",mReplace],
												  ["repWith","enabled",mReplace]);
							}
						}
					} },
					
					{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
					
					{ Button: {
						/* 重置 */
						label: COMMON.str[0],
						height: 22,
						alpha: 0,
						buttonMode: true,
						events: {
							click: function(event){
								event.result.push(["repKeyword","text",""],
												  ["repWith","text",""]);
							}
						},
						style: { color:0x888888, paddingRight:-10 }
					} },
					{ Spacer: { width:6 } },
				],
			} },
			Row([
				{ Label: {
					/* 替换 - 关键字 */
					text: REPLACE.str[1],
					width: 62,
				} },
				{ TextInput: {
					name: "repKeyword",
					enabled: mReplace,
					width: 126,
					text: "",
				} },
				
				{ Label: {
					/* 替换 - 替换词 */
					text: REPLACE.str[2],
					width: 44,
				} },
				{ TextInput: {
					name: "repWith",
					enabled: mReplace,
					percentWidth: 100,
					text: "",
				} },
			]),
			{ Spacer: { height:2 } },
			


	//------------------------------------------------------------------ 追加字符
			{ HBox: {
				percentWidth: 100,
				height: 22,
				style: {
					paddingLeft: 4,
					backgroundAlpha: .2,
					backgroundColor: "0xA4A4A4",
				},
				children: [
					{ CheckBox: {
						name: "cbAdd",
						selected: mAdd,
						style:{
							paddingTop:4,
							paddingRight:4
						},
						events:{
							click: function(event){
								mAdd = event.currentValues.cbAdd;
								event.result.push(["addPrefix","enabled",mAdd],
												  ["addSuffix","enabled",mAdd],
												  ["addOriginal","enabled",mAdd]);
							}
						}
					} },
				
					{ Label: {
						/* 追加字符 */
						text: ADD.str[0],
						percentWidth: 100,
						style: {
							paddingLeft: -10,
							paddingTop: 2,
							fontWeight: "bold",
							color: 0x555555,
							fontSize: 11,
						},
						events: {
							click: function(event){
								mAdd = !mAdd;
								event.result.push(["cbAdd","selected",mAdd],
												  ["addPrefix","enabled",mAdd],
												  ["addSuffix","enabled",mAdd],
												  ["addOriginal","enabled",mAdd]);
							}
						}
					} },
					
					{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
					
					{ Button: {
						/* 重置 */
						label: COMMON.str[0],
						height: 22,
						alpha: 0,
						buttonMode: true,
						events: {
							click: function(event){
								event.result.push(["addPrefix","text",""],
												  ["addSuffix","text",""],
												  ["addOriginal","text",""]);
							}
						},
						style: { color:0x888888, paddingRight:-10 }
					} },
					{ Spacer: { width:6 } },
					
					
				],
			} },
			Row([
				{ Label: {
					/* 追加 - 前缀 */
					text: ADD.str[1],
					width: 48,
				} },
				{ TextInput: {
					name: "addPrefix",
					enabled: mAdd,
					width: 60,
					text: "",
				} },
				
				{ Label: {
					/* 追加 - 后缀 */
					text: ADD.str[2],
					width: 48,
				} },
				{ TextInput: {
					name: "addSuffix",
					enabled: mAdd,
					width: 60,
					text: "",
				} },
				
				{ Label: {
					/* 追加 - 原始 */
					text: ADD.str[3],
					width: 58,
				} },
				{ TextInput: {
					name: "addOriginal",
					enabled: mAdd,
					percentWidth: 100,
					text: "",
					toolTip: ADD.str[4],
				} },
			]),
			{ Spacer: { height:2 } },
			
			
	//------------------------------------------------------------------ 数字序号
			{ HBox: {
				percentWidth: 100,
				height: 22,
				style: {
					paddingLeft: 4,
					backgroundAlpha: .2,
					backgroundColor: "0xA4A4A4",
				},
				children: [
					{ CheckBox: {
						name: "cbNumber",
						selected: mNumber,
						style:{
							paddingTop:4,
							paddingRight:4
						},
						events:{
							click: function(event){
								mNumber = event.currentValues.cbNumber;
								if(event.currentValues.numMode.selectedItem==NUMBER.str[4] && mNumber){
									event.result.push(["numAt","enabled",true]);
								}else{
									event.result.push(["numAt","enabled",false]);
								}
								event.result.push(["numMode","enabled",mNumber],
												  ["numSep","enabled",mNumber],
												  ["numStart","enabled",mNumber],
												  ["numIncrease","enabled",mNumber],
												  ["numPad","enabled",mNumber]);
							}
						}
					} },
					
					{ Label: {
						/* 数字序号 */
						text: NUMBER.str[0],
						percentWidth: 100,
						style: {
							paddingLeft: -10,
							paddingTop: 2,
							fontWeight: "bold",
							color: 0x555555,
							fontSize: 11,
						},
						events: {
							click: function(event){
								mNumber = !mNumber;
								
								if(event.currentValues.numMode.selectedItem==NUMBER.str[4] && mNumber){
									event.result.push(["numAt","enabled",true]);
								}else{
									event.result.push(["numAt","enabled",false]);
								}
								
								event.result.push(["cbNumber","selected",mNumber],
												  ["numMode","enabled",mNumber],
												  ["numSep","enabled",mNumber],
												  ["numStart","enabled",mNumber],
												  ["numIncrease","enabled",mNumber],
												  ["numPad","enabled",mNumber]);
							}
						}
					} },
					
					{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
					
					{ Button: {
						/* 重置 */
						label: COMMON.str[0],
						height: 22,
						alpha: 0,
						buttonMode: true,
						events: {
							click: function(event){
								event.result.push(["numMode","selectedIndex",0],
												  ["numAt","value",1],
												  ["numAt","enabled",false],
												  ["numSep","text",""],
												  ["numStart","value",1],
												  ["numIncrease","value",1],
												  ["numPad","value",0]);
							}
						},
						style: { color:0x888888, paddingRight:-10 }
					} },
					{ Spacer: { width:6 } },
				],
			} },
			Col([
				Row([
					{ Label: {
						/* 数字序号 - 模式 */
						text: NUMBER.str[1],
						width: 48,
						style:{
							paddingTop:4
						}
					} },
					{ ComboBox: {
						name: "numMode",
						enabled: mNumber,
						width: 100,
						height:26,
						selectedIndex: 0,
						dataProvider: [NUMBER.str[2],NUMBER.str[3],NUMBER.str[4]],
						events: {
							change: function(event){
								if(event.currentValues.numMode.selectedItem==NUMBER.str[4]){
									event.result.push(["numAt","enabled",true]);
								}else{
									event.result.push(["numAt","enabled",false]);
								}
							}
						}
					} },
					
					{ Label: {
						/* 数字序号 - 插入于 */
						text: NUMBER.str[5],
						width: 32,
					} },
					{ NumericStepper: {
						name: "numAt",
						enabled: mNumber,
						width: 50,
						value: 1,
						stepSize: 1,
						minimum: 0,
						maximum: 9999,
					} },
					
					{ Label: {
						/* 数字序号 - 分隔 */
						text: NUMBER.str[6],
						width: 44,
					} },
					{ TextInput: {
						name: "numSep",
						enabled: mNumber,
						percentWidth: 100,
						text: "",
					} },
				]),
				
				Row([
					{ Label: {
						/* 数字序号 - 开始 */
						text: NUMBER.str[7],
						width: 48,
					} },
					{ NumericStepper: {
						name: "numStart",
						enabled: mNumber,
						width: 60,
						value: 1,
						stepSize: 1,
						minimum: -9999,
						maximum: 9999,
					} },
					
					{ Label: {
						/* 数字序号 - 步进 */
						text: NUMBER.str[8],
						width: 62,
					} },
					{ NumericStepper: {
						name: "numIncrease",
						enabled: mNumber,
						width: 60,
						value: 1,
						stepSize: 1,
						minimum: -9999,
						maximum: 9999,
					} },
					
					{ Label: {
						/* 数字序号 - 位数 */
						text: NUMBER.str[9],
						width: 44,
					} },
					{ NumericStepper: {
						name: "numPad",
						enabled: mNumber,
						percentWidth: 100,
						value: 1,
						stepSize: 1,
						minimum: 1,
						maximum: 9999,
					} },
				]),
			]),
			{ Spacer: { height:2 } },
			
			
	//--------------------------------------------------------------------- 操作
			/* 操作 */
			CreateCaption(COMMON.str[1]),
			
			Row([
				
				{ Button: {
					/* 数字序号 - 重命名 */
					label: COMMON.str[2],
					percentWidth: 80,
					height: 60,
					emphasized: true,
					events:{
						click: function(event){
							Renamer(event, true);
						}
					}
				} },
				{ Button: {
					/* 数字序号 - 预览 */
					label: COMMON.str[3],
					percentWidth: 20,
					height: 60,
					events:{
						click: function(event){
							if(!fw.selection){ return }
							if(fw.selection.length>0){
								Renamer(event, false);
								alert(newNameList.toString().split(",").join(" , "));
							}
						}
					}
				} },
			]),

		]
	});


	
})();