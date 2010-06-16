/*
	Inter-BBS/Inter-Node client (for use with commservice.js)
	for Synchronet v3.15+
	by Matt Johnson - 2009
*/

load("funclib.js");
load("synchronet-json.js");
load("sbbsdefs.js");
load("sockdefs.js");

function ServiceConnection(id,alias)
{
	const QUERY=				"?";
	const LOCAL=				"&";
	const FILESYNC=			"@";
	const CONNECTION_TIMEOUT=	5;
	const CONNECTION_ATTEMPTS=	2;
	const CONNECTION_INTERVAL=	5;
	const MAX_BUFFER=			512;
	
	const hub=					"localhost";
	const port=				10088;

	this.id=				(id?id:"default");
	this.queue=				[];
	this.notices=			[];
	this.sock=				false;
	
	var attempts=0;
	var last_attempt=0;
	
	//hub should point to the local, internal ip address or domain of the computer running commservice.js
	//port should point to the port the gaming service is set to use in commservice.js
	
	this.init=function()
	{
		if((time()-last_attempt)<CONNECTION_INTERVAL || attempts>=CONNECTION_ATTEMPTS) {
			debug("error connecting to hub, exiting program",LOG_WARNING);
			exit();
		}
		this.sock=new Socket();
		this.sock.nonblocking=true;
		this.sock.connect(hub,port,CONNECTION_TIMEOUT);
		if(testSocket(this.sock)) {
			attempts=0;
			last_attempt=0;
			return true;
		} else {
			attempts++;
			debug("error connecting to hub, attempt " + attempts,LOG_WARNING);
			last_attempt=time();
			return false;
		}
	}
	this.getNotices=function()
	{
		var notices=[];
		while(this.notices.length) {
			notices.push(this.notices.shift());
		}
		return notices;
	}
	this.receive=function()
	{
		if(!testSocket(this.sock))
		{
			if(!this.init()) return false;
		}
		if(this.sock.data_waiting)
		{
			var raw_data=this.sock.recvline(10240,CONNECTION_TIMEOUT);
			if(raw_data == null) return false;
			return(JSON.parse(raw_data));
		}
	}
	this.send=function(data)
	{
		if(!testSocket(this.sock))
		{
			if(!this.init()) return false;
		}
		if(!data.id) data.id=this.id;
		if(!data.system) data.system=system.name;
		if(!data.context) data.context=LOCAL;
		if(!data.alias) data.alias=alias;
		
		for(var i=0;i<this.queue.length;i++) {
			var qdata=this.queue.shift();
			if(!this.sock.write(qdata)) this.queue.push(qdata);
		}
		data=JSON.stringify(data)+"\r\n";
		if(!this.sock.write(data)) {
			this.queue.push(data);
		}
		return true;
	}
	this.recvfile=function(files,blocking)
	{
		this.filesync(files,"trysend",blocking);
	}
	this.sendfile=function(files,blocking)
	{
		this.filesync(files,"tryrecv",blocking);
	}
	this.filesync=function(filemask,command,blocking)
	{
		var q=new Object();
		q.filemask=filemask;
		q.command=command;
		q.blocking=blocking;
		q.type=FILESYNC;
		
		this.send(q);
		if(q.blocking) {
			/* Do something */
		}
	}
	this.close=function()
	{
		debug("terminating service connection",LOG_DEBUG);
		while(this.queue.length) {
			this.sock.write(this.queue.shift());
		}
		this.sock.close();
	}

	if(!this.init() && attempts>=CONNECTION_ATTEMPTS) return false;
}

	
