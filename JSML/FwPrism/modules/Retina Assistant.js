INFO = { name:'Retina Assistant', version:'1.0', type:'panel' };


(function() {

	//================================================================ 初始化设定
	var i=0;
	
	var info = {};
	info.numObjects = 0;
	info.numSlices = 0;
	
	var s = {};
	s.addSuffix = true;
	s.scaleSize = 1;
	
	//================================================================== 功能函数
	
	function CheckInfo(){
		
	}
	
	function SetScale(inEvent){
		inEvent.result.push(["btnS1","emphasized", false],["btnS1","styleName","btnNormal"],
							["btnS2","emphasized", false],["btnS2","styleName","btnNormal"],
							["btnS3","emphasized", false],["btnS3","styleName","btnNormal"],
							["btnS4","emphasized", false],["btnS4","styleName","btnNormal"],
							["btnS5","emphasized", false],["btnS5","styleName","btnNormal"]);
		
		switch(s.scaleSize){
			case 1.0:
				inEvent.result.push(["btnS1","emphasized", true],
									["btnS1","styleName","btnActive"]);
				break;
			case 1.5:
				inEvent.result.push(["btnS2","emphasized", true],
									["btnS2","styleName","btnActive"]);
				break;
			case 2.0:
				inEvent.result.push(["btnS3","emphasized", true],
									["btnS3","styleName","btnActive"]);
				break;
			case 3.0:
				inEvent.result.push(["btnS4","emphasized", true],
									["btnS4","styleName","btnActive"]);
				break;
			default:
				inEvent.result.push(["btnS5","emphasized", true],
									["btnS5","styleName","btnActive"]);
				break;
		}
		
		inEvent.result.push(["infoScale","text", s.scaleSize+"x"]);
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
				backgroundAlpha: .2,
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
						color: 0x555555,
						fontSize: 11,
					},
				} }
			],
		} };
	}

	function RowSpace(){
		return { Spacer: { height:2 } };
	}

	function Col(inChildren,pw){
		if(!pw){ pw=100 };
		return { VBox: {
			percentWidth: pw,
			styleName: "Col",
			children: inChildren
		} };
	}

	function Row(inChildren,pw){
		if(!pw){ pw=100 };
		return { HBox: {
			percentWidth: pw,
			styleName: "Row",
			children: inChildren
		} };
	}
	
	//========================================================================== 用户界面
	
	fwlib.panel.register({
		css: {
			".Col": { paddingLeft:0 },
			".Row": { paddingLeft:4, paddingButtom:0 },
			".btnNormal": { color:0x666666, fontWeight: "normal" },
			".btnActive": { color:0x0085D5, fontWeight: "normal" },
			
			".infoTitle": { color:0x636363, paddingTop:8 },
			".infoValue": { color:0x0085D5, paddingTop:8, fontWeight:"bold", fontSize:11 },
		},
		children:[
			
			CreateHeader(INFO.name, 0x0090EA),
			
			Col([
				//--------------------------------------------------------- 缩放
				{ HBox: {
					percentWidth: 100,
					height: 22,
					style: { paddingLeft: 4, backgroundAlpha: .2, backgroundColor: "0xA4A4A4" },
					children: [
						{ Label: {
							text: "快捷输出",
							percentWidth: 100,
							style: { paddingLeft:4, paddingTop: 2, fontWeight: "bold", color: 0x555555, fontSize: 11 }
						} },
						
						{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
						
						{ CheckBox: {
							name: "cbSuffix",
							selected: s.addSuffix,
							style:{ paddingTop:4, paddingLeft:6 },
							events:{
								click: function(event){
									s.addSuffix = event.currentValues.cbSuffix;
								}
							}
						} },
						
						{ Button: {
							label: "添加@后缀",
							buttonMode: true,
							alpha: 0,
							events: {
								click: function(event){
									s.addSuffix = !s.addSuffix;
									event.result.push(["cbSuffix", "selected", s.addSuffix]);
								}
							},
							style: { color:0x888888, paddingLeft:-6 }
						} },
						
					],
				} },
				
				Row([
					Col([
						Row([
							{ Button: {
								label: "原始倍数",
								name: "btnS1",
								emphasized: true,
								percentWidth: 25, height: 30, styleName: "btnActive", events: {click: function(event){ s.scaleSize=1.0; SetScale(event) }}
							} },
							{ Button: {
								label: "1.5倍",
								name: "btnS2",
								percentWidth: 25, height: 30, styleName: "btnNormal", events: {click: function(event){ s.scaleSize=1.5; SetScale(event) }}
							} },
							{ Button: {
								label: "2倍",
								name: "btnS3",
								percentWidth: 25, height: 30, styleName: "btnNormal", events: {click: function(event){ s.scaleSize=2.0; SetScale(event) }}
							} },
							{ Button: {
								label: "3倍",
								name: "btnS4",
								percentWidth: 25, height: 30, styleName: "btnNormal", events: {click: function(event){ s.scaleSize=3.0; SetScale(event) }}
							} },
							{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:7, paddingRight:14, fontSize:8 } } },
						]),
						
					],40),
					
					Col([
						Row([
							{ Button: {
								label: "自定义",
								name: "btnS5",
								percentWidth: 50, height: 30, styleName: "btnNormal",
								events: {click: function(event){ s.scaleSize=event.currentValues.numScale; SetScale(event) }}
							} },
							{ NumericStepper: {
								name: "numScale",
								percentWidth: 50,
								height: 30,
								value: 1,
								stepSize: .1,
								maximum: 20,
								minimum: .1,
								style: { fontSize:12 }
							} },
						]),
						
					],60),
					
				]),
				RowSpace(),
				
				//------------------------------------------------------------- 统计信息
				{ HBox: {
					percentWidth: 100,
					height: 22,
					style: { paddingLeft: 4, backgroundAlpha: .2, backgroundColor: "0xA4A4A4" },
					children: [
						{ Label: {
							text: "快捷输出",
							percentWidth: 100,
							style: { paddingLeft:4, paddingTop: 2, fontWeight: "bold", color: 0x555555, fontSize: 11 }
						} },
						
						{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:2, paddingRight:10, fontWeight:"normal" } } },
						
						{ Button: {
							label: "刷新",
							buttonMode: true,
							alpha: 0,
							events: {
								click: function(event){
									
								}
							},
							style: { color:0x888888, paddingLeft:1 }
						} },
						
					],
				} },
				
				
				Row([
				
					Col([
						Row([
							{ Label: { text:"当前缩放率：", styleName:"infoTitle" } },
							{ Label: { text:"3x", name:"infoScale", width:30, styleName:"infoValue" } },
							{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:10, paddingLeft:2, fontSize:8 } } },
						]),
					], 34),
					
					Col([
						Row([
							{ Label: { text:"已选择对象：", styleName:"infoTitle" } },
							{ Label: { text:"16", name:"infoObjects", styleName:"infoValue" } },
							{ Label: { text:"|", width: 1, style: { color:0x888888, paddingTop:10, paddingLeft:6, paddingRight:4, fontSize:8 } } },
						]),
					], 33),
					
					Col([
						Row([
							{ Label: { text:"页面切片数：", styleName:"infoTitle" } },
							{ Label: { text:"28", name:"infoSlices", styleName:"infoValue" } },
						]),
					], 33),
					
				]),
				RowSpace(),
				
				//------------------------------------------------------------- 操作
				CreateCaption("操作"),
				Row([
					{ Button: {
						label: "添加切片",
						percentWidth: 20, height: 40, style: { color:0x666666, fontWeight:"normal" }
					} },
					{ Button: {
						label: "后缀命名",
						percentWidth: 20, height: 40, style: { color:0x666666, fontWeight:"normal" }
					} },
					{ Button: {
						label: "输出",
						percentWidth: 30, height: 40, style: { color:0x666666, fontWeight:"normal" }
					} },
					{ Button: {
						label: "输出",
						percentWidth: 30, height: 40, style: { color:0x666666, fontWeight:"normal" }
					} },
				]),
			]),
		]
	});

})();