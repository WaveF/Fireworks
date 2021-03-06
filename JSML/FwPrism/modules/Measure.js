INFO = { name:'Measure', version:'1.0', type:'panel' };


(function() {

	//================================================================ 初始化设定
	var i = 0;
	var sp = "\r";
	var sav = [];
	var bound={}; bound.x=0; bound.y=0; bound.w=0; bound.h=0;
	var offset = 0;
	
	var dom = (fw.documents.length>0)?fw.getDocumentDOM():null;
	var sel = fw.selection?fw.selection:[];
	
	var TEXT = {
		color:	"#FFFFFF",
		font:	"LucidaConsole",
		size:	"12pt",
		bold:	true,
		smooth:	true,
		offset: [10, 10]
	};
	
	var BOX = {
		color:	"#000000",
		alpha:	80,
		roundness: 6,
		offset: [4, 4]
	};
	
	
	
	//================================================================== 功能函数
	
	
	function Marker(inEvent){
		sel = fw.selection?fw.selection:[];
		if(sel.length==0) return;
		
		for(i in sel){
			bound = getBound(sel[i]);
			
			AddText(["x:"+FormatValue(bound.x), "y:"+FormatValue(bound.y), "width:"+FormatValue(bound.w), "height:"+FormatValue(bound.h)].join(sp), getBound(sel[i]));
			setGroup(fw.selection[0], "new");
			
			AddBox(getBound(sav[0]));
			fw.getDocumentDOM().arrange("backward");
			setGroup(fw.selection[0], "add");
			setGroup();
			
			AddGuideLine(getBound(sel[i]));
		}
		
		fw.selection = sel;
	}
	

	function getBound(obj){
		var b = {};
		b.x = obj.left;
		b.y = obj.top;
		b.w = obj.width;
		b.h = obj.height;
		b.r = obj.left + obj.width;
		b.b = obj.top + obj.height;
		
		return b;
	}

	
	function AddText(str, bnd){
		fw.getDocumentDOM().selectNone();
		
		fw.getDocumentDOM().addNewText({left:bnd.x+TEXT.offset[0], top:bnd.y+TEXT.offset[1], right:bnd.r+TEXT.offset[0], bottom:bnd.b+TEXT.offset[1]}, true);
		fw.selection[0].textChars = str;
		fw.selection[0].autoExpand = true;
		
		fw.getDocumentDOM().setFillColor(TEXT.color);
		fw.getDocumentDOM().applyFontMarkup("size", TEXT.size);
		fw.getDocumentDOM().applyFontMarkup("face", TEXT.font);
		fw.getDocumentDOM().enableTextAntiAliasing(TEXT.smooth);
		fw.getDocumentDOM().setTextAlignment("left");
		if(TEXT.bold){ fw.getDocumentDOM().applyCharacterMarkup("b") }else{ fw.getDocumentDOM().removeCharacterMarkup("b") }
		
		fw.getDocumentDOM().setBrushNColor(null, "#ffffff00");
		fw.getDocumentDOM().changeCurrentPage(fw.getDocumentDOM().currentPageNum);
		//fw.getDocumentDOM().applyEffects({ category:"UNUSED", effects:[ { BottomRight:"76 18", EffectIsVisible:true, EffectMoaID:"{8eeadf50-9efe-11da-a7460800200c9a66}", TopLeft:"-13 -6", category:"SpecialFill", dropShadow:"1&40.000000&0&90.000000&0.000000&2.000000&2.000000&0.000000&0&1&multiply&RGBColor;0.000000;0.000000;0.000000&2\u0024\u00240.000000;0.000000;1\u0024255.000000;255.000000;1", name:"Photoshop Live Effects", stroke:"1&60.000000&1.000000&normal&RGBColor;255.000000;255.000000;255.000000&outsetFrame&solidColor&" } ], name:"UNUSED" });
	}
	

	function AddBox(bnd){
		fw.getDocumentDOM().selectNone();
		
		fw.getDocumentDOM().addNewRectanglePrimitive({left:bnd.x-BOX.offset[0], top:bnd.y-BOX.offset[1], right:bnd.r+2*BOX.offset[0], bottom:bnd.b+2*BOX.offset[1]}, 0);		
		//fw.getDocumentDOM().setRectRoundness(BOX.roundness, "percentage");
		fw.getDocumentDOM().setRectRoundness(BOX.roundness, "exact");
		fw.getDocumentDOM().setFillColor(BOX.color);
		fw.getDocumentDOM().setOpacity(BOX.alpha);
		
		fw.getDocumentDOM().setBrushNColor(null, "#ffffff00");
		
	}
	

	function AddGuideLine(bnd, direction){
		var lineGup;
		fw.getDocumentDOM().selectNone();
		
		
		fw.getDocumentDOM().setBrushNColor({ alphaRemap:"none", angle:0, antiAliased:false, aspect:100, blackness:0, category:"bc_Basic", concentration:100, dashOffSize1:2, dashOffSize2:2, dashOffSize3:2, dashOnSize1:10, dashOnSize2:1, dashOnSize3:1, diameter:1, feedback:"none", flowRate:0, maxCount:14, minSize:1, name:"bn_Hard Line", numDashes:0, shape:"square", softenMode:"bell curve", softness:0, spacing:6, textureBlend:0, textureEdge:0, tipColoringMode:"random", tipCount:1, tipSpacing:0, tipSpacingMode:"random", type:"simple" }, "#ff0000");
		fw.getDocumentDOM().setBrushPlacement("center");
		

		//Horizontal Top
		lineGup = [];

		fw.getDocumentDOM().addNewLine({x:bnd.x, y:bnd.y-10}, {x:bnd.r, y:bnd.y-10});
		lineGup.push(fw.selection[0]);
		
		fw.getDocumentDOM().addNewLine({x:bnd.x, y:bnd.y-15}, {x:bnd.x, y:bnd.y-5});
		lineGup.push(fw.selection[0]);
		
		fw.getDocumentDOM().addNewLine({x:bnd.r, y:bnd.y-15}, {x:bnd.r, y:bnd.y-5});
		lineGup.push(fw.selection[0]);
		
		fw.selection = lineGup;
		fw.getDocumentDOM().group("normal");


		//Vertical Right
		lineGup = [];

		fw.getDocumentDOM().addNewLine({ x:bnd.r+5, y:bnd.y }, { x:bnd.r+15, y:bnd.y });
		lineGup.push(fw.selection[0]);
		
		fw.getDocumentDOM().addNewLine({ x:bnd.r+10, y:bnd.y }, { x:bnd.r+10, y:bnd.b });
		lineGup.push(fw.selection[0]);
		
		fw.getDocumentDOM().addNewLine({ x:bnd.r+5, y:bnd.b }, { x:bnd.r+15, y:bnd.b });
		lineGup.push(fw.selection[0]);
		
		fw.selection = lineGup;
		fw.getDocumentDOM().group("normal");
	}
	

	function setGroup(obj, option){
		/* option 
			"new":		clean old selections
			"add":		add new selection
			"group":	group saved selections
		*/
		if(!obj){ option=="group" }
		
		switch(option){
			case "new":
				sav=[];
			case "add":
				sav.push(obj);
				break;
			case "group":
			default:
				fw.selection = sav;
				fw.getDocumentDOM().group("normal");
		}
	}
	

	function FormatValue(num){
		var sym = 1;
		if(num<0){ sym = -1 }
		
		var num = num.toFixed(1);
		num = sym*Math.abs(num);
		
		return num;
	}
	

	function FormatColor(val){
		val = val.toString();
		val = val.split("#").join("0x");
		//val = parseInt(val);
		return val;
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
			
			CreateHeader(INFO.name, 0x45D3C1),
			
			Col([
				
				CreateCaption("Text Setting"),
				
				Row([
					{ ColorPicker: {
						name: "comFontColor",
						selectedColor: TEXT.color,
						events: {
							change: function(event){
								TEXT.color = event.currentValues.comFontColor;
							}
						}
					} },
				]),
				
				RowSpace(),
				
				CreateCaption("Object Annotation"),
				
				Row([
					{ Button: {
						label: "Mark",
						width: 80,
						height: 60,
						events:{
							click: function(event){
								Marker(event);
							}
						}
					} },
					
					{ Button: {
						label: "TEST",
						width: 80,
						height: 60,
						events:{
							click: function(event){
								
							}
						}
					} },
				]),
			]),
		]
	});

})();