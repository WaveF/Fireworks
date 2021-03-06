//---------------------------------------- 初始变量 ----------------------------------------//


var os = fw.platform;
var iconDisableAlpha = .1;
var batMinWindowCode = "mode con cols=15 lines=1\n";
var i, _path, _port, _ip, _ipFile, _offsetX, _offsetY, _autoRefresh, _autoExport, _manualExport, _interval, _favicon;
var _macPath, _allowDefinePath, _pathBoxAlpha, _macPathTips, _allowDefinePort, _macPortTips;


_ip = undefined;
_offsetX = 0;
_offsetY = 0;
_autoRefresh = false;
_autoExport = false;
_manualExport = false;
_interval = 4,
_favicon = 1;



if(os == "win"){
	_port = 81;
	_allowDefinePort = true;
	_macPortTips = "- Change port number when web server unavailable;\n- Restart web server after port number being changed.";

	_path = "file:///C|/fwplay";
	_ipFile="winip.txt";
	_allowDefinePath = true;
	_pathBoxAlpha = 1;
	_macPathTips = "Browse";
}else{
	_port = 8000;
	_allowDefinePort = false;
	_macPortTips = "Not allow change port on MacOS";

	_macPath = fw.userJsCommandsDir;
	_macPath = _macPath.split('/Library/');
	_macPath = _macPath[0];
	_path = _macPath + "/Documents/fwplay";

	_ipFile="macip.txt";
	_allowDefinePath = false;
	_pathBoxAlpha = .2	;
	_macPathTips = "Not allow change location on MacOS";
}

initFiles();


//---------------------------------------- 用户界面 ----------------------------------------//

