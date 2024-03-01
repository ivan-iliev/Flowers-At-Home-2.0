<?php
$dataPath= '../data';
require("$dataPath/common.php");
require("$dataPath/db.php");
//PARAMS: user, pass, mac, interval?
//rc: 600, 601, 602, 603, 604, 605, 607, 608, 609, 613, 617
//headers: x-rc, interval?
//body: 


$user= ($PARAMS['user'] ?? null);
$pass= ($PARAMS['pass'] ?? null);
$passLen= strlen($pass);
$mac= ($PARAMS['mac'] ?? null);
$interval= ($PARAMS['interval'] ?? null);
$interval= ($interval===null ? $defaultInterval : intval($interval, 10));


//record("data_headers= " .json_encode(getallheaders()), 'debug');
//record("data_post= "    .json_encode($_POST),          'debug');
//record("data_get= "     .json_encode($_GET),           'debug');
record("user= $user, passLen= $passLen, mac= $mac, interval= $interval", 'access');
if( $requestMethod==='OPTIONS' ){
	http_response_code(200);
	record('200', 'access');
	exit;
}


if( $user===null || $pass===null || $mac===null ){
	record("(605) missing data - user= $user, pass= " .($pass!==null ? 'not ' : '') ."null, passLen= $passLen", 'error');
	header('x-rc: 605');
	http_response_code(400);
	record('400 605', 'access');
	exit;
}
if( $interval<$minInterval ){
	record("(613) incorrect data submitted - interval= $interval, user= $user", 'error');
	header('x-rc: 613');
	http_response_code(400);
	record('400 613', 'access');
	exit;
}


rwLink();


$handle= $linkRW->prepare("SELECT * FROM users WHERE email=:user AND pass = crypt(:pass, pass)");
$handle->execute(['user'=> $user, 'pass'=> $pass]);
$data= $handle->fetchAll();
if( !$data ){
	record("(601) wrong user or pass - user= $user, passLen= $passLen", 'error');
	header('x-rc: 601');
	http_response_code(401);
	record('401 601', 'access');
	exit;
}
$data= $data[0];
$userInfo= "userID= " .$data['user_id'] .", user= $user";
if( !$data['active'] ){
	record("(603) suspended user - $userInfo", 'error');
	header('x-rc: 603');
	http_response_code(403);
	record('403 603', 'access');
	exit;
}
$handle= $linkRW->prepare("
	SELECT p.*, p.active AS preset_active, d.*, u.battery 
	FROM devices d 
	INNER JOIN users u USING(user_id) 
	LEFT JOIN presets p ON(p.preset_id=d.preset_id AND p.active) 
	WHERE d.user_id=:userID AND d.mac=:mac
");
$handle->execute(['userID'=> $data['user_id'], 'mac'=> $mac]);
$device= $handle->fetchAll();
if( !$device ){
	record("(607) report from unregistered mac ($mac) - $userInfo", 'error');
	header('x-rc: 607');
	http_response_code(400);
	record('400 607', 'access');
	exit;
}
$device= $device[0];
$deviceID= $device['device_id'];
if( !$device['active'] ){
	record("(617) suspended device - deviceID= $deviceID, $userInfo", 'error');
	header('x-rc: 617');
	http_response_code(403);
	record('403 617', 'access');
	exit;
}
header("interval: " .$device['interval']);


$body= file_get_contents('php://input');
if( !$body ){
	record("(608) missing body - $userInfo", 'error');
	header('x-rc: 608');
	http_response_code(400);
	record('400 608', 'access');
	exit;
}
$json= json_decode($body, true);
if( !($json && isset($json['battery']) && isset($json['humidity']) && isset($json['light']) && isset($json['salt']) && isset($json['soil']) && isset($json['temperature']) && isset($json['timestamp'])) ){
	record("(609) can't parse the data - $userInfo, body= $body", 'error');
	header('x-rc: 609');
	http_response_code(400);
	record('400 609', 'access');
	exit;
}


if( $device['applied_interval'] != $interval ){
	$handle= $linkRW->prepare("UPDATE devices SET applied_interval= $interval WHERE device_id=:deviceID");
	$handle->execute(['deviceID'=> $deviceID]);
	if( !$handle->execute(['deviceID'=> $deviceID]) )
		record("failed to set applied_interval - db applied_interval= " .$device['applied_interval'] .", new applied_interval= $interval, $userInfo", 'error');
}
$temperature= floatval($json['temperature']);
$humidity=    floatval($json[   'humidity']);
$battery=     floatval($json[    'battery']);
$light=       floatval($json[      'light']);
$salt=        floatval($json[       'salt']);
$soil=        floatval($json[       'soil']);
$timestamp= intval($json['timestamp'], 10);
$handle= $linkRW->prepare("INSERT INTO data (device_id, timestamp, humidity, light, salt, soil, temperature, battery) VALUES (:deviceID, :timestamp, :humidity, :light, :salt, :soil, :temperature, :battery) RETURNING *");
$handle->execute(['deviceID'=> $deviceID, 'timestamp'=> $timestamp, 'humidity'=> $humidity, 'light'=> $light, 'salt'=> $salt, 'soil'=> $soil, 'temperature'=> $temperature, 'battery'=> $battery]);
$returning= $handle->fetchAll();
if( !$returning ){
	record("(604) db operation failure - $userInfo, data= $body", 'error');
	header('x-rc: 604');
	http_response_code(500);
	record('500 604', 'access');
	exit;
}
header('x-rc: 600');
http_response_code(200);
record('200 600', 'access');
if( $battery<$device['battery'] || $device['preset_id'] && $device['preset_active'] && (
	$device['temperature_min'] !== null && $temperature < $device['temperature_min'] || $device['temperature_max'] !== null && $device['temperature_max'] < $temperature || 
	$device[   'humidity_min'] !== null && $humidity    < $device[   'humidity_min'] || $device[   'humidity_max'] !== null && $device[   'humidity_max'] < $humidity || 
	$device[      'light_min'] !== null && $light       < $device[      'light_min'] || $device[      'light_max'] !== null && $device[      'light_max'] < $light || 
	$device[       'salt_min'] !== null && $salt        < $device[       'salt_min'] || $device[       'salt_max'] !== null && $device[       'salt_max'] < $salt || 
	$device[       'soil_min'] !== null && $soil        < $device[       'soil_min'] || $device[       'soil_max'] !== null && $device[       'soil_max'] < $soil 
) ){
	//TODO
	record("notification - $userInfo, battery= $battery, preset_id= " .$device['preset_id'] .", humidity= $humidity, light= $light, salt= $salt, soil= $soil, temperature= $temperature", 'debug');
}
?>