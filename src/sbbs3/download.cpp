/* download.cpp */

/* Synchronet file download routines */

/* $Id$ */

/****************************************************************************
 * @format.tab-size 4		(Plain Text/Source Code File Header)			*
 * @format.use-tabs true	(see http://www.synchro.net/ptsc_hdr.html)		*
 *																			*
 * Copyright 2003 Rob Swindell - http://www.synchro.net/copyright.html		*
 *																			*
 * This program is free software; you can redistribute it and/or			*
 * modify it under the terms of the GNU General Public License				*
 * as published by the Free Software Foundation; either version 2			*
 * of the License, or (at your option) any later version.					*
 * See the GNU General Public License for more details: gpl.txt or			*
 * http://www.fsf.org/copyleft/gpl.html										*
 *																			*
 * Anonymous FTP access to the most recent released source is available at	*
 * ftp://vert.synchro.net, ftp://cvs.synchro.net and ftp://ftp.synchro.net	*
 *																			*
 * Anonymous CVS access to the development source and modification history	*
 * is available at cvs.synchro.net:/cvsroot/sbbs, example:					*
 * cvs -d :pserver:anonymous@cvs.synchro.net:/cvsroot/sbbs login			*
 *     (just hit return, no password is necessary)							*
 * cvs -d :pserver:anonymous@cvs.synchro.net:/cvsroot/sbbs checkout src		*
 *																			*
 * For Synchronet coding style and modification guidelines, see				*
 * http://www.synchro.net/source.html										*
 *																			*
 * You are encouraged to submit any modifications (preferably in Unix diff	*
 * format) via e-mail to mods@synchro.net									*
 *																			*
 * Note: If this box doesn't appear square, then you need to fix your tabs.	*
 ****************************************************************************/

#include "sbbs.h"
#include "telnet.h"