fwlib.panel.register({

//Fw侦听器
	events: {
		onFwStartMovie:				function(event){ exportImagePNG() }, //开启面板
		onFwStopMovie:				function(event){ if(_autoExport){ alert("'Export on changes' will be disabled when panel was closed.") } }, //关闭面板
		
		onFwActiveDocumentChange:	function(event){ exportImagePNG() }, //改变文档
		
		onFwDocumentNameChange:		function(event){ exportImagePNG() }, //改变名称
		onFwActiveSelectionChange:	function(event){ exportImagePNG() }, //改变选区
		
		onFwCurrentFrameChange:		function(event){ exportImagePNG() }, //选择帧
		onFwObjectSettingChange:	function(event){ exportImagePNG() }, //属性变
		
		onFwHistoryChange:			function(event){ exportImagePNG() }, //创建非脚本记录
		onFwDocumentSizeChange:		function(event){ exportImagePNG() }, //文档尺寸改变
		
		//onFwApplicationDeactivate:	function(event){  }, //切换出去
		//onFwApplicationActivate:	function(event){  }, //切换回来
	},

//CSS样式表
	css: {
		"global":	{ fontFamily:"Tahoma" },
		".Caption":	{ paddingTop:2 },
		".Content":	{ paddingLeft:5, paddingRight:5 },
		Button:		{ color:"0x000000" }
	},
    children: [

//Web服务
		RowSpace(),
		Header("Web Server"),
		{ HBox: {
			percentWidth: 100,
			styleName:"Content",
			children: [
				{ Label : {
					text: "Path:",
					width: 34,
					styleName: "Caption",
				} },
				{ TextInput : {
					name: "WebPath",
					text: convertURLToOSPath(_path, false),
					editable: false,
					alpha: _pathBoxAlpha,
					percentWidth: 100,
				} },
				{ Button: {
					label: "...",
					height: 23,
					width:34,
					enabled:_allowDefinePath,
					events: {
						click: function(event){
							var changePath = fw.browseForFolderURL("Export to...", _path);
							if(changePath!=null){ _path = changePath; Files.createDirectory(_path); }
							event.result.push(["WebPath","text",convertURLToOSPath(_path, false)]);
							initFiles();
							checkMissingFiles();
						},
					},
					toolTip: _macPathTips,
				} },
			],
		} },
		{ HBox: {
			percentWidth: 100,
			styleName:"Content",
			children: [
				{ Label : {
					text: "Port:",
					width: 34,
					styleName: "Caption",
				} },
				{ NumericStepper : {
					name: "PortNum",
					value: _port,
					stepSize: 1,
					maximum: 65535,
					minimum: 0,
					maxChars: 5,
					width: 80,
					enabled: _allowDefinePort,
					events: {
						change: function(event){
							_port = event.currentValues.PortNum;
							if(_ip!=null){
								event.result.push(['ipAddress','htmlText','<font color="#FFFFFF">http://'+_ip+':'+_port+'</font>']);
							}
						}
					},
					toolTip: _macPortTips
				} },
				{ VRule: { width:20, height:24 } },
				{ Button: {
					label: "IP",
					height: 23,
					width: 40,
					events: {
						click: function(event){
							getIP();
							event.result.push(
								['ipAddress','htmlText','<font color="#FFFFFF">http://'+_ip+':'+_port+'</font>'],
								["ipAddress","selectable",true],
								["ipBox","alpha",1]
							);
						}
					},
					toolTip: "Refresh IP again when you've changed any network settings."
				} },
				{ HBox: {
					name: "ipBox",
					percentWidth: 100,
					height: 24,
					alpha: 0,
					style: { paddingLeft:4, paddingRight:4, backgroundColor: "0x4DCD70" },
					children: [
						{ Text : {
							name: "ipAddress",
							htmlText: '<font color="#ff4000">« Click to refresh...</font>',
							selectable: false,
							percentWidth: 100,
							style: { paddingTop:3, /*fontWeight:"bold"*/ }
						} }
					]
				} },
			],
		} },

//位置偏移
		RowSpace(),
		Header("Position"),
		{ HBox: {
			percentWidth:100,
			styleName:"Content",
			children: [
				{ Label : {
					text: "Left:",
					width: 34,
					styleName: "Caption",
				} },
				{ NumericStepper : {
					name: "OffsetX",
					value: _offsetX,
					stepSize: 1,
					maximum: 6000,
					minimum: -6000,
					maxChars: 4,
					width: 80,
					events: {
						change: function(event){
							_offsetX = event.currentValues.OffsetX;
							createOffsetJS();
						},
					},
				} },
				{ VRule: { width:20, height:24 } },
				{ Label : {
					text: "Top:",
					width: 34,
					styleName: "Caption",
				} },
				{ NumericStepper : {
					name: "OffsetY",
					value: _offsetY,
					stepSize: 1,
					maximum: 6000,
					minimum: -6000,
					maxChars: 4,
					width: 80,
					events: {
						change: function(event){
							_offsetY = event.currentValues.OffsetY;
							createOffsetJS();
						},
					},
				} },
				{ VRule: { width:20, height:24 } },
				{ Label : {
					text: "Uint: pixel",
					style: { paddingTop:3, color:"0x999999" }
				} },
			],
		} },

//自动更新
		RowSpace(),
		Header("Auto Update"),
		{ HBox: {
			percentWidth:100,
			styleName:"Content",
			children: [
				{ CheckBox: {
					name: "AutoExport",
					label: "Export on changes",
					width: 122,
					selected: _autoExport,
					events: {
						click: function(event){
							_autoExport = event.currentValues.AutoExport;
						},
					},
					style: { paddingTop:0 },
					toolTip: "Enable this option will export image in realtime,\nbut it will also slow down Fireworks."
				} },
				{ VRule: { width:20, height:24 } },
				{ CheckBox: {
					name: "AutoRefresh",
					label: "Refresh",
					selected: _autoRefresh,
					events: {
						click: function(event){
							_autoRefresh = !_autoRefresh;
							event.result.push(
								["AutoRefresh","selected",_autoRefresh],
								["Interval", "enabled", _autoRefresh]
							);
							createRefreshJS();
						},
					},
					style: { paddingTop:0 },
					toolTip: "Refresh your web browser manually once \nwhen you've enabled this option."
				} },
				{ NumericStepper : {
					name: "Interval",
					value: _interval,
					stepSize: 1,
					maximum: 9999,
					minimum: 1,
					maxChars: 4,
					width: 73,
					enabled: false,
					events: {
						change: function(event){
							_interval = event.currentValues.Interval;
							if(_interval>1){ event.result.push("timeUnit","text","per seconds") }else{ event.result.push("timeUnit","text","per second") }
							createRefreshJS();
						},
					},
				} },
				{ Label : {
					name: "timeUnit",
					text: "per seconds",
					style: { paddingTop:2, paddingLeft:-4 },
				} },
			],
		} },

//自定义图标
		RowSpace(),
		Header("Favicon"),
		{ HBox: {
			percentWidth:100,
			styleName:"Content",
			children: [
				{ Image: {
					name: "icon1",
					source: "assets/icon1.png",
					width: 24,
					height: 24,
					alpha: 1,
				} },
				{ Image: {
					name: "icon2",
					source: "assets/icon2.png",
					width: 24,
					height: 24,
					alpha: iconDisableAlpha,
				} },
				{ Image: {
					name: "icon3",
					source: "assets/icon3.png",
					width: 24,
					height: 24,
					alpha: iconDisableAlpha,
				} },
				{ Image: {
					name: "icon4",
					source: "assets/icon4.png",
					width: 24,
					height: 24,
					alpha: iconDisableAlpha,
				} },
				{ Image: {
					name: "icon5",
					source: "assets/icon5.png",
					width: 24,
					height: 24,
					alpha: iconDisableAlpha,
				} },
				{ NumericStepper : {
					name: "swIcon",
					value: _favicon,
					stepSize: 1,
					maximum: 5,
					minimum: 1,
					maxChars: 1,
					width: 60,
					events: {
						change: function(event){
							_favicon = event.currentValues.swIcon;
							switchIcon(event);
							createFaviconPNG();
						},
					},
					toolTip: "Choose your icon while adding FwPlay webpage \nto iPhone/iPad Home Screen."
				} },
			],
		} },

//控制按钮
		RowSpace(),
		{ HRule: { percentWidth:100 } },
		{ HBox: {
			percentWidth:100,
			children: [
				{ Button: {
					label: "Host & Launch",
					height: 40,
					percentWidth:50,
					events: {
						click: function(event){
							_manualExport = true;
							checkMissingFiles();
							exportImagePNG();
							createWebServer();
						},
					},
				} },
				{ Button: {
					label: "Update",
					height: 40,
					percentWidth:25,
					events: {
						click: function(event){
							_manualExport = true;
							exportImagePNG();
						},
					},
					toolTip: "Export image manually",
				} },
				{ Button: {
					label: "End",
					height: 40,
					percentWidth:25,
					events: {
						click: function(event){
							_ip = undefined;
							event.result.push(
								['ipAddress','htmlText','<font color="#ff4000">« Click to refresh...</font>'],
								["ipAddress","selectable",false],
								["ipBox","alpha",0]
							);
							killWebServer();
						},
					},
				} },
			],
			style: { paddingLeft:5, paddingRight:5, paddingTop:10 },
		} },
    ],
});







