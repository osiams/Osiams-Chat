<?php
error_reporting(E_ALL);
set_time_limit(0);
ob_implicit_flush();
class PHPWebSockets{
	private object $sock;
	private array $clients;
	private array $user;	
	private string $stat;
	private string $error;
	public function __construct(
		private string $host = "0.0.0.0",
		private string $port = "9000",
	){
		$this->sock = new stdClass();
		$this->clients = [];
		$this->user = [];
		$this->stat = "Osiams Chat V0.0";
	}
	public function start():void{
		$this->status($this->stat." @".$this->host.":".$this->port);
		try {
			$write  = NULL;
			$except = NULL;
			$this->sock = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
			if (is_object($this->sock)){
				socket_set_option($this->sock, SOL_SOCKET, SO_REUSEADDR, 1);
				$this->status("sockets_create................................................OK");
				if (@socket_bind($this->sock,$this->host, $this->port) === true){
					$this->status("sockets_bind..................................................OK");			
					if (socket_listen($this->sock, 0) === true){
						socket_set_nonblock($this->sock);
						$this->status("sockets_listen................................................OK");
						do {
							$read = [];
							$read[] = $this->sock;
							$read = array_merge($read,$this->clients);
							$num_changed_sockets = socket_select($read,$write, $except, 1);
							if (in_array($this->sock, $read)){echo "*";
								$sock = socket_accept($this->sock);
								if (is_object($sock)) {echo "+";
									$re = $this->handShake($sock);
									if($re){
										$this->clients[] = $sock;
										$data = ["type"=>"connect"];
										$this->send([],$data);	
										$key = array_search($this->sock, $read);
										unset($read[$key]);																	
									}		
								}
								foreach($read as $client){
									echo ".";
									$disc=true;	
									$buf = @socket_read($client, 1024, PHP_BINARY_READ);
									if(strlen($buf) > 0 ){
										$data = $this->unmask($buf);
										if(bin2hex($data) != "03e9"){
											$disc = false;
											$data = json_decode($data,true);
											if(is_array($data)){
												#################### START MY APP ##################
												if ($data["type"] == "regis"){
													socket_getpeername($client, $ip);
													$data["ip"] = $ip;
													$this->addUser($client,$data);
													$this->send([],$data);
												}else if($data["type"] == "message"){
													$data["from"] = $this->getFromKey($client);
													$this->send($data["to"],$data);
												}elseif($data["type"] == "listuser"){
													$dt  = $this->getListUser($data);
													$dt["type"] = "listuser";
													$this->send($data["to"],$dt);
												}elseif($data["type"] == "logout"){
													$disc = true;
												}
												##################### END MY APP ###################
											}
										}
									}
									$key = array_search($client, $read);
									if($disc){
										$index = $this->searchIndex($this->clients,$client);
										if($index>=0){echo "-";
											socket_getpeername($this->clients[$index], $ip);
											unset($this->clients[$index]);	
											$user = $this->getUser($client);
											unset($this->user[$user["key"]]);
											$data = ["type"=>"system","action"=>"out","name"=>$user["name"],"ip"=>$user["ip"],"key"=>$user["key"]];
											$this->send([],$data);
										}								
									}		
									unset($read[$key]);										
								}	
							}
						} while (true);
					}else{
						throw new Exception("socket_listen() failed: reason: " . socket_strerror(socket_last_error($this->sock)));
					}	
				}else{
					throw new Exception("socket_bind() failed: reason: " . socket_strerror(socket_last_error($this->sock)));
				}
			}else{
				throw new Exception("socket_create() failed: reason: " . socket_strerror(socket_last_error()));				
			}
		} catch (Exception $e) {
			$this->status("ERROR ".$e);
		}
		socket_close($this->sock);
	}
	private function getListUser(array $data):array{
		$re=["user"=>[]];
		foreach($this->user as $k=>$v){
			$re["user"][$k] = [];
			$re["user"][$k]["key"] = $k;
			$re["user"][$k]["name"] = $v["name"];
			$re["user"][$k]["ip"] = $v["ip"];
		}
		return $re;
	}
	private function getFromKey(object $sock):string{
		$re="";
		foreach($this->user as $k=>$v){
			if(spl_object_id($v["sock"]) == spl_object_id($sock)){
				$re = $k;
				break;
			}
		}
		return $re;
	}
	private function getUser(object $sock):array{
		$re=["name"=>null,"ip"=>null,"key"=>null];
		foreach($this->user as $k=>$v){
			if(spl_object_id($v["sock"]) == spl_object_id($sock)){
				$re["key"] = $k;
				$re["name"] = $v["name"];
				$re["ip"] = $v["ip"];
				break;
			}
		}
		return $re;
	}
	private function searchIndex(array $clients,object $sock):int{
		$re = -1;
		foreach($clients as $k=>$v){
			if(spl_object_id($clients[$k]) == spl_object_id($sock)){
				$re = $k;
				break;
			}
		}
		return $re;
	}
	private function unmask(string $text):string{
		$re="";
		$bh = bin2hex($text[1]);
		$index_code = 2;
		if($bh == "fe"){
			$index_code = 4;
		}else if($bh == "ff"){
			$index_code = 10;
		}
		$mask = substr($text,$index_code,4);
		$data=substr($text,$index_code+4);
		$len = strlen($data);
		for ($i = 0; $i < $len; $i++) {
			$re.= $data[$i] ^ $mask[$i % 4];
		}
		return $re;
	}
	private function addClients(object $sock):void{
		array_push($this->clients,$sock);
	}
	private function addUser(object $sock,array $data):void{
		socket_getpeername($sock, $ip);
		$this->user[$data["key"]]=["name"=>$data["name"],"ip"=>$ip,"sock"=>$sock];
	}
	private function status(string $text):void{
		echo $text."\n";
	}
	private function send(array $to,array $data):void{
		$text = json_encode($data);
		$text = $this->mask($text);
		$to = (count($to) == 0)?array_keys($this->user):$to;
		$to = array_values(array_unique($to));
		foreach($to as $k=>$v){
			@socket_write($this->user[$v]["sock"],$text,strlen($text));
		}
	}
	private function mask(string $text):string{
		$re=hex2bin(81);
		$len=strlen($text);
		if($len <= 125 ){
			$re.=hex2bin( str_pad(base_convert($len,10,16),2,"0",STR_PAD_LEFT));
		}else if($len<pow(16,4)){
			$re.=hex2bin( base_convert(126,10,16))."".hex2bin( str_pad(base_convert($len,10,16),4,"0",STR_PAD_LEFT));
		}else{
			$re.=hex2bin( base_convert(127,10,16))."".hex2bin( str_pad(base_convert($len,10,16),8,"0",STR_PAD_LEFT));
		}
		return $re."".$text;
	}
	private function handShake(object $sock):bool{
		$re=false;
		$tx = socket_read($sock, 1024);
		$client_header = explode("\r\n",$tx); 
		echo "@";
		$sec_ws_acc = "";
		for($i=0;$i<count($client_header);$i++){
			if (preg_match("/^Sec-WebSocket-Key:.+$/",trim($client_header[$i]))) {
				$client_ws_key = trim( substr( trim($client_header[$i]),18));
				$sec_ws_acc = base64_encode( sha1($client_ws_key."258EAFA5-E914-47DA-95CA-C5AB0DC85B11",true) );
				break;
			}
		}		
		$herder = "HTTP/1.1 101 Switching Protocols\r\n".
			"Upgrade: websocket\r\n".
			"Connection: Upgrade\r\n".
			"Sec-WebSocket-Accept: ".$sec_ws_acc."\r\n\r\n";
		if($sec_ws_acc !=""){
			socket_write($sock,$herder,strlen($herder));
			$re = true;
		}
		return $re;
	}
}
(new PHPWebSockets("0.0.0.0","9000"))->start();
?>
