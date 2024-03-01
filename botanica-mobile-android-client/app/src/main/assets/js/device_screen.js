//@ts-check
///<reference path="../../../../../../libs/apexcharts.js/types/apexcharts.d.ts"/>
///<reference path="./core.js"/>
///<reference path="./devices.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./input.js"/>
///<reference path="./presets.js"/>
///<reference path="./user.js"/>
'use strict';

/** @const @global @namespace */
const deviceScreen= (function(){//TODO(v2): data validations


const container=                                       /** @type {  HTMLDivElement                      } */(document.getElementById('deviceDiv')), 
	deviceImg=                                       /** @type {HTMLImageElement                      } */(                 container.firstElementChild), 
	deviceName=                                        /** @type {  HTMLDivElement                      } */(                  deviceImg.nextElementSibling), 
	deviceInterval=                                    /** @type {  HTMLDivElement                      } */(                 deviceName.nextElementSibling), 
	deviceAppliedInterval=                             /** @type {  HTMLDivElement                      } */(             deviceInterval.nextElementSibling), 
	devicePreset=                                      /** @type {  HTMLDivElement                      } */(      deviceAppliedInterval.nextElementSibling), 
	devicePresetSpan=                                 /** @type { HTMLSpanElement                      } */(              devicePreset.firstElementChild), 
	devicePresetImg=                                 /** @type {HTMLImageElement                      } */(           devicePresetSpan.nextElementSibling), 
	devicePresetName=                                 /** @type { HTMLSpanElement                      } */(               devicePreset.lastElementChild), //@ts-ignore
	deviceCharts=                                      /** @type {  HTMLDivElement                      } */(container.lastElementChild.firstElementChild), 
	temperatureChart=      /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(              deviceCharts.firstElementChild), 
	humidityChart=         /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(           temperatureChart.nextElementSibling), 
	lightChart=            /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(              humidityChart.nextElementSibling), 
	saltChart=             /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(                 lightChart.nextElementSibling), 
	soilChart=             /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(                  saltChart.nextElementSibling), 
	batteryChart=          /** @type {  HTMLDivElement &{chart: ApexCharts?}} */(                  soilChart.nextElementSibling), 
	defaultOptions= {
		chart: {
			type: 'line', 
			zoom: {type: 'x', enabled: true}
		}, 
		stroke: {
			curve: 'straight', 
			width: 1.5, 
		}, 
		grid: {
			borderColor: '#4f4f4f', 
			row: {
				colors: ['transparent', 'transparent'], //takes an array which will be repeated on columns
				opacity: .5
			}, 
		}, 
		title: {style: {color: '#ffffff', }, }, 
		xaxis: {
			type: 'datetime', 
			labels: {style: {colors: '#ffffff', }, }, 
			axisBorder: {color: '#4f4f4f', }, 
			axisTicks: {color: '#4f4f4f', }, 
		}, 
		yaxis: {labels: {style: {colors: ['#ffffff'], }, }, }, 
		legend: {show: false}, 
	}, 
	defaultAnnotations= {
		borderColor: '#00ff004d', 
		label: {
			borderColor: '#00ff004d', 
			style: {
				color: '#ffffff', 
				background: '#00ff004d', 
			}, 
		}, 
	}, 
	mainColor= '#00FF00'
;
devicePresetSpan.textContent= translate('Preset') +": ";
var tmp;

/** @typedef {number} TimeStamp */
/**
 * @typedef {object} ChartData
 * @property {string} name
 * @property {string} color
 * @property {[TimeStamp, number][]} data
**/
/** @param {HTMLDivElement &{chart: ApexCharts?}} element  @param {[TimeStamp, number][]} data  @param {number?} dataMin  @param {number?} dataMax  @param {string} name  @param {number?} min  @param {number?} max  @param {string?} [annotationText] */
const makeChart= function(element, data, dataMin, dataMax, name, min, max, annotationText){
	/** @type {{series: ChartData[], title?: {text: string}} &typeof defaultOptions} */
	const options= {};
	for(tmp in defaultOptions)
		options[tmp]= defaultOptions[tmp];
	options.title.text= name;
	options.series= [];
	if( min!=null || max!=null ){
		if( data.length && min!=null )//@ts-ignore
			options.series.push({name: translate('min'), color: 'transparent', data: [[dataMin, min], [dataMax, min]]});
		if( data.length && max!=null )//@ts-ignore
			options.series.push({name: translate('max'), color: 'transparent', data: [[dataMin, max], [dataMax, max]]});
		if( annotationText==null ){
			if( min!=null && max!=null )
				annotationText= translate('range') +": " +min +"-" +max;
			else if( min!=null )
				annotationText= translate('min') +": " +min;
			else// if( max!=null )
				annotationText= translate('max') +": " +max;
		}
		/** @type {{y: number, y2?: number, label?: {text: string}} &typeof defaultAnnotations} */
		const annotations= {};//@ts-ignore
		annotations.y= (min!=null ? min:max);
		if( min!=null )//@ts-ignore
			annotations.y2= max;
		for(tmp in defaultAnnotations)
			annotations[tmp]= defaultAnnotations[tmp];
		annotations.label.text= annotationText;
		options.annotations= {yaxis: [annotations, ]};
	}
	options.series.push({name: name, color: mainColor, data: data, });
	element.chart= new ApexCharts(element.appendChild(document.createElement('div')), options);
	element.chart.render();
};
/** @param {Device} device  @param {string} json */
const parseData= function(device, json){//TODO(v2): data validations
	clearCharts();
	var data, row, /** @type {TimeStamp} */min, /** @type {TimeStamp} */max, /** @type {ChartData['data']} */temperature, /** @type {ChartData['data']} */humidity, /** @type {ChartData['data']} */light, /** @type {ChartData['data']} */salt, /** @type {ChartData['data']} */soil, /** @type {ChartData['data']} */battery, preset, tmp;
	try{ data= JSON.parse(json) }
	catch(e){ console.error("deviceScreen~parseData: failed to parse json= " +json) }
	if( !Array.isArray(data) ){
		msgBox({body:translate("Couldn't parse data"), buttons: [{name: translate('ok')  }]});
		return;
	}

	min= max= /** @type {TimeStamp} */(/** @type {unknown} */(null));
	temperature= [];
	humidity= [];
	light= [];
	salt= [];
	soil= [];
	battery= [];
	for(row of data){
		tmp= row.timestamp;
		if( !tmp )
			continue;
		if( min==null || tmp<min )
			min= tmp;
		if( max==null || max<tmp )
			max= tmp;
		temperature.push([tmp, row.temperature]);
		humidity.push(   [tmp, row.humidity]);
		light.push(      [tmp, row.light]);
		salt.push(       [tmp, row.salt]);
		soil.push(       [tmp, row.soil]);
		battery.push(    [tmp, row.battery]);
	}
	preset= device.preset;
	const minName= translate('min'), maxName= translate('max');

	makeChart(temperatureChart, temperature, min, max, translate('temperature'), preset && preset.temperatureMin, preset && preset.temperatureMax);

	makeChart(humidityChart, humidity, min, max, translate('humidity'), preset && preset.humidityMin, preset && preset.humidityMax);

	makeChart(lightChart, light, min, max, translate('light'), preset && preset.lightMin, preset && preset.lightMax);

	makeChart(saltChart, salt, min, max, translate('salt'), preset && preset.saltMin, preset && preset.saltMax);

	makeChart(soilChart, soil, min, max, translate('soil'), preset && preset.soilMin, preset && preset.soilMax);

	makeChart(batteryChart, battery, min, max, translate('battery'), user.battery, null, translate('Warning Level') +": " +user.battery);
};
const clearCharts= function(){
	if( temperatureChart.chart ){
		temperatureChart.chart.destroy();
		temperatureChart.chart= null;
	}
	if( humidityChart.chart ){
		humidityChart.chart.destroy();
		humidityChart.chart= null;
	}
	if( lightChart.chart ){
		lightChart.chart.destroy();
		lightChart.chart= null;
	}
	if( saltChart.chart ){
		saltChart.chart.destroy();
		saltChart.chart= null;
	}
	if( soilChart.chart ){
		soilChart.chart.destroy();
		soilChart.chart= null;
	}
	if( batteryChart.chart ){
		batteryChart.chart.destroy();
		batteryChart.chart= null;
	}
	temperatureChart.textContent= 
	humidityChart.textContent= 
	lightChart.textContent= 
	saltChart.textContent= 
	soilChart.textContent= 
	batteryChart.textContent= '';
};
/** @param {Device} device  @param {number} from  @param {number} to */
const getData= function(device, from, to){ core.callServer('get_data', {
	get: {device_id: device.deviceID, from: from, to: to}, 
	onSuccess: function(req, rc){  
		var msgText = '';
		switch( rc ){
		case 600: parseData(device, req.responseText); return;
		case 602: msgText = translate(translate("Failed to connect to the db")); break;
		case 604: msgText = translate(translate("Database operation failure")); break;
		case 605: msgText = translate(translate("Missing data")); break;
		case 613: msgText = translate(translate("Incorrect data submitted")); break;
		default: msgText = translate(translate("get_data error") + ": " +rc);	
	} 
	msgBox({body:msgText, buttons: [{name: translate('ok')  }]});

},
	onError: function(req, timeout){msgBox({body:translate("login error") + ": " +req.status, buttons: [{name: translate('ok'), classModifier: "btn-success"}]});}
}) };


/** @lends deviceScreen */
const module= {
	container: container, 
	visible: false, 

	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			homeScreen.show();
		else
			return true;
	}, 
	/** @param {Device} device  @param {number} range */
	show: function(device, range){
		if( !device || range<0 )
			return;
		clearCharts();
		deviceImg.src= device.picture;
		deviceName.textContent= device.name;
		deviceInterval.textContent= translate('Interval') +": " +core.getDetailedTimeFromMilliseconds(device.interval);
		deviceAppliedInterval.textContent= translate('Applied Interval') +": " +core.getDetailedTimeFromMilliseconds(device.appliedInterval);
		devicePresetImg.src= (device.preset ? device.preset.picture:'');
		devicePresetName.textContent= (device.preset ? device.preset.name : translate('None'));
		//system.forceOrientation(false);
		if( !module.visible )
			core.showScreen(module);
		const now= Date.now();
		getData(device, now -24 *60 *60 *1000/*range*/, now);
	}, 
	hide: function(){
		if( !module.visible )
			return;
		core.hideScreen(module);
		//system.forceOrientation(true);
		clearCharts();
	}
};


//@ts-ignore
core.registerModule(module);
return module;
})();
