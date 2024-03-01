//@ts-check
///<reference path="./core.js"/>
'use strict';

/** @const @global */
const okKey= 13;
/** @const @global */
const backKey= 27;

/** @callback @typedef {(keyCode: number)=> (boolean|void)} InputHandler */


/** @const @global @namespace */
const input= (function(){


const /** @const @readOnly */
	keyPriorities= Object.freeze(/** @type {const} */({
		popupPriority: 0, 
		msgPriority: 10
	})), 
	/** @typedef {typeof keyPriorities[keyof typeof keyPriorities]} KeyPriority */
	/**
	 * @typedef {object} KeySink
	 * @property {object} object
	 * @property {KeyPriority} priority
	**/
	/** @type {KeySink[]} */
	keySinks= [], 
	/** @type {Set<KeySink>} */
	keySinks_fixer= new Set()
;


/** @lends input */
const module= {
	keyPriorities: keyPriorities, 

	init: function(){
		document.onkeydown= function(event){
			const keyCode= event.which;
			if( keyCode!=okKey && keyCode!=backKey || module.inputHandler(keyCode) )
				return;
			event.cancelBubble= true;
			event.returnValue= false;
			event.stopPropagation();
			event.preventDefault();
		};
	}, 

	/** @type {InputHandler} */
	inputHandler: function(keyCode){
		if( keySinks.length ){
			for(var keySink of keySinks.slice()){
				if( keySinks_fixer.has(keySink) && !keySink.object.input(keyCode) )
					return;
			}
		}
		if( core.currentScreen && core.currentScreen.input && !core.currentScreen.input(keyCode) )
			return;
		if( keyCode==backKey )
			system.exit();
		else
			return true;
	}, 

	/**
	 * @param {{input: InputHandler}} obj
	 * @param {KeyPriority} [priority= keyPriorities.popupPriority]
	**/
	addInputSink: function(obj, priority){
		if( priority!==keyPriorities.msgPriority )
			priority= keyPriorities.popupPriority;
		const /** @type {KeySink} */keySink= {object: obj, priority: priority};
		keySinks_fixer.add(keySink);
		for(var j in keySinks){
			if( priority < keySinks[j].priority )
				continue;//@ts-ignore
			keySinks.splice(j, 0, keySink);
			return;
		}
		keySinks.push(keySink);
	}, 
	/**
	 * @param {{input: InputHandler}} obj
	 * @param {KeyPriority} [priority= keyPriorities.popupPriority]
	**/
	removeInputSink: function(obj, priority){
		if( !keySinks.length )
			return;
		if( priority!==keyPriorities.msgPriority )
			priority= keyPriorities.popupPriority;
		var j, /** @type {KeySink} */keySink;
		for(j in keySinks){
			keySink= keySinks[j];
			if( keySink.object===obj && keySink.priority===priority ){//@ts-ignore
				keySinks.splice(j, 1);
				keySinks_fixer.delete(keySink);
				return;
			}
		}
	}
};


core.registerModule(module);
return module;
})();
