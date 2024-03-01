<?php
$hostRW= 'mstorage15-1.office.lab';
$portRW= 5432;
$dbName= 'botanica';
$dbUser= 'botanica';
$dbPass= '2WoLLR4isoUg8eG';
$maxPassLength= 72;

$linkRW= null;
function rwLink(){
	global $linkRW, $hostRW, $portRW, $dbName, $dbUser, $dbPass;
	if( $linkRW )
		return;
	try{
		$linkRW= new PDO("pgsql:host=$hostRW port=$portRW dbname=$dbName connect_timeout=1", $dbUser, $dbPass);
		$linkRW->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
	}catch(PDOException $e){
		record("(602) failed to connect to the RW db - host= $hostRW, port= $portRW, e= $e", 'error');
		header('x-rc: 602');
		http_response_code(502);
		exit;
	}
}
?>