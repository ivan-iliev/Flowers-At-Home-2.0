//@ts-check
///<reference path="./input.js"/>
'use strict';

/**
 * @typedef {object} MsgBoxButton
 * @property {string} name
 * @property {string} [classModifier]
 * @property {()=> void} [callback]
**/
/**
 * @typedef {object} MsgBox
 * @property {HTMLDivElement} container
 * @property {HTMLDivElement} body
 * @property {(()=> void)[]} buttons
 * @property {()=> void} close
**/
/**
 * @const @global @namespace
 * @param {object}          params
 * @param {string}         [params.classModifier]
 * @param {string}         [params.header]
 * @param {string}         [params.icon]
 * @param {string}          params.body
 * @param {MsgBoxButton[]} [params.buttons]
 * @param {()=> void}      [params.closeCallback]
 * @returns {MsgBox}
**/
const msgBox= function(params){//TODO(v2): params validity checks
	const closeCallback= params.closeCallback, 
		container=   document.createElement('div'), 
		popupWindow= document.createElement('div'), 
		header=      document.createElement('div'), 
		body=        document.createElement('div'), 
		footer=      document.createElement('div')
	;
	var closed= false, tmp, tmp2;
	const privatePopup= {input: /** @type {InputHandler} */function(keyCode){ if( keyCode==backKey )close(closeCallback) }}, close= /** @param {()=> void} [callback] */function(callback){
		if( closed )
			return;
		closed= true;
		document.body.removeChild(container);
		input.removeInputSink(privatePopup, input.keyPriorities.msgPriority);
		if( callback )
			callback();
	}, cancel= function(){ close(closeCallback) };

	container.className= (params.classModifier ? "msg_box popup_base " +params.classModifier : 'msg_box popup_base');
	container.addEventListener('click', function(event){ if( event.target===container )close(closeCallback) });

	container.appendChild(popupWindow);

	if( params.header ){
		tmp= header.appendChild(document.createElement('div'));
		tmp.textContent= params.header;
		tmp= document.createElement('div');
		tmp.className= 'close_btn';//@ts-ignore
		tmp.addEventListener('click', cancel);
		tmp.appendChild(document.createElement('div'));
		header.appendChild(tmp);
	}
	popupWindow.appendChild(header);

	if( params.icon ){
		tmp= body.appendChild(document.createElement('img'));
		tmp.src= params.icon;
	}
	tmp= body.appendChild(document.createElement('div'));
	tmp.textContent= params.body;
	popupWindow.appendChild(body);

	/** @type {MsgBox["buttons"]} */
	const buttonArray= [];
	if( Array.isArray(params.buttons) ){
		for(tmp2 of params.buttons){
			tmp= footer.appendChild(document.createElement('div'));
			tmp.textContent= tmp2.name;
			if( tmp2.classModifier )
				tmp.className= tmp2.classModifier;
			tmp.classList.add('btn', 'btn-rounded', 'msg_box_btn');
			(function(callback){
				tmp2= function(){ close(callback) };//NOTE: var reuse
				tmp.addEventListener('click', tmp2);
				buttonArray.push(tmp2);
			})(tmp2.callback || closeCallback);
		}
	}
	popupWindow.appendChild(footer);

	document.body.appendChild(container);
	input.addInputSink(privatePopup, input.keyPriorities.msgPriority);

	return Object.freeze(/** @type {const} */({
		container: container, 
		body: body, 
		buttons: buttonArray, 
		close: cancel
	}));
};
