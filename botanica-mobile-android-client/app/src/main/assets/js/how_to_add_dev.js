//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
'use strict';

/** @const @global @namespace */
const howToScreen= (function(){



/** @lends howToScreen */
const module= {
	container: /** @type {HTMLDivElement} */(document.getElementById('addDeviceDiv')),
	visible: false,
	init: function(){
	    // @ts-ignore
	    document.getElementById('backHowToBtn').addEventListener('click', homeScreen.show);
	},
	/** @type {InputHandler} */
    input: function(keyCode){
        if( keyCode==backKey )
            homeScreen.show();
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