//---------------------------------------- 调用函数 ----------------------------------------//

/* 行间距 */
function RowSpace(){
	return { Spacer: { height:1 } };
}

/* 创建标题栏 */
function Header(inLabel){
	return { HBox: {
		percentWidth: 100,
		style: {
			paddingLeft: 4,
			backgroundAlpha: .2,
			backgroundColor: "0xbbbbbb",
		},
		children: [
			{ Label: {
				text: inLabel,
				style: { fontWeight: "bold", color: "0x444444" },
			} }
		],
	} };
}

/* 准备目录与素材 */
function initFiles(){
	Files.createDirectory(_path);
	
	createIndexHTML();
	createRefreshJS();
	createOffsetJS();
	createFaviconPNG();
}

/* 生成index.html */
function createIndexHTML(){
	var htmlFilePath = _path + "/index.html";
	Files.deleteFileIfExisting(htmlFilePath);
	Files.createFile(htmlFilePath, "TEXT", "????");
	var htmlFile = Files.open(htmlFilePath, true);
	var htmlFileText = "<!doctype html><html><head><meta id='viewport' name='viewport' content='width=device-width;maximum-scale=1.0;user-scalable=no;'/><meta name='apple-mobile-web-app-status-bar-style' content=black/><meta name='apple-mobile-web-app-capable' content='yes'/><title>FwPlay</title><link href='favicon.png' sizes='114x114' rel='apple-touch-icon-precomposed'><style>html, body{margin:0;background-color:#fff;width:100%; height:100%}img{border:none}</style><script src='refresh.js'></script><script src='offset.js'></script><script>function refreshPage(){history.go(0);}</script></head><body onload='offset()' onClick='refreshPage()'><img src='./image.png'/></body></html>";
	htmlFile.write(htmlFileText);
	htmlFile.close();
}

/* 生成refresh.js */
function createRefreshJS(){
	var jsFilePath = _path + "/refresh.js";
	Files.deleteFileIfExisting(jsFilePath);
	Files.createFile(jsFilePath, "TEXT", "????");
	var jsFile = Files.open(jsFilePath, true);
	var jsFileText;
	//if(_autoRefresh){ jsFileText="setInterval('history.go(0)'," + _interval*1000 + ");" }else{ jsFileText="" }
	if(_autoRefresh){ jsFileText="setInterval('window.location.reload(true)'," + _interval*1000 + ");" }else{ jsFileText="" }
	jsFile.write(jsFileText);
	jsFile.close();
}

