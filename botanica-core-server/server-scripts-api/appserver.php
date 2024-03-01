<?php
$dataPath= '../data';
require("$dataPath/common.php");
require("$dataPath/db.php");
/*** PARAMS *************************************************************************************************
log:             msg, type?
login:           user, pass
logout: 
get: 
user_delete: 
user_reset_pass: user
user_add:        user, pass, name?
user_update:     battery, pass?, name?, delete_pic?, type?
get_data:        device_id, from, to
device_delete:   device_id
device_update:   device_id, active, interval, name?, preset_id?, delete_pic?, type?
device_add:      user, pass, mac, interval, name?, model_id?
preset_delete:   preset_id
preset_update:   active, temperature_min, temperature_max, humidity_min, humidity_max, light_min, light_max, salt_min, salt_max, soil_min, soil_max, preset_id, name?, delete_pic?, type?
preset_add:      active, temperature_min, temperature_max, humidity_min, humidity_max, light_min, light_max, salt_min, salt_max, soil_min, soil_max, name?, type?
/*** PARAMS ************************************************************************************************/
/*** rc/prc *************************************************************************************************
log:             600
login:           600, 601, 602, 603,      605
logout:          600,                               612
get:             600,      602, 603,                612,      614
user_delete:     600,      602, 603, 604,           612,      614
user_reset_pass:           602, 603, 604, 605,           613, 616
user_add:        600,      602,      604, 605, 611,                615
user_update:     600,      602, 603, 604,      610, 612, 613, 614, 615 / x-prc: 604, 608, 613
get_data:        600,      602, 603, 604, 605,      612, 613, 614
device_delete:   600,      602, 603, 604, 605,      612, 613, 614
device_update:   600,      602, 603, 604, 605, 610, 612, 613, 614      / x-prc: 604, 608, 613
device_add:      600, 601, 602, 603, 604, 605,           613
preset_delete:   600,      602, 603, 604, 605,      612, 613, 614
preset_update:   600,      602, 603, 604, 605, 610, 612,      614      / x-prc: 604, 608, 613
preset_add:      600,      602, 603, 604, 605, 610, 612,      614      / x-prc: 604, 608, 613
!==:             606, 699
/*** rc/prc ************************************************************************************************/


//record("data_headers= " .json_encode(getallheaders()), 'debug');
//record("data_post= "    .json_encode($_POST),          'debug');
//record("data_get= "     .json_encode($_GET),           'debug');
//record("data_params= "  .json_encode($PARAMS),         'debug');
$api= ($PARAMS['api'] ?? null);
record("api= $api", 'access');
if( $requestMethod==='OPTIONS' ){
	finish(200);
	exit;
}


