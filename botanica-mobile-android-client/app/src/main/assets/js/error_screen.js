//@ts-check
///<reference path="./core.js"/>
'use strict';

/** @const @global @namespace */
const errorScreen= (function(){


const container= /** @type {HTMLDivElement} */(document.getElementById('errorDiv')), div= /** @type {HTMLDivElement} */(document.getElementById('errorMsg'));


/** @lends errorScreen */
const module= {
	container: container, 
	visible: false, 

	/** @param {string} msg */
	show: function(msg){
		div.textContent= msg;
		if( !module.visible )
			core.showScreen(module);
	}, 
	hide: function(){
		if( module.visible )
			core.hideScreen(module);
	}
};


//@ts-ignore
core.registerModule(module);
return module;
})();
