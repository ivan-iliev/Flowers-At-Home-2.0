//@ts-check
///<reference path="./core.js"/>
///<reference path="./login_screen.js"/>
///<reference path="./privacy_screen.js"/>
///<reference path="./signup_screen.js"/>
'use strict';

/** @const @global @namespace */
const startScreen= (function(){


/** @lends startScreen */
const module= {
	container: /** @type {HTMLDivElement} */(document.getElementById('startDiv')), 
	visible: false, 

	init: function(){//@ts-ignore
		document.getElementById('logInButton').addEventListener('click', loginScreen.show);//@ts-ignore
		document.getElementById('signUpButton').addEventListener('click', signupScreen.show);//@ts-ignore
		document.getElementById('privacy-href').addEventListener('click', privacyScreen.show);
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


core.registerModule(module);
return module;
})();
