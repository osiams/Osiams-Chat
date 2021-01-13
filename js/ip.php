<?php
$sock = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_connect($sock, "8.8.8.8",80);
socket_getsockname($sock, $name);
header('Content-Type: text/javascript');
echo 'IP=()=> {return "'.$name.'"}';
echo "\n";
echo 'AT=()=>{return "http://'.$name.''.str_replace('\\','\\\\',dirname($_SERVER['PHP_SELF'],2)).'"}';
echo "\n";
if(is_dir("C:\\")){
	echo 'CMW=()=>{return "'.dirname($_SERVER['CONTEXT_DOCUMENT_ROOT'],1).'/php/php '.dirname($_SERVER['SCRIPT_FILENAME'],2).'/php/socket.php"}';
}else if(is_dir("/opt")){
	echo 'CMW=()=>{return "'.dirname($_SERVER['CONTEXT_DOCUMENT_ROOT'],1).'/bin/php -q '.dirname($_SERVER['SCRIPT_FILENAME'],2).'/php/socket.php"}';
}
?>


