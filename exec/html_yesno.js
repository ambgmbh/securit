// $Id$

load("sbbsdefs.js");
load("text.js");
load("asc2htmlterm.js");

if(user.settings & USER_HTML) {
	var os = bbs.sys_status;
	bbs.sys_status |= SS_PAUSEOFF;
	bbs.sys_status &= ~SS_PAUSEON;

	console.write("\2\2<html><head><title>"+strip_ctrl(console.question)+"</title></head>");
	console.write('<body bgcolor="black" text="#a8a8a8">');
	console.write('&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>');
	console.write('<center><h1>'+asc2htmlterm(console.question,false,true).replace(/(?:&nbsp;)*<br>/,'')+'</h1></center>');
	console.write('&nbsp;<br>&nbsp;<br>&nbsp;<br>');
	console.write('<table width="100%"><tr><td align="center" width="50%">');
	console.write('<h3><font color="#a8a8a8"><a href="Y">Yes</a></h3>');
	console.write('</td><td align="center" width="50%">');
	console.write('<h3><font color="#a8a8a8"><a href="N">No</a></h3>');
	console.write('</td></tr></table>');
	console.write('</body></html>\2');
	bbs.sys_status=os;
}
else
	console.print(bbs.text[YesNoQuestion]);
