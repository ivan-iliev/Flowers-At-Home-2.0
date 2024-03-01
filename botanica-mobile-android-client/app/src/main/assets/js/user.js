//@ts-check
///<reference path="./core.js"/>
///<reference path="./home_screen.js"/>
///<reference path="./start_screen.js"/>
'use strict';

/** @const @global @namespace */
const user= (function(){//TODO(v2): data validations


var /** @type {HTMLImageElement} */
	userPic, 
	/** @type {HTMLDivElement} */
	userName, 
	/** @type {HTMLLabelElement} */
	label, 
	/** @type {File?} */
	fileContent, 
	/** @type {string?} */
	fileType, 
	/** @type {string?} */
	fileExt
;

const menuContainer= /** @type { HTMLDivElement} */(document.getElementById('userMenu')), 
	menuWindow=      /** @type { HTMLDivElement} */(             menuContainer.firstElementChild), 
	menuHeader=      /** @type { HTMLDivElement} */(                menuWindow.firstElementChild), 
	menuCloseBtn=    /** @type { HTMLDivElement} */(                 menuHeader.lastElementChild), 
	menuBody=        /** @type { HTMLDivElement} */(                 menuWindow.lastElementChild), // @ts-ignore
	edit=            /** @type { HTMLDivElement} */(menuBody.firstElementChild.firstElementChild), 
	editSpan=       /** @type {HTMLSpanElement} */(                       edit.lastElementChild), 
	logout=          /** @type { HTMLDivElement} */(                         edit.nextElementSibling), 
	logoutSpan=     /** @type {HTMLSpanElement} */(                     logout.lastElementChild), 
	deleteUser=      /** @type { HTMLDivElement} */(                       logout.nextElementSibling), 
	deleteUserSpan= /** @type {HTMLSpanElement} */(                 deleteUser.lastElementChild), 
	hideMenu= function(){
		if( !menu.visible )
			return;
		menu.visible= false;
		menuContainer.classList.add('gone');
		input.removeInputSink(menu);
	};
logoutSpan.textContent=     translate('logout');
editSpan.textContent=       translate('edit');
deleteUserSpan.textContent= translate('deleteUser');
const menu= {
	container: menuContainer, 
	visible: false, 

	init: function(){
		menuContainer.addEventListener('click', function(event){ if( event.target===menuContainer )hideMenu() });
		menuCloseBtn.addEventListener('click', hideMenu);
		logout.addEventListener('click', function(){ module.logout(false) });
		edit.addEventListener('click', function(){
			hideMenu();
			editPopup.show();
		});
		deleteUser.addEventListener('click', function(){ module.delete() });
	}, 
	reset: hideMenu, 
	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			hideMenu();
		else
			return true;
	}, 
	show: function(){
		if( menu.visible )
			return;
		menu.visible= true;
		menuContainer.classList.remove('gone');
		input.addInputSink(menu);
	}, 
	hide: hideMenu
};

const editContainer= /** @type {  HTMLDivElement} */(document.getElementById('userEdit')), 
	editWindow=      /** @type {  HTMLDivElement} */(                      editContainer.firstElementChild), 
	editHeader=      /** @type {  HTMLDivElement} */(                         editWindow.firstElementChild), 
	editCloseBtn=    /** @type {  HTMLDivElement} */(                          editHeader.lastElementChild), 
	editBody=        /** @type {  HTMLDivElement} */(                          editHeader.nextElementSibling), //@ts-ignore
	img=           /** @type {HTMLImageElement} */(         editBody.firstElementChild.firstElementChild), 
	userDiv=         /** @type {  HTMLDivElement} */(                                 img.nextElementSibling), //@ts-ignore
	nameDiv=         /** @type {  HTMLDivElement} */((label= userDiv.nextElementSibling).firstElementChild), 
	nameInput=     /** @type {HTMLInputElement} */(                               label.lastElementChild), //@ts-ignore
	batteryDiv=      /** @type {  HTMLDivElement} */((label=   label.nextElementSibling).firstElementChild), 
	batteryInput=  /** @type {HTMLInputElement} */(                               label.lastElementChild), //@ts-ignore
	pass1Div=        /** @type {  HTMLDivElement} */((label=   label.nextElementSibling).firstElementChild), 
	pass1Input=    /** @type {HTMLInputElement} */(                               label.lastElementChild), //@ts-ignore
	pass2Div=        /** @type {  HTMLDivElement} */((label=   label.nextElementSibling).firstElementChild), 
	pass2Input=    /** @type {HTMLInputElement} */(                               label.lastElementChild), //@ts-ignore
	fileDiv=         /** @type {  HTMLDivElement} */((label=   label.nextElementSibling).firstElementChild), 
	fileInput=     /** @type {HTMLInputElement} */(                               label.lastElementChild), //@ts-ignore
	deleteSpan=     /** @type { HTMLSpanElement} */((label=   label.nextElementSibling).firstElementChild), 
	deleteInput=   /** @type {HTMLInputElement} */(                               label.lastElementChild), 
	footer=          /** @type {  HTMLDivElement} */(                          editWindow.lastElementChild), 
	sendBtn=         /** @type {  HTMLDivElement} */(                             footer.firstElementChild), 
	cancelBtn=       /** @type {  HTMLDivElement} */(                              footer.lastElementChild), 
	verificationList= [nameInput, batteryInput, pass1Input, pass2Input, ], 
	hideEdit= function(){
		if( !editPopup.visible )
			return;
		editPopup.visible= false;
		editContainer.classList.add('gone');
		input.removeInputSink(editPopup);
		if( fileContent )
			fileContent= null;
		fileInput.value= '';
	}
;
nameDiv.textContent=    translate('Name') +": ";
batteryDiv.textContent= translate('Battery Warning Level') +": ";
pass1Div.textContent=   translate('New Password') +": ";
pass2Div.textContent=   translate('Repeat New Password') +": ";
fileDiv.textContent=    "   "+translate('Profile Picture');
deleteSpan.textContent= translate('Delete Profile Picture') +": ";
sendBtn.textContent=   translate('Submit');
cancelBtn.textContent= translate('Cancel');
///** @returns {boolean} */
//const fieldsValidityCheck= function(){//TODO
//	return true;
//};

const editPopup= {
	container: editContainer, 
	visible: false, 

	init: function(){
		img.src= module.defaultPic;
		editContainer.addEventListener('click', function(event){ if( event.target===editContainer )hideEdit() });
		editCloseBtn.addEventListener('click', hideEdit);
		cancelBtn.addEventListener('click', hideEdit);
		nameInput.addEventListener('input', core.nameValidityCheck);
		batteryInput.addEventListener('input', core.percentageValidityCheck);
		pass1Input.addEventListener('input', core.pass1OptValidityCheck);
		pass2Input.addEventListener('input', function(){ core.pass2ValidityCheck(pass2Input, pass1Input) });
		fileInput.addEventListener('change', function(){
			const files= /** @type {FileList} */(fileInput.files);
			if( !files.length )
				return;
			const file= files[0], ext= core.fileTypeValidityCheck(file.name);
			if( !ext )
				msgBox({body:translate("invalid image type"), buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});
			deleteInput.checked= false;
			fileContent= file;
			fileType= file.type;
			fileExt= ext;
			img.src= URL.createObjectURL(file.slice());
		});
		deleteInput.addEventListener('change', function(){
			if( deleteInput.checked ){
				if( fileContent )
					fileContent= null;
				img.src= module.defaultPic;
			}else{
				img.src= module.picture;
			}
		});
		sendBtn.addEventListener('click', function(){
			if( core.checkValidity(verificationList) )
				return;
			//if( !fieldsValidityCheck() )
			//	msgBox({body:translate("invalid data"), buttons: [{name: translate('ok')  }]});

			const /** @type {Parameters<typeof core.callServer>[1]} */params= {
				method: 'POST', 
				get: {battery: batteryInput.value, name: nameInput.value}, 
				onSuccess: function(req, rc){ 
					var msgText = '';
					switch( rc ){
						case 600: 	
						img.src= '';
						try{//@ts-ignore
							const prc= req.getResponseHeader('x-prc') |0;
							if( prc )
								msgBox({body:translate("picture upload failure")+ ": " +prc, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});
						}catch(e){
						}
						hideEdit();
						homeScreen.show(true);
						return;
						case 602: msgText = translate("Failed to connect to the db"); break;
						case 604: msgText = translate("Database operation failure"); break;
						case 610: msgText = translate("unsupported picture"); break;
						case 613: msgText = translate("Incorrect data submitted"); break;
						case 615: msgText = translate("Invalid password"); break;

						default:msgText = translate(translate("error")+ ": " +rc);
					} 

					msgBox({body:msgText, buttons: [{name: translate('ok'), classModifier: "btn-success"}]});
				}, 
				onError: function(req, timeout){msgBox({body:translate("error")+ ": " +req.status, buttons: [{name: translate('ok'), classModifier: 'btn-success'  }]});}
			};
			if( pass1Input.value )
				params.get.pass= pass1Input.value;
			if( deleteInput.checked )
				params.get.delete_pic= 1;

			if( !deleteInput.checked && fileContent ){
				params.body= fileContent.slice();
				if( fileExt )
					params.get.type= fileExt;
				if( fileType )
					params.headers= {"Content-Type": fileType};
			}
			core.callServer('user_update', params);
		});
	}, 
	reset: hideEdit, 
	/** @type {InputHandler} */
	input: function(keyCode){
		if( keyCode==backKey )
			hideEdit();
		else
			return true;
	}, 
	show: function(){
		if( editPopup.visible )
			return;
		editPopup.visible= true;
		img.src= module.picture;
		nameInput.value= module.name;//@ts-ignore
		batteryInput.value= module.battery;
		pass1Input.value= 
		pass2Input.value= '';
		deleteInput.checked= false;
		editContainer.classList.remove('gone');
		core.verify(verificationList);
		input.addInputSink(editPopup);
	}, 
	hide: hideEdit
};


/** @lends user */
const module= {//TODO(v2): data validations
	defaultPic: /** @type {const} */('css/img/default_user.png'), 
	/** @type {string?} */
	user: null, 
	/** @type {string} */
	name: '', 
	/** @type {string} */
	picture: /** @type {string} */(/** @type {unknown} */(null)), 
	/** @type {number} */
	battery: 20, 

	init: function(){
		module.picture= module.defaultPic;//@ts-ignore
		const userBar= /** @type {HTMLDivElement} */(homeScreen.container.firstElementChild.firstElementChild);//@ts-ignore
		userPic= userBar.firstElementChild;//@ts-ignore
		userName= userBar.lastElementChild;
		userBar.addEventListener('click', menu.show);
		menu.init();
		editPopup.init();
	}, 
	reset: function(){
		menu.reset();
		editPopup.reset();
	}, 
	/** @param {{user: string, name: string, picture: string, battery: number}} data  @returns {boolean} */
	parse: function(data){//TODO(v2): data validations
		if( !data.user || !data.battery )
			return false;

		userDiv.textContent= 
		module.user= data.user;

		userName.textContent= 
		module.name= data.name;

		userPic.src= 
		module.picture= (data.picture ? core.domain +data.picture : module.defaultPic);

		module.battery= data.battery;

		return true;
	}, 

	add: function(){ signupScreen.show() }, 
	delete: function(){ msgBox({body: translate("Delete user")+": "+module.name +"?", buttons: [
		{name: translate('ok'), classModifier: 'btn-success'  , callback: function(){ core.callServer('user_delete', {onSuccess: function(req, rc){
			var msgText = '';
			switch( rc ){
				case 600: core.reset(); return;
				case 602: msgText = translate("Failed to connect to the db"); break;
				case 604: msgText = translate("Database operation failure"); break;
				default:msgText = translate(translate("user_delete error")+ ": " +rc);
			} 
		}, onError: function(req, timeout){ msgBox({body:translate("error")+ ": " +req.status, buttons: [{name: 'ok',  classModifier: 'btn-success'}]})}}) }}, 
		{name: translate('Cancel'), classModifier: "btn-danger"}
	] }) }, 
	/** @param {boolean?} [doNotAsk] */
	logout: function(doNotAsk){
		const f= function(){ core.callServer('logout', {onSuccess: core.reset, onError: function(req, timeout){  msgBox({body:translate("logout error")+ ": " +req.status, buttons: [{name: 'ok',  classModifier: 'btn-success'}]}) }}) };
		if( doNotAsk )
			return f();
		msgBox({body: translate('Are you sure you want to logout')+ '?', buttons: [
			{name: translate('ok') , classModifier: 'btn-success' , callback: f}, 
			{name: translate('Cancel'), classModifier: "btn-danger btn-rounded"}
		] });
	}
};


core.registerModule(module);
return module;
})();