/****************************************************************************/
/* Updates downloader, uploader and downloaded file data                    */
/* Must have offset, dir and name fields filled prior to call.              */
/****************************************************************************/
void sbbs_t::downloadfile(file_t* f)
{
    char	str[256],fname[13];
	char 	tmp[512];
    int		i,file;
	long	length,mod;
    ulong	l;
	user_t	uploader;

	getfiledat(&cfg,f); /* Get current data - right after download */
	if((length=f->size)<0L)
		length=0L;
	if(!(cfg.dir[f->dir]->misc&DIR_NOSTAT)) {
		logon_dlb+=length;  /* Update 'this call' stats */
		logon_dls++;
	}
	bprintf(text[FileNBytesSent],f->name,ultoac(length,tmp));
	sprintf(str,"%s downloaded %s from %s %s"
		,useron.alias
		,f->name,cfg.lib[cfg.dir[f->dir]->lib]->sname
		,cfg.dir[f->dir]->sname);
	logline("D-",str);
	/****************************/
	/* Update Downloader's Info */
	/****************************/
	useron.dls=(ushort)adjustuserrec(&cfg,useron.number,U_DLS,5,1);
	useron.dlb=adjustuserrec(&cfg,useron.number,U_DLB,10,length);
	if(!is_download_free(&cfg,f->dir,&useron))
		subtract_cdt(&cfg,&useron,f->cdt);
	/**************************/
	/* Update Uploader's Info */
	/**************************/
	i=matchuser(&cfg,f->uler,TRUE /*sysop_alias*/);
	uploader.number=i;
	getuserdat(&cfg,&uploader);
	if(i && i!=useron.number && uploader.firston<f->dateuled) {
		l=f->cdt;
		if(!(cfg.dir[f->dir]->misc&DIR_CDTDL))	/* Don't give credits on d/l */
			l=0;
		if(cfg.dir[f->dir]->misc&DIR_CDTMIN && cur_cps) { /* Give min instead of cdt */
			mod=((ulong)(l*(cfg.dir[f->dir]->dn_pct/100.0))/cur_cps)/60;
			adjustuserrec(&cfg,i,U_MIN,10,mod);
			sprintf(tmp,"%lu minute",mod);
		} else {
			mod=(ulong)(l*(cfg.dir[f->dir]->dn_pct/100.0));
			adjustuserrec(&cfg,i,U_CDT,10,mod);
			ultoac(mod,tmp);
		}
		if(!(cfg.dir[f->dir]->misc&DIR_QUIET)) {
			sprintf(str,text[DownloadUserMsg]
				,!strcmp(cfg.dir[f->dir]->code,"TEMP") ? temp_file : f->name
				,!strcmp(cfg.dir[f->dir]->code,"TEMP") ? text[Partially] : nulstr
				,useron.alias,tmp); 
			putsmsg(&cfg,i,str); 
		}
	}
	/*******************/
	/* Update IXB File */
	/*******************/
	f->datedled=time(NULL);
	sprintf(str,"%s%s.ixb",cfg.dir[f->dir]->data_dir,cfg.dir[f->dir]->code);
	if((file=nopen(str,O_RDWR))==-1) {
		errormsg(WHERE,ERR_OPEN,str,O_RDWR);
		return; 
	}
	length=filelength(file);
	if(length%F_IXBSIZE) {
		close(file);
		errormsg(WHERE,ERR_LEN,str,length);
		return; 
	}
	strcpy(fname,f->name);
	for(i=8;i<12;i++)   /* Turn FILENAME.EXT into FILENAMEEXT */
		fname[i]=fname[i+1];
	for(l=0;l<(ulong)length;l+=F_IXBSIZE) {
		read(file,str,F_IXBSIZE);      /* Look for the filename in the IXB file */
		str[11]=0;
		if(!strcmp(fname,str)) 
			break; 
	}
	if(l>=(ulong)length) {
		close(file);
		errormsg(WHERE,ERR_CHK,f->name,0);
		return; 
	}
	lseek(file,l+18,SEEK_SET);
	write(file,&f->datedled,4);  /* Write the current time stamp for datedled */
	close(file);
	/*******************/
	/* Update DAT File */
	/*******************/
	f->timesdled++;
	putfiledat(&cfg,f);
	/******************************************/
	/* Update User to User index if necessary */
	/******************************************/
	if(f->dir==cfg.user_dir) {
		rmuserxfers(&cfg,0,useron.number,f->name);
		if(!getuserxfers(0,0,f->name)) { /* check if any ixt entries left */
			remove(getfilepath(&cfg,f,str));
			removefiledat(&cfg,f); 
		} 
	}

	user_event(EVENT_DOWNLOAD);
}

/****************************************************************************/
/* This function is called when a file is unsuccessfully downloaded.        */
/* It logs the tranfer time and checks for possible leech protocol use.     */
/****************************************************************************/
void sbbs_t::notdownloaded(ulong size, time_t start, time_t end)
{
    char	str[256],tmp2[256];
	char 	tmp[512];

	sprintf(str,"Estimated Time: %s  Transfer Time: %s"
		,sectostr(cur_cps ? size/cur_cps : 0,tmp)
		,sectostr((uint)end-start,tmp2));
	logline(nulstr,str);
	if(cfg.leech_pct && cur_cps                 /* leech detection */
		&& end-start>=cfg.leech_sec
		&& end-start>=(double)(size/cur_cps)*(double)cfg.leech_pct/100.0) {
		sprintf(str,"Possible use of leech protocol (leech=%u  downloads=%u)"
			,useron.leech+1,useron.dls);
		errorlog(str);
		useron.leech=(uchar)adjustuserrec(&cfg,useron.number,U_LEECH,2,1); 
	}
}

char* sbbs_t::protcmdline(prot_t* prot, enum XFER_TYPE type)
{
	switch(type) {
		case XFER_UPLOAD:
			return(prot->ulcmd);
		case XFER_DOWNLOAD:
			return(prot->dlcmd);
		case XFER_BATCH_UPLOAD:
			return(prot->batulcmd);
		case XFER_BATCH_DOWNLOAD:
			return(prot->batdlcmd);
		case XFER_BIDIR:
			return(prot->bicmd);
	}

	return("invalid transfer type");
}