/* 生成offset.js */
function createOffsetJS(){
	var jsFilePath = _path + "/offset.js";
	Files.deleteFileIfExisting(jsFilePath);
	Files.createFile(jsFilePath, "TEXT", "????");
	var jsFile = Files.open(jsFilePath, true);
	var jsFileText = "function offset(){setTimeout(function(){window.scrollTo(" + _offsetX + ", " + _offsetY + ");}, 1);}";
	jsFile.write(jsFileText);
	jsFile.close();
}

/* 生成favicon.png */
function createFaviconPNG(){
	Files.deleteFileIfExisting(_path+"/favicon.png");
	Files.copy(fw.currentScriptDir+"/assets/icon" + _favicon + ".png", _path+"/favicon.png");
}

/* 导出image.png */
function exportImagePNG(){
	if(!_autoExport && !_manualExport) return;
	if(fw.documents.length==0) return;
	if(fw.selection==null){ return }
	
	var exportOption = {
		animAutoCrop: true,
		animAutoDifference: true,
		applyScale: false,
		colorMode: "32 bit",
		crop: false,
		cropBottom: 0,
		cropLeft: 0,
		cropRight: 0,
		cropTop: 0,
		ditherMode: "none",
		ditherPercent: 100,
		exportFormat: "PNG",
		frameInfo: [],
		interlacedGIF: false,
		jpegQuality: 80,
		jpegSelPreserveButtons: false,
		jpegSelPreserveText: true,
		jpegSelQuality: 90,
		jpegSelQualityEnabled: false,
		jpegSmoothness: 0,
		jpegSubsampling: 0,
		localAdaptive: true,
		lossyGifAmount: 0,
		macCreator: "????",
		macFileType: "????",
		name: "PNG32",
		numCustomEntries: 0,
		numEntriesRequested: 0,
		numGridEntries: 6,
		optimized: true,
		paletteEntries: undefined,
		paletteInfo: undefined,
		paletteMode: "adaptive",
		paletteTransparency: "none",
		percentScale: 100,
		progressiveJPEG: false,
		savedAnimationRepeat: 0,
		sorting: "none",
		useScale: true,
		webSnapAdaptive: false,
		webSnapTolerance: 14,
		xSize: 0,
		ySize: 0,
	};

	var exportPath = _path + "/image.png";
	var deleteImage = Files.deleteFileIfExisting(exportPath);
	if(!deleteImage){ alert("Fail to update 'image.png' in the following directory:\n\n"+convertURLToOSPath(_path, true) + "\n\nplease make sure the file was NOT:\n- selected in Finder (Mac)\n- locked by other programs (Mac/Win)") }
	
	fw.getDocumentDOM().exportTo(exportPath, exportOption);
	
	_manualExport = false;
}

/* 检查遗漏文件 */
function checkMissingFiles(){
	if(!Files.exists(_path)){ Files.createDirectory(_path) }
	if(!Files.exists(_path+'/index.html')){ createIndexHTML() }
	if(!Files.exists(_path+'/refresh.js')){ createRefreshJS() }
	if(!Files.exists(_path+'/offset.js')){ createOffsetJS() }
	if(!Files.exists(_path+'/favicon.png')){ createFaviconPNG() }
}


/* 切换图标 */
function switchIcon(inEvent){
	inEvent.result.push(
		["icon1", "alpha", iconDisableAlpha],
		["icon2", "alpha", iconDisableAlpha],
		["icon3", "alpha", iconDisableAlpha],
		["icon4", "alpha", iconDisableAlpha],
		["icon5", "alpha", iconDisableAlpha],
		["icon"+_favicon, "alpha", 1]
	);
}

/* 创建服务器 */
function createWebServer(){
	var date = new Date();
	m = date.getMinutes();
	s = date.getSeconds();
	var seed = m.toString()+s;
	
	if(os == "win"){
		var batchFilePath = fw.currentScriptDir + "/assets/tinyweb.bat";
		Files.deleteFileIfExisting(batchFilePath);
		Files.createFile(batchFilePath, "TEXT", "????");
		var batchFile = Files.open(batchFilePath, true);
		var batchFileText = batMinWindowCode+'start "" /b /min "' + convertURLToOSPath(fw.currentScriptDir + "/assets/tiny.exe") + '" ' + convertURLToOSPath(_path,true) + ' ' + _port;
		
		batchFileText.replace(/\t/g,"");
		batchFile.write(batchFileText);
		batchFile.close();
		fw.launchApp(batchFilePath, []);
	}else{
		fw.launchApp(fw.currentScriptDir+"/assets/webserver.app", []);
	}

	delay(200);
	fw.launchBrowserTo("http://localhost:" + _port + "/index.html?" + seed);
}

