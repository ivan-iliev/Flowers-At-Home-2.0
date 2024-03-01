//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./signup_screen.js"/>
'use strict';

/** @const @global @namespace */
const loginScreen= (function(){


const 
	userField= /** @type {HTMLInputElement} */(document.getElementById('email')), 
	passField= /** @type {HTMLInputElement} */(document.getElementById('password')), 
	loginBtn= /** @type {HTMLButtonElement} */(document.getElementById('loginBtn')), 
	verificationList= [userField, ]
;


/** @lends loginScreen */
const module= {
	container: /** @type {HTMLDivElement} */(document.getElementById('logInDiv')), 
	visible: false, 

	init: function(){
		userField.addEventListener('input', core.emailValidityCheck);//@ts-ignore
		document.getElementById('sign-up-href').addEventListener('click', signupScreen.show);
		loginBtn.addEventListener('click', function(){
			if( core.checkValidity(verificationList) )
				return;
			core.callServer('login', {
				get: {user: userField.value, pass: passField.value}, 
				onSuccess: function(req, rc){
					var msgText = '';
					switch( rc ){
						case 600: homeScreen.show(true); return;
						case 601: msgText = translate("wrong user or pass"); break;
						case 602: msgText = translate(translate("Failed to connect to the db")); break;
						case 603: msgText = translate(translate("The user is suspended")); break;
						case 605: msgText = translate(translate("Missing data")); break;
						default: msgText = translate(translate("login error") + ": " +rc); break;	
					} 
					msgBox({body:msgText, buttons: [{name: translate('ok'),  classModifier: 'btn-success'}]});
				}, 
				onError: function(req, timeout){ 
					msgBox({body:translate("login error") + ": " +req.status, buttons: [{name: translate('ok'),  classModifier: 'btn-success'}]});
				}, 
				login: true
			});
		});
	},
	/** @type {InputHandler} */
    input: function(keyCode){
    	if( keyCode==backKey )
    		startScreen.show();
		else if( document.activeElement===userField )
			passField.focus();
		else if( document.activeElement===passField )
			loginBtn.click();
    	else
    		return true;
    },
	show: function(){
		if( !module.visible )
			core.showScreen(module, verificationList);
	}, 
	hide: function(){
		if( module.visible )
			core.hideScreen(module);
	}
};


core.registerModule(module);
return module;
})();
