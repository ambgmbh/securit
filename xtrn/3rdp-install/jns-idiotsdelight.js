"use strict";

writeln("Generating config files...");

var i;

var gamedir = fullpath(js.startup_dir);
var configfile = gamedir + "IDELIGHT.CFG";
var nodedat = gamedir + "NODEINFO.DAT";

file_backup(configfile);

var lines = [];

var file = new File(configfile);
if (file.open(configfile, 'r')) {
	lines = file.readAll();
	file.close();
} else {
	// new config
	lines[2] = 'Y';
	lines[3] = 'NOLOG';
	lines[6] = gamedir + 'idiot.asc';
	lines[7] = gamedir + 'idiot.ans';
	lines[11] = "3";
	lines[12] = "5";
	lines[13] = "25";
}

lines[0] = system.name;
lines[1] = system.operator;

var mfile = new File(gamedir + "IDELIGHT.KEY");
if(mfile.open("rb")) {
	var md5 = mfile.md5_hex;
	writeln("Check key " + md5);
	if (md5 == "28fc004f23a6af5ff9463dd3ee496943") {
		writeln("Restoring free key sysop info");
		lines[0] = "BBSFILES.COM";
		lines[1] = "FREE COPY";
	}
	mfile.close();
}

lines[4] = "Synchronet";
lines[5] = "DOOR.SYS";
lines[9] = "PCBNODE";
lines[10] = nodedat;

if (file.open(configfile, 'r+')) {
	file.writeAll(lines);
	file.close();
} else {
	writeln("Error " + file.error + " opening " + file.name + " for writing");
	exit(1)
}

writeln("Beginning node config generation...");

file_backup(nodedat);

var nodedata = "";

for(i = 0; i < 250; i++) {
	var nodenum = i + 1;
	
	// you can use COM1 for every node
	var nodeentry = (typeof system.node_list[i] !== "undefined") ?
		"03F8" : "0000"
	nodeentry = nodeentry + "0" + " ";
	if (typeof system.node_list[i] !== "undefined") {
		nodeentry = nodeentry + system.node_list[i].dir;
	}
	while (nodeentry.length < 46) {
		nodeentry = nodeentry + " ";
	}
	
	nodedata = nodedata + nodeentry;
}

var file = new File(nodedat);
if (!file.open("w+")) {
	writeln("Error " + file.error + " opening " + file.name + " for writing");
	exit(1)
}
file.write(nodedata);
file.close();

writeln("Config generation complete");

exit(0);