/* 关闭服务器 */
function killWebServer(){
	if(os == "win"){
		var batchFilePath = fw.currentScriptDir + "/assets/tinyweb.bat";
		Files.deleteFileIfExisting(batchFilePath);
		Files.createFile(batchFilePath, "TEXT", "????");
		var batchFile = Files.open(batchFilePath, true);
		var batchFileText = batMinWindowCode+"taskkill /F /IM tiny.exe";
		batchFile.write(batchFileText);
		batchFile.close();
		fw.launchApp(batchFilePath, []);
	}else{
		fw.launchApp(fw.currentScriptDir+"/assets/endserver.app", []);
	}
}

/* URI转为系统路径 */
function convertURLToOSPath(inURL, quote){
	if(!inURL){return}
	if (os == "win") {
	  /*  // replace file:///C| with C: and turn / into \  */
	  var path = inURL.replace(/file:\/\/\/(.)\|/, "$1:");
	  path = path.replace(/\//g, "\\");
	} else {
	  /*  // replace file:/// with /Volumes/  */
	  var path = "/Volumes" + inURL.replace(/file:\/\//, "");
	}
	// we also have to convert the URL-encoded chars back into normal chars
	// so that the OS can handle the path, and quote the path in case it
	// contains spaces
	if(quote){
		return '"' + unescape(path) + '"';
	}else{
		return unescape(path);
	}
}

/* 获取OS的IP */
function getIP(){
	checkMissingFiles();
	
	if(os == "win"){
		var vbsFilePath = fw.currentScriptDir + "/assets/ip.vbs";
		Files.deleteFileIfExisting(vbsFilePath);
		Files.createFile(vbsFilePath, "TEXT", "????");
		var vbsFile = Files.open(vbsFilePath, true);
		var vbsText = 'Dim ip\nGetIP\nSet fso = CreateObject("Scripting.FileSystemObject")\nIf Not fso.FolderExists("'+ convertURLToOSPath(_path, false) +'") Then\nfso.CreateFolder("'+ convertURLToOSPath(_path, false) +'")\nEnd If\nSet file = fso.CreateTextFile("'+ convertURLToOSPath(_path, false) +'\\'+ _ipFile +'", true)\nfile.Write ip\nfile.Close\nPublic Function GetIP\nComputerName="."\nDim objWMIService,colItems,objItem,objAddress\nSet objWMIService = GetObject("winmgmts:\\\\" & ComputerName & "\\root\\cimv2")\nSet colItems = objWMIService.ExecQuery("Select * From Win32_NetworkAdapterConfiguration Where IPEnabled = True")\nFor Each objItem in colItems\nFor Each objAddress in objItem.IPAddress\nIf objAddress <> "" then\nip = objAddress\nExit Function\nEnd If\nNext\nNext\nEnd Function';
		vbsFile.write(vbsText);
		vbsFile.close();

		var batFilePath = fw.currentScriptDir + "/assets/ip.bat";
		Files.deleteFileIfExisting(batFilePath);
		Files.createFile(batFilePath, "TEXT", "????");
		var batFile = Files.open(batFilePath, true);
		var batText = batMinWindowCode+'start "" /b /min ' + convertURLToOSPath(fw.currentScriptDir+"/assets/ip.vbs",true);
		batFile.write(batText);
		batFile.close();
		fw.launchApp(batFilePath, []);
	}else{
		fw.launchApp(fw.currentScriptDir+"/assets/getip.app", []);
	}
	
	delay(100);
	
	var ipFilePath, ipFile, line;
	ipFilePath = _path + "/" + _ipFile;
	if(Files.exists(ipFilePath)){
		ipFile = Files.open(ipFilePath, false);
		for(i=0;i<9;i++){
			if(_ip==undefined){
				_ip = ipFile.readline();
				i = 0;
			}else{
				break;
			}
		}
		ipFile.close();
	}
}

/* 伪延时 */
function delay(n){
	//setTimeout not available in JSML...
	if(!n){ n = 1 }
	i = 0;
	while(i < n){ i = i + .00005 }
}