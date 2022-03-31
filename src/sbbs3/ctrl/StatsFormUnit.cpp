/* Synchronet Control Panel (GUI Borland C++ Builder Project for Win32) */

/****************************************************************************
 * @format.tab-size 4		(Plain Text/Source Code File Header)			*
 * @format.use-tabs true	(see http://www.synchro.net/ptsc_hdr.html)		*
 *																			*
 * Copyright Rob Swindell - http://www.synchro.net/copyright.html			*
 *																			*
 * This program is free software; you can redistribute it and/or			*
 * modify it under the terms of the GNU General Public License				*
 * as published by the Free Software Foundation; either version 2			*
 * of the License, or (at your option) any later version.					*
 * See the GNU General Public License for more details: gpl.txt or			*
 * http://www.fsf.org/copyleft/gpl.html										*
 *																			*
 * For Synchronet coding style and modification guidelines, see				*
 * http://www.synchro.net/source.html										*
 *																			*
 * Note: If this box doesn't appear square, then you need to fix your tabs.	*
 ****************************************************************************/

//---------------------------------------------------------------------------
#include <vcl.h>
#pragma hdrstop

#include "StatsFormUnit.h"
#include "StatsLogFormUnit.h"
//---------------------------------------------------------------------------
#pragma package(smart_init)
#pragma resource "*.dfm"
TStatsForm *StatsForm;
//---------------------------------------------------------------------------
__fastcall TStatsForm::TStatsForm(TComponent* Owner)
	: TForm(Owner)
{
}
//---------------------------------------------------------------------------
void __fastcall TStatsForm::FormHide(TObject *Sender)
{
	MainForm->ViewStats->Checked=false;
}
//---------------------------------------------------------------------------
void __fastcall TStatsForm::LogButtonClick(TObject *Sender)
{
	Application->CreateForm(__classid(TStatsLogForm), &StatsLogForm);
	StatsLogForm->ShowModal();
    delete StatsLogForm;
}
//---------------------------------------------------------------------------

