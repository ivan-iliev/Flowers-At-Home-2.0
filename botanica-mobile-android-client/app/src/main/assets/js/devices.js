//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./how_to_add_dev.js"/>
///<reference path="./msg_box.js"/>
'use strict';

/**
 * @typedef {object} DeviceDataRow
 * @property {number} timestamp
 * @property {number?} humidity
 * @property {number?} light
 * @property {number?} salt
 * @property {number?} soil
 * @property {number?} flood
 * @property {number?} battery
 * @property {number?} temperature
 * @property {boolean?} emptyWaterTank
**/
/**
 * @typedef {object} DeviceData
 * @property {number} deviceID
 * @property {number} presetID
 * @property {number} modelID
 * @property {string} picture
 * @property {boolean} active
 * @property {string} name
 * @property {string} mac
 * @property {number} appliedInterval
 * @property {number} interval
 * @property {DeviceDataRow} lastData
**/
/** @typedef {Omit<DeviceData, 'presetID' |'lastData'> &{preset: Preset|null, lastData: DeviceDataRow?, edit: ()=> void, delete: ()=> void}} Device */

/** @const @global @namespace */
const devices= (function(){//TODO(v2): data validations


var /** @type {HTMLLabelElement|HTMLDivElement} */
	tmp, 
	/** @type {Device} */
	device, 
	/** @type {File?} */
	fileContent, 
	/** @type {string?} */
	fileType, 
	/** @type {string?} */
	fileExt, 
	/** @type {Preset?} */
	currentPreset
;

const container=   /** @type {  HTMLDivElement} */(document.getElementById('devicePopup')), 
	popupWindow=   /** @type {  HTMLDivElement} */(                    container.firstElementChild), 
	header=        /** @type {  HTMLDivElement} */(                  popupWindow.firstElementChild), 
	closeBtn=      /** @type {  HTMLDivElement} */(                        header.lastElementChild), 
	body=          /** @type {  HTMLDivElement} */(                        header.nextElementSibling), //@ts-ignore
	img=           /** @type {HTMLImageElement} */(       body.firstElementChild.firstElementChild), 
	mac=           /** @type {  HTMLDivElement} */(                           img.nextElementSibling), //@ts-ignore
	activeSpan=    /** @type { HTMLSpanElement} */((tmp= mac.nextElementSibling).firstElementChild), 
	activeBox=     /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	presetLabel=   /** @type {HTMLLabelElement} */(tmp=                       tmp.nextElementSibling), 
	presetSpan=    /** @type { HTMLSpanElement} */(                  presetLabel.firstElementChild), 
	presetImg=     /** @type {HTMLImageElement} */(                    presetSpan.nextElementSibling), 
	presetContent= /** @type {  HTMLDivElement} */(                   presetLabel.lastElementChild), //@ts-ignore
	nameDiv=       /** @type {  HTMLDivElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	nameInput=     /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	intervalDiv=   /** @type {  HTMLDivElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	intervalInput= /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	fileDiv=       /** @type {  HTMLDivElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	fileInput=     /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	deleteSpan=    /** @type { HTMLSpanElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	deleteInput=   /** @type {HTMLInputElement} */(                           tmp.lastElementChild), 
	footer=    /** @type {HTMLDivElement} */(popupWindow.lastElementChild), 
	sendBtn=   /** @type {HTMLDivElement} */(    footer.firstElementChild), 
	cancelBtn= /** @type {HTMLDivElement} */(     footer.lastElementChild), 
	verificationList= [nameInput, intervalInput, ], 
	hidePopup= function(){
		if( !popup.visible )
			return;
		popup.visible= false;
		container.classList.add('gone');
		input.removeInputSink(popup);
		if( fileContent )
			fileContent= null;
		fileInput.value= '';
	}
;
nameDiv.textContent=     translate('Name') +": ";
activeSpan.textContent=  translate('Active Device') +": ";
//presetSpan.textContent=  translate('Preset') +": ";
intervalDiv.textContent= translate('Interval (in minutes)') +": ";
fileDiv.textContent=     "    "+translate('Device Picture');
deleteSpan.textContent=  translate('Delete Device Picture') +": ";
sendBtn.textContent=   translate('Submit');
sendBtn.classList.add('btn', 'btn-success', 'btn-rounded', 'editDeviceBtn');
cancelBtn.textContent= translate('Cancel');
cancelBtn.classList.add('btn', 'btn-danger', 'btn-rounded','editDeviceBtn');
///** @returns {boolean} */
//const fieldsValidityCheck= function(){//TODO
//	return true;
//};
/** @param {Preset|null|undefined} preset */
const setPreset= function(preset){
	if( preset ){
		currentPreset= preset;
		presetImg.src= currentPreset.picture;
		presetImg.classList.add('device_preset_image');
		presetContent.textContent= (currentPreset.system ? translate_server(currentPreset.name) : currentPreset.name);
		presetContent.classList.add('device_preset_label');
	}else if( preset===null ){
		currentPreset= null;
		presetImg.src= '';
		presetContent.textContent= translate('None');
	}
};

const popup= {
	container: container, 
	visible: false, 

	init: function(){
		img.src= module.defaultPic;
		container.addEventListener('click', function(event){ if( event.target===container )hidePopup() });
		closeBtn.addEventListener('click', hidePopup);
		cancelBtn.addEventListener('click', hidePopup);
		nameInput.addEventListener('input', function(){
			const value= nameInput.value;
			for(var tmp of module.list){
				if( device!==tmp && value===tmp.name )
					return nameInput.classList.add('invalid');
			}
			core.nameValidityCheck.call(nameInput);
		});
		intervalInput.addEventListener('input', core.intervalValidityCheck);
		fileInput.addEventListener('change', function(){
			const files= /** @type {FileList} */(fileInput.files);
			if( !files.length )
				return;
			const file= files[0], ext= core.fileTypeValidityCheck(file.name);
			if( !ext )
				msgBox({body:translate("invalid image type"), buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});
			deleteInput.checked= false;
			fileContent= file;
			fileType= file.type;
			fileExt= ext;
			img.src= URL.createObjectURL(file.slice());
		});
		deleteInput.addEventListener('change', function(){
			if( deleteInput.checked ){
				if( fileContent )
					fileContent= null;
				img.src= module.defaultPic;
			}else{
				img.src= module.picture;
			}
		});
		presetLabel.addEventListener('click', function(){ presets.choose(setPreset, currentPreset) });
		sendBtn.addEventListener('click', function(){
			if( core.checkValidity(verificationList) )
				return;
			//if( !fieldsValidityCheck() )
			//	msgBox({body:translate("invalid data"), buttons: [{name: translate('ok')  }]});

			const /** @type {Parameters<typeof core.callServer>[1]} */params= {
				method: 'POST', 
				get: {
					active: (activeBox.checked ? '1':'0'), 
					name: nameInput.value, 
					device_id: device.deviceID, //@ts-ignore
					interval: Math.floor(intervalInput.value *60000) || 0
				}, 
				onSuccess: function(req, rc){
					var msgText = '';
					switch( rc ){
						case 600: 	
						img.src= '';
						try{//@ts-ignore
							const prc= req.getResponseHeader('x-prc') |0;
							if( prc )
								msgBox({body:translate("picture upload failure")+ ": " +prc, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]});
						}catch(e){
						}
						hidePopup();
						homeScreen.show(true);
						return;
						case 602: msgText = translate("Failed to connect to the db"); break;
						case 604: msgText = translate("Database operation failure"); break;
						case 605: msgText = translate("Missing data"); break;
						case 610: msgText = translate("unsupported picture"); break;
						case 613: msgText = translate("Incorrect data submitted"); break;
						case 615: msgText = translate("Invalid password"); break;

						default:msgText = translate(translate("error")+ ": " +rc);
					} 

					msgBox({body:msgText, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]});
				}, 
				onError: function(req, timeout){msgBox({body:translate("error")+ ": " +req.status, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});}
			};
			if( currentPreset )
				params.get.preset_id= currentPreset.presetID;
			if( deleteInput.checked )
				params.get.delete_pic= 1;

			if( !deleteInput.checked && fileContent ){
				params.body= fileContent.slice();
				if( fileExt )
					params.get.type= fileExt;
				if( fileType )
					params.headers= {"Content-Type": fileType};
			}
			core.callServer('device_update', params);
		});
	}, 
	reset: hidePopup, 
	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			hidePopup();
		else
			return true;
	}, 
	/** @param {Device} editedDevice */
	show: function(editedDevice){
		if( popup.visible || !editedDevice )
			return;
		popup.visible= true;//@ts-ignore
		device= editedDevice;
		img.src= device.picture;
		mac.textContent= device.mac;
		mac.classList.add('mac');
		activeBox.checked= device.active;
		nameInput.value= device.name;//@ts-ignore
		intervalInput.value= device.interval /60000;
		setPreset(device.preset);
		deleteInput.checked= false;
		container.classList.remove('gone');
		core.verify(verificationList);
		input.addInputSink(popup);
	}, 
	hide: hidePopup
};

