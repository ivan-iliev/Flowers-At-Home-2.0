//@ts-check
///<reference path="./error_screen.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./start_screen.js"/>
'use strict';

/** @type {{forceOrientation: (portrait: boolean)=> void, exit: ()=> void}} *///@ts-ignore
const system= (window.system);

/**
 * @typedef {object} AppScreen
 * @property {HTMLDivElement} container
 * @property {boolean} visible
 * @property {()=> void} [init]
 * @property {(keyCode: number)=> (boolean | void)} [input]
 * @property {function} show
 * @property {function} hide
**/

/** @const @global @namespace *///@ts-ignore
const core= (function(){//TODO(v2): data validations


const /** @type {{init?: ()=> void, reset?: ()=> void}[]} */
	modules= [], 
	domain= /** @type {const} */('https://www.botanica-wellness.com/'), 
	appServer= `${domain}appserver.php`, 
	textEncoder= new TextEncoder(), 
	minNameLength= 4, 
	maxNameLength= 25, 
	minInterval= 10, 
	maxInterval= 2880, 
	minPassLength= 8, 
	maxPassLength= 72, 
	minTemp= 1, 
	maxTemp= 99, 
	minLight= 1, 
	maxLight= 10000
;


/** @lends core */
const module= {//TODO(v2): data validations
	/** @type {AppScreen?} */
	currentScreen: null, 
	domain: domain, 

	init: function(){
		for(var m of modules){
			if( m.init )
				m.init();
		}
		module.callServer('get', {onSuccess: function(req, rc){
			if( rc==600 )
				homeScreen.show(req.responseText);
			else
				errorScreen.show(translate('error')+': '+ rc);
		}, onError: function(req, timeout){ errorScreen.show('Няма връзка със сървъра' )}});
	}, 
	/** @param {typeof modules[number]} module */
	registerModule: function(module){
		if( module )
			modules.push(module);
	}, 
	reset: function(){
		for(var m of modules){
			if( m.reset )
				m.reset();
		}
		startScreen.show();
	}, 
	/**
	 * @param {'log'|'login'|'logout'|'get'|'user_delete'|'user_reset_pass'|'user_add'|'user_update'|'get_data'|'device_delete'|'device_update'|'device_add'|'preset_delete'|'preset_update'|'preset_add'} api
	 * @param {object}                                         [params]
	 * @param {'GET'|'POST'}                                   [params.method]
	 * @param {Object<String, String>}                         [params.headers]
	 * @param {Object<String, String>}                         [params.get]
	 * @param {string|Blob}                                    [params.body]
	 * @param {boolean}                                        [params.login]
	 * @param {number}                                         [params.timeout]
	 * @param {(event: ProgressEvent<EventTarget>)=> void}     [params.onprogress]
	 * @param {(req: XMLHttpRequest, timeout: boolean)=> void} [params.onError]
	 * @param {(req: XMLHttpRequest, rc: number)=> void}       [params.onSuccess]
	**/
	callServer: function(api, params){
		if( !params )
			params= {};
		const req= new XMLHttpRequest(), notLogin= !params.login;
		var tmp, get= (/\?/.test(appServer) ? '':null);
		for(tmp in params.get)
			get= (get!=null ? get +"&" : '?') +tmp +"=" +encodeURIComponent(params.get[tmp]);
		req.open((params.method ? params.method:'GET'), (get ? appServer +get : appServer), true);
		req.withCredentials= true;
		req.setRequestHeader('api', api);
		for(tmp in params.headers)
			req.setRequestHeader(tmp, params.headers[tmp]);
		req.timeout= params.timeout || 5000;//@ts-ignore
		req.onprogress= params.onprogress;
		if( params.onSuccess ){
			req.onload= function(){//@ts-ignore
				try{ tmp= req.getResponseHeader('x-rc') |0 }catch(e){ tmp= 0 }//@ts-ignore
				if( notLogin && tmp==603 || tmp==612 || tmp==614 )
					module.reset();
				else//@ts-ignore
					params.onSuccess(req, tmp);
			};
		}
		if( params.onError ){//@ts-ignore
			req.onerror= function(){ params.onError(req, false) };//@ts-ignore
			req.ontimeout= function(){ params.onError(req, true) };
		}
		req.send(params.body);
	}, 
	/** @param {AppScreen} obj  @param {HTMLInputElement[]} [verificationList] */
	showScreen: function(obj, verificationList){
		if( module.currentScreen )
			module.currentScreen.hide();
		obj.visible= true;
		obj.container.classList.remove('gone');
		if( verificationList )
			module.verify(verificationList);
		module.currentScreen= obj;
	}, 
	/** @param {AppScreen} obj */
	hideScreen: function(obj){
		obj.visible= false;
		obj.container.classList.add('gone');
		module.currentScreen= null;
	}, 

	/** @param {{modelID: number, picture: string, name: string}} data */
	parseModels: function(data){//TODO(v2)
		return true;
	}, 

	/** @param {number} n  @returns {string} */
	getDetailedTimeFromMilliseconds: function(n){
		n= (n<=0 ? 0 : (Math.trunc(n) || 0));
		n= Math.trunc(n /1000) || 0;

		const s= n %60;

		n= (n /60) |0;
		const m= n %60;

		n= (n /60) |0;
		const h= n %24;

		const d= (n /24) |0;

		var res;
		if( d )
			res= d +" " +translate('d.');
		if( h )
			res= (res ? res +" " +h : h) +" " +translate('h.');
		if( m )
			res= (res ? res +" " +m : m) +" " +translate('m.');
		if( s || !res )
			res= (res ? res +" " +s : s) +" " +translate('s.');

		return res;
	}, 
	/** @param {string} filename  @returns {string?} */
	fileTypeValidityCheck: function(filename){
		const match= filename.match(/\.(jpe?g|png|svg|gif|bmp|webp|avif|tiff?)$/);
		return (match ? match[1]:null);
	}, 
	/** @this {HTMLInputElement} */
	nameValidityCheck: function(){ this.classList[this.value.length<minNameLength || maxNameLength<this.value.length ? 'add':'remove']('invalid') }, 
	/** @this {HTMLInputElement} */
	intervalValidityCheck: function(){
		const value= parseFloat(this.value) || 0;
		this.classList[!this.value || value<minInterval || maxInterval<value ? 'add':'remove']('invalid');
	}, 
	/** @this {HTMLInputElement} */
	temperatureOptValidityCheck: function(){
		const value= parseFloat(this.value) || 0;
		this.classList[this.value && (value<minTemp || maxTemp<value) ? 'add':'remove']('invalid');
	}, 
	/** @this {HTMLInputElement} */
	lightOptValidityCheck: function(){
		const value= parseFloat(this.value) || 0;
		this.classList[this.value && (value<minLight || maxLight<value) ? 'add':'remove']('invalid');
	}, 
	/** @this {HTMLInputElement} */
	percentageValidityCheck: function(){
		const value= parseFloat(this.value) || 0;
		this.classList[!this.value || value<0 || 100<value ? 'add':'remove']('invalid');
	}, 
	/** @this {HTMLInputElement} */
	percentageOptValidityCheck: function(){
		const value= parseFloat(this.value) || 0;
		this.classList[this.value && (value<0 || 100<value) ? 'add':'remove']('invalid');
	}, 
	/** @param {HTMLInputElement} pass1  @param {HTMLInputElement} user */
	pass1ValidityCheck: function(pass1, user){
		const len= textEncoder.encode(pass1.value).length;
		pass1.classList[pass1.value===user.value || len<minPassLength || maxPassLength<len ? 'add':'remove']('invalid');
	}, 
	/** @this {HTMLInputElement} */
	pass1OptValidityCheck: function(){
		if( !this.value )
			return this.classList.remove('invalid');
		const value= this.value;
		this.classList[value && (value===user.user || value.length<minPassLength || maxPassLength<value.length) ? 'add':'remove']('invalid');
	}, 
	/** @param {HTMLInputElement} pass2  @param {HTMLInputElement} pass1 */
	pass2ValidityCheck: function(pass2, pass1){ pass2.classList[pass2.value!==pass1.value ? 'add':'remove']('invalid') }, 
	/** @this {HTMLInputElement} */
	emailValidityCheck: function(){ this.classList[this.value.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i) ? 'remove':'add']('invalid') }, 
	/** @param {HTMLInputElement[]} list  @returns {boolean} */
	checkValidity: function(list){
		for(var element of list){
			if( element.classList.contains('invalid') )
				return true;
		}
		return false;
	}, 
	/** @param {HTMLInputElement[]} verificationList */
	verify: function(verificationList){
		for(var element of verificationList)
			element.dispatchEvent(new Event('input'));
	}, 
};


return module;
})();


