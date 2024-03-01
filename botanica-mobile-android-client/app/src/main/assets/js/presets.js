//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./msg_box.js"/>
'use strict';

/**
 * @typedef {object} PresetData
 * @property {boolean} system
 * @property {number} presetID
 * @property {number} createdOn
 * @property {string} picture
 * @property {boolean} active
 * @property {string} name
 * @property {number?} temperatureMin
 * @property {number?} temperatureMax
 * @property {number?} humidityMin
 * @property {number?} humidityMax
 * @property {number?} lightMin
 * @property {number?} lightMax
 * @property {number?} saltMin
 * @property {number?} saltMax
 * @property {number?} soilMin
 * @property {number?} soilMax
**/
/** @typedef {PresetData &{edit: ()=> void, delete: ()=> void}} Preset */

/** @const @global @namespace */
const presets= (function(){//TODO(v2): data validations


var /** @type {HTMLLabelElement|HTMLDivElement} */
	tmp, 
	/** @type {Preset?} */
	preset, 
	/** @type {File?} */
	fileContent, 
	/** @type {string?} */
	fileType, 
	/** @type {string?} */
	fileExt, 
	/** @type {(preset: Preset|null|undefined)=> void} */
	choiceCallback, 
	/** @type {Object<number, HTMLDivElement>} */
	map= {}, 
	/** @type {HTMLDivElement?} */
	selected
;

const container= /** @type {  HTMLDivElement} */(document.getElementById('presetPopup')), 
	popupWindow= /** @type {  HTMLDivElement} */(                    container.firstElementChild), 
	header=      /** @type {  HTMLDivElement} */(                  popupWindow.firstElementChild), 
	headerDiv=   /** @type {  HTMLDivElement} */(                       header.firstElementChild), 
	body=        /** @type {  HTMLDivElement} */(                        header.nextElementSibling), //@ts-ignore
	img=         /** @type {HTMLImageElement} */(       body.firstElementChild.firstElementChild), //@ts-ignore
	nameDiv=     /** @type {  HTMLDivElement} */((tmp= img.nextElementSibling).firstElementChild), 
	nameInput=   /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	activeSpan=  /** @type { HTMLSpanElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	activeBox=   /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	minLabel=   /** @type {  HTMLDivElement} */((tmp= tmp.nextElementSibling).firstElementChild), //@ts-ignore
	minFields=   /** @type {  HTMLDivElement} */(   				minLabel.nextElementSibling), 
	maxLabel=   /** @type {  HTMLDivElement} */(                     minFields.nextElementSibling), //@ts-ignore
	maxFields=   /** @type {  HTMLDivElement} */(                     maxLabel.nextElementSibling), //@ts-ignore
	fileDiv=     /** @type {  HTMLDivElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	fileInput=   /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	deleteSpan=  /** @type { HTMLSpanElement} */((tmp= tmp.nextElementSibling).firstElementChild), 
	deleteInput= /** @type {HTMLInputElement} */(                           tmp.lastElementChild), //@ts-ignore
	temperatureMinDiv=   /** @type {  HTMLDivElement} */((tmp= minFields.firstElementChild).firstElementChild), 
	temperatureMinInput= /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	humidityMinDiv=      /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	humidityMinInput=    /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	lightMinDiv=         /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	lightMinInput=       /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	saltMinDiv=          /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	saltMinInput=        /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	soilMinDiv=          /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	soilMinInput=        /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	temperatureMaxDiv=   /** @type {  HTMLDivElement} */((tmp= maxFields.firstElementChild).firstElementChild), 
	temperatureMaxInput= /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	humidityMaxDiv=      /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	humidityMaxInput=    /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	lightMaxDiv=         /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	lightMaxInput=       /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	saltMaxDiv=          /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	saltMaxInput=        /** @type {HTMLInputElement} */(                                tmp.lastElementChild), //@ts-ignore
	soilMaxDiv=          /** @type {  HTMLDivElement} */((tmp=      tmp.nextElementSibling).firstElementChild), 
	soilMaxInput=        /** @type {HTMLInputElement} */(                                tmp.lastElementChild), 
	footer=    /** @type {HTMLDivElement} */(popupWindow.lastElementChild), 
	sendBtn=   /** @type {HTMLDivElement} */(    footer.firstElementChild), 
	cancelBtn= /** @type {HTMLDivElement} */(     footer.lastElementChild), 
	verificationList= [nameInput, temperatureMinInput, humidityMinInput, lightMinInput, saltMinInput, soilMinInput, temperatureMaxInput, humidityMaxInput, lightMaxInput, saltMaxInput, soilMaxInput, ], 
	min= translate('min'), 
	max= translate('max'), 
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

minLabel.textContent= 'Минимални стойности:';
maxLabel.textContent= 'Максимални стойности:';
nameDiv.textContent=    translate('Name') +": ";
activeSpan.textContent= translate('Active Preset') +": ";
fileDiv.textContent=    translate('Preset Picture');
deleteSpan.textContent= translate('Delete Preset Picture') +": ";
temperatureMinDiv.textContent= '';
humidityMinDiv.textContent=    ' ';
lightMinDiv.textContent=       ' ';
saltMinDiv.textContent=        ' ';
soilMinDiv.textContent=        ' ';
temperatureMaxDiv.textContent= ' ';
humidityMaxDiv.textContent=    ' ';
lightMaxDiv.textContent=       ' ';
saltMaxDiv.textContent=        ' ';
soilMaxDiv.textContent=        ' ';
sendBtn.textContent=   translate('Submit');
cancelBtn.textContent= translate('Cancel');
///** @returns {boolean} */
//const fieldsValidityCheck= function(){//TODO
//	return true;
//};

const popup= {
	container: container, 
	visible: false, 

	init: function(){
		img.src= module.defaultPic;
		container.addEventListener('click', function(event){ if( event.target===container )hidePopup() });
		cancelBtn.addEventListener('click', hidePopup);
		nameInput.addEventListener('input', function(){
			const value= nameInput.value;
			for(var tmp of module.list){
				if( tmp!==preset && !tmp.system && value===tmp.name )
					return nameInput.classList.add('invalid');
			}
			core.nameValidityCheck.call(nameInput);
		});
		temperatureMinInput.addEventListener('input', core.temperatureOptValidityCheck);
		humidityMinInput.addEventListener('input', core.percentageOptValidityCheck);
		lightMinInput.addEventListener('input', core.lightOptValidityCheck);
		saltMinInput.addEventListener('input', core.percentageOptValidityCheck);
		soilMinInput.addEventListener('input', core.percentageOptValidityCheck);
		temperatureMaxInput.addEventListener('input', core.temperatureOptValidityCheck);
		humidityMaxInput.addEventListener('input', core.percentageOptValidityCheck);
		lightMaxInput.addEventListener('input', core.lightOptValidityCheck);
		saltMaxInput.addEventListener('input', core.percentageOptValidityCheck);
		soilMaxInput.addEventListener('input', core.percentageOptValidityCheck);
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
		sendBtn.addEventListener('click', function(){
			if( core.checkValidity(verificationList) )
				return;
			//if( !fieldsValidityCheck() )
			//	msgBox({body:translate("invalid data"), buttons: [{name: translate('ok')  }]});

			const /** @type {Parameters<typeof core.callServer>[1]} */params= {
				method: 'POST', 
				get: {active: (activeBox.checked ? '1':'0'), name: nameInput.value}, 
				onSuccess: function(req, rc){
					var msgText = '';
					switch( rc ){
						case 600: 	
						img.src= '';
						try{//@ts-ignore
							const prc= req.getResponseHeader('x-prc') |0;
							if( prc )
								msgBox({body:translate("picture upload failure")+ ": " +prc, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});
						}catch(e){
						}
						hidePopup();
						homeScreen.show(true);
						return;
						case 602: msgText = translate("Failed to connect to the db"); break;
						case 604: msgText = translate("Database operation failure"); break;
						case 605: msgText = translate("Missing data"); break;
						case 610: msgText = translate("unsupported picture"); break;

						default:msgText = translate(translate("error")+ ": " +rc);
					} 

					msgBox({body:msgText, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});
				}, 
				onError: function(req, timeout){msgBox({body:translate("error")+ ": " +req.status, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});}
			};
			if( temperatureMinInput.value )
				params.get.temperature_min= temperatureMinInput.value;
			if( humidityMinInput.value )
				params.get.humidity_min=       humidityMinInput.value;
			if( lightMinInput.value )
				params.get.light_min=             lightMinInput.value;
			if( saltMinInput.value )
				params.get.salt_min=               saltMinInput.value;
			if( soilMinInput.value )
				params.get.soil_min=               soilMinInput.value;
			if( temperatureMaxInput.value )
				params.get.temperature_max= temperatureMaxInput.value;
			if( humidityMaxInput.value )
				params.get.humidity_max=       humidityMaxInput.value;
			if( lightMaxInput.value )
				params.get.light_max=             lightMaxInput.value;
			if( saltMaxInput.value )
				params.get.salt_max=               saltMaxInput.value;
			if( soilMaxInput.value )
				params.get.soil_max=               soilMaxInput.value;
			var /** @type {'preset_update'|'preset_add'} */api;
			if( preset ){
				params.get.preset_id= preset.presetID;
				if( deleteInput.checked )
					params.get.delete_pic= 1;
				api= 'preset_update';
			}else{
				api= 'preset_add';
			}

			if( !deleteInput.checked && fileContent ){
				params.body= fileContent.slice();
				if( fileExt )
					params.get.type= fileExt;
				if( fileType )
					params.headers= {"Content-Type": fileType};
			}
			core.callServer(api, params);
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
	/** @param {Preset} [editedPreset] */
	show: function(editedPreset){
		if( popup.visible || editedPreset && editedPreset.system )
			return;
		popup.visible= true;//@ts-ignore
		preset= editedPreset;
		deleteInput.checked= false;
		if( preset ){
			headerDiv.textContent= translate('Editing Preset') +": " +preset.name;
			img.src= preset.picture;
			nameInput.value= preset.name;
			activeBox.checked= preset.active;//@ts-ignore
			temperatureMinInput.value= (preset.temperatureMin!=null ? preset.temperatureMin:'');//@ts-ignore
			humidityMinInput.value=    (   preset.humidityMin!=null ?    preset.humidityMin:'');//@ts-ignore
			lightMinInput.value=       (      preset.lightMin!=null ?       preset.lightMin:'');//@ts-ignore
			saltMinInput.value=        (       preset.saltMin!=null ?        preset.saltMin:'');//@ts-ignore
			soilMinInput.value=        (       preset.soilMin!=null ?        preset.soilMin:'');//@ts-ignore
			temperatureMaxInput.value= (preset.temperatureMax!=null ? preset.temperatureMax:'');//@ts-ignore
			humidityMaxInput.value=    (   preset.humidityMax!=null ?    preset.humidityMax:'');//@ts-ignore
			lightMaxInput.value=       (      preset.lightMax!=null ?       preset.lightMax:'');//@ts-ignore
			saltMaxInput.value=        (       preset.saltMax!=null ?        preset.saltMax:'');//@ts-ignore
			soilMaxInput.value=        (       preset.soilMax!=null ?        preset.soilMax:'');
		}else{
			headerDiv.textContent= translate('Creating Preset');
			img.src= module.defaultPic;
			activeBox.checked= true;
			temperatureMinInput.value= temperatureMaxInput.value= 
			humidityMinInput.value=    humidityMaxInput.value= 
			lightMinInput.value=       lightMaxInput.value= 
			saltMinInput.value=        saltMaxInput.value= 
			soilMinInput.value=        soilMaxInput.value= 
			nameInput.textContent= '';
		}
		container.classList.remove('gone');
		core.verify(verificationList);
		input.addInputSink(popup);
	}, 
	hide: hidePopup
};

/** @this {Preset} */
const edit= function(){ popup.show(this) };
/** @this {Preset} */
const deleteIt= function(){
	const presetID= this.presetID;
	msgBox({body: translate("delete preset")+ ": " +this.name +"?", buttons: [
		{name:translate("ok"), classModifier: 'btn-success', callback: function(){ core.callServer('preset_delete', {
			get: {preset_id: presetID}, 
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
			onError: function(req, timeout){msgBox({body:translate("device_delete error") + ": " +req.status, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});}
		}) }}, 
		{name: translate("cancel"),  classModifier: 'btn-danger'}
	] });
};

const choiceContainer= /** @type {HTMLDivElement} */(document.getElementById('presetChoice')), 
	choiceWindow=      /** @type {HTMLDivElement} */(              choiceContainer.firstElementChild), 
	choiceHeader=      /** @type {HTMLDivElement} */(                 choiceWindow.firstElementChild), 
	choiceHeaderDiv=   /** @type {HTMLDivElement} */(                 choiceHeader.firstElementChild), 
	choiceCloseBtn=    /** @type {HTMLDivElement} */(                  choiceHeader.lastElementChild), //@ts-ignore
	choiceList=        /** @type {HTMLDivElement} */(choiceWindow.lastElementChild.firstElementChild)
;
const choicePopup= {
	container: choiceContainer, 
	visible: false, 

	init: function(){
		choiceContainer.addEventListener('click', function(event){ if( event.target===choiceContainer )choicePopup.hide() });
		choiceCloseBtn.addEventListener('click', function(){ choicePopup.hide() });
	}, 
	reset: function(){
		if( !choicePopup.visible )
			return;
		choicePopup.visible= false;
		choiceContainer.classList.add('gone');
		input.removeInputSink(choicePopup);
		if( selected ){
			selected.classList.remove('selected');
			selected= null;
		}
	}, 
	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			choicePopup.hide();
		else
			return true;
	}, 
	/** @param {(preset: Preset|null|undefined)=> void} callback  @param {Preset?} [defaultPreset] */
	show: function(callback, defaultPreset){
		if( choicePopup.visible || !callback )
			return;
		selected= map[(defaultPreset ? defaultPreset.presetID:0)];
		if( !selected )
			return;
		choicePopup.visible= true;
		choiceCallback= callback;
		selected.classList.add('selected');
		choiceContainer.classList.remove('gone');
		input.addInputSink(choicePopup);
	}, 
	/** @param {Preset|null|undefined} [chosenPreset] */
	hide: function(chosenPreset){
		if( !choicePopup.visible )
			return;
		choicePopup.reset();
		choiceCallback(chosenPreset);
	}, 

	update: function(){
		choiceList.textContent= '';
		var preset, tmp;
		tmp= choiceList.appendChild(document.createElement('div'));
		map= {0: tmp};
		tmp.addEventListener('click', function(){ choicePopup.hide(null) });
		tmp.appendChild(document.createElement('img')).src= '';
		tmp.appendChild(document.createElement('span')).textContent= translate('No Preset');
		for(preset of presets.list){
			if( !preset.active )
				continue;
			map[preset.presetID]= 
			tmp= /** @type {HTMLDivElement &{preset: Preset}} */(choiceList.appendChild(document.createElement('div')));
			tmp.preset= preset;
			tmp.addEventListener('click', /** @this {HTMLDivElement &{preset: Preset}} */function(){ choicePopup.hide(this.preset) });
			tmp.appendChild(document.createElement('img')).src= preset.picture;
			tmp.appendChild(document.createElement('span')).textContent= (preset.system ? translate_server(preset.name) : preset.name);
		}
		selected= null;
	}
};


/** @lends presets */
const module= {//TODO(v2): data validations
	defaultPic: /** @type {const} */('css/img/default_preset.png'), 
	/** @type {Preset[]} */
	list: [], 
	/** @type {Object<number, Preset>} */
	map: {}, 

	init: function(){
		popup.init();
		choicePopup.init();
	}, 
	reset: function(){
		popup.reset();
		choicePopup.reset();
	}, 
	/** @param {PresetData[]} data  @returns {boolean} */
	parse: function(data){//TODO(v2): data validations
		if( !data )
			return false;
		const /** @type {Preset[]} */list= [], /** @type {Object<number, Preset>} */map= {};
		var preset, newPreset;
		for(preset of data){
			if( !preset.presetID || !preset.createdOn )
				continue;
			newPreset= {
				system:    preset.system, 
				presetID:  preset.presetID, 
				createdOn: preset.createdOn, 
				picture:  (preset.picture ? core.domain +preset.picture : presets.defaultPic), 
				active:  !!preset.active, 
				name:      preset.name, 
				temperatureMin: preset.temperatureMin, 
				temperatureMax: preset.temperatureMax, 
				humidityMin:       preset.humidityMin, 
				humidityMax:       preset.humidityMax, 
				lightMin:             preset.lightMin, 
				lightMax:             preset.lightMax, 
				saltMin:               preset.saltMin, 
				saltMax:               preset.saltMax, 
				soilMin:               preset.soilMin, 
				soilMax:               preset.soilMax, 
				edit:   edit, 
				delete: deleteIt
			};
			list.push(newPreset);
			map[newPreset.presetID]= newPreset;
		}
		if( list.length<=0 )
			return false;
		module.list= list;
		module.map= map;
		choicePopup.update();
		return true;
	}, 
	add: function(){ popup.show() }, 
	choose: choicePopup.show
};


core.registerModule(module);
return module;
})();
