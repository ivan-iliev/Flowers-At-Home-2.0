//@ts-check
///<reference path="./core.js"/>
'use strict';

/** @const @global @namespace */
const privacyScreen= (function(){


/** @lends privacyScreen */
const module= {
	container: /** @type {HTMLDivElement} */(document.getElementById('privacyDiv')),
	visible: false,
	init: function(){
	},
	/** @type {InputHandler} */
    input: function(keyCode){
        if( keyCode==backKey )
            startScreen.show();
        else
            return true;
    },
	show: function(){
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
