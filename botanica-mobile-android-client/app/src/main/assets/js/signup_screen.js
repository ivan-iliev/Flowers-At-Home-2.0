//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./privacy_screen.js"/>
///<reference path="./start_screen.js"/>
'use strict';

/** @const @global @namespace */
const signupScreen= (function(){


const 
	nameField= /** @type {HTMLInputElement} */(document.getElementById('name')), 
	userSignField= /** @type {HTMLInputElement} */(document.getElementById('email-signup')), 
	passSignField= /** @type {HTMLInputElement} */(document.getElementById('password-signup')), 
	pass2Field= /** @type {HTMLInputElement} */(document.getElementById('password-repeat')), 
	signUpBtn= /** @type {HTMLButtonElement} */(document.getElementById('signup-btn')), 
	verificationList= [nameField, userSignField, passSignField, pass2Field, ]
;


/** @lends signupScreen */
const module= {
	container: /** @type {HTMLDivElement} */(document.getElementById('signUpDiv')),
	visible: false, 

	init: function(){
		userSignField.addEventListener('input', core.emailValidityCheck);
		nameField.addEventListener('input', core.nameValidityCheck);
		passSignField.addEventListener('input', function(){ core.pass1ValidityCheck(passSignField, userSignField) });
		pass2Field.addEventListener('input', function(){ core.pass2ValidityCheck(pass2Field, passSignField) });//@ts-ignore
		document.getElementById('log-in-href').addEventListener('click', loginScreen.show);
		signUpBtn.addEventListener('click', function(){
			if( core.checkValidity(verificationList) )
				return;
			

			core.callServer('user_add', {
				get: {user: userSignField.value, pass: passSignField.value, name: nameField.value}, 
				onSuccess: function(req, rc){ 
					var msgText = '';
					switch( rc ){
						case 600: homeScreen.show(true); return;
						case 602: msgText = translate("Failed to connect to the db"); break;
						case 604: msgText = translate("Database operation failure"); break;
						case 605: msgText = translate("Missing data"); break;
						case 611: msgText = translate("Username already exists"); break;
						case 615: msgText = translate("Invalid password"); break;
						default: msgText = translate("login error") + ": " +rc;			
					} 
					msgBox({body:msgText, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]}); 
				},
				onError: function(req, timeout){msgBox({body:translate("user_add error") + ": " +req.status, buttons: [{name: translate('ok'),  classModifier: 'btn-success'  }]}); }
			});
		});
	}, 
	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			startScreen.show();
		else if( document.activeElement===nameField )
			userSignField.focus();
		else if( document.activeElement===userSignField )
			passSignField.focus();
		else if( document.activeElement===passSignField )
			pass2Field.focus();
		else if( document.activeElement===pass2Field )
			signUpBtn.click();
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