/** @this {Device} */
const edit= function(){ popup.show(this) };
/** @this {Device} */
const deleteIt= function(){
	const deviceID= this.deviceID;
	msgBox({body: translate("Do you want to delete")+ ": " +this.name +"?", buttons: [
		{name: translate('ok'), classModifier: 'btn-success', callback: function(){ core.callServer('device_delete', {
			headers: {device_id: deviceID}, 
			onSuccess: function(req, rc){ 
				var msgText = '';
				switch( rc ){
					case 600: homeScreen.show(true); return;
					case 602: msgText = translate("Failed to connect to the db"); break;
					case 604: msgText = translate("Database operation failure"); break;
					case 605: msgText = translate("Missing data"); break;
					case 613: msgText = translate("Incorrect data submitted"); break;
					default:msgText = translate(translate("get_data error")+ ": " +rc);
				} 
			msgBox({body:msgText, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]});
		},
		onError: function(req, timeout){msgBox({body:translate("device_delete error") + ": " +req.status, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]});}
	}) }}, 
		{name: translate('Cancel'), classModifier: 'btn-danger'}
	] });
};


/** @lends devices */
const module= {//TODO(v2): data validations
	defaultPic: /** @type {const} */('css/img/default_device.png'), 
	/** @type {Device[]} */
	list: [], 
	/** @type {Object<number, Device>} */
	map: {}, 

	init: popup.init, 
	reset: popup.reset, 
	/** @param {DeviceData[]} data  @returns {boolean} */
	parse: function(data){//TODO(v2): data validations
		if( !data )
			return false;
		const /** @type {Device[]} */list= [], /** @type {Object<number, Device>} */map= {};
		var tmp, /** @type {Device} */newDevice;
		for(tmp of data){
			if( !tmp.deviceID || !tmp.modelID )
				continue;
			newDevice= {
				deviceID:           tmp.deviceID, 
				preset: presets.map[tmp.presetID] || null, 
				modelID:            tmp.modelID, 
				picture:           (tmp.picture ? core.domain +tmp.picture : devices.defaultPic), 
				active:           !!tmp.active, 
				name:               tmp.name, 
				mac:                tmp.mac, 
				interval:           tmp.interval, 
				appliedInterval:    tmp.appliedInterval, 
				lastData: null, 
				edit:     edit, 
				delete:   deleteIt
			};
			tmp= tmp.active && tmp.lastData;
			if( tmp && tmp.timestamp && (tmp.humidity!=null || tmp.light!=null || tmp.salt!=null || tmp.soil!=null || tmp.flood!=null || tmp.battery!=null || tmp.temperature!=null || tmp.emptyWaterTank!=null) ){
				newDevice.lastData= {
					timestamp:      tmp.timestamp, 
					humidity:       tmp.humidity, 
					light:          tmp.light, 
					salt:           tmp.salt, 
					soil:           tmp.soil, 
					flood:          tmp.flood, 
					battery:        tmp.battery, 
					temperature:    tmp.temperature, 
					emptyWaterTank: tmp.emptyWaterTank
				};
			}
			list.push(newDevice);
			map[newDevice.deviceID]= newDevice;
		}
		module.list= list;
		module.map= map;
		return true;
	}, 
	add: function(){ howToScreen.show() }
};


core.registerModule(module);
return module;
})();
