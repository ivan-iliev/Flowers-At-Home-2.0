<?php
/*** error codes ********************************************************************************************
600 no error
601 wrong user or pass
602 failed to connect to the db
603 suspended user
604 db operation failure
605 missing data
606 unrecognized api
607 report from unregistered mac
608 missing body
609 can't parse the data
610 unsupported picture
611 username already exists
612 missing login session
613 incorrect data submitted
614 invalid session
615 invalid password
616 failed to send email
617 suspended device
699 not yet implemented
/*** error codes *******************************************************************************************/


header('Cache-Control: no-store');
//header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");//Date in the past
header('serverVer: 0');
//CORS{
header('Access-Control-Allow-Origin: http://10.0.0.13/');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,x-company_suffix,user,pass,name,api,type,interval,did,device_id,preset_id,delete_pic,battery,active,temperature_min,temperature_max,humidity_min,humidity_max,light_min,light_max,salt_min,salt_max,soil_min,soil_max,x-req');
header('Access-Control-Expose-Headers: Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,x-company_suffix,serverVer,x-rc,x-prc,path,interval,x-req');
//CORS}


$minPassLength= 8;
$minInterval= 600000;
$defaultInterval= 3600000;
$picsBase= 'pics';
$userIP= $_SERVER['REMOTE_ADDR'];
$requestMethod= $_SERVER['REQUEST_METHOD'];
$reqID= random_int(1000000000000000000, PHP_INT_MAX);
function fsEscape($text){
	return preg_replace("/[^0-9A-Za-z_-]/", '.', $text);
}
function record($msg, $type= 'debug'){
	global $dataPath, $userIP, $requestMethod, $reqID;
	if( $type==='error' ){
		$data= debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0];
		error_log("$msg in " .$data['file'] ." on line " .$data['line']);
	}
	$now= date('Y-m-d H:i:s');
	$logs= "$dataPath/" .preg_replace('/^\.+/', '', fsEscape(preg_replace('/(?:\?|&|;).*$/', '', $_SERVER['PHP_SELF']))) .".$type.log";
	$bytes= file_put_contents($logs, "\n$now, " .date_create()->format('Uv') .", $userIP, $reqID, $requestMethod - $msg\n", FILE_APPEND |LOCK_EX);
	if( $bytes===false )
		error_log("Can't open(append) $logs ?!? ($now $userIP)");
}
function rm_rf($dir){
	if( !$dir )
		return;
	if( PHP_OS==='Windows' )
		exec("rd /s /q " .escapeshellarg($dir));
	else if( $dir!=='/' )
		exec("rm -rf " .escapeshellarg($dir));
}
function logout($headers= false){
	global $userID;
	record("user logout ($userID)", 'security');
	session_unset();
	session_destroy();
	if( $headers ){
		if( $userID ){
			finish(200, 600);
		}else{
			record('(612) missing login session', 'error');
			finish(403, 612);
		}
	}
}
function downloadPicture($filename, $oldName){
	global $userInfo;
	$body= file_get_contents('php://input');
	if( !$body ){
		record("(608) missing body - $userInfo", 'error');
		return 608;
	}
	$p= $_SERVER['DOCUMENT_ROOT'] ."/" .preg_replace('/\/[^\/]+$/', '', $filename);
	if( !file_exists($p) )
		mkdir($p, 0777, true);
	$bytes= file_put_contents("$filename.new", $body, LOCK_EX);
	if( $bytes===false ){
		record("Can't open(write) $filename.new!?!", 'error');
		return 613;
	}
	chmod("$filename.new", 0664);

	$verify= strlen($body);
	if( $verify!=$bytes ){
		record("Settings mismatch - bytes= $bytes, verify= $verify", 'error');
		return 613;
	}
	if( $oldName!==null && $oldName!==$filename )
		rename($oldName, "$oldName.bkp");
	unlink("$filename.bkp");
	rename($filename, "$filename.bkp");
	rename("$filename.new", $filename);
}
function getRandomPass($length= 12) {
	$map= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$max= strlen($map) -1;
	$res= '';
	for($i= 0; $i<$length; ++$i)
		$res.= $map[random_int(0, $max)];
	return $res;
}
function sendTempPass($email, $pass){//TODO
	$subject= 'test subject';
	$message= "temp pass test - $pass";
	$headers= "From: support@botanica-wellness.com\r\nReply-To: support@botanica-wellness.com\r\nX-Mailer: PHP/" .phpversion();
	$success= false;//mail($email, $subject, $message, $headers);
	if( !$success )
		record("(616) failed to send email - email= $email, subject= $subject, message= $message, headers= $headers, error= " .error_get_last()['message'], 'error');
	return $success;
}
function finish($resCode, $rc= null){
	http_response_code($resCode);
	if( $rc!==null ){
		header("x-rc: $rc");
		record("$resCode $rc", 'access');
	}else{
		record($resCode, 'access');
	}
}


$PARAMS= [];
foreach(getallheaders() as $key=>$value)
	$PARAMS[preg_replace('/^x-/', '', strtolower($key))]= $value;
foreach($_POST as $key=>$value)
	$PARAMS[$key]= $value;
foreach($_GET as $key=>$value)
	$PARAMS[$key]= $value;
?>