/****************************************************************************/
/* Handles start and stop routines for transfer protocols                   */
/****************************************************************************/
int sbbs_t::protocol(prot_t* prot, enum XFER_TYPE type
					 ,char *fpath, char *fspec, bool cd)
{
	char	protlog[256],*p;
	char*	cmdline;
	char	msg[256];
    int		i;
	long	ex_mode;
	FILE*	stream;

	sprintf(protlog,"%sPROTOCOL.LOG",cfg.node_dir);
	remove(protlog);                        /* Deletes the protocol log */
	if(useron.misc&AUTOHANG)
		autohang=1;
	else
		autohang=yesno(text[HangUpAfterXferQ]);
	if(sys_status&SS_ABORT) {				/* if ctrl-c */
		autohang=0;
		return(-1); 
	}
	bputs(text[StartXferNow]);
	RIOSYNC(0);
	//lprintf("%s",cmdline);
	if(cd) 
		p=cfg.temp_dir;
	else
		p=NULL;
	cmdline=cmdstr(protcmdline(prot,type),fpath,fspec,NULL);
	sprintf(msg,"Transferring %s",cmdline);
	spymsg(msg);
	sys_status|=SS_FILEXFER;	/* disable spy during file xfer */
	/* enable telnet binary transmission in both directions */
	if(!(telnet_mode&TELNET_MODE_BIN_RX)) {
		send_telnet_cmd(TELNET_DO,TELNET_BINARY);
		telnet_mode|=TELNET_MODE_BIN_RX;
	}
	send_telnet_cmd(TELNET_WILL,TELNET_BINARY);
	ex_mode=0;
	if(prot->misc&PROT_NATIVE)
		ex_mode|=EX_NATIVE;
#ifdef __unix__		/* file xfer progs must use stdio on Unix */
	ex_mode|=(EX_INR|EX_OUTR|EX_BIN);
#endif

	i=external(cmdline,ex_mode,p);
	/* disable telnet binary transmission mode */
	send_telnet_cmd(TELNET_WONT,TELNET_BINARY);
	/* Got back to Text/NVT mode */
	if(telnet_mode&TELNET_MODE_BIN_RX) {
		send_telnet_cmd(TELNET_DONT,TELNET_BINARY);
		telnet_mode&=~TELNET_MODE_BIN_RX;
	}

	sys_status&=~SS_FILEXFER;
	if(online==ON_REMOTE)
		rioctl(IOFB);

	// Save DSZLOG to logfile
	if((stream=fnopen(NULL,protlog,O_RDONLY))!=NULL) {
		while(!feof(stream) && !ferror(stream)) {
			if(!fgets(protlog,sizeof(protlog),stream))
				break;
			truncsp(protlog);
			logline(nulstr,protlog);
		}
		fclose(stream);
	}

	CRLF;
	if(autohang) sys_status|=SS_PAUSEOFF;	/* Pause off after download */
	return(i);
}

/****************************************************************************/
/* Invokes the timed auto-hangup after transfer routine                     */
/****************************************************************************/
void sbbs_t::autohangup()
{
    char	a,c,k;
	char 	tmp[512];

	if(online!=ON_REMOTE)
		return;
	SYNC;
	sys_status&=~SS_PAUSEOFF;		/* turn pause back on */
	rioctl(IOFI);
	if(!autohang) return;
	lncntr=0;
	bputs(text[Disconnecting]);
	attr(GREEN);
	outchar('[');
	for(c=9,a=0;c>-1 && online && !a;c--) {
		checkline();
		attr(LIGHTGRAY|HIGH);
		bputs(ultoa(c,tmp,10));
		attr(GREEN);
		outchar(']');
		while((k=inkey(K_NONE,DELAY_AUTOHG))!=0 && online) {
			if(toupper(k)=='H') {
				c=0;
				break; 
			}
			if(toupper(k)=='A') {
				a=1;
				break; 
			} 
		}
		if(!a) {
			outchar(BS);
			outchar(BS); 
		} 
	}
	if(c==-1) {
		bputs(text[Disconnected]);
		hangup(); 
	}
	else
		CRLF;
}