switch( $api ){
	case 'log': {
		record("\n" .$PARAMS['msg'], fsEscape($PARAMS['type'] ?? 'debug'));
		finish(200, 600);
	}exit;
	case 'login': {
		$user= ($PARAMS['user'] ?? null);
		$pass= ($PARAMS['pass'] ?? null);
		$passLen= strlen($pass);
		if( $user===null || $pass===null ){
			record("(605) missing data - user= $user, pass= " .($pass!==null ? 'not ' : '') ."null, passLen= $passLen", 'error');
			finish(400, 605);
			exit;
		}

		rwLink();
		$handle= $linkRW->prepare("SELECT *, pass = crypt(:pass, pass) AS pass_match, temp_pass = crypt(:pass, temp_pass) AS temp_pass_match FROM users WHERE email=:user");
		$userData= ($handle->execute(['user'=> $user, 'pass'=> $pass]) ? $handle->fetchAll() : null);
		if( !$userData || !($userData= $userData[0]) || !($userData['pass_match'] || $userData['temp_pass_match']) ){
			record("(601) wrong user or pass - user= $user, passLen= $passLen", 'error');
			finish(401, 601);
			exit;
		}
		if( !$userData['active'] ){
			record("(603) suspended user - userID= " .$userData['user_id'] .", user= $user", 'error');
			finish(403, 603);
			exit;
		}

		$query= null;
		if( $userData['temp_pass'] !== null ){
			if( $userData['pass_match'] )
				$query= "UPDATE users SET temp_pass= NULL WHERE user_id=$userID";
			else if( $userData['temp_pass_match'] )
				$query= "UPDATE users SET pass= temp_pass, temp_pass= NULL WHERE user_id=$userID";
			if( $query ){
				$handle= $linkRW->prepare($query);
				$userID= $userData['user_id'];
				if( !$handle->execute() )
					record("(604) db operation failure - user= $user, passLen= $passLen, userID= $userID, query= $query", 'error');
			}
		}
		session_start();
		$_SESSION['userID']= $userData['user_id'];
		$_SESSION['user']=   $userData[  'email'];
		$_SESSION['pass']=   $userData[   'pass'];
		record("(600) user login - userID= " .$_SESSION['userID'] .", user= $user", 'security');
		finish(200, 600);
	}exit;
	case 'user_add': {
		$user= ($PARAMS['user'] ?? null);
		$pass= ($PARAMS['pass'] ?? null);
		$passLen= strlen($pass);
		$name= ($PARAMS['name'] ?? null);
		if( $name===null )
			$name= '';
		if( $user===null || !filter_var($user, FILTER_VALIDATE_EMAIL) || $pass===null ){
			record("(605) missing data - user= $user, pass= " .($pass!==null ? 'not ' : '') ."null, passLen= $passLen", 'error');
			finish(400, 605);
			exit;
		}
		if( $passLen<$minPassLength || $maxPassLength<$passLen || $user===$pass ){
			record("(615) invalid password - user= $user, passLen= $passLen", 'error');
			finish(400, 615);
			exit;
		}
		rwLink();

		$handle= $linkRW->prepare("SELECT user_id FROM users WHERE email=:user");
		$handle->execute(['user'=> $user]);
		$userData= $handle->fetchAll();
		if( $userData ){
			record("(611) username already exists - user= $user", 'error');
			finish(403, 611);
			exit;
		}

		$query= "INSERT INTO users (email, pass, name) VALUES (:user, crypt(:pass, gen_salt('bf')), :name) RETURNING *";
		$handle= $linkRW->prepare($query);
		$userData= ($handle->execute(['user'=> $user, 'pass'=> $pass, 'name'=> $name]) ? $handle->fetchAll() : null);
		if( !$userData ){
			record("(604) db operation failure - user= $user, passLen= $passLen, name= $name, query= $query", 'error');
			finish(500, 604);
			exit;
		}
		$userData= $userData[0];
		session_start();
		$_SESSION['userID']= $userData['user_id'];
		$_SESSION['user']=   $userData[  'email'];
		$_SESSION['pass']=   $userData[   'pass'];
		record("(600) user registration - userID= " .$_SESSION['userID'] .", user= $user", 'security');
		finish(200, 600);
	}exit;
	case 'user_reset_pass': {
		$user= ($PARAMS['user'] ?? null);
		if( !$user ){
			record("(605) missing data - user= $user", 'error');
			finish(400, 605);
			exit;
		}
		$userInfo= "userIP= $userIP, user= $user";
		rwLink();

		$handle= $linkRW->prepare("SELECT * FROM users WHERE email=:user");
		$handle->execute(['user'=> $user]);
		$userData= $handle->fetchAll();
		if( !$userData ){
			record("(613) incorrect data submitted - $userInfo", 'error');
			finish(400, 613);
			exit;
		}
		$userData= $userData[0];
		if( !$userData['active'] ){
			record("(603) suspended user - $userInfo", 'error');
			finish(403, 603);
			exit;
		}

		$pass= getRandomPass();
		$query= "UPDATE users SET temp_pass= crypt(:pass, gen_salt('bf')) WHERE user_id=" .$userData['user_id'];
		$data= ['pass'=> $pass];
		$handle= $linkRW->prepare($query);
		if( !$handle->execute($data) ){
			record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		record("set temp_pass for user - email= " .$userData['email'] .", pass= $pass", 'security');

		if( !sendTempPass($userData['email'], $pass) ){
			record("(616) failed to send email - email= " .$userData['email'] .", pass= $pass", 'error');
			finish(500, 616);
			exit;
		}
		record("(600) sent temp_pass for user - $userInfo, pass= $pass", 'security');
		finish(200, 600);
	}exit;
	case 'device_add': {
		$user= ($PARAMS['user'] ?? null);
		$pass= ($PARAMS['pass'] ?? null);
		$passLen= strlen($pass);
		$mac= ($PARAMS['mac'] ?? null);
		if( $user===null || $pass===null || !$mac ){
			record("(605) missing data - user= $user, pass= " .($pass!==null ? 'not ' : '') ."null, passLen= $passLen, mac= $mac", 'error');
			finish(400, 605);
			exit;
		}
		$interval= intval(($PARAMS['interval'] ?? null), 10);
		if( $interval<$minInterval ){
			record("(613) incorrect data submitted - interval= $interval, user= $user", 'error');
			finish(400, 613);
			exit;
		}

		rwLink();
		$handle= $linkRW->prepare("SELECT * FROM users WHERE email=:user AND pass = crypt(:pass, pass)");
		$userData= ($handle->execute(['user'=> $user, 'pass'=> $pass]) ? $handle->fetchAll() : null);
		if( !$userData ){
			record("(601) wrong user or pass - user= $user, passLen= $passLen", 'error');
			finish(401, 601);
			exit;
		}
		$userData= $userData[0];
		$userInfo= "userID= " .$userData['user_id'] .", user= $user";
		if( !$userData['active'] ){
			record("(603) suspended user - $userInfo", 'error');
			finish(403, 603);
			exit;
		}

		$name= ($PARAMS['name'] ?? null);
		$modelID= intval(($PARAMS['model_id'] ?? null), 10);
		if( !$modelID )
			$modelID= 1;
		$query= "INSERT INTO devices (model_id, user_id, applied_interval, interval, mac, name) VALUES ($modelID, " .$userData['user_id'] .", $interval, $interval, :mac, :name) RETURNING *";
		$data= ['mac'=> $mac, 'name'=> $name];
		$handle= $linkRW->prepare($query);
		$deviceData= ($handle->execute($data) ? $handle->fetchAll() : null);
		if( !$deviceData ){
			record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		finish(200, 600);
	}exit;

	case   'user_delete': case   'user_update': case 'user_reset_pass': 
	case 'device_delete': case 'device_update': case 'get_data': 
	case 'preset_delete': case 'preset_update': case 'preset_add': 
	case 'get': case 'logout': break;

	default: 
		record("(606) unrecognized api ($api)", 'error');
		finish(400, 606);
	exit;
}


session_start();
$userID= intval(($_SESSION['userID'] ?? null), 10);
if( !$userID || $api==='logout' ){
	logout(true);
	exit;
}
$user= $_SESSION['user'];
$userInfo= "userID= $userID, user= $user";
rwLink();

$handle= $linkRW->prepare("SELECT * FROM users WHERE user_id=$userID");
$handle->execute();
$userData= $handle->fetchAll();
if( !$userData ){
	record("(614) invalid session - $userInfo", 'error');
	finish(403, 614);
	logout();
	exit;
}
$userData= $userData[0];
if( !$userData['active'] ){
	record("(603) suspended user - $userInfo", 'error');
	finish(403, 603);
	logout();
	exit;
}
if( $userData['pass'] !== $_SESSION['pass'] ){
	record("(614) invalid session - $userInfo", 'error');
	finish(403, 614);
	logout();
	exit;
}


$deviceID= $presetID= 0;
$deviceData= $presetData= null;
switch( $api ){
	case 'get': {
		$res= [
			"user"=> ["user"=> $user, "name"=> $userData['name'], "picture"=> $userData['picture'], "battery"=> floatval($userData['battery'])], 
			"models"=> [], 
			"presets"=> [], 
			"devices"=> []
		];

		$handle= $linkRW->prepare("SELECT * FROM models");
		$handle->execute();
		$data= $handle->fetchAll();
		if( $data ){
			foreach($data as $value)
				$res['models'][]= ["modelID"=> $value['model_id'], "picture"=> $value['picture'], "name"=> $value['name']];
		}

		$handle= $linkRW->prepare("SELECT * FROM presets WHERE (user_id IS NULL AND active) OR user_id=$userID");
		$handle->execute();
		$data= $handle->fetchAll();
		if( $data ){
			foreach($data as $value){
				$res['presets'][]= [
					"system"=>    $value['user_id'] === null, 
					"presetID"=>  $value['preset_id'], 
					"createdOn"=> $value['created_on'], 
					"picture"=>   $value['picture'], 
					"active"=>    $value['active'], 
					"name"=>      $value['name'], 

					"temperatureMin"=> $value['temperature_min'], 
					"temperatureMax"=> $value['temperature_max'], 
					"humidityMin"=>    $value[   'humidity_min'], 
					"humidityMax"=>    $value[   'humidity_max'], 
					"lightMin"=>       $value[      'light_min'], 
					"lightMax"=>       $value[      'light_max'], 
					"saltMin"=>        $value[       'salt_min'], 
					"saltMax"=>        $value[       'salt_max'], 
					"soilMin"=>        $value[       'soil_min'], 
					"soilMax"=>        $value[       'soil_max']
				];
			}
		}

		$handle= $linkRW->prepare("
			SELECT a.*, d.* 
			FROM devices d 
			LEFT JOIN LATERAL (SELECT a.* FROM data a WHERE a.device_id=d.device_id ORDER BY a.created_on DESC LIMIT 1) a ON true 
			WHERE d.user_id=$userID
		");
		$handle->execute();
		$data= $handle->fetchAll();
		if( $data ){
			foreach($data as $value){
				$res['devices'][]= [
					"deviceID"=> $value['device_id'], 
					"presetID"=> $value['preset_id'], 
					"modelID"=>  $value[ 'model_id'], 
					"picture"=>  $value[  'picture'], 
					"active"=>   $value[   'active'], 
					"name"=>     $value[     'name'], 
					"mac"=>      $value[      'mac'], 
					"appliedInterval"=> $value['applied_interval'], 
					"interval"=>        $value[        'interval'], 
					"lastData"=> [
						"timestamp"=>      $value[       'timestamp'], 
						"humidity"=>       $value[        'humidity'], 
						"light"=>          $value[           'light'], 
						"salt"=>           $value[            'salt'], 
						"soil"=>           $value[            'soil'], 
						"flood"=>          $value[           'flood'], 
						"battery"=>        $value[         'battery'], 
						"temperature"=>    $value[     'temperature'], 
						"emptyWaterTank"=> $value['empty_water_tank']
					]
				];
			}
		}
		finish(200, 600);
		echo json_encode($res);
	}exit;
	case 'user_delete': {
		$query= "DELETE FROM users WHERE user_id=$userID";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute() ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		rm_rf("$picsBase/users/$userID");
		finish(200, 600);
		logout();
	}exit;
	case 'user_update': break;

	case 'device_update': case 'device_delete': case 'get_data': {
		$deviceID= intval(($PARAMS['device_id'] ?? null), 10);
		if( !$deviceID ){
			record("(605) missing data - device_id= $deviceID, $userInfo", 'error');
			finish(400, 605);
			exit;
		}
		$query= "SELECT * FROM devices WHERE user_id=$userID AND device_id=$deviceID";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute() ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		$deviceData= $handle->fetchAll();
		if( !$deviceData ){
			record("(613) incorrect data submitted - $userInfo, data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(400, 613);
			exit;
		}
		$deviceData= $deviceData[0];
	}break;

	case 'preset_update': case 'preset_delete': {
		$presetID= intval(($PARAMS['preset_id'] ?? null), 10);
		if( !$presetID ){
			record("(605) missing data - preset_id= $presetID, $userInfo", 'error');
			finish(400, 605);
			exit;
		}
		$query= "SELECT * FROM presets WHERE user_id=$userID AND preset_id=$presetID";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute($data) ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		$presetData= $handle->fetchAll();
		if( !$presetData ){
			record("(613) incorrect data submitted - $userInfo, data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(400, 613);
			exit;
		}
		$presetData= $presetData[0];
	}
	case 'preset_add': break;

	default: {
		record("(699) not yet implemented - api= $api", 'error');
		finish(500, 699);
	}exit;
}


switch( $api ){
	case 'get_data': {
		$from= intval(($PARAMS['from'] ?? null), 10);
		$to= intval(($PARAMS['to'] ?? null), 10);
		if( $to<=$from ){
			record("(613) incorrect data submitted - from= " .$PARAMS['from'] .", to= " .$PARAMS['to'] .", $userInfo", 'error');
			finish(400, 613);
			exit;
		}

		$query= "SELECT * FROM data WHERE device_id=$deviceID AND $from<=timestamp AND timestamp<=$to";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute() ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		$res= [];
		$history= $handle->fetchAll();
		if( $history ){
			foreach($history as $value){
				unset($value['device_id']);
				unset($value['created_on']);
				$res[]= $value;
				//record(json_encode($value), 'debug');
				//$res[]= ["temperature"=> $value['temperature'], "timestamp"=> $value['timestamp'], "humidity"=> $value['humidity'], "light"=> $value['light'], "salt"=> $value['salt'], "soil"=> $value['soil'], "flood"=> $value['flood'], "empty_water_tank"=> $value['empty_water_tank'], "battery"=> $value['battery']];
			}
		}
		finish(200, 600);
		echo json_encode($res);
	}exit;
	case 'device_delete': {
		$query= "DELETE FROM devices WHERE device_id=$deviceID";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute() ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		if( $deviceData['picture'] !== null )
			rename($deviceData['picture'], $deviceData['picture'] .".bkp");
		finish(200, 600);
	}exit;
	case 'preset_delete': {
		$query= "DELETE FROM presets WHERE preset_id=$presetID";
		$handle= $linkRW->prepare($query);
		if( !$handle->execute() ){
			record("(604) db operation failure - query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		if( $presetData['picture'] !== null )
			rename($presetData['picture'], $presetData['picture'] .".bkp");
		finish(200, 600);
	}exit;
}


$type= strtolower($PARAMS['type'] ?? null);
$pic= strlen($type)>0;
$deletePic= ($PARAMS['delete_pic'] ?? null);
$del= $api!=='preset_add' && !$pic && $deletePic && $deletePic!='0';
if( $pic && !$del && !preg_match("/^(jpe?g|png|svg|gif|bmp|webp|avif|tiff?)$/", $type) ){
	record("(610) unsupported picture - type= $type, $userInfo", 'error');
	finish(400, 610);
	exit;
}

$filename= $oldName= $query= $data= null;
switch( $api ){
	case 'user_update': {
		$pass= ($PARAMS['pass'] ?? null);
		$passLen= strlen($pass);
		$name= ($PARAMS['name'] ?? '');
		if( $name===null )
			$name= '';
		$battery= floatval($PARAMS['battery'] ?? null);
		if( $passLen>0 && ($passLen<$minPassLength || $maxPassLength<$passLen || $user===$pass) ){
			record("(615) invalid password - user= $user, passLen= $passLen", 'error');
			finish(400, 615);
			exit;
		}
		if( $battery<0 || 100<$battery ){
			record("(613) incorrect data submitted - battery= " .$PARAMS['battery'] .", $userInfo", 'error');
			finish(400, 613);
			exit;
		}

		$oldName= $userData['picture'];
		$query= "UPDATE users SET name= :name, battery= $battery" .($passLen>0 ? ", pass= crypt(:pass, gen_salt('bf'))" : '') .($userData['temp_pass'] !== null ? ', temp_pass= NULL' : '') .($del && $oldName !== null ? ', picture= NULL' : '') ." WHERE user_id=$userID RETURNING *";
		//$data= ['name'=> $name, 'battery'=> $battery, 'pass'=> $pass, 'userID'=> $userID];
		$data= ['name'=> $name];
		if( $passLen>0 )
			$data['pass']= $pass;
		$handle= $linkRW->prepare($query);
		if( !$handle->execute($data) ){
			if( $passLen>0 )
				record("(604) db operation failure - name= $name, passLen= $passLen, query= $query, $userInfo", 'error');
			else
				record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		$data= $handle->fetchAll();
		if( $data )
			$_SESSION['pass']= $data[0]['pass'];
		if( $pic ){
			$filename= "$picsBase/users/$userID/user.$type";
			$query= "UPDATE users SET picture= :picture WHERE user_id=:userID";
			$data= ['picture'=> $filename, 'userID'=> $userID];
		}
	}break;
	case 'device_update': {
		$active= ($PARAMS['active'] ?? null);
		$name= ($PARAMS['name'] ?? '');
		if( $active===null ){
			record("(605) missing data - active= $active, $userInfo", 'error');
			finish(400, 605);
			exit;
		}
		$interval= intval(($PARAMS['interval'] ?? null), 10);
		if( $interval<10000 ){
			record("(613) incorrect data submitted - interval= " .$PARAMS['interval'] .", $userInfo", 'error');
			finish(400, 613);
			exit;
		}
		$presetID= intval(($PARAMS['preset_id'] ?? null), 10);
		if( !$presetID )
			$presetID= 'NULL';
		$active= ($active!='0' ? 'TRUE':'FALSE');

		$oldName= $deviceData['picture'];
		$query= "UPDATE devices SET preset_id= $presetID, active= $active, interval= $interval, name= :name" .($del && $oldName ? ', picture= NULL' : '') ." WHERE device_id=$deviceID";
		$data= ['name'=> $name];
		$handle= $linkRW->prepare($query);
		if( !$handle->execute($data) ){
			record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			finish(500, 604);
			exit;
		}
		if( $pic ){
			$filename= "$picsBase/users/$userID/device.$deviceID.$type";
			$query= "UPDATE devices SET picture= :filename WHERE device_id=:deviceID";
			$data= ['deviceID'=> $deviceID, 'filename'=> $filename];
		}
	}break;
	case 'preset_add': case 'preset_update': {
		$active= ($PARAMS['active'] ?? null);
		$name= ($PARAMS['name'] ?? '');
		$temperatureMin= ($PARAMS['temperature_min'] ?? null);
		$temperatureMin= ($temperatureMin!==null ? floatval($temperatureMin) : 'NULL');
		$temperatureMax= ($PARAMS['temperature_max'] ?? null);
		$temperatureMax= ($temperatureMax!==null ? floatval($temperatureMax) : 'NULL');
		$humidityMin= ($PARAMS['humidity_min'] ?? null);
		$humidityMin= ($humidityMin!==null ? floatval($humidityMin) : 'NULL');
		$humidityMax= ($PARAMS['humidity_max'] ?? null);
		$humidityMax= ($humidityMax!==null ? floatval($humidityMax) : 'NULL');
		$lightMin= ($PARAMS['light_min'] ?? null);
		$lightMin= ($lightMin!==null ? floatval($lightMin) : 'NULL');
		$lightMax= ($PARAMS['light_max'] ?? null);
		$lightMax= ($lightMax!==null ? floatval($lightMax) : 'NULL');
		$saltMin= ($PARAMS['salt_min'] ?? null);
		$saltMin= ($saltMin!==null ? floatval($saltMin) : 'NULL');
		$saltMax= ($PARAMS['salt_max'] ?? null);
		$saltMax= ($saltMax!==null ? floatval($saltMax) : 'NULL');
		$soilMin= ($PARAMS['soil_min'] ?? null);
		$soilMin= ($soilMin!==null ? floatval($soilMin) : 'NULL');
		$soilMax= ($PARAMS['soil_max'] ?? null);
		$soilMax= ($soilMax!==null ? floatval($soilMax) : 'NULL');
		if( $active===null || !($temperatureMin!=='NULL' || $temperatureMax!=='NULL' || $humidityMin!=='NULL' || $humidityMax!=='NULL' || $lightMin!=='NULL' || $lightMax!=='NULL' || $saltMin!=='NULL' || $saltMax!=='NULL' || $soilMin!=='NULL' || $soilMax!=='NULL') ){
			record("(605) missing data - active= $active, temperature_min= " .$PARAMS['temperature_min'] .", temperature_max= " .$PARAMS['temperature_max'] .", humidity_min= " .$PARAMS['humidity_min'] .", humidity_max= " .$PARAMS['humidity_max'] .", light_min= " .$PARAMS['light_min'] .", light_max= " .$PARAMS['light_max'] .", salt_min= " .$PARAMS['salt_min'] .", salt_max= " .$PARAMS['salt_max'] .", soil_min= " .$PARAMS['soil_min'] .", soil_max= " .$PARAMS['soil_max'] .", $userInfo", 'error');
			finish(400, 605);
			exit;
		}

		$active= ($active!='0' ? 'TRUE':'FALSE');
		$oldName= $presetData['picture'];
		$data= ['name'=> $name];
		if( $api==='preset_add' ){
			$query= "INSERT INTO presets (user_id, active, name, temperature_min, temperature_max, humidity_min, humidity_max, light_min, light_max, salt_min, salt_max, soil_min, soil_max) VALUES ($userID, $active, :name, $temperatureMin, $temperatureMax, $humidityMin, $humidityMax, $lightMin, $lightMax, $saltMin, $saltMax, $soilMin, $soilMax) RETURNING *";
			$handle= $linkRW->prepare($query);
			$presetData= ($handle->execute($data) ? $handle->fetchAll() : null);
			if( !$presetData ){
				record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
				finish(500, 604);
				exit;
			}
			$presetData= $presetData[0];
			$presetID= $presetData['preset_id'];
		}else{//'preset_update'
			$query= "UPDATE presets SET active= $active, name= :name, temperature_min= $temperatureMin, temperature_max= $temperatureMax, humidity_min= $humidityMin, humidity_max= $humidityMax, light_min= $lightMin, light_max= $lightMax, salt_min= $saltMin, salt_max= $saltMax, soil_min= $soilMin, soil_max= $soilMax" .($del && $oldName ? ', picture= NULL' : '') ." WHERE preset_id=$presetID";
			$handle= $linkRW->prepare($query);
			if( !$handle->execute($data) ){
				record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
				finish(500, 604);
				exit;
			}
		}
		if( $pic ){
			$filename= "$picsBase/users/$userID/preset.$presetID.$type";
			$query= "UPDATE presets SET picture= :filename WHERE preset_id=$presetID";
			$data= ['filename'=> $filename];
		}
				record("del= $del, pic= $pic, oldName= $oldName, filename= $filename, $userInfo", 'debug');
	}break;
}

if( $del && $oldName !== null ){
	rename($oldName, "$oldName.bkp");
}else if( $pic ){
	$picError= downloadPicture($filename, $oldName);
	if( $picError ){
		header("x-prc: $picError");
	}else if( $filename!==$oldName ){
		$handle= $linkRW->prepare($query);
		if( $handle->execute($data) ){
			header("path: $filename");
		}else{
			record("(604) db operation failure - data= " .json_encode($data) .", query= $query, $userInfo", 'error');
			header('x-prc: 604');
			unlink($filename);
			rename("$oldName.bkp", $oldName);
		}
	}
}
finish(200, 600);
?>