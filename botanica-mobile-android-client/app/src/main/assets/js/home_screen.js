//@ts-check
///<reference path="./core.js"/>
///<reference path="./device_screen.js"/>
///<reference path="./devices.js"/>
///<reference path="./error_screen.js"/>
///<reference path="./presets.js"/>
///<reference path="./user.js"/>
'use strict';

/** @const @global @namespace */
const homeScreen= (function(){//TODO(v2): data validations


//@ts-ignore
const container= /** @type {HTMLDivElement} */(document.getElementById('homeDiv')), buttonBar= /** @type {HTMLDivElement} */(container.firstElementChild.lastElementChild);
const presetsTab= /** @type {HTMLDivElement} */(document.getElementById('presetsTab')), presetsContent= /** @type {HTMLDivElement} */(document.getElementById('presets'));
const devicesTab= /** @type {HTMLDivElement} */(document.getElementById('devicesTab')), devicesContent= /** @type {HTMLDivElement} */(document.getElementById('devices'));
var /** @type {devices|presets} */currentGlobal;

const parseData= /** @param {string} json  @returns {[HTMLDivElement, HTMLDivElement]?} */function(json){//TODO(v2): data validations
	var data, device, preset, card, div, left, right, tmp, tmp2, warnings, lastData;
	try{ data= JSON.parse(json) }
	catch(e){ console.error("homeScreen~parseData: failed to parse json= " +json) }
	//TODO(v2): data validations
	if( !data || typeof data !== 'object' ){
		errorScreen.show(translate('Failed to parse data'));
		return null;
	}
	if( !user.parse(data.user) ){
		errorScreen.show(translate('Failed to parse user data'));
		return null;
	}
	if( !data.presets || !presets.parse(data.presets) ){
		errorScreen.show(translate('Failed to parse presets data'));
		return null;
	}
	if( !data.devices || !devices.parse(data.devices) ){
		errorScreen.show(translate('Failed to parse devices data'));
		return null;
	}

	/** @type {[HTMLDivElement, HTMLDivElement]} */
	const res= [document.createElement('div'), document.createElement('div')];
	const warn= res[0].appendChild(document.createElement('div')), norm= res[0].appendChild(document.createElement('div'));
	warn.className= 'warn';
	norm.className= 'norm';
	if( devices.list.length ){
		for(device of devices.list){
			card= /** @type {HTMLDivElement &{device: Device}} */(document.createElement('div'));
			card.device= device;
			card.className= 'device';
			card.addEventListener('click', /** @this {HTMLDivElement &{device: Device}} */function(){ deviceScreen.show(this.device, 7 *24 *60 *60 *1000) });
			if( !device.active )
				card.classList.add('suspended');
			warnings= false;

			//header{
			tmp2= card.appendChild(document.createElement('div'));
			tmp2.className= 'header';

			tmp= tmp2.appendChild(document.createElement('div'));
			tmp.className= 'name';
			tmp.textContent= device.name;

			data= tmp2.appendChild(document.createElement('div'));

			tmp= data.appendChild(document.createElement('i'));
			tmp.className= 'edit';
			tmp.addEventListener('click', function(event){//@ts-ignore
				/** @type {Device} */(this.parentNode.parentNode.parentNode.device).edit();
				event.stopPropagation();
			});

			tmp= data.appendChild(document.createElement('i'));
			tmp.className= 'delete';
			tmp.addEventListener('click', function(event){//@ts-ignore
				/** @type {Device} */(this.parentNode.parentNode.parentNode.device).delete();
				event.stopPropagation();
			});
			//header}

			//preset{
			tmp2= card.appendChild(document.createElement('div'));
			tmp2.className= 'preset';

			preset= device.preset;

			if( preset ){
				//tmp= tmp2.appendChild(document.createElement('span'));
				//tmp.textContent= translate('Preset') +": ";

				//tmp= tmp2.appendChild(document.createElement('img'));
				//tmp.className= 'img';
				//tmp.src= preset.picture;

				tmp= tmp2.appendChild(document.createElement('span'));
				tmp.className= 'name';
				tmp.textContent= (preset.system ? translate_server(preset.name) : preset.name);
			}
			//preset}

			div= card.appendChild(document.createElement('div'));

			tmp= div.appendChild(document.createElement('img'));
			tmp.className= 'img';
			tmp.src= device.picture;

			data= div.appendChild(document.createElement('div'));
			data.className= 'data';

			lastData= device.lastData;
			if( !lastData || !device.active ){
				norm.appendChild(card);
				continue;
			}

			//left{
			left= data.appendChild(document.createElement('div'));

			tmp2= left.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-sun data_icon';
			if( lastData.light && preset && preset.lightMin!=null && preset.lightMax!=null && (lastData.light<preset.lightMin || preset.lightMax<lastData.light) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));
			if( lastData.light && preset && preset.lightMin!=null && preset.lightMax!=null && (lastData.light<preset.lightMin || preset.lightMax<lastData.light) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.light +" " +translate('lux');

			tmp2= left.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-wind data_icon';
			if( lastData.humidity && preset && preset.humidityMin!=null && preset.humidityMax!=null && (lastData.humidity<preset.humidityMin || preset.humidityMax<lastData.humidity) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));
			if( lastData.humidity && preset && preset.humidityMin!=null && preset.humidityMax!=null && (lastData.humidity<preset.humidityMin || preset.humidityMax<lastData.humidity) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.humidity +"%";

			tmp2= left.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-droplet data_icon';
			if( lastData.soil && preset && preset.soilMin!=null && preset.soilMax!=null && (lastData.soil<preset.soilMin || preset.soilMax<lastData.soil) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));
			if( lastData.soil && preset && preset.soilMin!=null && preset.soilMax!=null && (lastData.soil<preset.soilMin || preset.soilMax<lastData.soil) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.soil +"%";
			//left}

			//right{
			right= data.appendChild(document.createElement('div'));

			tmp2= right.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-temperature-half data_icon';
			if( lastData.temperature && preset && preset.temperatureMin!=null && preset.temperatureMax!=null && (lastData.temperature<preset.temperatureMin || preset.temperatureMax<lastData.temperature) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));
			if( lastData.temperature && preset && preset.temperatureMin!=null && preset.temperatureMax!=null && (lastData.temperature<preset.temperatureMin || preset.temperatureMax<lastData.temperature) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.temperature +"\u00B0C";

			tmp2= right.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-seedling data_icon';
			if( lastData.salt && preset && preset.saltMin!=null && preset.saltMax!=null && (lastData.salt<preset.saltMin || preset.saltMax<lastData.salt) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));
			if( lastData.salt && preset && preset.saltMin!=null && preset.saltMax!=null && (lastData.salt<preset.saltMin || preset.saltMax<lastData.salt) ){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.salt +"%";

			tmp2= right.appendChild(document.createElement('div'));
			tmp= tmp2.appendChild(document.createElement('span'));
			tmp.className= 'fa-solid fa-battery-three-quarters data_icon';//@ts-ignore
			if( lastData.battery<user.battery){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp= tmp2.appendChild(document.createElement('span'));// @ts-ignore
			if( lastData.battery<user.battery){
				tmp.classList.add('warn');
				warnings= true;
			}
			tmp.textContent= lastData.battery +"%";
			//right}

			(warnings ? warn:norm).appendChild(card);
		}
	}else{
		const emptyDiv = norm.appendChild(document.createElement('div'));
		emptyDiv.className= 'empty-div';
		const imgDiv= emptyDiv.appendChild(document.createElement('img'));
		imgDiv.className= 'empty-img fa-bounce';
		imgDiv.src= 'libs/fontawesome-free-6.5.1-web 2/svgs/solid/microchip.svg';
		const emptyTextDiv= emptyDiv.appendChild(document.createElement('div'));
		emptyTextDiv.className= 'empty-text';
		emptyTextDiv.textContent= translate('You dont have ragistered devices');
	}

	const presetsDiv= res[1];
	for(preset of presets.list){
		div= /** @type {HTMLDivElement &{preset: Preset}} */(document.createElement('div'));
		div.className= 'preset';
		div.preset= preset;
		if( !preset.active )
			div.classList.add('suspended');
		if( preset.system )
			div.classList.add('system');

		tmp= div.appendChild(document.createElement('img'));
		tmp.className= 'img';
		tmp.src= preset.picture;

		tmp= div.appendChild(document.createElement('div'));
		tmp.className= 'name';
		if( preset.system ){
			if( preset.name )
				tmp.textContent= translate_server(preset.name);
		}else{
			if( preset.name )
				tmp.textContent= preset.name;

			tmp2= div.appendChild(document.createElement('div'));
			tmp2.className= 'buttons';

			tmp= tmp2.appendChild(document.createElement('i'));
			tmp.className= 'edit';
			tmp.addEventListener('click', function(event){//@ts-ignore
				/** @type {Preset} */(this.parentNode.parentNode.preset).edit();
				event.stopPropagation();
			});

			tmp= tmp2.appendChild(document.createElement('i'));
			tmp.className= 'delete';
			tmp.addEventListener('click', function(event){//@ts-ignore
				/** @type {Preset} */(this.parentNode.parentNode.preset).delete();
				event.stopPropagation();
			});
		}

		presetsDiv.appendChild(div);
	}

	return res;
}, clearData= function(){
	devicesContent.textContent= 
	presetsContent.textContent= '';
	devices.list= [];
	presets.list= [];
	devices.map= {};
	presets.map= {};
}, applyData= /** @param {string} json */function(json){
	clearData();
	const elements= parseData(json);
	if( !elements )
		return;
	devicesContent.appendChild(elements[0]);
	presetsContent.appendChild(elements[1]);
}, getData= function(){ core.callServer('get', {
	onSuccess: function(req, rc){
		var msgText = '';
		 switch( rc ){
			case 600: applyData(req.responseText); return;
			case 602: msgText = translate("Failed to connect to the db"); break;
			default: msgText = translate("get error")+ ": " +rc;
		} 
		msgBox({body:msgText, buttons: [{name: translate('ok'), classModifier: 'btn-success'}]});
	}, 
	onError: function(req, timeout){msgBox({body:translate("device_delete error") + ": " +req.status, buttons: [{name: translate('ok'), classModifier: 'btn-success'}]});}
	})
};


/** @lends homeScreen */
const module= {
	container: container, 
	visible: false, 

	init: function(){
		presetsTab.addEventListener('click', function(){
			devicesContent.classList.remove('active');
			devicesTab.classList.remove('active');
			presetsContent.classList.add('active');
			presetsTab.classList.add('active');
			currentGlobal= presets;
		});
		devicesTab.addEventListener('click', function(){
			presetsContent.classList.remove('active');
			presetsTab.classList.remove('active');
			devicesContent.classList.add('active');
			devicesTab.classList.add('active');
			currentGlobal= devices;
		});
		devicesTab.click();//@ts-ignore
		buttonBar.firstElementChild.addEventListener('click', function(){ currentGlobal.add() });//@ts-ignore
		buttonBar.lastElementChild.addEventListener('click', function(){ module.show(true) });
	}, 
	/** @param {string | true} [json] */
	show: function(json){
		if( json ){
			if( typeof json === 'string' )
				applyData(json);
			else
				getData();
		}
		if( !module.visible )
			core.showScreen(module);
	}, 
	hide: function(){
		if( module.visible )
			core.hideScreen(module);
	}
};


core.registerModule(module);
return module;
})();
