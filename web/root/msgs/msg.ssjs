load("html_inc/msgslib.ssjs");
load("html_inc/mime_decode.ssjs");

if(msgbase.open!=undefined && msgbase.open()==false) {
	error(msgbase.last_error);
}

if(sub=='mail') {
	template.group=new Object;
	template.group.name="E-Mail";
}
else {
	template.group=msg_area.grp[msg_area.sub[sub].grp_name];
}

if(sub=='mail') {
	template.sub=new Object;
	template.sub.description="Personal E-Mail";
	template.sub.code="mail";
}
else {
	template.sub=msg_area.sub[sub];
	if(!msg_area.sub[sub].can_read)
		error("You can't read messages in this sub!");
}

template.idx=msgbase.get_msg_index(false,m);
if(sub=='mail' && template.idx.to!=user.number)
	error("You can only read e-mail messages addressed to yourself!");
template.hdr=msgbase.get_msg_header(false,m);
template.body=msgbase.get_msg_body(false,m,true,true);

msg=mime_decode(template.hdr,template.body);
template.body=msg.body;
if(msg.type=="plain") {
	/* ANSI */
	if(template.body.indexOf('\x1b[')>=0 || template.body.indexOf('\x01')>=0) {
		template.body=html_encode(template.body,true,false,true,true);
	}
	/* Plain text */
	else {
		template.body=word_wrap(template.body,79);
		template.body=html_encode(template.body,true,false,false,false);
	}
}
if(msg.attachments!=undefined) {
	template.attachments=new Object;
	for(att in msg.attachments) {
		template.attachments[att]=new Object;
		template.attachments[att].name=msg.attachments[att];
	}
}

if(template.hdr != null)  {
	template.title="Message: "+template.hdr.subject;
}

var tmp=find_np_message(template.hdr.offset,true);
if(tmp!=undefined)
	template.nextlink='<a href="msg.ssjs?msg_sub='+sub+'&amp;message='+tmp+'">'+next_msg_html+'</a>';
var tmp=find_np_message(template.hdr.offset,false);
if(tmp!=undefined)
	template.prevlink='<a href="msg.ssjs?msg_sub='+sub+'&amp;message='+tmp+'">'+prev_msg_html+'</a>';

write_template("header.inc");
write_template("msgs/msg.inc");
write_template("footer.inc");

msgs_done();
