class client{
	constructor(IP,port){
		this.loginform=document.forms["login"];
		this.loginblock=document.getElementById("loginblock")
		this.chatblock=document.getElementById("chatblock")
		this.rmb=document.getElementById("rmb_room")
		this.me=document.getElementById("me")
		this.n_user=document.getElementById("n_user")
		this.myname=""
		this.mykey=""
		this.cmsg=document.getElementById("chatmessage")
		this.userlist=document.getElementById("userlist")
		this.listuser=[]
		this.to=[]
		this.wssrc="ws://"+IP+":"+port+""+location.pathname+"s/socket.php"
		this.ws=null
		this.online = 0
		this.fg="#000000"
		this.bg="#ffffff"
		this.key_active = "room"
		this.new_msg =[]
	}
	onMessage(event){
		let data = JSON.parse(event.data)
		let type = data.type
		if(type=="system"){
			if(data.action=="out"){
				this.rmb.innerHTML+='<p class="disconected">'+data.ip+' disconnected : <b>'+data.name+'</b><p/>'
				this.setUserOnline("calc",-1)
				this.removeUser(data)
			}
		}else if(type=="message"){
			let message=data.message
			let html = '<p class="pusermsg"><b>'+data.name+'</b> : <br /><span style="color:'+data.fg+';background-color:'+data.bg+'">'+message+'</span><p/>'
			if(data.to.length == 0){
				this.rmb.innerHTML+=html
			}else{
				this.checkBlockChat(data.from)
				if(data.from == this.mykey){
					//--ส่งถึง
					if(data.to.includes(data.from)){
						//--ตัวเองส่งให้ตัวเอง
						if(data.to.length == 1){
							document.getElementById("rmb_"+data.from).innerHTML+='<p class="p_m"><br /><span class="span_m" style="color:'+data.fg+';background-color:'+data.bg+'">'+message+'</span><p/>'
							document.getElementById("rmb_"+data.from).innerHTML+=html
						//--ส่งถึงคนอื่น
						}else{
							document.getElementById("rmb_"+this.key_active).innerHTML+='<p class="p_m"><br /><span class="span_m" style="color:'+data.fg+';background-color:'+data.bg+'">'+message+'</span><p/>'
						}
					}
				}
				//มีคนส่งข้อความมาหา
				if(data.to.includes(this.mykey) && data.from != this.mykey){ 
					document.getElementById("rmb_"+data.from).innerHTML+=html	
					this.setUnread(data.from)	
				}
			}
		}else if(type=="regis"){
			let dt={}
			if(data.key==this.mykey){	
				this.getListUser()
				this.rmb.innerHTML+='<p class="conected">Hi '+data.ip+' connected : <b>'+data.name+'</b><p/>'
			}else{
				this.addUser({data})	
				this.setUserOnline("calc",1)
				this.rmb.innerHTML+='<p class="conected">'+data.ip+' connected : <b>'+data.name+'</b><p/>'
			}
		}else if(type=="listuser"){
			this.addUser(data.user)
			this.setUserOnline("set",Object.keys(data.user).length)
		}
		document.getElementById("rmb_"+this.key_active).scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
	}
	setUnread(key){
		if(this.new_msg[key] == undefined){
			this.new_msg[key] = 0
		}
		if(key != this.mykey){
			if(this.new_msg[key] != undefined){
				if(this.key_active != key){
					this.new_msg[key] +=1
					this.showUnread("show",key)
				}else{
					this.new_msg[key]  = 0
				}

			}
		}
	}
	showUnread(type,key){
		if(type == "show"){
			document.getElementById("out_"+key).childNodes[1].style.visibility = "visible"
			document.getElementById("out_"+key).childNodes[1].innerHTML = this.new_msg[key]
		}else{
			document.getElementById("out_"+key).childNodes[1].style.visibility = "hidden"
			this.new_msg[key] = 0
			document.getElementById("out_"+key).childNodes[1].innerHTML = this.new_msg[key]
		}
	}
	removeUser(data){
		document.getElementById("out_"+data.key).parentNode.removeChild(document.getElementById("out_"+data.key))
		if(this.key_active == data.key){
			document.getElementById("room").click()
		}
	}
	addUser(data){
		for (let k in data) { 
			let nod = document.createElement("DIV")
			nod.setAttribute("class","listuser")
			nod.setAttribute("id","out_"+data[k].key)
			let node = document.createElement("DIV")
			let av = (k == this.mykey)?"😀":"👤"
			let textnode = document.createTextNode(`${av} `+data[k].name)
			node.appendChild(textnode);
			node.setAttribute("id",data[k].key)
			node.setAttribute("onclick","chat.setActive(this,'"+JSON.stringify(data[k]).replace(/"/g, "\"")+"')"); 
			let node_n_msg = document.createElement("DIV")
			let node_set = document.createElement("DIV")
			nod.appendChild(node);
			nod.appendChild(node_n_msg);
			nod.appendChild(node_set);
			if(k!=this.mykey){	
				this.userlist.appendChild(nod);
			}else{
				while (this.me.hasChildNodes()) {  
					this.me.removeChild(this.me.firstChild);
				} 
				this.me.appendChild(nod); 
			}
			this.listuser[k]={"name":data[k].name}
		}
	}
	checkBlockChat(from_key){
		if(document.getElementById("rmb_"+from_key) != undefined){
			
		}else{
			let node = document.createElement("DIV");
			node.setAttribute("id","rmb_"+from_key)
			node.setAttribute("class","rmb_y")
			node.setAttribute("style","display:none;")
			document.getElementById("rmb_out").appendChild(node)
		}
	}
	setActive(did,data){
		data = JSON.parse(data);
		document.getElementById("rmb_"+this.key_active).style.display = "none"		
		if(document.getElementById(this.key_active) != undefined){
			document.getElementById(this.key_active).classList.remove("list_active")
		}	
		
		this.key_active = data.key
		did.classList.add("list_active"); 
		document.getElementById("rmb_head").innerHTML = data.name
		document.getElementById("rmb_head").classList.remove("bg_p","bg_m","bg_y")
		this.to = data.key
		if(data.key == "room"){
			this.to=[];
			document.getElementById("rmb_head").classList.add("bg_p"); 
		}else if(data.key === this.mykey){
			document.getElementById("rmb_head").classList.add("bg_m"); 
		}else{
			document.getElementById("rmb_head").classList.add("bg_y"); 
			this.showUnread("hide",data.key)
		}
	
		if(document.getElementById("rmb_"+data.key) != undefined){

			document.getElementById("rmb_"+data.key).style.display = "block"
			document.getElementById("rmb_"+data.key).scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
		}else{
			
			let node = document.createElement("DIV");
			node.setAttribute("id","rmb_"+data.key)
			node.setAttribute("class","rmb_y")
			document.getElementById("rmb_out").appendChild(node)
		}
	}
	setUserOnline(type,value){
		if(type == "set"){
			this.online = value
		}else if(type == "calc"){
			this.online += value
		}
		this.n_user.innerHTML=this.online
	}
	getListUser(){
		let data={
			"type":"listuser",
			"to":[this.mykey],
		};
		this.ws.send(JSON.stringify(data));
	}
	send(type,to=[]){
		let msg=this.cmsg.value
		if(type == "message"){
			if(this.key_active != "room"){
				to = [this.key_active]
				if(this.key_active != this.mykey){
					to.push(this.mykey)
				}
			}else{
				to = []
			}
		}
		if(msg.trim().length>0){
			msg=msg.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;")
						.replace(/"/g, "&quot;")
						.replace(/'/g, "&#039;")
			let data={
				"type":type,
				"to":to,
				"message":msg,
				"name": this.myname,
				"fg":this.fg,
				"bg":this.bg
			};
			this.cmsg.value=""
			this.cmsg.focus()			
			this.ws.send(JSON.stringify(data));
		}
	}
	createKey(){
		let a="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
		let ms=Date.now()
		let t="_"+ms
		for(let i=0;i<7;i++){
			t+=a.charAt(Math.floor(Math.random()*63))
		}
		return t
	}
	setColor(did,type,label_id,input_id){
		document.getElementById(label_id).style.backgroundColor=did.value		
		if(type=="fg"){
			document.getElementById(input_id).style.color=did.value
			this.fg=did.value
		}else if(type=="bg"){
			document.getElementById(input_id).style.backgroundColor=did.value
			this.bg=did.value
		}
	}
	logout(){
		let data={
			"type":"logout"
		}
		this.ws.send(JSON.stringify(data));
		setTimeout("chat.logout2()",1000)
	}
	logout2(){
		this.loginblock.style.display="block"
		this.chatblock.style.zIndex="-1"		
		this.ws.close()
		this.ws=null	
		while (this.userlist.hasChildNodes()) {  
			this.userlist.removeChild(this.userlist.firstChild)
		} 
		let bx = this.rmb.parentNode
		let l = bx.childNodes.length
		for(let i=l-1;i>=0;i--){
			if(bx.childNodes[i].tagName != "DIV"){
				bx.removeChild(bx.childNodes[i])
			}else{
				if(bx.childNodes[i].id !="rmb_head" && bx.childNodes[i].id !="rmb_room"){
					bx.removeChild(bx.childNodes[i])
				}
			}
		}
		this.key_active = "room"
	}
	onError(event){
		alert("WebSocket error observed:");
		console.log("WebSocket error observed:", event)
	}
	onOpen(){
		let msg=this.cmsg.value
		let data={
			"type":"regis",
			"to":[],
			"key":this.mykey,
			"name": this.myname,
			"device":window.navigator.userAgent
		};
		this.ws.send(JSON.stringify(data))
	}
	login(){
		while (this.rmb.hasChildNodes()) {  
			this.rmb.removeChild(this.rmb.firstChild);
		} 		
		this.mykey=this.createKey();
		this.ws=new WebSocket(this.wssrc); 
		this.ws.onopen=(event)=>this.onOpen(event)
		this.ws.onmessage=(event)=>this.onMessage(event)
		this.ws.onerror=(event)=>this.onError(event)
		this.myname=this.loginform.name.value
		this.loginblock.style.display="none"
		this.chatblock.style.zIndex="2"
		this.cmsg.focus()
		this.setActive(document.getElementById(this.key_active),JSON.stringify({"key":"room","name":"In The Room."}))
	}
}