bool sbbs_t::checkdszlog(file_t* f)
{
	char	path[MAX_PATH+1];
	char	str[MAX_PATH+128];
	char	fname[MAX_PATH+1];
	char	rpath[MAX_PATH+1];
	char*	p;
	char*	rname;
	char	code;
	ulong	bytes;
	ulong	dte;
	ulong	cps;
	ulong	errors;
	ulong	flows;
	ulong	block_size;
	long	serial_no;
	FILE*	fp;
	bool	success=false;

	sprintf(path,"%sPROTOCOL.LOG",cfg.node_dir);
	if((fp=fopen(path,"r"))==NULL)
		return(false);

	unpadfname(f->name,fname);

	/* Increase real path is different (long filename?) */
	getfilepath(&cfg,f,rpath);
	rname=getfname(rpath);

	while(!ferror(fp)) {
		if(!fgets(str,sizeof(str),fp))
			break;
		sscanf(str,"%c %lu %lu bps %lu cps %lu errors %lu %lu %s %ld"
			,&code
			,&bytes
			,&dte
			,&cps
			,&errors
			,&flows
			,&block_size
			,path
			,&serial_no);
		p=getfname(path);	/* DSZ stores fullpath, BiModem doesn't */
		if(stricmp(p,fname)==0 || stricmp(p,rname)==0) {
			/* E for Error or L for Lost Carrier */
			/* or only sent 0 bytes! */
			if(code!='E' && code!='L' && bytes!=0)
				success=true;
			break;
		}
	}
	fclose(fp);
	return(success);
}


/****************************************************************************/
/* Checks dsz compatible log file for errors in transfer                    */
/* Returns 1 if the file in the struct file_t was successfuly transfered    */
/****************************************************************************/
bool sbbs_t::checkprotresult(prot_t* prot, int error, file_t* f)
{
	char str[512];
	char tmp[128];
	bool success;

	if(prot->misc&PROT_DSZLOG)
		success=checkdszlog(f);
	else
		success=(error==0);

	if(!success) {
		bprintf(text[FileNotSent],f->name);
		if(f->dir<cfg.total_dirs)
			sprintf(str,"%s attempted to download %s (%s) from %s %s"
				,useron.alias
				,f->name,ultoac(f->size,tmp)
				,cfg.lib[cfg.dir[f->dir]->lib]->sname,cfg.dir[f->dir]->sname);
		else if(f->dir==cfg.total_dirs)
			sprintf(str,"%s attempted to download QWK packet"
				,useron.alias);
		else if(f->dir==cfg.total_dirs+1)
			sprintf(str,"%s attempted to download attached file: %s"
				,useron.alias,f->name);
		logline("D!",str);
		return(false); 
	}
	return(true);
}



/************************************************************************/
/* Wait (for a limited period of time) for sequential dev to become 	*/
/* available for file retrieval 										*/
/************************************************************************/
void sbbs_t::seqwait(uint devnum)
{
	char loop=0;
	int i;
	time_t start;
	node_t node;

	if(!devnum)
		return;
	for(start=now=time(NULL);online && now-start<90;now=time(NULL)) {
		if(msgabort())				/* max wait ^^^^ sec */
			break;
		getnodedat(cfg.node_num,&thisnode,true);	/* open and lock this record */
		for(i=1;i<=cfg.sys_nodes;i++) {
			if(i==cfg.node_num) continue;
			if(getnodedat(i,&node,true)==0) {
				if((node.status==NODE_INUSE || node.status==NODE_QUIET)
					&& node.action==NODE_RFSD && node.aux==devnum) {
					putnodedat(i,&node);
					break; 
				}
				putnodedat(i,&node); 
			}
		}
		if(i>cfg.sys_nodes) {
			thisnode.action=NODE_RFSD;
			thisnode.aux=devnum;
			putnodedat(cfg.node_num,&thisnode);	/* write devnum, unlock, and ret */
			return; 
		}
		putnodedat(cfg.node_num,&thisnode);
		if(!loop)
			bprintf(text[WaitingForDeviceN],devnum);
		loop=1;
		mswait(100); 
	}

}