/** @const @global */
const transMap= Object.freeze(/** @type {const} */({
	Interval:                 'Интервал', 
	"Applied Interval":       'Сложен интервал', 
	"min.":                   'мин.', 
	None:                     'Няма', 
	temperature:              'Температура', 
	humidity:                 'Влажност-въздух', 
	light:                    'Светлина', 
	salt:                     'Минерали', 
	soil:                     'Влажност-почва', 
	battery:                  'Батерия', 
	flood:                    'flood', 
	emptyWaterTank:           'emptyWaterTank', 
	min:                      'мин', 
	max:                      'макс', 
	"d.":                     'ден', 
	"h.":                     'час', 
	"m.":                     'мин.', 
	"s.":                     'сек.', 
	pp:                       'Политика за поверителност', 
	logout:                   'Излизане от профил', 
	edit:                     'Редакция на профил', 
	deleteUser:               'Изтриване на профил', 
	Name:                     'Име', 
	"Battery Warning Level":  'Пред. ниво на батерията', 
	"New Password":           'Нова парола', 
	"Repeat New Password":    'Повтори нова парола', 
	"Profile Picture":        'Профилна снимка', 
	"Delete Profile Picture": 'Изтрий профилна снимка', 
	Submit:                   'Потвърди', 
	Cancel:                   'Откажи  ', 
	"Active Preset":          'Активно', 
	"Preset Picture":         'Снимка на растение', 
	"Delete Preset Picture":  'Изтрий снимка на растение', 
	"Editing Preset":         'Редакция', 
	"Creating Preset":        'Създаване', 
	"Active Device":          'Активно устройство', 
	"No Preset":              'Няма Растение',
	Preset:                   'Растение', 
	"Interval (in minutes)":  'Интервал (в минути)', 
	"Device Picture":         'Устройствена снимка', 
	"Delete Device Picture":  'Изтрий устройствена снимка', 
	Mac:                      'MAC', 
	lux:                      'lux', 
	range:                    'Обхват', 
	"Warning Level":          'Предупреждение за нивото', 
	error:  'Възникна грешка',
	ok:  'ОК',  
	"delete preset":  'Сигурни ли сте, че искате да изтриете пресет',
	"picture upload failure":  'Неуспешно качване на снимка',
	"Failed to connect to the db": 'Неуспешно свързване с базата данни',
	"The user is suspended": 'Потребителят е спрян',
	"Database operation failure": 'Неуспешна операция с базата данни',
	"Missing data": 'Липсващи данни',
	"User not logged in": 'Потребителят не е влезнал',
	"Incorrect data submitted": 'Подадени са некоректни данни',
	"Invalid session": 'Невалидна сесия',
	"get_data error": 'Грешка при извличане на данни', 
	'invalid data': 'Невалидни данни',
	"Do you want to delete": 'Сигурни ли сте, че искате ли да изтриете',
	"wrong user or pass": 'Невалиден имейл и/или парола',
	"login error": 'Грешка при влизане',
	"Username already exists": 'Потребителското име(имейл) вече съществува',
	"Invalid password": 'Невалидна парола',
	'invalid image type': 'Невалиден тип снимка',
	"Delete user": 'Сигурни ли сте, че искате да изтриете потребителя',
	"log_out err": 'Грешка при излизане',
	"Are you sure you want to logout": 'Сигурни ли сте, че искате да излезете',
	"Couldn't parse data": 'Неуспешно обработване на данни',
	'Failed to parse data': 'Неуспешно обработване на данни',
	'Failed to parse user data': 'Неуспешно обработване на данни за потребителя',
	'Failed to parse presets data': 'Неуспешно обработване на данни за растения',
	'Failed to parse devices data': 'Неуспешно обработване на данни за устройства',
	'unsupported picture': 'Неподдържан тип снимка',
	'You dont have ragistered devices': 'Нямате регистрирани устройства',
}));
/** @const @global  @param {string} text  @returns {string} */
const translate= function(text){
	const /** @type {typeof transMap[keyof transMap] | undefined} */res= transMap[text];
	return (res!=null ? res:text);
};

/** @const @global */
const transMap_server= Object.freeze(/** @type {const} */({
	'White Butterfly Orchid': 'Бяла Орхидея Пеперуда',
	'Zamioculcas Zamiifolia': 'Замиокулкас Замифолия',
	'Philodendron Sanguineum': 'Филодендрон "Кървав"'
}));
/** @const @global  @param {string} text  @returns {string} */
const translate_server= function(text){
	const /** @type {typeof transMap_server[keyof transMap_server] | undefined} */res= transMap_server[text];
	return (res!=null ? res:text);
};
