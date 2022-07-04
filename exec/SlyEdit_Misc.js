/* This file declares some general helper functions and variables
 * that are used by SlyEdit.
 *
 * Author: Eric Oulashin (AKA Nightfox)
 * BBS: Digital Distortion
 * BBS address: digdist.bbsindex.com
 *
 * Date       User              Description
 * 2009-06-06 Eric Oulashin     Started development
 * 2009-06-11 Eric Oulashin     Taking a break from development
 * 2009-08-09 Eric Oulashin     Started more development & testing
 * 2009-08-22 Eric Oulashin     Version 1.00
 *                              Initial public release
 * ....Removed some comments...
 * 2017-12-16 Eric Oulashin     Updated ReadSlyEditConfigFile() to include the
 *                              allowEditQuoteLines option.
 * 2017-12-18 Eric Oulashin     Update the KEY_PAGE_UP and KEY_PAGE_DOWN keys to
 *                              ensure they mat what's in sbbsdef.js
 * 2017-12-24 Eric Oulashin     Updated firstNonQuoteTxtIndex() to better handle
 *                              lines with 3 non-space characters before a >, to
 *                              not consider those sequences a quote when using
 *                              author initials.  When using author initials,
 *                              SlyEdit considers a quote sequence to only have 2
 *                              non-space characters (such as "EO>").
 * 2017-12-25 Eric Oulashin     Updated wrapTextLines() - Added an optional
 *                              parameter for the lineInfo object array so it
 *                              can be updated when lines are split (for quoting
 *                              with author initials).  That should fix an
 *                              issue where some wrapped/split quote lines
 *                              were missing the quote line prefix.
 * 2017-12-26 Eric Oulashin     Updated wrapTextLines() to (hopefully) better
 *                              handle situations when it wraps text into the
 *                              next line when that next line is blank - Ensuring
 *                              it adds a blank line below that.
 * 2019-05-04 Eric Oulashin     Updated to use require() instead of load() if possible.
 * 2020-03-03 Eric Oulashin     Updated the postMsgToSubBoard() to ensure the user
 *                              has posting access to the sub-board before posting the
 *                              message.
 * 2020-03-04 Eric Oulashin     Updated the way postMsgToSubBoard() checks whether
 *                              the user can post in a sub-board by checking the can_post
 *                              property of the sub-board rather than checking the
 *                              ARS.  The can_post property covers more cases.
 * 2021-12-09 Eric Oulashin     Added consolePauseWithoutText()
 * 2022-05-27                   Fixed a few instances where SlyEdit was trying to access
 *                              sub-board information with an empty sub-board code (in the rare
 *                              case when no sub-boards are configured).
 */

"use strict";
 
if (typeof(require) === "function")
{
	require("text.js", "Pause");
	require("key_defs.js", "CTRL_A");
}
else
{
	load("text.js");
	load("key_defs.js");
}
 
// Note: These variables are declared with "var" instead of "const" to avoid
// multiple declaration errors when this file is loaded more than once.

// Values for attribute types (for text attribute substitution)
var FORE_ATTR = 1; // Foreground color attribute
var BKG_ATTR = 2;  // Background color attribute
var SPECIAL_ATTR = 3; // Special attribute

// Box-drawing/border characters: Single-line
var UPPER_LEFT_SINGLE = "\xDA"; //ASCII 218
var HORIZONTAL_SINGLE = "\xC4"; //ASCII 196
var UPPER_RIGHT_SINGLE = "\xBF"; //ASCII 191 // or 170?
var VERTICAL_SINGLE = "\xB3"; //ASCII 179
var LOWER_LEFT_SINGLE = "\xC0"; //ASCII 192
var LOWER_RIGHT_SINGLE = "\xD9"; //ASCII 217
var T_SINGLE = "\xC2"; //ASCII 194
var LEFT_T_SINGLE = "\xC3"; //ASCII 195
var RIGHT_T_SINGLE = "\xB4"; //ASCII 180
var BOTTOM_T_SINGLE = "\xC1"; //ASCII 193
var CROSS_SINGLE = "\xC5"; //ASCII 197
// Box-drawing/border characters: Double-line
var UPPER_LEFT_DOUBLE = "\xC9"; //ASCII 201
var HORIZONTAL_DOUBLE = "\xCD"; //ASCII 205
var UPPER_RIGHT_DOUBLE = "\xBB"; //ASCII 187
var VERTICAL_DOUBLE = "\xBA"; //ASCII 186
var LOWER_LEFT_DOUBLE = "\xCB"; //ASCII 200
var LOWER_RIGHT_DOUBLE = "\xBC"; //ASCII 188
var T_DOUBLE = "\xCB"; //ASCII 203
var LEFT_T_DOUBLE = "\xCC"; //ASCII 204
var RIGHT_T_DOUBLE = "\xB9"; //ASCII 185
var BOTTOM_T_DOUBLE = "\xCA"; //ASCII 202
var CROSS_DOUBLE = "\xCE"; //ASCII 206
// Box-drawing/border characters: Vertical single-line with horizontal double-line
var UPPER_LEFT_VSINGLE_HDOUBLE = "\xD5"; //ASCII 213
var UPPER_RIGHT_VSINGLE_HDOUBLE = "\xB8"; //ASCII 184
var LOWER_LEFT_VSINGLE_HDOUBLE = "\xD4"; //ASCII 212
var LOWER_RIGHT_VSINGLE_HDOUBLE = "\xBE"; //ASCII 190
// Other special characters
var DOT_CHAR = "\xF9"; //ASCII 249
var CHECK_CHAR = "\xFB"; //ASCII 251
var THIN_RECTANGLE_LEFT = "\xDD"; //ASCII 221
var THIN_RECTANGLE_RIGHT = "\xDE"; //ASCII 222
var CENTERED_SQUARE = "\xFE"; //ASCII 254
var BLOCK1 = "\xB0"; //ASCII 176 // Dimmest block
var BLOCK2 = "\xB1"; //ASCII 177
var BLOCK3 = "\xB2"; //ASCII 178
var BLOCK4 = "\xDB"; //ASCII 219 // Brightest block

// Navigational keys
var UP_ARROW = "\x18"; //ASCII 24
var DOWN_ARROW = "\x19"; //ASCII 25
// Some functional keys
var BACKSPACE = CTRL_H;
var TAB = CTRL_I;
var INSERT_LINE = CTRL_L;
var CR = CTRL_M;
var KEY_ENTER = CTRL_M;
var XOFF = CTRL_Q;
var XON = CTRL_S;
var KEY_INSERT = CTRL_V;
var KEY_F1 = "\x01F1";
var KEY_F2 = "\x01F2";
var KEY_F3 = "\x01F3";
var KEY_F4 = "\x01F4";
var KEY_F5 = "\x01F5";
// PageUp & PageDown keys - Synchronet 3.17 as of about December 18, 2017
// use CTRL-P and CTRL-N for PageUp and PageDown, respectively.  sbbsdefs.js
// defines them as KEY_PAGEUP and KEY_PAGEDN; I've used slightly different names
// in this script so that this script will work with Synchronet systems before
// and after the update containing those key definitions.
var KEY_PAGE_UP = CTRL_P;
var KEY_PAGE_DOWN = CTRL_N;
// Ensure KEY_PAGE_UP and KEY_PAGE_DOWN are set to what's defined in sbbs.js
// for KEY_PAGEUP and KEY_PAGEDN in case they change.  Note that this relies
// on sbbsdefs.js being loaded; SlyEdit.js loads sbbsdefs.js before this file,
// so this should work.
if (typeof(KEY_PAGEUP) === "string")
	KEY_PAGE_UP = KEY_PAGEUP;
if (typeof(KEY_PAGEDN) === "string")
	KEY_PAGE_DOWN = KEY_PAGEDN;

// ESC menu action codes to be returned
var ESC_MENU_SAVE = 0;
var ESC_MENU_ABORT = 1;
var ESC_MENU_INS_OVR_TOGGLE = 2;
var ESC_MENU_SYSOP_IMPORT_FILE = 3;
var ESC_MENU_SYSOP_EXPORT_FILE = 4;
var ESC_MENU_FIND_TEXT = 5;
var ESC_MENU_HELP_COMMAND_LIST = 6;
var ESC_MENU_HELP_GENERAL = 7;
var ESC_MENU_HELP_PROGRAM_INFO = 8;
var ESC_MENU_EDIT_MESSAGE = 9;
var ESC_MENU_CROSS_POST_MESSAGE = 10;
var ESC_MENU_LIST_TEXT_REPLACEMENTS = 11;
var ESC_MENU_USER_SETTINGS = 12;
var ESC_MENU_SPELL_CHECK = 13;


var COPYRIGHT_YEAR = 2022;

// Store the full path & filename of the Digital Distortion Message
// Lister, since it will be used more than once.
var gDDML_DROP_FILE_NAME = system.node_dir + "DDML_SyncSMBInfo.txt";

var gUserSettingsFilename = backslash(system.data_dir + "user") + format("%04d", user.number) + ".SlyEdit_Settings";

///////////////////////////////////////////////////////////////////////////////////
// Object/class stuff

//////
// TextLine stuff

// TextLine object constructor: This is used to keep track of a text line,
// and whether it has a hard newline at the end (i.e., if the user pressed
// enter to break the line).
//
// Parameters (all optional):
//  pText: The text for the line
//  pHardNewlineEnd: Whether or not the line has a "hard newline" - What
//                   this means is that text below it won't be wrapped up
//                   to this line when re-adjusting the text lines.
//  pIsQuoteLine: Whether or not the line is a quote line.
function TextLine(pText, pHardNewlineEnd, pIsQuoteLine)
{
	this.text = "";               // The line text
	this.hardNewlineEnd = false; // Whether or not the line has a hard newline at the end
	this.isQuoteLine = false;    // Whether or not this is a quote line
	// Copy the parameters if they are valid.
	if ((pText != null) && (typeof(pText) == "string"))
		this.text = pText;
	if ((pHardNewlineEnd != null) && (typeof(pHardNewlineEnd) == "boolean"))
		this.hardNewlineEnd = pHardNewlineEnd;
	if ((pIsQuoteLine != null) && (typeof(pIsQuoteLine) == "boolean"))
		this.isQuoteLine = pIsQuoteLine;

	// For color support
	this.attrs = {}; // An object where its properties are the line indexes, and values are attributes at that index in the line

	// Functions
	this.isAQuoteLine = TextLine_isAQuoteLine;
	this.numAttrs = TextLine_numAttrs;
	this.hasAttrs = TextLine_hasAttrs;
	this.getSortedAttrKeysArray = TextLine_getSortedAttrKeysArray;
	this.length = TextLine_length;
	this.screenLength = TextLine_screenLength;
	this.print = TextLine_print;
	this.substr = TextLine_substr;
	this.substring = TextLine_substring;
	this.getText = TextLine_getText;
	this.insertIntoText = TextLine_insertIntoText;
	this.trimFront = TextLine_trimFront;
	this.trimEnd = TextLine_trimEnd;
	this.moveAttrIdxes = TextLine_moveAttrIdxes;
	this.doMacroTxtReplacement = TextLine_doMacroTxtReplacement;
	this.getWord = TextLine_getWord;
	this.removeCharAt = TextLine_removeCharAt;
	this.getAttrs = TextLine_getAttrs;
	this.popAttrsFromFront = TextLine_popAttrsFromFront;
	this.popAttrsFromEnd = TextLine_popAttrsFromEnd;
}
// For the TextLine class: Returns whether the line a quote line.  This is true if
// the line's isQuoteLine property is true.  If the line's text is empty, then this
// will return false and set the line's isQuoteLine property to false.
function TextLine_isAQuoteLine()
{
	var lineIsQuoteLine = false;
	//lineIsQuoteLine = (this.isQuoteLine || (/^ *>/.test(this.text)));
	//lineIsQuoteLine = this.isQuoteLine;
	if (this.isQuoteLine)
	{
		if (this.screenLength() > 0)
			lineIsQuoteLine = true;
		else
			this.isQuoteLine = false;
	}
	return lineIsQuoteLine;
}
// For the TextLine class: Returns the number of attribute codes in the line
function TextLine_numAttrs()
{
	return (Object.keys(this.attrs)).length;
}
// For the TextLine class: Returns whether or not the line has any attribute codes specified
function TextLine_hasAttrs()
{
	return ((Object.keys(this.attrs)).length > 0);
}
// For the TextLine class: Returns a sorted array of the keys (numeric line indexes) from the attrs object
function TextLine_getSortedAttrKeysArray()
{
	var attrKeys = Object.keys(this.attrs);
	if (attrKeys.length > 0)
	{
		attrKeys.sort(textLineAttrSortCompareFunc);
		// Ensure the values in the attrKeys array are numeric
		for (var keysIdx = 0; keysIdx < attrKeys.length; ++keysIdx)
			attrKeys[keysIdx] = +(attrKeys[keysIdx]);
	}
	return attrKeys;
}
// Compare function for sorting TextLine attribute objects
function textLineAttrSortCompareFunc(a, b)
{
	var numA = +a;
	var numB = +b;
	if (numA < numB)
		return -1;
	else if (numA > numB)
		return 1;
	else
		return 0;
}
// For the TextLine class: Returns the length of the text.
function TextLine_length()
{
	return this.text.length;
}
// For the TextLine class: Returns the printed length of the text (without any attribute codes, etc.)
function TextLine_screenLength()
{
	return console.strlen(this.text);
}
// For the TextLine class: Prints the text line, using its text attributes.
//
// Parameters:
//  pPrintNormalAttrFirst: Boolean - Whether or not to print a normal attribute first. Defaults to false.
//  pMaxLength: The maximum length to print.  Optional.  If not specified or <= 0, the whole text will be printed.
//  pClearToEOL: Boolean - Whether or not to clear to the end of the line.  Defaults to false.
function TextLine_print(pPrintNormalAttrFirst, pMaxLength, pClearToEOL)
{
	var printNormalAttrFirst = (typeof(pPrintNormalAttrFirst) === "boolean" ? pPrintNormalAttrFirst : false);
	if (printNormalAttrFirst)
		console.print("\x01n");
	if (this.screenLength() > 0)
	{
		var thisLineText = this.getText(true);
		if (typeof(pMaxLength) === "number" && pMaxLength > 0 && pMaxLength < this.screenLength())
			thisLineText = shortenStrWithAttrCodes(thisLineText, pMaxLength, true);
		console.print(thisLineText);
	}
	var clearToEOL = (typeof(pClearToEOL) === "boolean" ? pClearToEOL : false);
	if (clearToEOL)
		console.cleartoeol("\x01n");
}
// For the TextLine class: Returns a substring of the text string, with or without attribute codes.
//
// Parameters:
//  pWithAttrs: Boolean - Whether or not to include the attribute codes in the substring
//  pStart: The index of where to start in the string
//  pLen: The printed screen length of the substring
//
// Return value: The substring from the text line. If pWithAttrs is true, the substring will contain
//               the attribute codes set for the text line.
function TextLine_substr(pWithAttrs, pStart, pLen)
{
	var startIdx = (typeof(pStart) === "number" && pStart >= 0 && pStart < this.text.length ? pStart : 0);
	var length = (typeof(pLen) === "number" && pLen > 0 && pLen <= this.text.length ? pLen : this.text.length);
	// Sanity check
	var maxLength = this.text.length - startIdx;
	if (length > maxLength)
		length = maxLength;

	// Note: substrWithAttrCodes() is defined in dd_lightbar_menu.js
	var theSubstr = "";
	if (pWithAttrs)
		theSubstr = substrWithAttrCodes(this.getText(pWithAttrs), startIdx, length);
	else
		theSubstr = this.text.substr(startIdx, length);
	return theSubstr;
}
// For the TextLine class: Returns a substring of the text string, with or without attribute codes.
//
// Parameters:
//  pWithAttrs: Boolean - Whether or not to include the attribute codes in the substring
//  pStart: The starting index of the string for the screen-printable text
//  pEnd: One past the last index to be included in the substring for the screen-printable text
//
// Return value: The substring from the text line. If pWithAttrs is true, the substring will contain
//               the attribute codes set for the text line.
function TextLine_substring(pWithAttrs, pStart, pEnd)
{
	if (typeof(pStart) !== "number" || typeof(pEnd) !== "number")
		return "";
	if (pStart < 1 || pStart >= this.text.length || pEnd <= pStart)
		return "";

	var strLength = pEnd - pStart;
	return this.substr(pWithAttrs, pStart, strLength);
}
// For the TextLine class: Gets the entire text string
//
// Parameters:
//  pWithAttrs: Boolean - Whether or not to include the attribute codes in the substring. Defaults to true.
//
// Return value: The object's text string, possibly with its attribute codes as specified
function TextLine_getText(pWithAttrs)
{
	var thisText = "";
	var withAttrs = (typeof(pWithAttrs) === "boolean" ? pWithAttrs : true);
	var attrKeys = this.getSortedAttrKeysArray(); // The attribute keys are indexes for this.text
	if (withAttrs && attrKeys.length > 0)
	{
		var textIdx = +(attrKeys[0]);
		if (textIdx > 0)
			thisText += this.text.substring(0, textIdx);
		var substringEndIdx = 0; // For substrings
		var keysArrayEndIdx = attrKeys.length - 1;
		for (var keysIdx = 0; keysIdx <= keysArrayEndIdx; ++keysIdx)
		{
			textIdx = +(attrKeys[keysIdx]);
			thisText += this.attrs[textIdx];
			if (keysIdx < keysArrayEndIdx)
			{
				substringEndIdx = +(attrKeys[keysIdx+1]);
				thisText += this.text.substring(textIdx, substringEndIdx);
			}
			else
				thisText += this.text.substring(textIdx);
		}
	}
	else
		thisText = this.text;
	return thisText;
}
// For the TextLine class: Inserts a string inside the line's text string.
//
// Parameters:
//  pIndex: The index of this TextLine's text at which to insert the other string
//  pAdditionalText: The string to insert into this TextTine's text string
//  pInsertMiddleShiftAttrsStartAtIndexPlusOne: Optional boolean - When inserting text in the middle of the
//                                              line, whether to start shifting attribute codes to the right
//                                              at pIndex+1.  Defaults to true (start at pIndex+1).
function TextLine_insertIntoText(pIndex, pAdditionalText, pInsertMiddleShiftAttrsStartAtIndexPlusOne)
{
	// Error checking
	if (typeof(pIndex) !== "number" || pIndex >= this.text.length)
		return;
	if (typeof(pAdditionalText) !== "string" || console.strlen(pAdditionalText) == 0)
		return;

	var txtIdx = (pIndex < 0 ? 0 : pIndex);

	// Check for attribute codes in pAdditionalText so we can move them to this.attrs
	var attrSepObj = sepStringAndAttrCodes(pAdditionalText);

	// If txtIdx is beyond the last index of this.text, then just return the
	// two strings concatenated.
	if (txtIdx >= this.text.length)
	{
		this.text = this.text + attrSepObj.textWithoutAttrs;
		// Copy any attributes into this.attrs
		for (var txtIdx in attrSepObj.attrs)
		{
			var newTxtIdx = this.text.length + (+txtIdx);
			this.attrs[newTxtIdx] = attrSepObj.attrs[txtIdx];
		}
	}
	// If txtIdx is 0, then just return the additional text + this.text.
	else if (txtIdx == 0)
	{
		this.text = attrSepObj.textWithoutAttrs + this.text;
		// Move any attribute indexes in the line to the right after the additional text
		this.moveAttrIdxes(0, attrSepObj.textWithoutAttrs.length);
		// Copy any attributes into this.attrs
		for (var txtIdx in attrSepObj.attrs)
			this.attrs[+txtIdx] = attrSepObj.attrs[txtIdx];
	}
	else
	{
		this.text = this.text.substr(0, txtIdx) + attrSepObj.textWithoutAttrs + this.text.substr(txtIdx);
		// Move any text attributes to the right according to the length of the text spliced in, starting
		// at the given index
		var shiftStartingAtIndexPlusOne = (typeof(pInsertMiddleShiftAttrsStartAtIndexPlusOne) === "boolean" ? pInsertMiddleShiftAttrsStartAtIndexPlusOne : true);
		this.moveAttrIdxes(shiftStartingAtIndexPlusOne ? txtIdx+1 : txtIdx, attrSepObj.textWithoutAttrs.length);
		// Copy any attributes into this.attrs
		for (var attrTxtIdx in attrSepObj.attrs)
		{
			var newTxtIdx = txtIdx + (+attrTxtIdx);
			this.attrs[newTxtIdx] = attrSepObj.attrs[txtIdx];
		}
	}
}
// For the TextLine class: Removes text from the front of the line, and adjusts any attribute codes accordingly
//
// Parameters:
//  pNewStartIdx: The index before which to trim off (this is basically the new starting index for the text)
//
// Return value: An object indexed by text index with any color/attribute codes before pNewStartIndex
function TextLine_trimFront(pNewStartIdx)
{
	if (typeof(pNewStartIdx) !== "number" || pNewStartIdx < 0)
		return {};

	var frontAttrs = {};
	if (pNewStartIdx > 0)
		frontAttrs = this.popAttrsFromFront(pNewStartIdx-1);

	if (pNewStartIdx >= this.text.length)
	{
		this.text = "";
		this.attrs = {};
	}
	else
	{
		this.text = this.text.substr(pNewStartIdx);
		/*
		// Adjust the indexes of any attribute codes this line might have: First delete any attributes
		// before pNewStartIdx
		var attrKeys = Object.keys(this.attrs);
		for (var attrKeysIdx = 0; attrKeysIdx < attrKeys.length; ++attrKeysIdx)
		{
			var textIdx = +(attrKeys[attrKeysIdx]);
			if (textIdx < pNewStartIdx)
				delete this.attrs[textIdx];
		}
		*/
		// Adjust the indexes of the remaining attribute codes to the left (the front ones were removed earlier, to be returned).
		this.moveAttrIdxes(pNewStartIdx, -pNewStartIdx);
	}

	return frontAttrs;
}
// For the TextLine class: Removes text from the end of the line, and removes and returns any attribute codes from the
// end starting at the given index.
//
// Parameters:
//  pTxtIdx: The text index to start trimming the line at
//
// Return value: An object indexed by text index with any color/attribute codes from pTxtIdx and afterward
function TextLine_trimEnd(pTxtIdx)
{
	if (typeof(pTxtIdx) !== "number" || pTxtIdx < 0 || pTxtIdx >= this.text.length)
		return {};
	var rearAttrs = this.popAttrsFromEnd(pTxtIdx);
	this.text = this.text.substring(0, pTxtIdx);
	return rearAttrs;
}
// For the TextLine class: Moves attribute indexes according to an offset.
//
// Parameters:
//  pStartIdx: The text index at which to start moving the attribute indexes
//  pOffset: The offset by which to move the attribute indexes
function TextLine_moveAttrIdxes(pStartIdx, pOffset)
{
	if (typeof(pStartIdx) !== "number" || pStartIdx < 0 || pStartIdx >= this.text.length || typeof(pOffset) !== "number" || pOffset == 0)
		return;

	var startIdx = (pStartIdx < 0 ? 0 : pStartIdx);
	if (pOffset > 0)
	{
		// pOffset is positive: Moving attributes to the right
		// Go through the sorted attribute keys from right to left, and for any text indexes >= pStartIdx,
		// adjust them rightward by pOffset
		var sortedAttrKeys = this.getSortedAttrKeysArray();
		for (var keysI = sortedAttrKeys.length - 1; keysI >= 0; --keysI)
		{
			var textIdx = +(sortedAttrKeys[keysI]);
			if (textIdx >= pStartIdx)
			{
				this.attrs[textIdx + pOffset] = this.attrs[textIdx];
				delete this.attrs[textIdx];
			}
			else
				break;
		}
	}
	else
	{
		// pOffset is negative: Moving attributes to the left
		// Go through the sorted attribute keys from left to right, and for any text indexes >= startIdx,
		// adjust them by pOffset
		var sortedAttrKeys = this.getSortedAttrKeysArray();
		for (var keysI = 0; keysI < sortedAttrKeys.length; ++keysI)
		{
			var textIdx = +(sortedAttrKeys[keysI]);
			if (textIdx >= startIdx)
			{
				// Note: pOffset is negative, so adding pOffset will subtract from textIdx.
				var newTextIdx = textIdx + pOffset;
				if (newTextIdx < 0) newTextIdx = 0;
				this.attrs[newTextIdx] = this.attrs[textIdx];
				delete this.attrs[textIdx];
			}
		}
	}
}
// For the TextLine class: Performs text replacement (AKA macro replacement) in the text line
// for the current word, based on an index in the text line.
//
// Parameters:
//  pTxtReplacements: An associative array of text to be replaced (i.e.,
//                    gTxtReplacements)
//  pCharIndex: The current character index in the text line
//  pUseRegex: Whether or not to treat the text replacement search string as a
//             regular expression.
//  pPriorTxtLineAttrs: In case colors are enabled, this includes the attribute codes from prior lines.
//
// Return value: An object containing the following properties:
//               textLineIndex: The updated text line index (integer)
//               wordLenDiff: The change in length of the word that
//                            was replaced (integer)
//               wordStartIdx: The index of the first character in the word.
//                             Only valid if a word was found.  Otherwise, this
//                             will be 0.
//               newTextEndIdx: The index of the last character in the new
//                              text.  Only valid if a word was replaced.
//                              Otherwise, this will be 0.
//               newTextLen: The length of the new text in the string.  Will be
//                           the length of the existing word if the word wasn't
//                           replaced or 0 if no word was found.
//               madeTxtReplacement: Whether or not a text replacement was made
//                                   (boolean)
//               priorTxtAttrs: Any prior text attribute codes before the replacement was made. If none, this
//                              will be an empty string.
function TextLine_doMacroTxtReplacement(pTxtReplacements, pCharIndex, pUseRegex, pPriorTxtLineAttrs)
{
	var retObj = {
		textLineIndex: pCharIndex,
		wordLenDiff: 0,
		wordStartIdx: 0,
		newTextEndIdx: 0,
		newTextLen: 0,
		madeTxtReplacement: false,
		priorTxtAttrs: ""
	};

	// Try to find the word at the given index in the text line
	var wordObj = this.getWord(retObj.textLineIndex);
	if (!wordObj.foundWord)
		return retObj;

	retObj.wordStartIdx = wordObj.startIdx;
	retObj.newTextLen = wordObj.word.length;

	// See if the word starts with a capital letter; if so, we'll capitalize
	// the replacement word.
	var firstCharUpper = false;
	var txtReplacement = "";
	if (pUseRegex)
	{
		// Since a regular expression might have more characters in addition
		// to the actual word, we need to go through all the replacement strings
		// in pTxtReplacements and use the first one that changes the text.
		for (var prop in pTxtReplacements)
		{
			if (pTxtReplacements.hasOwnProperty(prop))
			{
				var regex = new RegExp(prop);
				txtReplacement = wordObj.word.replace(regex, pTxtReplacements[prop]);
				retObj.madeTxtReplacement = (txtReplacement != wordObj.word);
				// If a text replacement was made, then check and see if the first
				// letter in the original text was uppercase, and if so, make the
				// first letter in the new text (txtReplacement) uppercase.
				if (retObj.madeTxtReplacement)
				{
					if (firstLetterIsUppercase(wordObj.word))
					{
						var letterInfo = getFirstLetterFromStr(txtReplacement);
						if (letterInfo.idx > -1)
						{
							txtReplacement = txtReplacement.substr(0, letterInfo.idx)
										   + letterInfo.letter.toUpperCase()
										   + txtReplacement.substr(letterInfo.idx+1);
						}
					}

					// Now that we've made a text replacement, stop going through
					// pTxtReplacements looking for a matching regex.
					break;
				}
			}
		}
	}
	else
	{
		// Not using a regular expression.
		firstCharUpper = (wordObj.word.charAt(0) == wordObj.word.charAt(0).toUpperCase());
		// Convert the word to all uppercase to do the case-insensitive lookup
		// in pTxtReplacements.
		wordObj.word = wordObj.word.toUpperCase();
		if (pTxtReplacements.hasOwnProperty(wordObj.word))
		{
			txtReplacement = pTxtReplacements[wordObj.word];
			retObj.madeTxtReplacement = true;
		}
	}
	if (retObj.madeTxtReplacement)
	{
		// Look for any attribute codes in the replacement word and separate them out (to put into this.attrs)
		var attrSepObj = sepStringAndAttrCodes(txtReplacement);
		// Uppercase the first character if desired
		if (firstCharUpper)
			attrSepObj.textWithoutAttrs = attrSepObj.textWithoutAttrs.charAt(0).toUpperCase() + attrSepObj.textWithoutAttrs.substr(1);
		var originalTextLen = this.text.length;
		this.text = this.text.substr(0, wordObj.startIdx) + attrSepObj.textWithoutAttrs + this.text.substr(wordObj.endIndex+1);
		// Based on the difference in word length, update the data that
		// matters (retObj.textLineIndex, which keeps track of the index of the current line).
		// Note: The horizontal cursor position variable should be replaced after calling this
		// function.
		retObj.wordLenDiff = attrSepObj.textWithoutAttrs.length - wordObj.word.length;
		retObj.textLineIndex += retObj.wordLenDiff;
		retObj.newTextEndIdx = wordObj.endIndex + retObj.wordLenDiff;
		retObj.newTextLen = attrSepObj.textWithoutAttrs.length;

		// Starting at the index of one past the end of the original word, adjust any text
		// indexes in this.attrs based on the change in length of the word after replacement.
		if (retObj.wordLenDiff > 0)
		{
			var endIdx = wordObj.endIndex + 1;
			for (var txtIdx = originalTextLen - 1; txtIdx >= endIdx; --txtIdx)
			{
				if (this.attrs.hasOwnProperty(txtIdx))
				{
					this.attrs[txtIdx+retObj.wordLenDiff] = this.attrs[txtIdx];
					delete this.attrs[txtIdx];
				}
			}
		}
		else if (retObj.wordLenDiff < 0)
		{
			for (var txtIdx = wordObj.endIndex + 1; txtIdx < originalTextLen; ++txtIdx)
			{
				if (this.attrs.hasOwnProperty(txtIdx))
				{
					this.attrs[txtIdx+retObj.wordLenDiff] = this.attrs[txtIdx];
					delete this.attrs[txtIdx];
				}
			}
		}
		// Copy any attribute codes from the replacement word into this.attrs (adjusting indexes to be correct)
		for (var idx in attrSepObj.attrs)
		{
			var newTextIdx = +idx + wordObj.startIdx;
			this.attrs[newTextIdx] = attrSepObj.attrs[idx];
		}
		// Apply the prior text attributes to ensure the text color after the replacement is back to what it was previously
		if (typeof(pPriorTxtLineAttrs) === "string")
		{
			var thisLinePriorAttrs = this.getAttrs(wordObj.startIdx, true);
			var endIdx = wordObj.endIndex + retObj.wordLenDiff + 1;
			if (this.attrs.hasOwnProperty(endIdx))
				this.attrs[endIdx] += ("\x01n" + pPriorTxtLineAttrs + thisLinePriorAttrs);
			else
				this.attrs[endIdx] = ("\x01n" + pPriorTxtLineAttrs + thisLinePriorAttrs);
			retObj.priorTxtAttrs = pPriorTxtLineAttrs + thisLinePriorAttrs;
		}
		else
			retObj.priorTxtAttrs = this.getAttrs(wordObj.startIdx, true);
	}

	return retObj;
}
// For the TextLine class: Returns the word in a text line at a given index.  If the index
// is at a space, then this function will return the word before
// (to the left of) the space.
//
// Parameters:
//  pEditLinesIndex: The index of the line to look at (0-based)
//  pCharIndex: The character index in the text line (0-based)
//
// Return value: An object containing the following properties:
//               foundWord: Whether or not a word was found (boolean)
//               word: The word in the edit line at the given indexes (text).
//                     This might include control/color codes, etc..
//               plainWord: The word in the edit line without any control
//                          or color codes, etc.  This may or may not be
//                          the same as word.
//               startIdx: The index of the first character of the word (integer)
//               endIndex: The index of the last character of the word (integer)
function TextLine_getWord(pCharIndex)
{
	var retObj = {
		foundWord: false,
		word: "",
		plainWord: "",
		startIdx: 0,
		endIndex: 0
	};

	// Parameter checking
	if ((pCharIndex < 0) || (pCharIndex >= this.text.length))
		return retObj;

	// If pCharIndex specifies the index of a space, then look for a non-space
	// character before it.
	var charIndex = pCharIndex;
	while (this.text.charAt(charIndex) == " ")
		--charIndex;
	// Look for the start & end of the word based on the indexes of a space
	// before and at/after the given character index.
	var wordStartIdx = charIndex;
	var wordEndIdx = charIndex;
	while ((this.text.charAt(wordStartIdx) != " ") && (wordStartIdx >= 0))
		--wordStartIdx;
	++wordStartIdx;
	while ((this.text.charAt(wordEndIdx) != " ") && (wordEndIdx < this.text.length))
		++wordEndIdx;
	--wordEndIdx;

	retObj.foundWord = true;
	retObj.startIdx = wordStartIdx;
	retObj.endIndex = wordEndIdx;
	retObj.word = this.text.substring(wordStartIdx, wordEndIdx+1);
	retObj.plainWord = strip_ctrl(retObj.word);
	return retObj;
}
// For the TextLine class: Removes a single character from the line.  Also adjust attribute code
// indexes if necessary.
function TextLine_removeCharAt(pCharIdx)
{
	if (typeof(pCharIdx) !== "number" || pCharIdx < 0 || pCharIdx >= this.text.length)
		return;

	this.text = this.text.substr(0, pCharIdx) + this.text.substr(pCharIdx+1);
	// For attribute indexes to the right of pCharIdx, move them left by 1.
	this.moveAttrIdxes(pCharIdx+1, -1);
}
// For the TextLine class: Returns a string containing all the attribute codes from the text line (if any).
// If there are none, this will return an empty string.
//
// Parameters:
//  pEndIdx: Optional (numeric) - One past the last index in the text string to get attributes for. If this is
//           not specified (default), all of the line's attributes will be returned.
//  pIncludeNormalAttr: Optional boolean: Whether or not to include the normal attribute, if it exists.  Defaults
//                      to false.
function TextLine_getAttrs(pEndIdx, pIncludeNormalAttr)
{
	var attrsStr = "";
	var attrKeys = this.getSortedAttrKeysArray();
	var onePastLastIdx = this.text.length;
	if (typeof(pEndIdx) === "number" && pEndIdx >= 0 && pEndIdx < this.text.length)
		onePastLastIdx = pEndIdx;
	var includeNormalAttr = (typeof(pIncludeNormalAttr) === "boolean" ? pIncludeNormalAttr : false);

	for (var keysIdx = 0; keysIdx < attrKeys.length; ++keysIdx)
	{
		var textIdx = +(attrKeys[keysIdx]);
		// If pEndIdx is unspecified, we want to ensure we get all remaining attributes, including after
		// the last index and after that
		if (typeof(pEndIdx) !== "number" || textIdx < onePastLastIdx)
			attrsStr += this.attrs[textIdx];
		else
			break;
	}
	// If there is a normal attribute code in the middle of the string, anything before it.
	var normalAttrIdx = attrsStr.lastIndexOf("\x01n");
	if (normalAttrIdx < 0)
		normalAttrIdx = attrsStr.lastIndexOf("\x01N");
	if (normalAttrIdx > -1)
	{
		if (includeNormalAttr)
			attrsStr = attrsStr.substr(normalAttrIdx);
		else
			attrsStr = attrsStr.substr(normalAttrIdx);
	}
	return attrsStr;
}
// For the TextLine class: Removes all line attributes from the beginning up to (and not including) an end
// index, and returns an object with those attributes, where the object properties are the text indexes
// where those attributes were to be applied.
//
// Parameters:
//  pEndIndex: The ending index (non-inclusive) to stop removing attribute codes
//
// Return value: An object with string indexes as properties, and attribute codes as values for those indexes
function TextLine_popAttrsFromFront(pEndIdx)
{
	var attrObj = {};
	if (typeof(pEndIdx) !== "number" || pEndIdx < 0)
		return attrObj;
	var endIdx = (pEndIdx <= this.text.length ? pEndIdx : this.text.length);
	var sortedAttrKeys = this.getSortedAttrKeysArray();
	for (var attrKeysIdx = 0; attrKeysIdx < sortedAttrKeys.length; ++attrKeysIdx)
	{
		var textIdx = +(sortedAttrKeys[attrKeysIdx]);
		if (textIdx <= endIdx)
		{
			attrObj[textIdx] = this.attrs[textIdx];
			delete this.attrs[textIdx];
		}
		else
			break;
	}
	return attrObj;
}
// For the TextLine class: Removes all line attributes from the end starting from a string index, and
// returns an object with those attributes, where the object properties are the text indexes where
// those attributes were to be applied.
//
// Parameters:
//  pStartIdx: The index of where to start removing attribute codes
//
// Return value: An object with string indexes as properties, and attribute codes as values for those indexes
function TextLine_popAttrsFromEnd(pStartIdx)
{
	var attrObj = {};
	if (typeof(pStartIdx) !== "number" || pStartIdx > this.text.length)
		return attrObj;
	var startIdx = (pStartIdx >= 0 ? pStartIdx : 0);
	var sortedAttrKeys = this.getSortedAttrKeysArray();
	for (var attrKeysIdx = 0; attrKeysIdx < sortedAttrKeys.length; ++attrKeysIdx)
	{
		var textIdx = sortedAttrKeys[attrKeysIdx];
		if (textIdx >= startIdx)
		{
			attrObj[textIdx] = this.attrs[textIdx];
			delete this.attrs[textIdx];
		}
	}
	return attrObj;
}

// AbortConfirmFuncParams constructor: This object contains parameters used by
// the abort confirmation function (actually, there are separate ones for
// IceEdit and DCT Edit styles).
function AbortConfirmFuncParams()
{
	this.editTop = gEditTop;
	this.editBottom = gEditBottom;
	this.editWidth = gEditWidth;
	this.editHeight = gEditHeight;
	this.editLinesIndex = gEditLinesIndex;
	this.displayMessageRectangle = displayMessageRectangle;
}

//////
// ChoiceScrollbox stuff

// Returns the minimum width for a ChoiceScrollbox
function ChoiceScrollbox_MinWidth()
{
	return 73; // To leave room for the navigation text in the bottom border
}

// ChoiceScrollbox constructor
//
// Parameters:
//  pLeftX: The horizontal component (column) of the upper-left coordinate
//  pTopY: The vertical component (row) of the upper-left coordinate
//  pWidth: The width of the box (including the borders)
//  pHeight: The height of the box (including the borders)
//  pTopBorderText: The text to include in the top border
//  pSlyEdCfgObj: The SlyEdit configuration object (color settings are used)
//  pAddTCharsAroundTopText: Optional, boolean - Whether or not to use left & right T characters
//                           around the top border text.  Defaults to true.
// pReplaceTopTextSpacesWithBorderChars: Optional, boolean - Whether or not to replace
//                           spaces in the top border text with border characters.
//                           Defaults to false.
function ChoiceScrollbox(pLeftX, pTopY, pWidth, pHeight, pTopBorderText, pSlyEdCfgObj,
                         pAddTCharsAroundTopText, pReplaceTopTextSpacesWithBorderChars)
{
	// The default is to add left & right T characters around the top border
	// text.  But also use pAddTCharsAroundTopText if it's a boolean.
	var addTopTCharsAroundText = true;
	if (typeof(pAddTCharsAroundTopText) == "boolean")
		addTopTCharsAroundText = pAddTCharsAroundTopText;
	// If pReplaceTopTextSpacesWithBorderChars is true, then replace the spaces
	// in pTopBorderText with border characters.
	if (pReplaceTopTextSpacesWithBorderChars)
	{
		var startIdx = 0;
		var firstSpcIdx = pTopBorderText.indexOf(" ", 0);
		// Look for the first non-space after firstSpaceIdx
		var nonSpcIdx = -1;
		for (var i = firstSpcIdx; (i < pTopBorderText.length) && (nonSpcIdx == -1); ++i)
		{
			if (pTopBorderText.charAt(i) != " ")
				nonSpcIdx = i;
		}
		var firstStrPart = "";
		var lastStrPart = "";
		var numSpaces = 0;
		while ((firstSpcIdx > -1) && (nonSpcIdx > -1))
		{
			firstStrPart = pTopBorderText.substr(startIdx, (firstSpcIdx-startIdx));
			lastStrPart = pTopBorderText.substr(nonSpcIdx);
			numSpaces = nonSpcIdx - firstSpcIdx;
			if (numSpaces > 0)
			{
				pTopBorderText = firstStrPart + "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder;
				for (var i = 0; i < numSpaces; ++i)
					pTopBorderText += HORIZONTAL_SINGLE;
				pTopBorderText += "\x01n" + pSlyEdCfgObj.genColors.listBoxBorderText + lastStrPart;
			}

			// Look for the next space and non-space character after that.
			firstSpcIdx = pTopBorderText.indexOf(" ", nonSpcIdx);
			// Look for the first non-space after firstSpaceIdx
			nonSpcIdx = -1;
			for (var i = firstSpcIdx; (i < pTopBorderText.length) && (nonSpcIdx == -1); ++i)
			{
				if (pTopBorderText.charAt(i) != " ")
					nonSpcIdx = i;
			}
		}
	}

	this.SlyEdCfgObj = pSlyEdCfgObj;

	var minWidth = ChoiceScrollbox_MinWidth();

	this.dimensions = {
		topLeftX: pLeftX,
		topLeftY: pTopY,
		width: 0,
		height: pHeight,
		bottomRightX: 0,
		bottomRightY: 0
	};
	// Make sure the width is the minimum width
	if ((pWidth < 0) || (pWidth < minWidth))
		this.dimensions.width = minWidth;
	else
		this.dimensions.width = pWidth;
	this.dimensions.bottomRightX = this.dimensions.topLeftX + this.dimensions.width - 1;
	this.dimensions.bottomRightY = this.dimensions.topLeftY + this.dimensions.height - 1;

	// The text item array and member variables relating to it and the items
	// displayed on the screen during the input loop
	this.txtItemList = [];
	this.chosenTextItemIndex = -1;
	this.topItemIndex = 0;
	this.bottomItemIndex = 0;

	// Top border string
	var innerBorderWidth = this.dimensions.width - 2;
	// Calculate the maximum top border text length to account for the left/right
	// T chars and "Page #### of ####" text
	var maxTopBorderTextLen = innerBorderWidth - (pAddTCharsAroundTopText ? 21 : 19);
	if (strip_ctrl(pTopBorderText).length > maxTopBorderTextLen)
		pTopBorderText = pTopBorderText.substr(0, maxTopBorderTextLen);
	this.topBorder = "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder + UPPER_LEFT_SINGLE;
	if (addTopTCharsAroundText)
		this.topBorder += RIGHT_T_SINGLE;
	this.topBorder += "\x01n" + pSlyEdCfgObj.genColors.listBoxBorderText
	               + pTopBorderText + "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder;
	if (addTopTCharsAroundText)
		this.topBorder += LEFT_T_SINGLE;
	const topBorderTextLen = strip_ctrl(pTopBorderText).length;
	var numHorizBorderChars = innerBorderWidth - topBorderTextLen - 20;
	if (addTopTCharsAroundText)
		numHorizBorderChars -= 2;
	for (var i = 0; i <= numHorizBorderChars; ++i)
		this.topBorder += HORIZONTAL_SINGLE;
	this.topBorder += RIGHT_T_SINGLE + "\x01n" + pSlyEdCfgObj.genColors.listBoxBorderText
	               + "Page    1 of    1" + "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder + LEFT_T_SINGLE
	               + UPPER_RIGHT_SINGLE;

	// Bottom border string
	this.btmBorderNavText = "\x01n\x01h\x01c" + UP_ARROW + "\x01b, \x01c" + DOWN_ARROW + "\x01b, \x01cN\x01y)\x01bext, \x01cP\x01y)\x01brev, "
	                      + "\x01cF\x01y)\x01birst, \x01cL\x01y)\x01bast, \x01cHOME\x01b, \x01cEND\x01b, \x01cEnter\x01y=\x01bSelect, "
	                      + "\x01cESC\x01n\x01c/\x01h\x01cQ\x01y=\x01bEnd";
	this.bottomBorder = "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder + LOWER_LEFT_SINGLE
	                  + RIGHT_T_SINGLE + this.btmBorderNavText + "\x01n" + pSlyEdCfgObj.genColors.listBoxBorder
	                  + LEFT_T_SINGLE;
	var numCharsRemaining = this.dimensions.width - strip_ctrl(this.btmBorderNavText).length - 6;
	for (var i = 0; i < numCharsRemaining; ++i)
		this.bottomBorder += HORIZONTAL_SINGLE;
	this.bottomBorder += LOWER_RIGHT_SINGLE;

	// Item format strings
	this.listIemFormatStr = "\x01n" + pSlyEdCfgObj.genColors.listBoxItemText + "%-"
	                      + +(this.dimensions.width-2) + "s";
	this.listIemHighlightFormatStr = "\x01n" + pSlyEdCfgObj.genColors.listBoxItemHighlight + "%-"
	                               + +(this.dimensions.width-2) + "s";

	// Key functionality override function pointers
	this.enterKeyOverrideFn = null;

	// inputLoopeExitKeys is an object containing additional keypresses that will
	// exit the input loop.
	this.inputLoopExitKeys = {};

	// For drawing the menu
	this.pageNum = 0;
	this.numPages = 0;
	this.numItemsPerPage = 0;
	this.maxItemWidth = 0;
	this.pageNumTxtStartX = 0;

	// Object functions
	this.addTextItem = ChoiceScrollbox_AddTextItem; // Returns the index of the item
	this.getTextItem = ChoiceScrollbox_GetTextIem;
	this.replaceTextItem = ChoiceScrollbox_ReplaceTextItem;
	this.delTextItem = ChoiceScrollbox_DelTextItem;
	this.chgCharInTextItem = ChoiceScrollbox_ChgCharInTextItem;
	this.getChosenTextItemIndex = ChoiceScrollbox_GetChosenTextItemIndex;
	this.setItemArray = ChoiceScrollbox_SetItemArray; // Sets the item array; returns whether or not it was set.
	this.clearItems = ChoiceScrollbox_ClearItems; // Empties the array of items
	this.setEnterKeyOverrideFn = ChoiceScrollbox_SetEnterKeyOverrideFn;
	this.clearEnterKeyOverrideFn = ChoiceScrollbox_ClearEnterKeyOverrideFn;
	this.addInputLoopExitKey = ChoiceScrollbox_AddInputLoopExitKey;
	this.setBottomBorderText = ChoiceScrollbox_SetBottomBorderText;
	this.drawBorder = ChoiceScrollbox_DrawBorder;
	this.drawInnerMenu = ChoiceScrollbox_DrawInnerMenu;
	this.refreshOnScreen = ChoiceScrollbox_RefreshOnScreen;
	this.refreshItemCharOnScreen = ChoiceScrollbox_RefreshItemCharOnScreen;
	// Does the input loop.  Returns an object with the following properties:
	//  itemWasSelected: Boolean - Whether or not an item was selected
	//  selectedIndex: The index of the selected item
	//  selectedItem: The text of the selected item
	//  lastKeypress: The last key pressed by the user
	this.doInputLoop = ChoiceScrollbox_DoInputLoop;
}
function ChoiceScrollbox_AddTextItem(pTextLine, pStripCtrl)
{
   var stripCtrl = true;
   if (typeof(pStripCtrl) == "boolean")
      stripCtrl = pStripCtrl;

   if (stripCtrl)
      this.txtItemList.push(strip_ctrl(pTextLine));
   else
      this.txtItemList.push(pTextLine);
   // Return the index of the added item
   return this.txtItemList.length-1;
}
function ChoiceScrollbox_GetTextIem(pItemIndex)
{
   if (typeof(pItemIndex) != "number")
      return "";
   if ((pItemIndex < 0) || (pItemIndex >= this.txtItemList.length))
      return "";

   return this.txtItemList[pItemIndex];
}
function ChoiceScrollbox_ReplaceTextItem(pItemIndexOrStr, pNewItem)
{
   if (typeof(pNewItem) != "string")
      return false;

   // Find the item index
   var itemIndex = -1;
   if (typeof(pItemIndexOrStr) == "number")
   {
      if ((pItemIndexOrStr < 0) || (pItemIndexOrStr >= this.txtItemList.length))
         return false;
      else
         itemIndex = pItemIndexOrStr;
   }
   else if (typeof(pItemIndexOrStr) == "string")
   {
      itemIndex = -1;
      for (var i = 0; (i < this.txtItemList.length) && (itemIndex == -1); ++i)
      {
         if (this.txtItemList[i] == pItemIndexOrStr)
            itemIndex = i;
      }
   }
   else
      return false;

   // Replace the item
   var replacedIt = false;
   if ((itemIndex > -1) && (itemIndex < this.txtItemList.length))
   {
      this.txtItemList[itemIndex] = pNewItem;
      replacedIt = true;
   }
   return replacedIt;
}
function ChoiceScrollbox_DelTextItem(pItemIndexOrStr)
{
   // Find the item index
   var itemIndex = -1;
   if (typeof(pItemIndexOrStr) == "number")
   {
      if ((pItemIndexOrStr < 0) || (pItemIndexOrStr >= this.txtItemList.length))
         return false;
      else
         itemIndex = pItemIndexOrStr;
   }
   else if (typeof(pItemIndexOrStr) == "string")
   {
      itemIndex = -1;
      for (var i = 0; (i < this.txtItemList.length) && (itemIndex == -1); ++i)
      {
         if (this.txtItemList[i] == pItemIndexOrStr)
            itemIndex = i;
      }
   }
   else
      return false;

   // Remove the item
   var removedIt = false;
   if ((itemIndex > -1) && (itemIndex < this.txtItemList.length))
   {
      this.txtItemList = this.txtItemList.splice(itemIndex, 1);
      removedIt = true;
   }
   return removedIt;
}
function ChoiceScrollbox_ChgCharInTextItem(pItemIndexOrStr, pStrIndex, pNewText)
{
	// Find the item index
	var itemIndex = -1;
	if (typeof(pItemIndexOrStr) == "number")
	{
		if ((pItemIndexOrStr < 0) || (pItemIndexOrStr >= this.txtItemList.length))
			return false;
		else
			itemIndex = pItemIndexOrStr;
	}
	else if (typeof(pItemIndexOrStr) == "string")
	{
		itemIndex = -1;
		for (var i = 0; (i < this.txtItemList.length) && (itemIndex == -1); ++i)
		{
			if (this.txtItemList[i] == pItemIndexOrStr)
				itemIndex = i;
		}
	}
	else
		return false;

	// Change the character in the item
	var changedIt = false;
	if ((itemIndex > -1) && (itemIndex < this.txtItemList.length))
	{
		this.txtItemList[itemIndex] = chgCharInStr(this.txtItemList[itemIndex], pStrIndex, pNewText);
		changedIt = true;
	}
	return changedIt;
}
function ChoiceScrollbox_GetChosenTextItemIndex()
{
   return this.chosenTextItemIndex;
}
function ChoiceScrollbox_SetItemArray(pArray, pStripCtrl)
{
	var safeToSet = false;
	if (Object.prototype.toString.call(pArray) === "[object Array]")
	{
		if (pArray.length > 0)
			safeToSet = (typeof(pArray[0]) == "string");
		else
			safeToSet = true; // It's safe to set an empty array
	}

	if (safeToSet)
	{
		delete this.txtItemList;
		this.txtItemList = pArray;

		var stripCtrl = true;
		if (typeof(pStripCtrl) == "boolean")
			stripCtrl = pStripCtrl;
		if (stripCtrl)
		{
			// Remove attribute/color characters from the text lines in the array
			for (var i = 0; i < this.txtItemList.length; ++i)
				this.txtItemList[i] = strip_ctrl(this.txtItemList[i]);
		}
	}

	return safeToSet;
}
function ChoiceScrollbox_ClearItems()
{
   this.txtItemList.length = 0;
}
function ChoiceScrollbox_SetEnterKeyOverrideFn(pOverrideFn)
{
   if (Object.prototype.toString.call(pOverrideFn) == "[object Function]")
      this.enterKeyOverrideFn = pOverrideFn;
}
function ChoiceScrollbox_ClearEnterKeyOverrideFn()
{
   this.enterKeyOverrideFn = null;
}
function ChoiceScrollbox_AddInputLoopExitKey(pKeypress)
{
   this.inputLoopExitKeys[pKeypress] = true;
}
function ChoiceScrollbox_SetBottomBorderText(pText, pAddTChars, pAutoStripIfTooLong)
{
	if (typeof(pText) != "string")
		return;

	const innerWidth = (pAddTChars ? this.dimensions.width-4 : this.dimensions.width-2);

	if (pAutoStripIfTooLong)
	{
		if (strip_ctrl(pText).length > innerWidth)
			pText = pText.substr(0, innerWidth);
	}

	// Re-build the bottom border string based on the new text
	this.bottomBorder = "\x01n" + this.SlyEdCfgObj.genColors.listBoxBorder + LOWER_LEFT_SINGLE;
	if (pAddTChars)
		this.bottomBorder += RIGHT_T_SINGLE;
	if (pText.indexOf("\x01n") != 0)
		this.bottomBorder += "\x01n";
	this.bottomBorder += pText + "\x01n" + this.SlyEdCfgObj.genColors.listBoxBorder;
	if (pAddTChars)
		this.bottomBorder += LEFT_T_SINGLE;
	var numCharsRemaining = this.dimensions.width - strip_ctrl(this.bottomBorder).length - 3;
	for (var i = 0; i < numCharsRemaining; ++i)
		this.bottomBorder += HORIZONTAL_SINGLE;
	this.bottomBorder += LOWER_RIGHT_SINGLE;
}
function ChoiceScrollbox_DrawBorder()
{
	console.gotoxy(this.dimensions.topLeftX, this.dimensions.topLeftY);
	console.print(this.topBorder);
	// Draw the side border characters
	var screenRow = this.dimensions.topLeftY + 1;
	for (var screenRow = this.dimensions.topLeftY+1; screenRow <= this.dimensions.bottomRightY-1; ++screenRow)
	{
		console.gotoxy(this.dimensions.topLeftX, screenRow);
		console.print(VERTICAL_SINGLE);
		console.gotoxy(this.dimensions.bottomRightX, screenRow);
		console.print(VERTICAL_SINGLE);
	}
	// Draw the bottom border
	console.gotoxy(this.dimensions.topLeftX, this.dimensions.bottomRightY);
	console.print(this.bottomBorder);
}
function ChoiceScrollbox_DrawInnerMenu(pSelectedIndex)
{
	var selectedIndex = (typeof(pSelectedIndex) == "number" ? pSelectedIndex : -1);
	var startArrIndex = this.pageNum * this.numItemsPerPage;
	var endArrIndex = startArrIndex + this.numItemsPerPage;
	if (endArrIndex > this.txtItemList.length)
		endArrIndex = this.txtItemList.length;
	var selectedItemRow = this.dimensions.topLeftY+1;
	var screenY = this.dimensions.topLeftY + 1;
	for (var i = startArrIndex; i < endArrIndex; ++i)
	{
		console.gotoxy(this.dimensions.topLeftX+1, screenY);
		if (i == selectedIndex)
		{
			printf(this.listIemHighlightFormatStr, this.txtItemList[i].substr(0, this.maxItemWidth));
			selectedItemRow = screenY;
		}
		else
			printf(this.listIemFormatStr, this.txtItemList[i].substr(0, this.maxItemWidth));
		++screenY;
	}
	// If the current screen row is below the bottom row inside the box,
	// continue and write blank lines to the bottom of the inside of the box
	// to blank out any text that might still be there.
	while (screenY < this.dimensions.topLeftY+this.dimensions.height-1)
	{
		console.gotoxy(this.dimensions.topLeftX+1, screenY);
		printf(this.listIemFormatStr, "");
		++screenY;
	}

	// Update the page number in the top border of the box.
	console.gotoxy(this.pageNumTxtStartX, this.dimensions.topLeftY);
	printf("\x01n" + this.SlyEdCfgObj.genColors.listBoxBorderText + "Page %4d of %4d", this.pageNum+1, this.numPages);
	return selectedItemRow;
}
function ChoiceScrollbox_RefreshOnScreen(pSelectedIndex)
{
	this.drawBorder();
	this.drawInnerMenu(pSelectedIndex);
}
function ChoiceScrollbox_RefreshItemCharOnScreen(pItemIndex, pCharIndex)
{
	if ((typeof(pItemIndex) != "number") || (typeof(pCharIndex) != "number"))
		return;
	if ((pItemIndex < 0) || (pItemIndex >= this.txtItemList.length) ||
	    (pItemIndex < this.topItemIndex) || (pItemIndex > this.bottomItemIndex))
	{
		return;
	}
	if ((pCharIndex < 0) || (pCharIndex >= this.txtItemList[pItemIndex].length))
		return;

	// Save the current cursor position so that we can restore it later
	const originalCurpos = console.getxy();
	// Go to the character's position on the screen and set the highlight or
	// normal color, depending on whether the item is the currently selected item,
	// then print the character on the screen.
	const charScreenX = this.dimensions.topLeftX + 1 + pCharIndex;
	const itemScreenY = this.dimensions.topLeftY + 1 + (pItemIndex - this.topItemIndex);
	console.gotoxy(charScreenX, itemScreenY);
	if (pItemIndex == this.chosenTextItemIndex)
		console.print(this.SlyEdCfgObj.genColors.listBoxItemHighlight);
	else
		console.print(this.SlyEdCfgObj.genColors.listBoxItemText);
	console.print(this.txtItemList[pItemIndex].charAt(pCharIndex));
	// Move the cursor back to where it was originally
	console.gotoxy(originalCurpos);
}
function ChoiceScrollbox_DoInputLoop(pDrawBorder)
{
	var retObj = {
		itemWasSelected: false,
		selectedIndex: -1,
		selectedItem: "",
		lastKeypress: ""
	};

	// Don't do anything if the item list doesn't contain any items
	if (this.txtItemList.length == 0)
		return retObj;

	//////////////////////////////////
	// Locally-defined functions

	// This function returns the index of the bottommost item that
	// can be displayed in the box.
	//
	// Parameters:
	//  pArray: The array containing the items
	//  pTopindex: The index of the topmost item displayed in the box
	//  pNumItemsPerPage: The number of items per page
	function getBottommostItemIndex(pArray, pTopIndex, pNumItemsPerPage)
	{
		var bottomIndex = pTopIndex + pNumItemsPerPage - 1;
		// If bottomIndex is beyond the last index, then adjust it.
		if (bottomIndex >= pArray.length)
			bottomIndex = pArray.length - 1;
		return bottomIndex;
	}



	//////////////////////////////////
	// Code

	// Variables for keeping track of the item list
	this.numItemsPerPage = this.dimensions.height - 2;
	this.topItemIndex = 0;    // The index of the message group at the top of the list
	// Figure out the index of the last message group to appear on the screen.
	this.bottomItemIndex = getBottommostItemIndex(this.txtItemList, this.topItemIndex, this.numItemsPerPage);
	this.numPages = Math.ceil(this.txtItemList.length / this.numItemsPerPage);
	const topIndexForLastPage = (this.numItemsPerPage * this.numPages) - this.numItemsPerPage;

	if (pDrawBorder)
		this.drawBorder();

	// User input loop
	// For the horizontal location of the page number text for the box border:
	// Based on the fact that there can be up to 9999 text replacements and 10
	// per page, there will be up to 1000 pages of replacements.  To write the
	// text, we'll want to be 20 characters to the left of the end of the border
	// of the box.
	this.pageNumTxtStartX = this.dimensions.topLeftX + this.dimensions.width - 19;
	this.maxItemWidth = this.dimensions.width - 2;
	this.pageNum = 0;
	var startArrIndex = 0;
	this.chosenTextItemIndex = retObj.selectedIndex = 0;
	var endArrIndex = 0; // One past the last array item
	var curpos = { // For keeping track of the current cursor position
		x: 0,
		y: 0
	};
	var refreshList = true; // For screen redraw optimizations
	var continueOn = true;
	while (continueOn)
	{
		if (refreshList)
		{
			this.bottomItemIndex = getBottommostItemIndex(this.txtItemList, this.topItemIndex, this.numItemsPerPage);

			// Write the list of items for the current page.  Also, drawInnerMenu()
			// will return the selected item row.
			var selectedItemRow = this.drawInnerMenu(retObj.selectedIndex);

			// Just for sane appearance: Move the cursor to the first character of
			// the currently-selected row and set the appropriate color.
			curpos.x = this.dimensions.topLeftX+1;
			curpos.y = selectedItemRow;
			console.gotoxy(curpos.x, curpos.y);
			console.print(this.SlyEdCfgObj.genColors.listBoxItemHighlight);

			refreshList = false;
		}

		// Get a key from the user (upper-case) and take action based upon it.
		retObj.lastKeypress = getKeyWithESCChars(K_UPPER|K_NOCRLF|K_NOSPIN, this.SlyEdCfgObj);
		switch (retObj.lastKeypress)
		{
			case 'N': // Next page
			case KEY_PAGE_DOWN:
				refreshList = (this.pageNum < this.numPages-1);
				if (refreshList)
				{
					++this.pageNum;
					this.topItemIndex += this.numItemsPerPage;
					this.chosenTextItemIndex = retObj.selectedIndex = this.topItemIndex;
					// Note: this.bottomItemIndex is refreshed at the top of the loop
				}
				break;
			case 'P': // Previous page
			case KEY_PAGE_UP:
				refreshList = (this.pageNum > 0);
				if (refreshList)
				{
					--this.pageNum;
					this.topItemIndex -= this.numItemsPerPage;
					this.chosenTextItemIndex = retObj.selectedIndex = this.topItemIndex;
					// Note: this.bottomItemIndex is refreshed at the top of the loop
				}
				break;
			case 'F': // First page
				refreshList = (this.pageNum > 0);
				if (refreshList)
				{
					this.pageNum = 0;
					this.topItemIndex = 0;
					this.chosenTextItemIndex = retObj.selectedIndex = this.topItemIndex;
					// Note: this.bottomItemIndex is refreshed at the top of the loop
				}
				break;
			case 'L': // Last page
				refreshList = (this.pageNum < this.numPages-1);
				if (refreshList)
				{
					this.pageNum = this.numPages-1;
					this.topItemIndex = topIndexForLastPage;
					this.chosenTextItemIndex = retObj.selectedIndex = this.topItemIndex;
					// Note: this.bottomItemIndex is refreshed at the top of the loop
				}
				break;
			case KEY_UP:
				// Move the cursor up one item
				if (retObj.selectedIndex > 0)
				{
					// If the previous item index is on the previous page, then we'll
					// want to display the previous page.
					var previousItemIndex = retObj.selectedIndex - 1;
					if (previousItemIndex < this.topItemIndex)
					{
						--this.pageNum;
						this.topItemIndex -= this.numItemsPerPage;
						// Note: this.bottomItemIndex is refreshed at the top of the loop
						refreshList = true;
					}
					else
					{
						// Display the current line un-highlighted
						console.gotoxy(this.dimensions.topLeftX+1, curpos.y);
						printf(this.listIemFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
						// Display the previous line highlighted
						curpos.x = this.dimensions.topLeftX+1;
						--curpos.y;
						console.gotoxy(curpos);
						printf(this.listIemHighlightFormatStr, this.txtItemList[previousItemIndex].substr(0, this.maxItemWidth));
						console.gotoxy(curpos); // Move the cursor into place where it should be
						refreshList = false;
					}
					this.chosenTextItemIndex = retObj.selectedIndex = previousItemIndex;
				}
				break;
			case KEY_DOWN:
				// Move the cursor down one item
				if (retObj.selectedIndex < this.txtItemList.length - 1)
				{
					// If the next item index is on the next page, then we'll want to
					// display the next page.
					var nextItemIndex = retObj.selectedIndex + 1;
					if (nextItemIndex > this.bottomItemIndex)
					{
						++this.pageNum;
						this.topItemIndex += this.numItemsPerPage;
						// Note: this.bottomItemIndex is refreshed at the top of the loop
						refreshList = true;
					}
					else
					{
						// Display the current line un-highlighted
						console.gotoxy(this.dimensions.topLeftX+1, curpos.y);
						printf(this.listIemFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
						// Display the previous line highlighted
						curpos.x = this.dimensions.topLeftX+1;
						++curpos.y;
						console.gotoxy(curpos);
						printf(this.listIemHighlightFormatStr, this.txtItemList[nextItemIndex].substr(0, this.maxItemWidth));
						console.gotoxy(curpos); // Move the cursor into place where it should be
						refreshList = false;
					}
					this.chosenTextItemIndex = retObj.selectedIndex = nextItemIndex;
				}
				break;
			case KEY_HOME: // Go to the first row in the box
				if (retObj.selectedIndex > this.topItemIndex)
				{
					// Display the current line un-highlighted
					console.gotoxy(this.dimensions.topLeftX+1, curpos.y);
					printf(this.listIemFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
					// Select the top item, and display it highlighted.
					this.chosenTextItemIndex = retObj.selectedIndex = this.topItemIndex;
					curpos.x = this.dimensions.topLeftX+1;
					curpos.y = this.dimensions.topLeftY+1;
					console.gotoxy(curpos);
					printf(this.listIemHighlightFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
					console.gotoxy(curpos); // Move the cursor into place where it should be
					refreshList = false;
				}
				break;
			case KEY_END: // Go to the last row in the box
				if (retObj.selectedIndex < this.bottomItemIndex)
				{
					// Display the current line un-highlighted
					console.gotoxy(this.dimensions.topLeftX+1, curpos.y);
					printf(this.listIemFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
					// Select the bottommost item, and display it highlighted.
					this.chosenTextItemIndex = retObj.selectedIndex = this.bottomItemIndex;
					curpos.x = this.dimensions.topLeftX+1;
					curpos.y = this.dimensions.bottomRightY-1;
					console.gotoxy(curpos);
					printf(this.listIemHighlightFormatStr, this.txtItemList[retObj.selectedIndex].substr(0, this.maxItemWidth));
					console.gotoxy(curpos); // Move the cursor into place where it should be
					refreshList = false;
				}
				break;
			case KEY_ENTER:
				// If the enter key override function is set, then call it and pass
				// this object into it.  Otherwise, just select the item and quit.
				if (this.enterKeyOverrideFn !== null)
				this.enterKeyOverrideFn(this);
				else
				{
					retObj.itemWasSelected = true;
					// Note: retObj.selectedIndex is already set.
					retObj.selectedItem = this.txtItemList[retObj.selectedIndex];
					refreshList = false;
					continueOn = false;
				}
				break;
			case KEY_ESC: // Quit
			case CTRL_A:  // Quit
			case 'Q':     // Quit
				this.chosenTextItemIndex = retObj.selectedIndex = -1;
				refreshList = false;
				continueOn = false;
				break;
			default:
				// If the keypress is an additional key to exit the input loop, then
				// do so.
				if (this.inputLoopExitKeys.hasOwnProperty(retObj.lastKeypress))
				{
					this.chosenTextItemIndex = retObj.selectedIndex = -1;
					refreshList = false;
					continueOn = false;
				}
				else
				{
					// Unrecognized command.  Don't refresh the list of the screen.
					refreshList = false;
				}
				break;
		}
	}

	console.print("\x01n"); // To prevent outputting highlight colors, etc..
	return retObj;
}


///////////////////////////////////////////////////////////////////////////////////
// Functions

// This function takes a string and returns a copy of the string
// with a color randomly alternating between dim & bright versions.
//
// Parameters:
//  pString: The string to convert
//  pColor: The color to use (Synchronet color code)
function randomDimBrightString(pString, pColor)
{
	// Return if an invalid string is passed in.
	if (pString == null)
		return "";
	if (typeof(pString) != "string")
		return "";

   // Set the color.  Default to green.
	var color = "\x01g";
	if ((pColor != null) && (typeof(pColor) != "undefined"))
      color = pColor;

   return(randomTwoColorString(pString, "\x01n" + color, "\x01n\x01h" + color));
}

// This function takes a string and returns a copy of the string
// with colors randomly alternating between two given colors.
//
// Parameters:
//  pString: The string to convert
//  pColor11: The first color to use (Synchronet color code)
//  pColor12: The second color to use (Synchronet color code)
function randomTwoColorString(pString, pColor1, pColor2)
{
	// Return if an invalid string is passed in.
	if (pString == null)
		return "";
	if (typeof(pString) != "string")
		return "";

	// Set the colors.  Default to green.
	var color1 = "\x01n\x01g";
	if ((pColor1 != null) && (typeof(pColor1) != "undefined"))
      color1 = pColor1;
   var color2 = "\x01n\x01g\x01h";
	if ((pColor2 != null) && (typeof(pColor2) != "undefined"))
      color2 = pColor2;

	// Create a copy of the string without any control characters,
	// and then add our coloring to it.
	pString = strip_ctrl(pString);
	var returnString = color1;
	var useColor1 = false;     // Whether or not to use the useColor1 version of the color1
	var oldUseColor1 = useColor1; // The value of useColor1 from the last pass
	for (var i = 0; i < pString.length; ++i)
	{
		// Determine if this character should be useColor1
		useColor1 = (Math.floor(Math.random()*2) == 1);
		if (useColor1 != oldUseColor1)
         returnString += (useColor1 ? color1 : color2);

		// Append the character from pString.
		returnString += pString.charAt(i);

		oldUseColor1 = useColor1;
	}

	return returnString;
}

// Returns the current time as a string, to be displayed on the screen.
function getCurrentTimeStr()
{
	var timeStr = strftime("%I:%M%p", time());
	timeStr = timeStr.replace("AM", "a");
	timeStr = timeStr.replace("PM", "p");
	
	return timeStr;
}

// Returns whether or not a character is printable.
function isPrintableChar(pText)
{
   // Make sure pText is valid and is a string.
   if (typeof(pText) != "string")
      return false;
   if (pText.length == 0)
      return false;

   // Make sure the character is a printable ASCII character in the range of 32 to 254,
   // except for 127 (delete).
   var charCode = pText.charCodeAt(0);
   return ((charCode > 31) && (charCode < 255) && (charCode != 127));
}

// Removes multiple, leading, and/or trailing spaces
// The search & replace regular expressions used in this
// function came from the following URL:
// http://qodo.co.uk/blog/javascript-trim-leading-and-trailing-spaces
//
// Parameters:
//  pString: The string to trim
//  pLeading: Whether or not to trim leading spaces (optional, defaults to true)
//  pMultiple: Whether or not to trim multiple spaces (optional, defaults to true)
//  pTrailing: Whether or not to trim trailing spaces (optional, defaults to true)
//
// Return value: The trimmed string
function trimSpaces(pString, pLeading, pMultiple, pTrailing)
{
	// Make sure pString is a string.
	if (typeof(pString) == "string")
	{
		var leading = true;
		var multiple = true;
		var trailing = true;
		if(typeof(pLeading) != "undefined")
			leading = pLeading;
		if(typeof(pMultiple) != "undefined")
			multiple = pMultiple;
		if(typeof(pTrailing) != "undefined")
			trailing = pTrailing;

		// To remove both leading & trailing spaces:
		//pString = pString.replace(/(^\s*)|(\s*$)/gi,"");

		if (leading)
			pString = pString.replace(/(^\s*)/gi,"");
		if (multiple)
			pString = pString.replace(/[ ]{2,}/gi," ");
		if (trailing)
			pString = pString.replace(/(\s*$)/gi,"");
	}

	return pString;
}

// Displays the text to display above help screens.
function displayHelpHeader()
{
   // Construct the header text lines only once.
   if (typeof(displayHelpHeader.headerLines) == "undefined")
   {
      displayHelpHeader.headerLines = [];

      var headerText = EDITOR_PROGRAM_NAME + " Help \x01w(\x01y"
                      + (EDITOR_STYLE == "DCT" ? "DCT" : "Ice")
                      + " mode\x01w)";
      var headerTextLen = strip_ctrl(headerText).length;

      // Top border
      var headerTextStr = "\x01n\x01h\x01c" + UPPER_LEFT_SINGLE;
      for (var i = 0; i < headerTextLen + 2; ++i)
         headerTextStr += HORIZONTAL_SINGLE;
      headerTextStr += UPPER_RIGHT_SINGLE;
      displayHelpHeader.headerLines.push(headerTextStr);

      // Middle line: Header text string
      headerTextStr = VERTICAL_SINGLE + "\x01" + "4\x01y " + headerText + " \x01n\x01h\x01c"
                    + VERTICAL_SINGLE;
      displayHelpHeader.headerLines.push(headerTextStr);

      // Lower border
      headerTextStr = LOWER_LEFT_SINGLE;
      for (var i = 0; i < headerTextLen + 2; ++i)
         headerTextStr += HORIZONTAL_SINGLE;
      headerTextStr += LOWER_RIGHT_SINGLE;
      displayHelpHeader.headerLines.push(headerTextStr);
   }

   // Print the header strings
   for (var index in displayHelpHeader.headerLines)
      console.center(displayHelpHeader.headerLines[index]);
}

// Displays the command help.
//
// Parameters:
//  pDisplayHeader: Whether or not to display the help header.
//  pClear: Whether or not to clear the screen first
//  pPause: Whether or not to pause at the end
//  pCanCrossPost: Whether or not cross-posting is enabled
//  pIsSysop: Whether or not the user is the sysop.
//  pTxtReplacments: Whether or not the text replacements feature is enabled
//  pUserSettings: Whether or not the user settings feature is enabled
//  pSpellCheck: Whether or not spell check is allowed
//  pCanChangeColor: Whether or not changing text color is allowed
function displayCommandList(pDisplayHeader, pClear, pPause, pCanCrossPost, pIsSysop,
                            pTxtReplacments, pUserSettings, pSpellCheck, pCanChangeColor)
{
	if (pClear)
		console.clear("\x01n");
	if (pDisplayHeader)
	{
		displayHelpHeader();
		console.crlf();
	}

	var isSysop = (pIsSysop != null ? pIsSysop : user.compare_ars("SYSOP"));

	// This function displays a key and its description with formatting & colors.
	//
	// Parameters:
	//  pKey: The key description
	//  pDesc: The description of the key's function
	//  pCR: Whether or not to display a carriage return (boolean).  Optional;
	//       if not specified, this function won't display a CR.
	function displayCmdKeyFormatted(pKey, pDesc, pCR)
	{
		printf("\x01c\x01h%-13s\x01g: \x01n\x01c%s", pKey, pDesc);
		if (pCR)
			console.crlf();
	}
	// This function does the same, but outputs 2 on the same line.
	function displayCmdKeyFormattedDouble(pKey, pDesc, pKey2, pDesc2, pCR)
	{
		var sepChar1 = ":";
		var sepChar2 = ":";
		if ((pKey.length == 0) && (pDesc.length == 0))
			sepChar1 = " ";
		if ((pKey2.length == 0) && (pDesc2.length == 0))
			sepChar2 = " ";
		printf("\x01c\x01h%-13s\x01g" + sepChar1 + " \x01n\x01c%-28s \x01k\x01h" + VERTICAL_SINGLE +
		       " \x01c\x01h%-8s\x01g" + sepChar2 + " \x01n\x01c%s", pKey, pDesc, pKey2, pDesc2);
		if (pCR)
			console.crlf();
	}

	// Help keys and slash commands
	printf("\x01n\x01g%-44s  %-33s\r\n", "Help keys", "Slash commands (on blank line)");
	printf("\x01k\x01h%-44s  %-33s\r\n", charStr(HORIZONTAL_SINGLE, 9), charStr(HORIZONTAL_SINGLE, 30));
	displayCmdKeyFormattedDouble("Ctrl-G", "General help", "/A", "Abort", true);
	displayCmdKeyFormattedDouble("Ctrl-L", "Command key list (this list)", "/S", "Save", true);
	displayCmdKeyFormattedDouble("", "", "/Q", "Quote message", true);
	if (pTxtReplacments)
		displayCmdKeyFormattedDouble("Ctrl-T", "List text replacements", "/T", "List text replacements", true);
	if (pUserSettings)
		displayCmdKeyFormattedDouble("", "", "/U", "Your user settings", true);
	if (pCanCrossPost)
		displayCmdKeyFormattedDouble("", "", "/C", "Cross-post selection", true);
	displayCmdKeyFormattedDouble("", "", "/UPLOAD", "Upload a message", true);
	printf(" \x01c\x01h%-7s\x01g  \x01n\x01c%s", "", "", "/?", "Show help");
	console.crlf();
	// Command/edit keys
	console.print("\x01n\x01gCommand/edit keys\r\n\x01k\x01h" + charStr(HORIZONTAL_SINGLE, 17) + "\r\n");
	displayCmdKeyFormattedDouble("Ctrl-A", "Abort message", "PageUp", "Page up", true);
	displayCmdKeyFormattedDouble("Ctrl-Z", "Save message", "PageDown", "Page down", true);
	displayCmdKeyFormattedDouble("Ctrl-Q", "Quote message", "Ctrl-W", "Word/text search", true);
	displayCmdKeyFormattedDouble("Insert/Ctrl-I", "Toggle insert/overwrite mode",
	                             "Ctrl-D", "Delete line", true);
	displayCmdKeyFormattedDouble("Ctrl-S", "Change subject", "ESC", "Command menu", true);
	// For the remaining hotkeys, build an array of them based on whether they're allowed or not.
	// Then with the array, output each pair of hotkeys on the same line, and if there's only one
	// left, display it by itself.
	var remainingHotkeysAndDescriptions = [];
	if (pUserSettings)
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-U", "Your user settings"));
	if (pCanCrossPost)
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-C", "Cross-post selection"));
	if (pCanChangeColor)
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-K", "Change text color"));
	if (pSpellCheck)
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-R", "Spell checker"));
	if (isSysop)
	{
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-O", "Import a file"));
		remainingHotkeysAndDescriptions.push(makeHotkeyAndDescObj("Ctrl-X", "Export to file"));
	}
	var i = 0;
	while (i < remainingHotkeysAndDescriptions.length)
	{
		var numHotkeysRemaining = remainingHotkeysAndDescriptions.length - i;
		if (numHotkeysRemaining >= 2)
		{
			var nextI = i + 1;
			var hotkey1 = remainingHotkeysAndDescriptions[i].hotkey;
			var desc1 = remainingHotkeysAndDescriptions[i].desc;
			var hotkey2 = remainingHotkeysAndDescriptions[nextI].hotkey
			var desc2 = remainingHotkeysAndDescriptions[nextI].desc;
			displayCmdKeyFormattedDouble(hotkey1, desc1, hotkey2, desc2, true);
			i += 2;
		}
		else
		{
			displayCmdKeyFormatted(remainingHotkeysAndDescriptions[i].hotkey, remainingHotkeysAndDescriptions[i].desc, true);
			++i;
		}
	}

	if (pPause)
		console.pause();
}
// Helper for displayCommandList(): Returns an object with 'hotkey' and 'desc' propeties with the hotkey & its description
function makeHotkeyAndDescObj(pHotkey, pDescription)
{
	return {
		hotkey: pHotkey,
		desc: pDescription
	};
}
// Returns a string with a character repeated a given number of times
//
// Parameters:
//  pChar: The character to repeat in the string
//  pNumTimes: The number of times to repeat the character
//
// Return value: A string with the given character repeated the given number of times
function charStr(pChar, pNumTimes)
{
	if (typeof(pChar) !== "string" || pChar.length == 0 || typeof(pNumTimes) !== "number" || pNumTimes < 1)
		return "";

	var str = "";
	for (var i = 0; i < pNumTimes; ++i)
		str += pChar;
	return str;
}

// Displays the general help screen.
//
// Parameters:
//  pDisplayHeader: Whether or not to display the help header.
//  pClear: Whether or not to clear the screen first
//  pPause: Whether or not to pause at the end
function displayGeneralHelp(pDisplayHeader, pClear, pPause)
{
   if (pClear)
      console.clear("\x01n");
   if (pDisplayHeader)
      displayHelpHeader();

   console.print("\x01n\x01cSlyEdit is a full-screen message editor that mimics the look & feel of\r\n");
   console.print("IceEdit or DCT Edit, two popular editors.  The editor is currently in " +
                 (EDITOR_STYLE == "DCT" ? "DCT" : "Ice") + "\r\nmode.\r\n");
   console.print("At the top of the screen, information about the message being written (or\r\n");
   console.print("file being edited) is displayed.  The middle section is the edit area,\r\n");
   console.print("where the message/file is edited.  Finally, the bottom section displays\r\n");
   console.print("some of the most common keys and/or status.");
   console.crlf();
   if (pPause)
      console.pause();
}

// Displays program information.
//
// Parameters:
//  pClear: Whether or not to clear the screen first
//  pPause: Whether or not to pause at the end
function displayProgramInfo(pClear, pPause)
{
	if (pClear)
		console.clear("\x01n");

	// Print the program information
	console.center("\x01n\x01h\x01c" + EDITOR_PROGRAM_NAME + "\x01n \x01cVersion \x01g" +
	               EDITOR_VERSION + " \x01w\x01h(\x01b" + EDITOR_VER_DATE + "\x01w)");
	console.center("\x01n\x01cby Eric Oulashin");
	console.crlf();
	console.print("\x01n\x01cSlyEdit is a full-screen message editor for Synchronet that mimics the look &\r\n");
	console.print("feel of IceEdit or DCT Edit.");
	console.crlf();
	if (pPause)
		console.pause();
}

// Displays the informational screen for the program exit.
//
// Parameters:
//  pClearScreen: Whether or not to clear the screen.
function displayProgramExitInfo(pClearScreen)
{
	if (pClearScreen)
		console.clear("\x01n");

	console.print("\x01n\x01cYou have been using \x01hSlyEdit \x01n\x01cversion \x01g" + EDITOR_VERSION + " \x01n\x01m(" + EDITOR_VER_DATE + ")");
	console.crlf();
	console.print("\x01n\x01cby Eric Oulashin of \x01c\x01hD\x01n\x01cigital \x01hD\x01n\x01cistortion \x01hB\x01n\x01cBS");
	console.crlf();
	console.crlf();
	console.print("\x01n\x01cAcknowledgements for look & feel go to the following people:");
	console.crlf();
	console.print("Dan Traczynski: Creator of DCT Edit");
	console.crlf();
	console.print("Jeremy Landvoigt: Original creator of IceEdit");
	console.crlf();
}

// Writes some text on the screen at a given location with a given pause.
//
// Parameters:
//  pX: The column number on the screen at which to write the message
//  pY: The row number on the screen at which to write the message
//  pText: The text to write
//  pPauseMS: The pause time, in milliseconds
//  pClearLineAttrib: Optional - The color/attribute to clear the line with.
//                    If not specified, defaults to normal attribute.
function writeWithPause(pX, pY, pText, pPauseMS, pClearLineAttrib)
{
	var clearLineAttrib = "\x01n";
	if ((pClearLineAttrib != null) && (typeof(pClearLineAttrib) == "string"))
		clearLineAttrib = pClearLineAttrib;
	console.gotoxy(pX, pY);
	console.cleartoeol(clearLineAttrib);
	console.print(pText);
	mswait(pPauseMS);
}

// Prompts the user for a yes/no question.
//
// Parameters:
//  pQuestion: The question to ask the user
//  pDefaultYes: Boolean - Whether or not the default should be Yes.
//               For false, the default will be No.
//  pBoxTitle: For DCT mode, this specifies the title to use for the
//             prompt box.  This is optional; if this is left out,
//             the prompt box title will default to "Prompt".
// pIceRefreshForBothAnswers: In Ice mode, whether or not to refresh the bottom
//                            line on the screen for a "yes" as well as "no"
//                            answer.  This is optional.  By default, only
//                            refreshes for a "no" answer.
// pAlwaysEraseBox: In DCT mode - Boolean: Whether to erase the box regardless of a Yes or No answer.
//
// Return value: Boolean - true for a "Yes" answer, false for "No"
function promptYesNo(pQuestion, pDefaultYes, pBoxTitle, pIceRefreshForBothAnswers, pAlwaysEraseBox)
{
   var userResponse = pDefaultYes;

   if (EDITOR_STYLE == "DCT")
   {
      // We need to create an object of parameters to pass to the DCT-style
      // Yes/No function.
      var paramObj = new AbortConfirmFuncParams();
      paramObj.editLinesIndex = gEditLinesIndex;
      if (typeof(pBoxTitle) == "string")
         userResponse = promptYesNo_DCTStyle(pQuestion, pBoxTitle, pDefaultYes, paramObj, pAlwaysEraseBox);
      else
         userResponse = promptYesNo_DCTStyle(pQuestion, "Prompt", pDefaultYes, paramObj, pAlwaysEraseBox);
   }
   else if (EDITOR_STYLE == "ICE")
   {
      const originalCurpos = console.getxy();
      // Go to the bottom line on the screen and prompt the user
      console.gotoxy(1, console.screen_rows);
      console.cleartoeol();
      console.gotoxy(1, console.screen_rows);
      userResponse = promptYesNo_IceStyle(pQuestion, pDefaultYes);
      // If the user chose "No", or if we are to refresh the bottom line
      // regardless, then re-display the bottom help line and move the
      // cursor back to its original position.
      if (pIceRefreshForBothAnswers || !userResponse)
      {
         fpDisplayBottomHelpLine(console.screen_rows, gUseQuotes);
         console.gotoxy(originalCurpos);
      }
   }

   return userResponse;
}

// Reads the SlyEdit configuration settings from SlyEdit.cfg.
//
// Return value: An object containing the settings as properties.
function ReadSlyEditConfigFile()
{
	var cfgObj = {
		userIsSysop: user.compare_ars("SYSOP"), // Whether or not the user is a sysop
		// Default settings
		thirdPartyLoadOnStart: [],
		runJSOnStart: [],
		thirdPartyLoadOnExit: [],
		runJSOnExit: [],
		displayEndInfoScreen: true,
		userInputTimeout: true,
		inputTimeoutMS: 300000,
		reWrapQuoteLines: true,
		allowColorSelection: true,
		saveColorsAsANSI: false,
		useQuoteLineInitials: true,
		indentQuoteLinesWithInitials: true,
		allowCrossPosting: true,
		enableTextReplacements: false,
		textReplacementsUseRegex: false,
		enableTaglines: false,
		tagLineFilename: genFullPathCfgFilename("SlyEdit_Taglines.txt", gStartupPath),
		taglinePrefix: "... ",
		quoteTaglines: false,
		shuffleTaglines: false,
		allowUserSettings: true,
		allowEditQuoteLines: true,
		allowSpellCheck: true,
		dictionaryFilenames: [],

		// General SlyEdit color settings
		genColors: {
			// Cross-posting UI element colors
			listBoxBorder: "\x01n\x01g",
			listBoxBorderText: "\x01n\x01b\x01h",
			crossPostMsgAreaNum: "\x01n\x01h\x01w",
			crossPostMsgAreaNumHighlight: "\x01n\x01" + "4\x01h\x01w",
			crossPostMsgAreaDesc: "\x01n\x01c",
			crossPostMsgAreaDescHighlight: "\x01n\x01" + "4\x01c",
			crossPostChk: "\x01n\x01h\x01y",
			crossPostChkHighlight: "\x01n\x01" + "4\x01h\x01y",
			crossPostMsgGrpMark: "\x01n\x01h\x01g",
			crossPostMsgGrpMarkHighlight: "\x01n\x01" + "4\x01h\x01g",
			// Colors for certain output strings
			msgWillBePostedHdr: "\x01n\x01c",
			msgPostedGrpHdr: "\x01n\x01h\x01b",
			msgPostedSubBoardName: "\x01n\x01g",
			msgPostedOriginalAreaText: "\x01n\x01c",
			msgHasBeenSavedText: "\x01n\x01h\x01c",
			msgAbortedText: "\x01n\x01m\x01h",
			emptyMsgNotSentText: "\x01n\x01m\x01h",
			genMsgErrorText: "\x01n\x01m\x01h",
			listBoxItemText: "\x01n\x01c",
			listBoxItemHighlight: "\x01n\x01" + "4\x01w\x01h"
		},

		// Default Ice-style colors
		iceColors: {
			menuOptClassicColors: true,
			// Ice color theme file
			ThemeFilename: genFullPathCfgFilename("SlyIceColors_BlueIce.cfg", gStartupPath),
			// Quote line color
			QuoteLineColor: "\x01n\x01c",
			// Ice colors for the quote window
			QuoteWinText: "\x01n\x01h\x01w",            // White
			QuoteLineHighlightColor: "\x01" + "4\x01h\x01c", // High cyan on blue background
			QuoteWinBorderTextColor: "\x01n\x01c\x01h", // Bright cyan
			BorderColor1: "\x01n\x01b",              // Blue
			BorderColor2: "\x01n\x01b\x01h",          // Bright blue
			// Ice colors for multi-choice prompts
			SelectedOptionBorderColor: "\x01n\x01b\x01h\x01" + "4",
			SelectedOptionTextColor: "\x01n\x01c\x01h\x01" + "4",
			UnselectedOptionBorderColor: "\x01n\x01b",
			UnselectedOptionTextColor: "\x01n\x01w",
			// Ice colors for the top info area
			TopInfoBkgColor: "\x01" + "4",
			TopLabelColor: "\x01c\x01h",
			TopLabelColonColor: "\x01b\x01h",
			TopToColor: "\x01w\x01h",
			TopFromColor: "\x01w\x01h",
			TopSubjectColor: "\x01w\x01h",
			TopTimeColor: "\x01g\x01h",
			TopTimeLeftColor: "\x01g\x01h",
			EditMode: "\x01c\x01h",
			KeyInfoLabelColor: "\x01c\x01h"
		},

		// Default DCT-style colors
		DCTColors: {
			// DCT color theme file
			ThemeFilename: genFullPathCfgFilename("SlyDCTColors_Default.cfg", gStartupPath),
			// Quote line color
			QuoteLineColor: "\x01n\x01c",
			// DCT colors for the border stuff
			TopBorderColor1: "\x01n\x01r",
			TopBorderColor2: "\x01n\x01r\x01h",
			EditAreaBorderColor1: "\x01n\x01g",
			EditAreaBorderColor2: "\x01n\x01g\x01h",
			EditModeBrackets: "\x01n\x01k\x01h",
			EditMode: "\x01n\x01w",
			// DCT colors for the top informational area
			TopLabelColor: "\x01n\x01b\x01h",
			TopLabelColonColor: "\x01n\x01b",
			TopFromColor: "\x01n\x01c\x01h",
			TopFromFillColor: "\x01n\x01c",
			TopToColor: "\x01n\x01c\x01h",
			TopToFillColor: "\x01n\x01c",
			TopSubjColor: "\x01n\x01w\x01h",
			TopSubjFillColor: "\x01n\x01w",
			TopAreaColor: "\x01n\x01g\x01h",
			TopAreaFillColor: "\x01n\x01g",
			TopTimeColor: "\x01n\x01y\x01h",
			TopTimeFillColor: "\x01n\x01r",
			TopTimeLeftColor: "\x01n\x01y\x01h",
			TopTimeLeftFillColor: "\x01n\x01r",
			TopInfoBracketColor: "\x01n\x01m",
			// DCT colors for the quote window
			QuoteWinText: "\x01n\x01" + "7\x01b", // or k
			QuoteLineHighlightColor: "\x01n\x01w",
			QuoteWinBorderTextColor: "\x01n\x01" + "7\x01r",
			QuoteWinBorderColor: "\x01n\x01k\x01" + "7",
			// DCT colors for the bottom row help text
			BottomHelpBrackets: "\x01n\x01k\x01h",
			BottomHelpKeys: "\x01n\x01r\x01h",
			BottomHelpFill: "\x01n\x01r",
			BottomHelpKeyDesc: "\x01n\x01c",
			// DCT colors for text boxes
			TextBoxBorder: "\x01n\x01k\x01" + "7",
			TextBoxBorderText: "\x01n\x01r\x01" + "7",
			TextBoxInnerText: "\x01n\x01b\x01" + "7",
			YesNoBoxBrackets: "\x01n\x01k\x01" + "7",
			YesNoBoxYesNoText: "\x01n\x01w\x01h\x01" + "7",
			// DCT colors for the menus
			SelectedMenuLabelBorders: "\x01n\x01w",
			SelectedMenuLabelText: "\x01n\x01k\x01" + "7",
			UnselectedMenuLabelText: "\x01n\x01w\x01h",
			MenuBorders: "\x01n\x01k\x01" + "7",
			MenuSelectedItems: "\x01n\x01w",
			MenuUnselectedItems: "\x01n\x01k\x01" + "7",
			MenuHotkeys: "\x01n\x01w\x01h\x01" + "7"
		}
	};

	// Open the SlyEdit configuration file
	var slyEdCfgFileName = genFullPathCfgFilename("SlyEdit.cfg", gStartupPath);
	var cfgFile = new File(slyEdCfgFileName);
	if (cfgFile.open("r"))
	{
		var settingsMode = "behavior";
		var fileLine = null;     // A line read from the file
		var equalsPos = 0;       // Position of a = in the line
		var commentPos = 0;      // Position of the start of a comment
		var setting = null;      // A setting name (string)
		var settingUpper = null; // Upper-case setting name
		var value = null;        // A value for a setting (string), with spaces trimmed
		var valueLiteral = null; // The value as it is in the config file, no processing
		var valueUpper = null;   // Upper-cased value
		while (!cfgFile.eof)
		{
			// Read the next line from the config file.
			fileLine = cfgFile.readln(2048);

			// fileLine should be a string, but I've seen some cases
			// where for some reason it isn't.  If it's not a string,
			// then continue onto the next line.
			if (typeof(fileLine) != "string")
				continue;

			// If the line starts with with a semicolon (the comment
			// character) or is blank, then skip it.
			if ((fileLine.substr(0, 1) == ";") || (fileLine.length == 0))
				continue;

			// If in the "behavior" section, then set the behavior-related variables.
			if (fileLine.toUpperCase() == "[BEHAVIOR]")
			{
				settingsMode = "behavior";
				continue;
			}
			else if (fileLine.toUpperCase() == "[ICE_COLORS]")
			{
				settingsMode = "ICEColors";
				continue;
			}
			else if (fileLine.toUpperCase() == "[DCT_COLORS]")
			{
				settingsMode = "DCTColors";
				continue;
			}

			// If the line has a semicolon anywhere in it, then remove
			// everything from the semicolon onward.
			commentPos = fileLine.indexOf(";");
			if (commentPos > -1)
				fileLine = fileLine.substr(0, commentPos);

			// Look for an equals sign, and if found, separate the line
			// into the setting name (before the =) and the value (after the
			// equals sign).
			equalsPos = fileLine.indexOf("=");
			if (equalsPos > 0)
			{
				// Read the setting & value, and trim leading & trailing spaces.
				setting = trimSpaces(fileLine.substr(0, equalsPos), true, false, true);
				settingUpper = setting.toUpperCase();
				valueLiteral = fileLine.substr(equalsPos+1);
				value = trimSpaces(valueLiteral, true, false, true);
				valueUpper = value.toUpperCase();

				if (settingsMode == "behavior")
				{
					if (settingUpper == "DISPLAYENDINFOSCREEN")
						cfgObj.displayEndInfoScreen = (valueUpper == "TRUE");
					else if (settingUpper == "USERINPUTTIMEOUT")
						cfgObj.userInputTimeout = (valueUpper == "TRUE");
					else if (settingUpper == "INPUTTIMEOUTMS")
						cfgObj.inputTimeoutMS = +value;
					else if (settingUpper == "REWRAPQUOTELINES")
						cfgObj.reWrapQuoteLines = (valueUpper == "TRUE");
					else if (settingUpper == "ALLOWCOLORSELECTION")
						cfgObj.allowColorSelection = (valueUpper == "TRUE");
					else if (settingUpper == "SAVECOLORSASANSI")
						cfgObj.saveColorsAsANSI = (valueUpper == "TRUE");
					else if (settingUpper == "USEQUOTELINEINITIALS")
						cfgObj.useQuoteLineInitials = (valueUpper == "TRUE");
					else if (settingUpper == "INDENTQUOTELINESWITHINITIALS")
						cfgObj.indentQuoteLinesWithInitials = (valueUpper == "TRUE");
					else if (settingUpper == "ADD3RDPARTYSTARTUPSCRIPT")
						cfgObj.thirdPartyLoadOnStart.push(value);
					else if (settingUpper == "ADD3RDPARTYEXITSCRIPT")
						cfgObj.thirdPartyLoadOnExit.push(value);
					else if (settingUpper == "ADDJSONSTART")
						cfgObj.runJSOnStart.push(value);
					else if (settingUpper == "ADDJSONEXIT")
						cfgObj.runJSOnExit.push(value);
					else if (settingUpper == "ALLOWCROSSPOSTING")
						cfgObj.allowCrossPosting = (valueUpper == "TRUE");
					else if (settingUpper == "ENABLETEXTREPLACEMENTS")
					{
						// The enableTxtReplacements setting in the config file can
						// be regex, true, or false:
						//  - regex: Text replacement enabled using regular expressions
						//  - true: Text replacement enabled using exact match
						//  - false: Text replacement disabled
						cfgObj.textReplacementsUseRegex = (valueUpper == "REGEX");
						if (cfgObj.textReplacementsUseRegex)
							cfgObj.enableTextReplacements = true;
						else
							cfgObj.enableTextReplacements = (valueUpper == "TRUE");
					}
					else if (settingUpper == "ENABLETAGLINES")
						cfgObj.enableTaglines = (valueUpper == "TRUE");
					else if (settingUpper == "TAGLINEFILENAME")
						cfgObj.tagLineFilename = genFullPathCfgFilename(value, gStartupPath);
					else if (settingUpper == "TAGLINEPREFIX")
						cfgObj.taglinePrefix = valueLiteral;
					else if (settingUpper == "QUOTETAGLINES")
						cfgObj.quoteTaglines = (valueUpper == "TRUE");
					else if (settingUpper == "SHUFFLETAGLINES")
						cfgObj.shuffleTaglines = (valueUpper == "TRUE");
					else if (settingUpper == "ALLOWUSERSETTINGS")
						cfgObj.allowUserSettings = (valueUpper == "TRUE");
					else if (settingUpper == "ALLOWEDITQUOTELINES")
						cfgObj.allowEditQuoteLines = (valueUpper == "TRUE");
					else if (settingUpper == "ALLOWSPELLCHECK")
						cfgObj.allowSpellCheck = (valueUpper == "TRUE");
					else if (settingUpper == "DICTIONARYFILENAMES")
						cfgObj.dictionaryFilenames = parseDictionaryConfig(value, gStartupPath);
				}
				else if (settingsMode == "ICEColors")
				{
					if (settingUpper == "THEMEFILENAME")
						cfgObj.iceColors.ThemeFilename = genFullPathCfgFilename(value, gStartupPath);
					else if (settingUpper == "MENUOPTCLASSICCOLORS")
						cfgObj.iceColors.menuOptClassicColors = (valueUpper == "TRUE");
				}
				else if (settingsMode == "DCTColors")
				{
					if (settingUpper == "THEMEFILENAME")
						cfgObj.DCTColors.ThemeFilename = genFullPathCfgFilename(value, gStartupPath);
				}
			}
		}

		cfgFile.close();

		// Validate the settings
		if (cfgObj.inputTimeoutMS < 1000)
			cfgObj.inputTimeoutMS = 300000;

		// If no dictionaries were specified in the configuration file, then
		// set all available dictionary files in the configuration.
		if (cfgObj.dictionaryFilenames.length == 0)
		{
			var dictFilenames = getDictionaryFilenames(gStartupPath);
			for (var i = 0; i < dictFilenames.length; ++i)
				cfgObj.dictionaryFilenames.push(dictFilenames[i]);
		}
	}

	return cfgObj;
}

// This function reads a configuration file containing
// setting=value pairs and returns the settings in
// an Object.
//
// Parameters:
//  pFilename: The name of the configuration file.
//  pLineReadLen: The maximum number of characters to read from each
//                line.  This is optional; if not specified, then up
//                to 512 characters will be read from each line.
//
// Return value: An Object containing the value=setting pairs.  If the
//               file can't be opened or no settings can be read, then
//               this function will return null.
function readValueSettingConfigFile(pFilename, pLineReadLen)
{
   var retObj = null;

   var cfgFile = new File(pFilename);
   if (cfgFile.open("r"))
   {
      // Set the number of characters to read per line.
      var numCharsPerLine = 512;
      if (pLineReadLen != null)
         numCharsPerLine = pLineReadLen;

      var fileLine = null;     // A line read from the file
      var equalsPos = 0;       // Position of a = in the line
      var commentPos = 0;      // Position of the start of a comment
      var setting = null;      // A setting name (string)
      var settingUpper = null; // Upper-case setting name
      var value = null;        // A value for a setting (string)
      var valueUpper = null;   // Upper-cased value
      while (!cfgFile.eof)
      {
         // Read the next line from the config file.
         fileLine = cfgFile.readln(numCharsPerLine);

         // fileLine should be a string, but I've seen some cases
         // where it isn't, so check its type.
         if (typeof(fileLine) != "string")
            continue;

         // If the line starts with with a semicolon (the comment
         // character) or is blank, then skip it.
         if ((fileLine.substr(0, 1) == ";") || (fileLine.length == 0))
            continue;

         // If the line has a semicolon anywhere in it, then remove
         // everything from the semicolon onward.
         commentPos = fileLine.indexOf(";");
         if (commentPos > -1)
            fileLine = fileLine.substr(0, commentPos);

         // Look for an equals sign, and if found, separate the line
         // into the setting name (before the =) and the value (after the
         // equals sign).
         equalsPos = fileLine.indexOf("=");
         if (equalsPos > 0)
         {
            // If retObj hasn't been created yet, then create it.
            if (retObj == null)
               retObj = {};

            // Read the setting & value, and trim leading & trailing spaces.  Then
            // set the value in retObj.
            setting = trimSpaces(fileLine.substr(0, equalsPos), true, false, true);
            value = trimSpaces(fileLine.substr(equalsPos+1), true, false, true);
            retObj[setting] = value;
         }
      }

      cfgFile.close();
   }

   return retObj;
}

// Splits a string up by a maximum length, preserving whole words.
//
// Parameters:
//  pStr: The string to split
//  pMaxLen: The maximum length for the strings (strings longer than this
//           will be split)
//
// Return value: An array of strings resulting from the string split
function splitStrStable(pStr, pMaxLen)
{
   var strings = [];

   // Error checking
   if (typeof(pStr) != "string")
   {
      console.print("1 - pStr not a string!\r\n");
      return strings;
   }

   // If the string's length is less than or equal to pMaxLen, then
   // just insert it into the strings array.  Otherwise, we'll
   // need to split it.
   if (pStr.length <= pMaxLen)
      strings.push(pStr);
   else
   {
      // Make a copy of pStr so that we don't modify it.
      var theStr = pStr;

      var tempStr = "";
      var splitIndex = 0; // Index of a space in a string
      while (theStr.length > pMaxLen)
      {
         // If there isn't a space at the pMaxLen location in theStr,
         // then assume there's a word there and look for a space
         // before it.
         splitIndex = pMaxLen;
         if (theStr.charAt(splitIndex) != " ")
         {
            splitIndex = theStr.lastIndexOf(" ", splitIndex);
            // If a space was not found, then we should split at
            // pMaxLen.
            if (splitIndex == -1)
               splitIndex = pMaxLen;
         }

         // Extract the first part of theStr up to splitIndex into
         // tempStr, and then remove that part from theStr.
         tempStr = theStr.substr(0, splitIndex);
         theStr = theStr.substr(splitIndex+1);

         // If tempStr is not blank, then insert it into the strings
         // array.
         if (tempStr.length > 0)
            strings.push(tempStr);
      }
      // Edge case: If theStr is not blank, then insert it into the
      // strings array.
      if (theStr.length > 0)
         strings.push(theStr);
   }

   return strings;
}

// Fixes the text lines in the gEditLines array so that they all
// have a maximum width to fit within the edit area.
//
// Parameters:
//  pTextLineArray: An array of TextLine objects to adjust
//  pStartIndex: The index of the line in the array to start at.
//  pEndIndex: One past the last index of the line in the array to end at.
//  pEditWidth: The width of the edit area (AKA the maximum line length + 1)
//  pUsingColors: Boolean - Whether or not text color/attribute codes are being used
//
// Return value: Boolean - Whether or not any text was changed.
function reAdjustTextLines(pTextLineArray, pStartIndex, pEndIndex, pEditWidth, pUsingColors)
{
	// Returns without doing anything if any of the parameters are not
	// what they should be. (Note: Not checking pTextLineArray for now..)
	if (typeof(pStartIndex) != "number")
		return false;
	if (typeof(pEndIndex) != "number")
		return false;
	if (typeof(pEditWidth) != "number")
		return false;
	// Range checking
	if ((pStartIndex < 0) || (pStartIndex >= pTextLineArray.length))
		return false;
	if ((pEndIndex <= pStartIndex) || (pEndIndex < 0))
		return false;
	if (pEndIndex > pTextLineArray.length)
		pEndIndex = pTextLineArray.length;
	if (pEditWidth <= 5)
		return false;

	var textChanged = false; // We'll return this upon function exit.

	var usingColors = (typeof(pUsingColors) === "boolean" ? pUsingColors : true);

	var nextLineIndex = 0;
	var numCharsToRemove = 0;
	var splitIndex = 0;
	var spaceFoundAtSplitIdx = false; // Whether or not a space was found in a text line at the split index
	var splitIndexOriginal = 0;
	var tempText = null;
	var appendedNewLine = false; // If we appended another line
	var onePastLastLineIdx = pEndIndex;
	for (var i = pStartIndex; i < onePastLastLineIdx; ++i)
	{
		// As an extra precaution, check to make sure this array element is defined.
		if (pTextLineArray[i] == undefined)
			continue;

		nextLineIndex = i + 1;
		// If the line's text is longer or equal to the edit width, then if
		// possible, move the last word to the beginning of the next line.
		if (pTextLineArray[i].text.length >= pEditWidth)
		{
			numCharsToRemove = pTextLineArray[i].text.length - pEditWidth + 1;
			splitIndex = pTextLineArray[i].text.length - numCharsToRemove;
			splitIndexOriginal = splitIndex;
			// If the character in the text line at splitIndex is not a space,
			// then look for a space before splitIndex.
			spaceFoundAtSplitIdx = (pTextLineArray[i].text.charAt(splitIndex) == " ");
			if (!spaceFoundAtSplitIdx)
			{
				splitIndex = pTextLineArray[i].text.lastIndexOf(" ", splitIndex-1);
				spaceFoundAtSplitIdx = (splitIndex > -1);
				if (!spaceFoundAtSplitIdx)
					splitIndex = splitIndexOriginal;
			}
			var originalLineLen = pTextLineArray[i].text.length; // For adjusting attribute indexes
			tempText = pTextLineArray[i].text.substr(spaceFoundAtSplitIdx ? splitIndex+1 : splitIndex);
			// Remove the attributes from the end of the line that was cut short, to be moved to the beginning of
			// the next line. Note: This must be done before shortening the text.
			var lastAttrs = pTextLineArray[i].popAttrsFromEnd(splitIndex);
			// Remove the text from the line up to splitIndex
			pTextLineArray[i].text = pTextLineArray[i].text.substr(0, splitIndex);
			textChanged = true;
			// If we're on the last line, or if the current line has a hard
			// newline or is a quote line, then append a new line below.
			appendedNewLine = false;
			if ((nextLineIndex == pTextLineArray.length) || pTextLineArray[i].hardNewlineEnd || isQuoteLine(pTextLineArray, i))
			{
				pTextLineArray.splice(nextLineIndex, 0, new TextLine());
				pTextLineArray[nextLineIndex].hardNewlineEnd = pTextLineArray[i].hardNewlineEnd;
				pTextLineArray[i].hardNewlineEnd = false;
				pTextLineArray[nextLineIndex].isQuoteLine = pTextLineArray[i].isQuoteLine;
				appendedNewLine = true;
				//++onePastLastLineIdx; // End loop index // TODO: Is this needed?
			}

			// Move the text around and adjust the line properties.
			if (appendedNewLine)
			{
				pTextLineArray[nextLineIndex].text = tempText;
				// Add the attributes from the last of the line to the next line, adjusting the
				// text indexes as needed.  If a space was at the split index, then the attribute
				// indexes will need to be adjusted accordingly, since we got all attributes starting
				// from the split index but we removed the space there.
				if (spaceFoundAtSplitIdx)
				{
					var lastAttrKeys = Object.keys(lastAttrs);
					if (lastAttrKeys.length > 0)
					{
						lastAttrKeys.sort(textLineAttrSortCompareFunc);
						for (var lastAttrKeyI = 0; lastAttrKeyI < lastAttrKeys.length; ++lastAttrKeyI)
						{
							var originalTextIdx = +(lastAttrKeys[lastAttrKeyI]);
							lastAttrs[originalTextIdx - 1] = lastAttrs[originalTextIdx];
							delete lastAttrs[originalTextIdx];
						}
					}
				}
				for (var textIdx in lastAttrs)
				{
					var newTextIdx = (+textIdx) - splitIndex;
					pTextLineArray[nextLineIndex].attrs[newTextIdx] = lastAttrs[textIdx];
					// TODO: There might be an off-by-one issue here, related to whether a space was found (check spaceFoundAtSplitIdx?)
					//spaceFoundAtSplitIdx
				}
			}
			else
			{
				// Did not append a new line.
				// If we're in insert mode, then insert the text at the beginning of
				// the next line.  Otherwise, overwrite the text in the next line.
				if (inInsertMode())
				{
					pTextLineArray[nextLineIndex].text = tempText + " " + pTextLineArray[nextLineIndex].text;
					// Move the next line's current attributes to the right
					pTextLineArray[nextLineIndex].moveAttrIdxes(0, tempText.length + 1);
					// Add the attributes from the last of the line to the next line, adjusting the
					// text indexes as needed
					var actualSplitIndex = (spaceFoundAtSplitIdx ? splitIndex+1 : splitIndex);
					for (var textIdx in lastAttrs)
					{
						var newTextIdx = (+textIdx) - actualSplitIndex;
						if (newTextIdx < 0) newTextIdx = 0;
						pTextLineArray[nextLineIndex].attrs[newTextIdx] = lastAttrs[textIdx];
					}
				}
				else
				{
					// We're in overwrite mode, so overwite the first part of the next
					// line with tempText.
					if (pTextLineArray[nextLineIndex].text.length < tempText.length)
					{
						pTextLineArray[nextLineIndex].text = tempText;
						pTextLineArray[nextLineIndex].attrs = lastAttrs;
					}
					else
					{
						pTextLineArray[nextLineIndex].text = tempText + pTextLineArray[nextLineIndex].text.substr(tempText.length);
						// Adjust & insert attributes
						for (var textIdx in pTextLineArray[nextLineIndex].attrs)
						{
							var newTextIdx = (+textIdx) + tempText.length;
							pTextLineArray[nextLineIndex].attrs[newTextIdx] = pTextLineArray[nextLineIndex].attrs[textIdx];
							delete pTextLineArray[nextLineIndex].attrs[textIdx];
						}
						//for (var textIdx in lastAttrs)
						//	pTextLineArray[nextLineIndex].attrs[textIdx] = lastAttrs[textIdx];
						for (var textIdx in lastAttrs)
						{
							var newTextIdx = (+textIdx) - originalLineLen;
							pTextLineArray[nextLineIndex].attrs[newTextIdx] = lastAttrs[textIdx];
						}
					}
				}
			}
		}
		else
		{
			// pTextLineArray[i].text.length is < pEditWidth, so try to bring up text
			// from the next line.

			// Only do it if the line doesn't have a hard newline and it's not a
			// quote line and there is a next line.
			if (!pTextLineArray[i].hardNewlineEnd && !isQuoteLine(pTextLineArray, i) && (i < pTextLineArray.length-1))
			{
				if (pTextLineArray[nextLineIndex].text.length > 0)
				{
					splitIndex = pEditWidth - pTextLineArray[i].text.length - 2;
					// If splitIndex is negative, that means the entire next line
					// can fit on the current line.
					if ((splitIndex < 0) || (splitIndex > pTextLineArray[nextLineIndex].text.length))
						splitIndex = pTextLineArray[nextLineIndex].text.length;
					else
					{
						// If the character in the next line at splitIndex is not a
						// space, then look for a space before it.
						if (pTextLineArray[nextLineIndex].text.charAt(splitIndex) != " ")
							splitIndex = pTextLineArray[nextLineIndex].text.lastIndexOf(" ", splitIndex);
						// If no space was found, then skip to the next line (we don't
						// want to break up words from the next line).
						if (splitIndex == -1)
							continue;
					}

					// Get the text to bring up to the current line.
					// If the current line does not end with a space and the next line
					// does not start with a space, then add a space between this line
					// and the next line's text.  This is done to avoid joining words
					// accidentally.
					tempText = "";
					var prependedTextWithSpace = false;
					if ((pTextLineArray[i].text.charAt(pTextLineArray[i].text.length-1) != " ") && (pTextLineArray[nextLineIndex].text.substr(0, 1) != " "))
					{
						tempText = " ";
						prependedTextWithSpace = true;
					}
					tempText += pTextLineArray[nextLineIndex].text.substr(0, splitIndex);
					// Move the text from the next line to the current line, if the current
					// line has room for it.
					if (pTextLineArray[i].text.length + console.strlen(tempText.length) < pEditWidth)
					{
						var currentLineOriginalLen = pTextLineArray[i].text.length;
						pTextLineArray[i].text += tempText;
						// TODO: Color issue when deleting text and wrapping text up
						// Set the next line's text: Trim off the front up to splitIndex+1.  Also, capture any attribute
						// codes removed from the front of the next line (to be moved up).
						var frontAttrs = pTextLineArray[nextLineIndex].trimFront(splitIndex+1);
						textChanged = true;
						if (prependedTextWithSpace)
							++currentLineOriginalLen; // To fix off-by-1 issue with color/attribute codes
						for (var textLineIdx in frontAttrs)
						{
							var newTextLineIdx = (+textLineIdx) + currentLineOriginalLen;
							pTextLineArray[i].attrs[newTextLineIdx] = frontAttrs[textLineIdx];
						}

						// If the next line is now blank, then remove it.
						if (pTextLineArray[nextLineIndex].text.length == 0)
						{
							// The current line should take on the next line's
							// hardnewlineEnd property before removing the next line.
							pTextLineArray[i].hardNewlineEnd = pTextLineArray[nextLineIndex].hardNewlineEnd;
							pTextLineArray.splice(nextLineIndex, 1);
						}
					}
				}
				else
				{
					// The next line's text string is blank.  If its hardNewlineEnd
					// property is false, then remove the line.
					if (!pTextLineArray[nextLineIndex].hardNewlineEnd)
					{
						pTextLineArray.splice(nextLineIndex, 1);
						textChanged = true;
					}
				}
			}
		}
	}

	return textChanged;
}

// Returns indexes of the first unquoted text line and the next
// quoted text line in an array of text lines.
//
// Parameters:
//  pTextLineArray: An array of TextLine objects
//  pStartIndex: The index of where to start looking in the array
//  pQuotePrefix: The quote line prefix (string)
//
// Return value: An object containing the following properties:
//               noQuoteLineIndex: The index of the next non-quoted line.
//                                 Will be -1 if none are found.
//               nextQuoteLineIndex: The index of the next quoted line.
//                                   Will be -1 if none are found.
function quotedLineIndexes(pTextLineArray, pStartIndex, pQuotePrefix)
{
	var retObj = {
		noQuoteLineIndex: -1,
		nextQuoteLineIndex: -1
	};

	if (pTextLineArray.length == 0)
		return retObj;
	if (typeof(pStartIndex) != "number")
		return retObj;
	if (pStartIndex >= pTextLineArray.length)
		return retObj;

	var startIndex = (pStartIndex > -1 ? pStartIndex : 0);

	// Look for the first non-quoted line in the array.
	retObj.noQuoteLineIndex = startIndex;
	for (; retObj.noQuoteLineIndex < pTextLineArray.length; ++retObj.noQuoteLineIndex)
	{
		if (pTextLineArray[retObj.noQuoteLineIndex].text.indexOf(pQuotePrefix) == -1)
			break;
	}
	// If the index is pTextLineArray.length, then what we're looking for wasn't
	// found, so set the index to -1.
	if (retObj.noQuoteLineIndex == pTextLineArray.length)
		retObj.noQuoteLineIndex = -1;

	// Look for the next quoted line in the array.
	// If we found a non-quoted line, then use that index; otherwise,
	// start at the first line.
	if (retObj.noQuoteLineIndex > -1)
		retObj.nextQuoteLineIndex = retObj.noQuoteLineIndex;
	else
		retObj.nextQuoteLineIndex = 0;
	for (; retObj.nextQuoteLineIndex < pTextLineArray.length; ++retObj.nextQuoteLineIndex)
	{
		if (pTextLineArray[retObj.nextQuoteLineIndex].text.indexOf(pQuotePrefix) == 0)
			break;
	}
	// If the index is pTextLineArray.length, then what we're looking for wasn't
	// found, so set the index to -1.
	if (retObj.nextQuoteLineIndex == pTextLineArray.length)
		retObj.nextQuoteLineIndex = -1;

	return retObj;
}

// Returns whether a line in an array of TextLine objects is a quote line.
// This checks whether the given TextLine object is a valid object before
// checking if it's a quote line.
//
// Parameters:
//  pLineArray: An array of TextLine objects
//  pLineIndex: The index of the line in gEditLines
function isQuoteLine(pLineArray, pLineIndex)
{
	//if (typeof(pLineArray) == "undefined")
	if (typeof(pLineArray) !== "object") // Should be an array
		return false;
	if (typeof(pLineIndex) !== "number")
		return false;
	if (pLineIndex < 0 || pLineIndex >= pLineArray.length)
		return false;
	if (typeof(pLineArray[pLineIndex]) !== "object")
		return false;

	return pLineArray[pLineIndex].isAQuoteLine();
}

// Replaces an attribute in a text attribute string.
//
// Parameters:
//  pAttrType: Numeric:
//             FORE_ATTR: Foreground attribute
//             BKG_ATTR: Background attribute
//             3: Special attribute
//  pAttrs: The attribute string to change
//  pNewAttr: The new attribute to put into the attribute string (without the
//            control character)
function toggleAttr(pAttrType, pAttrs, pNewAttr)
{
	// Removes an attribute from an attribute string, if it
	// exists.  Returns the new attribute string.
	function removeAttrIfExists(pAttrs, pNewAttr)
	{
		var index = pAttrs.search(pNewAttr);
		if (index > -1)
			pAttrs = pAttrs.replace(pNewAttr, "");
		return pAttrs;
	}

	// Convert pAttrs and pNewAttr to all uppercase for ease of searching
	pAttrs = pAttrs.toUpperCase();
	pNewAttr = pNewAttr.toUpperCase();

	// If pAttrs starts with the normal attribute, then
	// remove it (we'll put it back on later).
	var normalAtStart = false;
	if (pAttrs.search(/^\x01N/) == 0)
	{
		normalAtStart = true;
		pAttrs = pAttrs.substr(2);
	}

	// Prepend the attribute control character to the new attribute
	var newAttr = "\x01" + pNewAttr;

	// Set a regexStr for searching & replacing
	var regexStr = "";
	switch (pAttrType)
	{
		case FORE_ATTR: // Foreground attribute
			regexStr = "\x01K|\x01R|\x01G|\x01Y|\x01B|\x01M|\x01C|\x01W";
			break;
		case BKG_ATTR: // Background attribute
			regexStr = "x01" + "0|\x01" + "1|\x01" + "2|\x01" + "3|\x01" + "4|\x01" + "5|\x01" + "6|\x01" + "7";
			break;
		case SPECIAL_ATTR: // Special attribute
			//regexStr = /\x01H|\x01I|\x01N/g;
			index = pAttrs.search(newAttr);
			if (index > -1)
                pAttrs = pAttrs.replace(newAttr, "");
			else
                pAttrs += newAttr;
			break;
		default:
			break;
	}

	// If regexStr is not blank, then search & replace on it in
	// pAttrs.
	if (regexStr != "")
	{
        var regex = new RegExp(regexStr, 'g');
		pAttrs = removeAttrIfExists(pAttrs, newAttr);
		// If the regexStr is found, then replace it.  Otherwise,
		// add pNewAttr to the attribute string.
		if (pAttrs.search(regex) > -1)
			pAttrs = pAttrs.replace(regex, "\x01" + pNewAttr);
		else
			pAttrs += "\x01" + pNewAttr;
	}

	// If pAttrs started with the normal attribute, then
	// put it back on.
	if (normalAtStart)
		pAttrs = "\x01N" + pAttrs;

	return pAttrs;
}

// This function wraps an array of strings based on a line width.
//
// Parameters:
//  pLineArr: An array of strings
//  pStartLineIndex: The index of the text line in the array to start at
//  pEndIndex: The index of where to stop in the array.  This is one past
//             the last line in the array.  For example, to end at the
//             last line in the array, use the array's .length property
//             for this parameter.
//  pLineWidth: The maximum width of each line
//  pIdxesRequiringNL (OUT): Optional - An array to contain the indexes of original
//                           wrapped lines that required a new line to be added.
//  pLineInfos (IN/OUT): Optional - An array of lineInfo objects previously generated
//                       for the unwrapped lines - This will be updated if lines are
//                       wrapped.
//
// Return value: The number of new lines added/removed
function wrapTextLines(pLineArr, pStartLineIndex, pEndIndex, pLineWidth, pIdxesRequiringNL, pLineInfos)
{
	// Validate parameters
	if (pLineArr == null)
		return 0;
	if (typeof(pLineWidth) != "number")
		return 0;
	if (pLineWidth < 0)
		return 0;
	if ((pStartLineIndex == null) || (typeof(pStartLineIndex) != "number") || (pStartLineIndex < 0))
		pStartLineIndex = 0;
	if (pStartLineIndex >= pLineArr.length)
		return pLineArr.length;
	if ((typeof(pEndIndex) != "number") || (pEndIndex == null) || (pEndIndex > pLineArr.length))
		pEndIndex = pLineArr.length;

	// Determine whether pIdxesRequiringNL is an array (actually, the most we can
	// do is check whether it's an object).
	var pNewLineIndexesIsArray = (typeof(pIdxesRequiringNL) == "object");
	if (pNewLineIndexesIsArray)
		pIdxesRequiringNL.length = 0;

	// Wrap the text lines
	var origNumLines = pLineArr.length; // So we can return the # of lines added
	var trimLen = 0;   // The number of characters to trim from the end of a string
	var trimIndex = 0; // The index of where to start trimming
	for (var i = pStartLineIndex; i < pEndIndex; ++i)
	{
		// If the object in pLineArr is not a string for some reason, then skip it.
		if (typeof(pLineArr[i]) != "string")
			continue;

		if (pLineArr[i].length > pLineWidth)
		{
			trimLen = pLineArr[i].length - pLineWidth;
			trimIndex = pLineArr[i].lastIndexOf(" ", pLineArr[i].length - trimLen);
			if (trimIndex == -1)
				trimIndex = pLineArr[i].length - trimLen;
			// Trim the text, and remove leading spaces from it too.
			var trimmedText = pLineArr[i].substr(trimIndex).replace(/^ +/, "");
			pLineArr[i] = pLineArr[i].substr(0, trimIndex);
			if (i < pLineArr.length - 1)
			{
				// Append a space to the end of the trimmed text if it doesn't have one.
				if ((trimmedText.length > 0) && (trimmedText.charAt(trimmedText.length-1) != " "))
					trimmedText += " ";
				// Prepend the trimmed text to the next line.  If the next line's index
				// is within the paragraph we're wrapping, then go ahead and prepend the
				// text to the next line.  Otherwise, add a new line to the array and
				// add the text to the new line.
				if (i+1 < pEndIndex)
				{
					var nextLineWasBlank = (pLineArr[i+1].length == 0);
					pLineArr[i+1] = trimmedText + pLineArr[i+1];
					if (nextLineWasBlank)
						pLineArr.splice(i+2, 0, "");
					// Copy the current line's lineInfo object to the next
					// one in the array
					if (typeof(pLineInfos) == "object")
					{
						if (pLineInfos.length > i+1)
						{
							pLineInfos[i+1].startIndex = pLineInfos[i].startIndex;
							pLineInfos[i+1].quoteLevel = pLineInfos[i].quoteLevel;
							pLineInfos[i+1].begOfLine = pLineInfos[i].begOfLine;
						}
						else
						{
							// pLineInfos doesn't have enough objects..  This probably
							// shouldn't happen, as the caller should fill it up to
							// the correct number of objects.
							var numToAdd = (i+1) - pLineInfos.length + 1;
							for (var idx = 0; idx < numToAdd; ++idx)
								pLineInfos.push(getDefaultQuoteStrObj());
						}
						// If the next line was blank before adding text to it,
						// then splice a new lineInfo object into pLineInfos as
						// a copy of the lineInfo object before it.
						if (nextLineWasBlank)
						{
							pLineInfos.splice(i+2, 0, getDefaultQuoteStrObj());
							pLineInfos[i+2].startIndex = pLineInfos[i+1].startIndex;
							pLineInfos[i+2].quoteLevel = pLineInfos[i+1].quoteLevel;
							pLineInfos[i+2].begOfLine = pLineInfos[i+1].begOfLine;
						}
					}
				}
				else
				{
					// Add the trimmed text on a new line in the array.  Then, if the
					// trimmed text's length is longer then the allowed line width, then
					// we'll want to extend the end index so we can continue wrapping the
					// lines in the current paragraph.  Otherwise, add the current line's
					// index to the array of lines requiring a newline.
					pLineArr.splice(i+1, 0, trimmedText);
					if (trimmedText.length > pLineWidth)
						++pEndIndex;
					else
					{
						if (pNewLineIndexesIsArray)
							pIdxesRequiringNL.push(i);
					}
					// Append a lineInfo object to pLineInfos as a copy of the
					// last one in the array.
					if (typeof(pLineInfos) == "object")
					{
						// Save the last lineInfo object's values
						var lastLineInfoObj = {
							startIndex: pLineInfos[pLineInfos.length-1].startIndex,
							quoteLevel: pLineInfos[pLineInfos.length-1].quoteLevel,
							begOfLine: pLineInfos[pLineInfos.length-1].begOfLine
						};
						// Append a new lineInfo object to pLineInfos and copy
						// the last one's values into it
						pLineInfos.push(getDefaultQuoteStrObj());
						pLineInfos[pLineInfos.length-1].startIndex = lastLineInfoObj.startIndex;
						pLineInfos[pLineInfos.length-1].quoteLevel = lastLineInfoObj.quoteLevel;
						pLineInfos[pLineInfos.length-1].begOfLine = lastLineInfoObj.begOfLine;
					}
				}
			}
			else
			{
				// Remove any leading spaces 
				pLineArr.push(trimmedText);
				// If the current line index is before the specified end index, then
				// increment the end index since we've added a line in order to continue
				// wrapping the lines.
				if (i < pEndIndex-1)
					++pEndIndex;

				if (pNewLineIndexesIsArray)
					pIdxesRequiringNL.push(i);
			}
		}
	}

	return(pLineArr.length - origNumLines);
}

// Returns an object containing default quote string information.
//
// Return value: An object containing the following properties:
//               startIndex: The index of the first non-quote character in the string.
//                           Defaults to -1.
//               quoteLevel: The number of > characters at the start of the string
//               begOfLine: Normally, the quote text at the beginng of the line.
//                          This defaults to a blank string.
function getDefaultQuoteStrObj()
{
	var retObj = {
		startIndex: -1,
		quoteLevel: 0,
		begOfLine: "", // Will store the beginning of the line, before the >
		copy: function(pThatQuoteStrObj) {
			this.startIndex = pThatQuoteStrObj.startIndex;
			this.quoteLevel = pThatQuoteStrObj.quoteLevel;
			this.begOfLine = pThatQuoteStrObj.begOfLine;
		}
	};
	return retObj;
}

// Searches a string for the index of the first non-quote character; also finds
// the quote level (number of times quoted) and the beginning-of-line text (the
// text before the quote characters).
//
// Parameters:
//  pStr: A string to check
//  pUseAuthorInitials: Whether or not SlyEdit is configured to prefix
//                      quote lines with author's initials
//  pIndentQuoteLinesWithInitials: Whether or not indenting is enabled for
//                                 quote lines with initials
//
// Return value: An object containing the following properties:
//               startIndex: The index of the first non-quote character in the string.
//                           If pStr is an invalid string, or if a non-quote character
//                           is not found, this will be -1.
//               quoteLevel: The number of > characters at the start of the string
//               begOfLine: The quote text at the beginning of the line
function firstNonQuoteTxtIndex(pStr, pUseAuthorInitials, pIndentQuoteLinesWithInitials)
{
	// Create the return object with initial values.
	var retObj = getDefaultQuoteStrObj();  

	// If pStr is not a valid positive-length string, then just return.
	if ((pStr == null) || (typeof(pStr) != "string") || (pStr.length == 0))
		return retObj;

	// If using author initials, then do some special checking: If the first >
	// character is preceded by something other than spaces or 3 non-space characters,
	// then this string is probably not quoted, so return an object that signifies
	// such.
	if (pUseAuthorInitials)
	{
		var firstGTCharIdx = pStr.indexOf(">");
		if (firstGTCharIdx > -1)
		{
			// double-quoted text: If there are only spaces, > characters, or
			// up to 3 characters directly before the >> (without spaces), then
			// take this as a valid instance of double-quoted text.
			var upToThreeNonSpacesBefore = false;
			var onlySpaces = true;
			var currentChar;
			for (var srchIdx = 0; (srchIdx < pStr.length) && onlySpaces; ++srchIdx)
				onlySpaces = (pStr.charAt(srchIdx) == " ");
			if (!onlySpaces)
			{
				var startIdxBeforeGT = firstGTCharIdx - 4;
				if (startIdxBeforeGT < 0)
					startIdxBeforeGT = 0;
				// If the string don't contain a non > followed by a space before the >, then
				// go ahead and check the first 3 characters before the >.  Otherwise, it's
				// already disqualified.
				if (!/[^>] /.test(pStr.substr(startIdxBeforeGT, firstGTCharIdx-startIdxBeforeGT)))
				{
					upToThreeNonSpacesBefore = true;
					var numNonSpaceChars = 0;
					for (var srchIdx = firstGTCharIdx-1; srchIdx >= startIdxBeforeGT; --srchIdx)
					{
						if (pStr.charAt(srchIdx) != " ")
							++numNonSpaceChars;
					}
					upToThreeNonSpacesBefore = (numNonSpaceChars < 4);
				}
			}

			// If there aren't just spaces or up to 3 non-space characters just before
			// the first >, then return an object that signifies this situation properly.
			if (!onlySpaces && !upToThreeNonSpacesBefore)
			{
				retObj.startIndex = 0;
				retObj.quoteLevel = 0;
				retObj.begOfLine = "";
				return retObj;
			}
		}
	}

	// Look for quote lines that begin with 1 or 2 initials followed by a > (i.e.,
	// "EO>" or "E>" at the start of the line.  If found, set an index to look for
	// & count the > characters from the >.
	var searchStartIndex = 0;
	// Regex notes:
	//  \w: Matches any alphanumeric character (word characters) including underscore (short for [a-zA-Z0-9_])
	//  ?: Supposed to match 0 or 1 occurance, but seems to match 1 or 2
	// First, look for spaces then 1 or 2 initials followed by a non-space followed
	// by a >.  If not found, then look for ">>".  If that isn't found, then look
	// for just 2 characters followed by a >.
	var lineStartsWithQuoteText = /^ *\w?[^ ]>/.test(pStr);
	if (pUseAuthorInitials)
	{
		if (!lineStartsWithQuoteText)
			lineStartsWithQuoteText = (pStr.lastIndexOf(">>") > -1);
		if (!lineStartsWithQuoteText)
			lineStartsWithQuoteText = /\w{2}>/.test(pStr);
	}
	if (lineStartsWithQuoteText)
	{
		if (pUseAuthorInitials)
		{
			// If the string is an origin line (starting with " * Origin:"), then don't
			// do much with this line..  Just set the first non-space character in retObj.
			if (/^ \* Origin:/.test(pStr))
				retObj.startIndex = 1;
			else
			{
				// First, look for the last instance of ">> " (signifying a multi-quoted line).
				// If found, increment searchStartIndex by 2 to get past the ">>".
				var validDoubleQuoteChars = false;
				searchStartIndex = pStr.lastIndexOf(">> ");
				if (searchStartIndex > -1)
					searchStartIndex += 2;
				else
				{
					// If pStr is at least 3 characters long, then starting with the
					// last 3 characters in pStr, look for an instance of 2 letters
					// or numbers or underscores followed by a >.  Keep moving back
					// 1 character at a time until found or until the beginning of
					// the string is reached.
					if (pStr.length >= 3)
					{
						// Regex notes:
						//  \w: Matches any alphanumeric character (word characters) including underscore (short for [a-zA-Z0-9_])
						var substrStartIndex = pStr.length - 3;
						for (; (substrStartIndex >= 0) && (searchStartIndex < 0); --substrStartIndex)
							searchStartIndex = pStr.substr(substrStartIndex, 3).search(/^\w{2}>$/);
						++substrStartIndex; // To fix off-by-one
						if (searchStartIndex > -1)
						{
							searchStartIndex += substrStartIndex + 3; // To get past the "..>"
							// New (2017-12-24):
							// If the instance(s) of a > has 3 non-space characters
							// before it, then assume the > is not part of a quote
							// prefix, and look for another > earlier in the text string.
							// When using author initials, SlyEdit assumes a quote prefix
							// has up to 2 characters before the >.
							while ((searchStartIndex >= 4) && (pStr.substr(searchStartIndex-4, 4).search(/^[^\s]{3}>$/) >= 0))
							{
								searchStartIndex = pStr.lastIndexOf(">", searchStartIndex-2);
								if (searchStartIndex == -1)
									searchStartIndex = 0;
								else
									++searchStartIndex; // To fix off-by-one
							}
						}
						// Note: I originally had + 4 here..
						if (searchStartIndex < 0)
						{
							searchStartIndex = pStr.indexOf(">");
							if (searchStartIndex < 0)
								searchStartIndex = 0;
						}
					}
					else
					{
						searchStartIndex = pStr.indexOf(">");
						if (searchStartIndex < 0)
							searchStartIndex = 0;
					}
				}
			}
		}
		else
		{
			// SlyEdit is not prefixing quote lines with author's initials.
			searchStartIndex = pStr.indexOf(">");
			if (searchStartIndex < 0)
				searchStartIndex = 0;
		}
	}

	// Find the quote level and the beginning of the line.
	// Look for the first non-quote text and quote level in the string.
	var strChar = "";
	var j = 0;
	for (var i = searchStartIndex; i < pStr.length; ++i)
	{
		strChar = pStr.charAt(i);
		if ((strChar != " ") && (strChar != ">"))
		{
			// New (2017-12-24):
			// If using author initials and there are 3 non-space characters
			// before the >, then continue to the next character.
			if (i >= 3)
			{
				if (pUseAuthorInitials && (pStr.substr(i-3, 4).search(/^[^\s]{3}>$/) >= 0))
					continue;
			}

			// We've found the first non-quote character.
			retObj.startIndex = i;
			// Count the number of times the > character appears at the start of
			// the line, and set quoteLevel to that.
			if (i >= 0)
			{
				for (j = 0; j < i; ++j)
				{
					if (pStr.charAt(j) == ">")
					{
						// New (2017-12-24):
						// If using author initials, then increment the quote level
						// only if there are not 3 non-space characters before the >
						if (pUseAuthorInitials && (j >= 3))
						{
							if (pStr.substr(j-3, 4).search(/^[^\s]{3}>$/) < 0)
								++retObj.quoteLevel;
						}
						else
							++retObj.quoteLevel;
					}
				}
			}
			// Store the beginning of the line in retObj.begOfLine.  And if
			// SlyEdit is configured to indent quote lines with author initials,
			// and if the beginning of the line doesn't begin with a space,
			// then add a space to the beginning of it.
			retObj.begOfLine = pStr.substr(0, retObj.startIndex);
			if (pUseAuthorInitials && pIndentQuoteLinesWithInitials && (retObj.begOfLine.length > 0) && (retObj.begOfLine.charAt(0) != " "))
				retObj.begOfLine = " " + retObj.begOfLine;
			break;
		}
	}

	// If we haven't found non-quote text but the line starts with quote text,
	// then set the starting index & quote level in retObj.
	if (lineStartsWithQuoteText && ((retObj.startIndex == -1) || (retObj.quoteLevel == 0)))
	{
		retObj.startIndex = pStr.indexOf(">") + 1;
		// New (2017-12-24):
		var setQuoteLevel = true;
		// When using author initials in quote lines: If there are 3 non-space
		// characters before the >, then it's not an actual quote (SlyEdit
		// considers quote lines with initials to have only 2 characters before
		// the >).
		if (pUseAuthorInitials && retObj.startIndex >= 4)
		{
			if (pStr.substr(retObj.startIndex-4, 4).search(/^[^\s]{3}>$/) >= 0)
			{
				retObj.startIndex = 0;
				setQuoteLevel = false;
			}
		}
		if (setQuoteLevel)
			retObj.quoteLevel = 1;
	}

	return retObj;
}

// Performs text wrapping on the quote lines.
//
// Parameters:
//  pUseAuthorInitials: Whether or not to prefix quote lines with the last author's
//                      initials
//  pIndentQuoteLinesWithInitials: If prefixing the quote lines with the
//                                 last author's initials, this parameter specifies
//                                 whether or not to also prefix the quote lines with
//                                 a space.
//  pTrimSpacesFromQuoteLines: Whether or not to trim spaces from quote lines (for when people
//                             indent the first line of their reply, etc.).  Defaults to true.
//  pMaxWidth: The maximum width of the lines
function wrapQuoteLines(pUseAuthorInitials, pIndentQuoteLinesWithInitials, pTrimSpacesFromQuoteLines, pMaxWidth)
{
	var useAuthorInitials = true;
	var indentQuoteLinesWithInitials = false;
	if (typeof(pUseAuthorInitials) != "undefined")
		useAuthorInitials = pUseAuthorInitials;
	if (typeof(pIndentQuoteLinesWithInitials) != "undefined")
		indentQuoteLinesWithInitials = pIndentQuoteLinesWithInitials;

	var trimSpacesFromQuoteLines = (typeof(pTrimSpacesFromQuoteLines) == "boolean" ? pTrimSpacesFromQuoteLines : true);
	if (useAuthorInitials)
		wrapQuoteLinesUsingAuthorInitials(pIndentQuoteLinesWithInitials, trimSpacesFromQuoteLines, pMaxWidth);
	else
		wrapQuoteLines_NoAuthorInitials(trimSpacesFromQuoteLines, pMaxWidth);
}

// For wrapping quote lines: This function checks if a string has only > characters
// separated by whitespace and returns a version where the > characters are only
// separated by one space each, and if the line starts with " >", the leading space
// will be removed.
function normalizeGTChars(pStr)
{
	if (/^\s*>\s*$/.test(pStr))
		pStr = ">";
	else
	{
		pStr = pStr.replace(/>\s*>/g, "> >")
		           .replace(/^\s>/, ">")
		           .replace(/^\s*$/, "");
	}
	return pStr;
}

// Wraps quote lines and prefixes them with the original author's initials.
// Assumes gQuotePrefix contains the author's initials.
//
// Parameters:
//  pIndentQuoteLines: Whether or not to indent the quote lines
//  pTrimSpacesFromQuoteLines: Whether or not to trim spaces from quote lines (for when people
//                             indent the first line of their reply, etc.).  Defaults to true.
//  pMaxWidth: The maximum width of the lines
function wrapQuoteLinesUsingAuthorInitials(pIndentQuoteLines, pTrimSpacesFromQuoteLines, pMaxWidth)
{
	if (gQuoteLines.length == 0)
		return;

	// Steps for wrapping quote lines:
	// 1. Get information for each line (quote level, beginning of line, etc.)
	// 2. Based on the line info, find the different sections of the quote lines
	// 3. Go through each section of the quote lines and quote appropriately

	// Note: gQuotePrefix is declared in SlyEdit.js.
	// Make another copy of it without its leading space for searching the
	// quote lines later.
	var quotePrefixWithoutLeadingSpace = gQuotePrefix.replace(/^ /, "");

	// 1. Get information for each line (quote level, beginning of line, etc.)
	var lineInfos = [];
	for (var quoteLineIndex = 0; quoteLineIndex < gQuoteLines.length; ++quoteLineIndex)
		lineInfos.push(firstNonQuoteTxtIndex(gQuoteLines[quoteLineIndex], true, pIndentQuoteLines));

	// 2. Based on the line info, find the different sections of the quote lines
	var quoteSections = [];
	var startArrIndex = 0;
	var endArrIndex = -1;
	var lastQuoteLevel = lineInfos[0].quoteLevel;
	for (var quoteLineIndex = 1; quoteLineIndex < gQuoteLines.length; ++quoteLineIndex)
	{
		endArrIndex = -1; // Resetting to help ensure that we get the last section sometimes

		if (gQuoteLines[quoteLineIndex].length == 0)
			continue;

		// If this line has a different quote level than the previous line, then
		// it marks a new section.
		if (lineInfos[quoteLineIndex].quoteLevel != lastQuoteLevel)
		{
			endArrIndex = quoteLineIndex;
			var sectionInfo = {
				startArrIndex: startArrIndex,
				endArrIndex: endArrIndex,
				quoteLevel: lastQuoteLevel
			};
			// If the end array index is for a blank quote line, then
			// adjust it to the first non-blank quote line before it.
			while ((sectionInfo.endArrIndex-1 >= 0) &&
			       (typeof(gQuoteLines[sectionInfo.endArrIndex-1]) == "string") &&
			       gQuoteLines[sectionInfo.endArrIndex-1].length == 0)
			{
				--sectionInfo.endArrIndex;
			}
			// If we moved sectionInfo.endArrIndex back too far, then increment it.
			while (typeof(gQuoteLines[sectionInfo.endArrIndex]) != "string")
				++sectionInfo.endArrIndex;

			quoteSections.push(sectionInfo);
			startArrIndex = quoteLineIndex;
			lastQuoteLevel = lineInfos[quoteLineIndex].quoteLevel;
		}
		// For lines with a quote level of 0, if this line's indentation differs from
		// the previous line's indentation, then that marks a new section.
		else if ((lineInfos[quoteLineIndex].quoteLevel == 0) && (lastQuoteLevel == 0) &&
		         (lineInfos[quoteLineIndex].startIndex > lineInfos[quoteLineIndex-1].startIndex))
		{
			endArrIndex = quoteLineIndex; // One past the last index of the current paragraph
			var sectionInfo = {
				startArrIndex: startArrIndex,
				endArrIndex: endArrIndex,
				quoteLevel: 0
			};
			// If the end array index is for a blank quote line, then
			// adjust it to the first non-blank quote line before it.
			while ((sectionInfo.endArrIndex-1 >= 0) &&
			       (typeof(gQuoteLines[sectionInfo.endArrIndex-1]) == "string") &&
			gQuoteLines[sectionInfo.endArrIndex-1].length == 0)
			{
				--sectionInfo.endArrIndex;
			}
			// If we moved sectionInfo.endArrIndex back too far, then increment it.
			while (typeof(gQuoteLines[sectionInfo.endArrIndex]) != "string")
				++sectionInfo.endArrIndex;

			quoteSections.push(sectionInfo);
			startArrIndex = quoteLineIndex;
		}
	}
	// If we only found one section or we're at the last section, then add it to
	// quoteSections.
	if ((endArrIndex == -1) || (endArrIndex == gQuoteLines.length-1))
	{
		var sectionInfo = {
			startArrIndex: startArrIndex,
			endArrIndex: gQuoteLines.length,
			quoteLevel: lastQuoteLevel
		};
		// If the end array index is for a blank quote line, then
		// adjust it to the first non-blank quote line before it.
		while ((sectionInfo.endArrIndex > 0) && (gQuoteLines[sectionInfo.endArrIndex-1].length == 0))
			--sectionInfo.endArrIndex;
		quoteSections.push(sectionInfo);
	}

	// 3. Go through each section of the quote lines and wrap & quote appropriately
	var trimSpacesFromQuoteLines = (typeof(pTrimSpacesFromQuoteLines) == "boolean" ? pTrimSpacesFromQuoteLines : true);
	for (var sIndex = 0; sIndex < quoteSections.length; ++sIndex)
	{
		// If the section is not quoted text (in other words, it was written by
		// author of the message), then remove leading whitespace from the text
		// lines in this section to leave more room for wrapping and so that we
		// don't end up with a section of quote lines that all start with several
		// spaces.
		if (quoteSections[sIndex].quoteLevel == 0)
		{
			for (var i = quoteSections[sIndex].startArrIndex; i < quoteSections[sIndex].endArrIndex; ++i)
			{
				if (trimSpacesFromQuoteLines)
					gQuoteLines[i] = trimSpaces(gQuoteLines[i], true, true, false);
				lineInfos[i].startIndex = 0;
				lineInfos[i].begOfLine = "";
			}
		}

		// Remove the quote strings from the lines we're about to wrap
		var maxBegOfLineLen = 0;
		for (var i = quoteSections[sIndex].startArrIndex; i < quoteSections[sIndex].endArrIndex; ++i)
		{
			if (lineInfos[i] != null)
			{
				if (lineInfos[i].startIndex > -1)
					gQuoteLines[i] = gQuoteLines[i].substr(lineInfos[i].startIndex);
				else
					gQuoteLines[i] = normalizeGTChars(gQuoteLines[i]);

				// If the quote line now only consists of spaces after removing the quote
				// characters, then make it blank.
				if (/^ +$/.test(gQuoteLines[i]))
					gQuoteLines[i] = "";
				// Change multiple spaces to single spaces in the beginning-of-line
				// string.  Also, if not prefixing quote lines w/ initials with a
				// space, then also trim leading spaces.
				if (pIndentQuoteLines)
					lineInfos[i].begOfLine = trimSpaces(lineInfos[i].begOfLine, false, true, false);
				else
					lineInfos[i].begOfLine = trimSpaces(lineInfos[i].begOfLine, true, true, false);

				// See if we need to update maxBegOfLineLen, and if so, do it.
				if (lineInfos[i].begOfLine.length > maxBegOfLineLen)
					maxBegOfLineLen = lineInfos[i].begOfLine.length;
			}
		}
		// If maxBegOfLineLen is positive, then add 1 more to it because
		// we'll be adding a > character to the quote lines to signify one
		// more level of quoting.
		if (maxBegOfLineLen > 0)
			++maxBegOfLineLen;
		// Add gQuotePrefix's length to maxBegOfLineLen to account for that
		// for wrapping the text. Note: In future versions, if we don't want
		// to add the previous author's initials to all lines, then we might
		// not automatically want to add this to every line.
		maxBegOfLineLen += gQuotePrefix.length;

		// Wrap the current section of quote lines
		var maxLineWidth = pMaxWidth - maxBegOfLineLen;
		if (maxLineWidth < 0)
			maxLineWidth = 0;
		var idxesAddedNL = [];
		var numLinesAdded = 0;
		if (maxLineWidth > 0)
		{
			numLinesAdded = wrapTextLines(gQuoteLines, quoteSections[sIndex].startArrIndex,
			                              quoteSections[sIndex].endArrIndex, maxLineWidth,
			                              idxesAddedNL, lineInfos);
		}

		// If quote lines were added as a result of wrapping, then determine the
		// number of lines added and update the end index of this object in
		// quoteSections and the start & end indexes of the subsequent objects in
		// quoteSections.
		if (numLinesAdded > 0)
		{
			// Splice new lineInfo objects into the lineInfos array at the end of this
			// section for each new line added in this section.
			for (var counter = 0; counter < numLinesAdded; ++counter)
				lineInfos.splice(quoteSections[sIndex].endArrIndex, 0, getDefaultQuoteStrObj());
			// Now we can update this section's end index.  Then, after each index that
			// required a new line to be added, move the lineInfo information down one line.
			quoteSections[sIndex].endArrIndex += numLinesAdded;
			for (var NLArrIdx = 0; NLArrIdx < idxesAddedNL.length; ++NLArrIdx)
			{
				for (var lnInfoMoveIdx = quoteSections[sIndex].endArrIndex-1;
				     lnInfoMoveIdx > idxesAddedNL[NLArrIdx]; --lnInfoMoveIdx)
				{
					lineInfos[lnInfoMoveIdx].copy(lineInfos[lnInfoMoveIdx-1]);
				}
			}

			// Update the start & end indexes of the following sections.
			for (var sIndex2 = sIndex+1; sIndex2 < quoteSections.length; ++sIndex2)
			{
				quoteSections[sIndex2].startArrIndex += numLinesAdded;
				quoteSections[sIndex2].endArrIndex += numLinesAdded;
			}

			// Go through this section's quote lines, and for each quote line that is
			// non-blank and has a lineInfo object with a blank beginning-of-line text,
			// set its beginning-of-line text to the first non-blank beginning-of-line
			// text from a line preceding it.
			for (var lnIdx = quoteSections[sIndex].startArrIndex+1; lnIdx < quoteSections[sIndex].endArrIndex; ++lnIdx)
			{
				if ((gQuoteLines[lnIdx].length > 0) && (lineInfos[lnIdx].begOfLine.length == 0))
				{
					var nonBlankIdx = lnIdx - 1;
					while ((lineInfos[nonBlankIdx].begOfLine.length == 0) && (nonBlankIdx > quoteSections[sIndex].startArrIndex))
						--nonBlankIdx;
					if (lineInfos[nonBlankIdx].begOfLine.length > 0)
						lineInfos[lnIdx].begOfLine = lineInfos[nonBlankIdx].begOfLine;
				}
			}
		}

		// Go through this section's (now wrapped) quote lines and quote them
		for (var quoteLnIdx = quoteSections[sIndex].startArrIndex; quoteLnIdx < quoteSections[sIndex].endArrIndex; ++quoteLnIdx)
		{
			if (lineInfos[quoteLnIdx] != null)
			{
				if (gQuoteLines[quoteLnIdx].length == 0)
					continue;

				// If the quote level in this section is positive and the beginning
				// of the line has a non-zero length, then add a > at the end to
				// signify that this line is being quoted again.
				var begOfLineLen = lineInfos[quoteLnIdx].begOfLine.length;
				if ((begOfLineLen > 0) && (quoteSections[sIndex].quoteLevel > 0))
				{
					if (lineInfos[quoteLnIdx].begOfLine.charAt(begOfLineLen-1) == " ")
						lineInfos[quoteLnIdx].begOfLine = lineInfos[quoteLnIdx].begOfLine.substr(0, begOfLineLen-1) + "> ";
					else
						lineInfos[quoteLnIdx].begOfLine += ">";
				}
				// Re-assemble the quote line
				gQuoteLines[quoteLnIdx] = lineInfos[quoteLnIdx].begOfLine + gQuoteLines[quoteLnIdx];
				if (quoteSections[sIndex].quoteLevel == 0)
					gQuoteLines[quoteLnIdx] = gQuotePrefix + gQuoteLines[quoteLnIdx];
			}
			else
			{
				// Old style: Put quote strings ("> ") back into the lines we just wrapped.
				var quotePrefix = "";
				for (var counter = 0; counter < lastQuoteLevel; ++counter)
					quotePrefix += "> ";
				gQuoteLines[quoteLnIdx] = quotePrefix + gQuoteLines[quoteLnIdx].replace(/^\s*>/, ">");
			}
		}
	}
}

// Wraps the quote lines without using the originals author's initials
// (classic quoting).
// Assumes gQuotePrefix does not contains the author's initials.
//
// Parameters:
//  pTrimSpacesFromQuoteLines: Whether or not to trim spaces from quote lines (for when people
//                             indent the first line of their reply, etc.).  Defaults to true.
//  pMaxWidth: The maximum width of the lines
function wrapQuoteLines_NoAuthorInitials(pTrimSpacesFromQuoteLines, pMaxWidth)
{
	if (gQuoteLines.length == 0)
		return;

	// Create an array for line information objects.
	var lineInfos = [];
	for (var quoteLineIndex = 0; quoteLineIndex < gQuoteLines.length; ++quoteLineIndex)
		lineInfos.push(firstNonQuoteTxtIndex(gQuoteLines[quoteLineIndex], false, false));

	// Set an initial value for lastQuoteLevel, which will be used to compare the
	// quote levels of each line.
	var lastQuoteLevel = lineInfos[0].quoteLevel;

	// Loop through the array starting at the 2nd line and wrap the lines
	var startArrIndex = 0;
	var endArrIndex = 0;
	var quoteStr = "";
	var quoteLevel = 0;
	var i = 0; // Index variable
	for (var quoteLineIndex = 1; quoteLineIndex < gQuoteLines.length; ++quoteLineIndex)
	{
		if (lineInfos[quoteLineIndex].quoteLevel != lastQuoteLevel)
		{
			endArrIndex = quoteLineIndex;
			// Remove the quote strings from the lines we're about to wrap
			for (i = startArrIndex; i < endArrIndex; ++i)
			{
				if (lineInfos[i] != null)
				{
					if (lineInfos[i].startIndex > -1)
						gQuoteLines[i] = gQuoteLines[i].substr(lineInfos[i].startIndex);
					else
						gQuoteLines[i] = normalizeGTChars(gQuoteLines[i]);
					// If the quote line now only consists of spaces after removing the quote
					// characters, then make it blank.
					if (/^ +$/.test(gQuoteLines[i]))
						gQuoteLines[i] = "";
				}
			}
			// Wrap the text lines in the range we've seen.
			// The following length is subtracted from it the max line width:
			// (2*(lastQuoteLevel+1) + gQuotePrefix.length)
			// That is because we'll be prepending "> " to the quote lines,
			// and then SlyEdit will prepend gQuotePrefix to them during quoting.
			var numLinesAdded =  wrapTextLines(gQuoteLines, startArrIndex, endArrIndex,
			                                   pMaxWidth - (2*(lastQuoteLevel+1) + gQuotePrefix.length));
			// If quote lines were added as a result of wrapping, then
			// determine the number of lines added, and update endArrIndex
			// and quoteLineIndex accordingly.
			if (numLinesAdded > 0)
			{
				endArrIndex += numLinesAdded;
				quoteLineIndex += (numLinesAdded-1); // - 1 because quoteLineIndex will be incremented by the for loop
				// Splice new lineInfo objects into the lineInfos array at the end of this
				// section for each new line added in this section.
				for (var counter = 0; counter < numLinesAdded; ++counter)
					lineInfos.splice(endArrIndex, 0, getDefaultQuoteStrObj());
			}
			// Put quote strings ("> ") back into the lines we just wrapped
			if ((quoteLineIndex > 0) && (lastQuoteLevel > 0))
			{
				quoteStr = "";
				for (i = 0; i < lastQuoteLevel; ++i)
					quoteStr += "> ";
				for (i = startArrIndex; i < endArrIndex; ++i)
					gQuoteLines[i] = quoteStr + gQuoteLines[i].replace(/^\s*>/, ">");
			}
			lastQuoteLevel = lineInfos[quoteLineIndex].quoteLevel;
			startArrIndex = quoteLineIndex;
		}
		// For lines with a quote level of 0, if this line's indentation differs from
		// the previous line's indentation, then that marks a new section.
		else if ((lineInfos[quoteLineIndex].quoteLevel == 0) && (lastQuoteLevel == 0) &&
		         (lineInfos[quoteLineIndex].startIndex > lineInfos[quoteLineIndex-1].startIndex))
		{
			endArrIndex = quoteLineIndex;

			// Remove leading whitespace from the text lines in this section to leave
			// more room for wrapping and so that we don't end up with a section of
			// quote lines that all start with several spaces.
			var trimSpacesFromQuoteLines = (typeof(pTrimSpacesFromQuoteLines) == "boolean" ? pTrimSpacesFromQuoteLines : true);
			for (var i = startArrIndex; i < endArrIndex; ++i)
			{
				if (trimSpacesFromQuoteLines)
					gQuoteLines[i] = trimSpaces(gQuoteLines[i], true, true, false);
				lineInfos[i].startIndex = 0;
				lineInfos[i].begOfLine = "";
			}

			// Wrap the text lines in the range we've seen.
			// Note: 79 is assumed as the maximum line length because
			// that seems to be a commonly-accepted message width for
			// BBSes.
			var numLinesAdded = wrapTextLines(gQuoteLines, startArrIndex, endArrIndex, 79);
			// If quote lines were added as a result of wrapping, then
			// determine the number of lines added, and update endArrIndex
			// and quoteLineIndex accordingly.
			if (numLinesAdded > 0)
			{
				endArrIndex += numLinesAdded;
				quoteLineIndex += (numLinesAdded-1); // - 1 because quoteLineIndex will be incremented by the for loop
				// Splice new lineInfo objects into the lineInfos array at the end of this
				// section for each new line added in this section.
				for (var counter = 0; counter < numLinesAdded; ++counter)
					lineInfos.splice(endArrIndex, 0, getDefaultQuoteStrObj());
			}
			startArrIndex = quoteLineIndex;
		}
	}
	// Wrap the last block of lines
	wrapTextLines(gQuoteLines, startArrIndex, gQuoteLines.length, 79 - (2*(lastQuoteLevel+1) + gQuotePrefix.length));

	// Go through the quote lines again, and for ones that start with " >", remove
	// the leading whitespace.  This is because the quote string is " > ", so it
	// would insert an extra space before the first > in the quote line.
	for (i = 0; i < gQuoteLines.length; ++i)
		gQuoteLines[i] = gQuoteLines[i].replace(/^\s*>/, ">");
}

// Gets information about a message area, given a message name.
// This function First tries to read the values from the file
// DDML_SyncSMBInfo.txt in the node directory (written by the Digital
// Distortion Message Lister v1.31 and higher).  If that file can't be read,
// the values will default to the values of bbs.smb_last_msg,
// bbs.smb_total_msgs, and bbs.msg_number/bbs.smb_curmsg.
//
// Parameters:
//  pMsgAreaName: The name of the message area being posted to
//
// Return value: An object containing the following properties:
//  lastMsg: The last message in the sub-board (i.e., bbs.smb_last_msg)
//  totalNumMsgs: The total number of messages in the sub-board (i.e., bbs.smb_total_msgs)
//  curMsgNum: The number/index of the current message being read.  Starting
//             with Synchronet 3.16 on May 12, 2013, this is the absolute
//             message number (bbs.msg_number).  For Synchronet builds before
//             May 12, 2013, this is bbs.smb_curmsg.  Starting on May 12, 2013,
//             bbs.msg_number is preferred because it works properly in all
//             situations, whereas in earlier builds, bbs.msg_number was
//             always given to JavaScript scripts as 0.
//  msgNumIsOffset: Boolean - Whether or not the message number is an offset.
//                  If not, then it is the absolute message number (i.e.,
//                  bbs.msg_number).
//  subBoardCode: The current sub-board code (i.e., bbs.smb_sub_code)
//  grpIndex: The message group index for the sub-board
function getCurMsgInfo(pMsgAreaName)
{
	var retObj = {
		msgNumIsOffset: false
	};
	if (bbs.smb_sub_code.length > 0)
	{
		retObj.lastMsg = bbs.smb_last_msg;
		retObj.totalNumMsgs = bbs.smb_total_msgs;
		// If bbs.msg_number is valid (greater than 0), then use it.  Otherwise,
		// use the older behavior of using bbs.smb_curmsg (the offset) instead.
		// bbs.msg_number was correct in Synchronet 3.16 builds starting on
		// May 12, 2013.
		//retObj.curMsgNum = (bbs.msg_number > 0 ? bbs.msg_number : bbs.smb_curmsg);
		if (bbs.msg_number > 0)
			retObj.curMsgNum = bbs.msg_number;
		else
		{
			retObj.curMsgNum = bbs.smb_curmsg;
			retObj.msgNumIsOffset = true;
		}
		retObj.subBoardCode = bbs.smb_sub_code;
		retObj.grpIndex = msg_area.sub[bbs.smb_sub_code].grp_index;
	}
	else
	{
		retObj.lastMsg = -1;
		retObj.curMsgNum = -1;
		// If the user has a valid current sub-board code, then use it;
		// otherwise, find the first sub-board the user is able to post
		// in and use that.
		if (typeof(msg_area.sub[bbs.cursub_code]) != "undefined")
		{
			retObj.subBoardCode = bbs.cursub_code;
			retObj.grpIndex = msg_area.sub[bbs.cursub_code].grp_index;
		}
		else
		{
			var firstPostableSubInfo = getFirstPostableSubInfo();
			retObj.subBoardCode = firstPostableSubInfo.subCode;
			retObj.grpIndex = firstPostableSubInfo.grpIndex;
		}

		// If we got a valid sub-board code, then open that sub-board
		// and get the total number of messages from it.
		if (retObj.subBoardCode.length > 0)
		{
			var tmpMsgBaseObj = new MsgBase(retObj.subBoardCode);
			if (tmpMsgBaseObj.open())
			{
				retObj.totalNumMsgs = tmpMsgBaseObj.total_msgs;
				tmpMsgBaseObj.close();
			}
			else
				retObj.totalNumMsgs = 0;
		}
		else
			retObj.totalNumMsgs = 0;
	}
	// If pMsgAreaName is valid, then if it specifies a message area name that is
	// different from what's in retObj, then we probably want to use bbs.cursub_code
	// instead of bbs.smb_sub_code, etc.
	// Note: As of the May 8, 2013 build of Synchronet (3.16), the bbs.smb_sub*
	// properties reflect the current sub-board being posted to, always.
	// Digital Man committed a change in CVS for this on May 7, 2013.
	if ((typeof(pMsgAreaName) === "string") && (pMsgAreaName.length > 0) && (retObj.subBoardCode != "") && msg_area.sub.hasOwnProperty(retObj.subBoardCode))
	{
		if (msg_area.sub[retObj.subBoardCode].name.indexOf(pMsgAreaName) == -1)
		{
			retObj.lastMsg = -1;
			retObj.curMsgNum = -1;
			// If the user has a valid current sub-board code, then use it;
			// otherwise, find the first sub-board the user is able to post
			// in and use that.
			if (typeof(msg_area.sub[bbs.cursub_code]) != "undefined")
			{
				retObj.subBoardCode = bbs.cursub_code;
				retObj.grpIndex = msg_area.sub[bbs.cursub_code].grp_index;
			}
			else
			{
				var firstPostableSubInfo = getFirstPostableSubInfo();
				retObj.subBoardCode = firstPostableSubInfo.subCode;
				retObj.grpIndex = firstPostableSubInfo.grpIndex;
			}

			// If we got a valid sub-board code, then open that sub-board
			// and get the total number of messages from it.
			if (retObj.subBoardCode.length > 0)
			{
				var tmpMsgBaseObj = new MsgBase(retObj.subBoardCode);
				if (tmpMsgBaseObj.open())
				{
					retObj.totalNumMsgs = tmpMsgBaseObj.total_msgs;
					tmpMsgBaseObj.close();
				}
				else
					retObj.totalNumMsgs = 0;
			}
			else
				retObj.totalNumMsgs = 0;
		}
	}

	// If the Digital Distortion Message Lister drop file exists,
	// then use the message information from that file instead.
	if (file_exists(gDDML_DROP_FILE_NAME))
	{
		var SMBInfoFile = new File(gDDML_DROP_FILE_NAME);
		if (SMBInfoFile.open("r"))
		{
			var fileLine = null; // A line read from the file
			var lineNum = 0; // Will be incremented at the start of the while loop, to start at 1.
			while (!SMBInfoFile.eof)
			{
				++lineNum;

				// Read the next line from the config file.
				fileLine = SMBInfoFile.readln(2048);

				// fileLine should be a string, but I've seen some cases
				// where for some reason it isn't.  If it's not a string,
				// then continue onto the next line.
				if (typeof(fileLine) != "string")
					continue;

				// Depending on the line number, set the appropriate value
				// in retObj.
				switch (lineNum)
				{
					case 1:
						retObj.lastMsg = +fileLine;
						break;
					case 2:
						retObj.totalNumMsgs = +fileLine;
						break;
					case 3:
						retObj.curMsgNum = +fileLine;
						retObj.msgNumIsOffset = false; // For Message Lister 1.36 and newer
						break;
					case 4:
						retObj.subBoardCode = fileLine;
						retObj.grpIndex = msg_area.sub[retObj.subBoardCode].grp_index;
						break;
					default:
						break;
				}
			}
			SMBInfoFile.close();
		}
	}

	return retObj;
}

// Gets the "From" name of the current message being replied to.
// Only for use when replying to a message in a public sub-board.
// The message information is retrieved from DDML_SyncSMBInfo.txt
// in the node dir if it exists or from the bbs object's properties.
// On error, the string returned will be blank.
//
// Parameters:
//  pMsgInfo: Optional: An object returned by getCurMsgInfo().  If this
//            parameter is not specified, this function will call
//            getCurMsgInfo() to get it.
//
// Return value: The from name of the current message being replied
//               to (a string).
function getFromNameForCurMsg(pMsgInfo)
{
	var fromName = "";

	// Get the information about the current message from
	// DDML_SyncSMBInfo.txt in the node dir if it exists or from
	// the bbs object's properties.  Then open the message header
	// and get the 'from' name from it.
	var msgInfo = null;
	if ((pMsgInfo != null) && (typeof(pMsgInfo) != "undefined"))
		msgInfo = pMsgInfo;
	else
		msgInfo = getCurMsgInfo();

	if (msgInfo.subBoardCode.length > 0)
	{
		var msgBase = new MsgBase(msgInfo.subBoardCode);
		if (msgBase != null)
		{
			msgBase.open();
			var hdr = msgBase.get_msg_header(msgInfo.msgNumIsOffset, msgInfo.curMsgNum, true);
			if (hdr != null)
				fromName = hdr.from;
			msgBase.close();
		}
	}

	return fromName;
}

// Calculates & returns a page number.
//
// Parameters:
//  pTopIndex: The index (0-based) of the topmost item on the page
//  pNumPerPage: The number of items per page
//
// Return value: The page number
function calcPageNum(pTopIndex, pNumPerPage)
{
  return ((pTopIndex / pNumPerPage) + 1);
}

// Returns whether or not the user is posting in a message sub-board.
// If false, that means the user is sending private email or netmail.
// This function determines whether the user is posting in a message
// sub-board if the message area name is not "Electronic Mail" and
// is not "NetMail".
//
// Parameters:
//  pMsgAreaName: The name of the message area.
function postingInMsgSubBoard(pMsgAreaName)
{
	if (typeof(pMsgAreaName) != "string")
		return false;
	if (pMsgAreaName.length == 0)
		return false;

	return ((pMsgAreaName != "Electronic Mail") && (pMsgAreaName != "NetMail"));
}

// Returns the number of properties of an object.
//
// Parameters:
//  pObject: The object for which to count properties
//
// Return value: The number of properties of the object
function numObjProperties(pObject)
{
  if (pObject == null)
    return 0;

  var numProps = 0;
  for (var prop in pObject) ++numProps;
  return numProps;
}

// Posts a message in a sub-board
//
// Paramters:
//  pSubBoardCode: Synchronet's internal code for the sub-board to post in
//  pFrom: The 'from' name of the person sending the message.  If the user chose to post anonymously
//         in the original sub-board, this will be "ANONYMOUS" (as given by Synchronet).
//  pTo: The name of the person to send the message to
//  pSubj: The subject of the email
//  pMessage: The email message
//  pFromUserNum: The number of the user to use as the message sender.
//                This is optional; if not specified, the current user
//                will be used.
//
// Return value: String - Blank on success, or message on failure.
function postMsgToSubBoard(pSubBoardCode, pFrom, pTo, pSubj, pMessage, pFromUserNum)
{
	// Return if the parameters are invalid.
	if (typeof(pSubBoardCode) != "string")
		return "Sub-board code is not a string";
	if (typeof(pTo) != "string")
		return "To name is not a string";
	if (pTo.length == 0)
		return "The 'to' user name is blank";
	if (typeof(pSubj) != "string")
		return "Subject is not a string";
	if (pSubj.length == 0)
		return "The subject is blank";
	if (typeof(pMessage) != "string")
		return "Message is not a string";
	if (pMessage.length == 0)
		return "Not sending an empty message";
	if (typeof(pFromUserNum) != "number")
		return "From user number is not a number";
	if ((pFromUserNum <= 0) || (pFromUserNum > system.lastuser))
		return "Invalid user number";

	// Load the user record specified by pFromUserNum.  If it's a deleted user,
	// then return an error.
	var fromUser = new User(pFromUserNum);
	if (fromUser.settings & USER_DELETED)
		return "The 'from' user is marked as deleted";

	// Check the posting access requirements for this sub-board.  If the
	// user is not able to post in this sub-board, then don't let them.
	if (!msg_area.sub[pSubBoardCode].can_post)
		return fromUser.name + " cannot post in " + pSubBoardCode;

	// Open the sub-board so that the message can be posted there.
	var msgbase = new MsgBase(pSubBoardCode);
	if (!msgbase.open())
		return ("Error opening the message area: " + msgbase.last_error);

	// Create the message header, and send the message.
	var header = {
		to: pTo,
		from_net_type: NET_NONE,
		to_net_type: NET_NONE
	};
	// For the 'From' name, if the SUB_ANON or SUB_AONLY flag is set, use
	// "Anonymous".  Otherwise, use the user's real name if the sub-board
	// is set up to post using real names; otherwise, use the user's alias.
	if ((msgbase.cfg.settings & SUB_AONLY) == SUB_AONLY) // The sub-board allows only anonymous posts
		header.from = (typeof(pFrom) === "string" ? pFrom : "ANONYMOUS");
	else if((msgbase.cfg.settings & SUB_ANON) == SUB_ANON)
	{
		// The sub-board allows anonymous posts but doesn't require it
		if (typeof(pFrom) === "string")
			header.from = pFrom;
		else
			header.from = ((msgbase.cfg.settings & SUB_NAME) == SUB_NAME ? fromUser.name : fromUser.alias);
	}
	else if ((msgbase.cfg.settings & SUB_NAME) == SUB_NAME)
		header.from = fromUser.name;
	else
		header.from = fromUser.alias;
	header.from_ext = fromUser.number;
	header.from_net_addr = fromUser.netmail;
	header.subject = pSubj;
	var saveRetval = msgbase.save_msg(header, pMessage);
	msgbase.close();

	var retStr = "";
	if (!saveRetval)
		retStr = "Error saving the message: " + msgbase.last_error;

	return retStr;
}

// Reads the current user's message signature file (if it exists)
// and returns its contents.
//
// Return value: An object containing the following properties:
//               sigFileExists: Boolean - Whether or not the user's signature file exists
//               sigContents: String - The user's message signature
function readUserSigFile()
{
	var retObj = {
		sigFileExists: false,
		sigContents: ""
	};

	// The user signature files are located in sbbs/data/user, and the filename
	// is the user number (zero-padded up to 4 digits) + .sig
	var userSigFilename = backslash(system.data_dir + "user") + format("%04d.sig", user.number);
	retObj.sigFileExists = file_exists(userSigFilename);
	if (retObj.sigFileExists)
	{
		var msgSigFile = new File(userSigFilename);
		if (msgSigFile.open("r"))
		{
			var fileLine = ""; // A line read from the file
			while (!msgSigFile.eof)
			{
				fileLine = msgSigFile.readln(2048);
				// fileLine should be a string, but I've seen some cases
				// where for some reason it isn't.  If it's not a string,
				// then continue onto the next line.
				if (typeof(fileLine) != "string")
					continue;

				retObj.sigContents += fileLine + "\r\n";
			}

			msgSigFile.close();
		}
	}

	return retObj;
}

// Returns the sub-board code and group index for the first sub-board
// the user is allowed to post in.  If none are found, the sub-board
// code will be a blank string and the group index will be 0.
//
// Return value: An object with the following properties:
//               subCode: The sub-board code
//               grpIndex: The group index of the sub-board
function getFirstPostableSubInfo()
{
	var retObj = {
		subCode: "",
		grpIndex: 0
	};

	var continueOn = true;
	for (var groupIdx = 0; (groupIdx < msg_area.grp_list.length) && continueOn; ++groupIdx)
	{
		for (var subIdx = 0; (subIdx < msg_area.grp_list[groupIdx].sub_list.length) && continueOn; ++subIdx)
		{
			if (user.compare_ars(msg_area.grp_list[groupIdx].sub_list[subIdx].ars) &&
			    user.compare_ars(msg_area.grp_list[groupIdx].sub_list[subIdx].post_ars))
			{
				retObj.subCode = msg_area.grp_list[groupIdx].sub_list[subIdx].code;
				retObj.grpIndex = groupIdx;
				continueOn = false;
				break;
			}
		}
	}

  return retObj;
}

// Reads SlyEdit_TextReplacements.cfg (from sbbs/mods, sbbs/ctrl, or the
// script's directory) and populates an associative array with the WORD=text
// pairs.  When not using regular expressions, the key will be in all uppercase
// and the value in lowercase.  This function will read up to 9999 replacements.
//
// Parameters:
//  pReplacementsObj: The object/dictionary to populate.
//  pRegex: Whether or not the text replace feature is configured to use regular
//          expressions.  If so, then the search words in the array will not
//          be converted to uppercase and the replacement text will not be
//          converted to lowercase.
//  pAllowColors: Boolean: Whether or not to allow color/attribute codes
//
// Return value: The number of text replacements added to the array.
function populateTxtReplacements(pReplacementsObj, pRegex, pAllowColors)
{
	var numTxtReplacements = 0;

	// Note: Limited to words without spaces.
	// Open the word replacements configuration file
	var wordReplacementsFilename = genFullPathCfgFilename("SlyEdit_TextReplacements.cfg", gStartupPath);
	var arrayPopulated = false;
	var wordFile = new File(wordReplacementsFilename);
	if (wordFile.open("r"))
	{
		var fileLine = null;      // A line read from the file
		var equalsPos = 0;        // Position of a = in the line
		var wordToSearch = null; // A word to be replaced
		var wordToSearchUpper = null;
		var substWord = null;    // The word to substitue
		// This tests numTxtReplacements < 9999 so that the 9999th one is the last
		// one read.
		while (!wordFile.eof && (numTxtReplacements < 9999))
		{
			// Read the next line from the config file.
			fileLine = wordFile.readln(2048);

			// fileLine should be a string, but I've seen some cases
			// where for some reason it isn't.  If it's not a string,
			// then continue onto the next line.
			if (typeof(fileLine) != "string")
				continue;
			// If the line starts with with a semicolon (the comment
			// character) or is blank, then skip it.
			if ((fileLine.substr(0, 1) == ";") || (fileLine.length == 0))
				continue;

			// Look for an equals sign, and if found, separate the line
			// into the setting name (before the =) and the value (after the
			// equals sign).
			equalsPos = fileLine.indexOf("=");
			if (equalsPos <= 0)
				continue; // = not found or is at the beginning, so go on to the next line

			// Extract the word to search and substitution word from the line.  If
			// not using regular expressions, then convert the word to search to
			// all uppercase for case-insensitive searching.
			wordToSearch = trimSpaces(fileLine.substr(0, equalsPos), true, false, true);
			wordToSearchUpper = wordToSearch.toUpperCase();
			substWord = trimSpaces(fileLine.substr(equalsPos+1), true, false, true);
			// We'll want to make sure substWord only contains printable characters.  If not, then
			// skip this one.
			var substIsPrintable = true;
			if (pAllowColors)
			{
				// Replace any instances of specifying the control character in substWord with the actual control character
				substWord = substWord.replace(/\\[xX]01/g, "\x01").replace(/\\[xX]1/g, "\x01").replace(/\\1/g, "\x01");
				// Check for only control characters and printable characters in substWord
				for (var i = 0; (i < substWord.length) && substIsPrintable; ++i)
				{
					var currentChar = substWord.charAt(i);
					substIsPrintable = (currentChar == "\x01" || isPrintableChar(currentChar));
				}
			}
			else
			{
				substWord = strip_ctrl(substWord);
				for (var i = 0; (i < substWord.length) && substIsPrintable; ++i)
					substIsPrintable = isPrintableChar(substWord.charAt(i));
			}
			if (!substIsPrintable)
				continue;

			// And add the search word and replacement text to pReplacementsObj.
			if (wordToSearchUpper != substWord.toUpperCase())
			{
				if (pRegex)
					pReplacementsObj[wordToSearch] = substWord;
				else
					pReplacementsObj[wordToSearchUpper] = substWord;
				++numTxtReplacements;
			}
		}

		wordFile.close();
	}

	return numTxtReplacements;
}

function moveGenColorsToGenSettings(pColorsArray, pCfgObj)
{
   // Set up an array of color setting names
   var colorSettingStrings = [];
   colorSettingStrings.push("crossPostBorder"); // Deprecated
   colorSettingStrings.push("crossPostBorderText"); // Deprecated
   colorSettingStrings.push("listBoxBorder");
   colorSettingStrings.push("listBoxBorderText");
   colorSettingStrings.push("crossPostMsgAreaNum");
   colorSettingStrings.push("crossPostMsgAreaNumHighlight");
   colorSettingStrings.push("crossPostMsgAreaDesc");
   colorSettingStrings.push("crossPostMsgAreaDescHighlight");
   colorSettingStrings.push("crossPostChk");
   colorSettingStrings.push("crossPostChkHighlight");
   colorSettingStrings.push("crossPostMsgGrpMark");
   colorSettingStrings.push("crossPostMsgGrpMarkHighlight");
   colorSettingStrings.push("msgWillBePostedHdr");
   colorSettingStrings.push("msgPostedGrpHdr");
   colorSettingStrings.push("msgPostedSubBoardName");
   colorSettingStrings.push("msgPostedOriginalAreaText");
   colorSettingStrings.push("msgHasBeenSavedText");
   colorSettingStrings.push("msgAbortedText");
   colorSettingStrings.push("emptyMsgNotSentText");
   colorSettingStrings.push("genMsgErrorText");
   colorSettingStrings.push("listBoxItemText");
   colorSettingStrings.push("listBoxItemHighlight");

   var colorName = "";
   for (var i = 0; i < colorSettingStrings.length; ++i)
   {
      colorName = colorSettingStrings[i];
      if (pColorsArray.hasOwnProperty(colorName))
      {
         pCfgObj.genColors[colorName] = pColorsArray[colorName];
         delete pColorsArray[colorName];
      }
   }
   // If listBoxBorder and listBoxBorderText exist in the general colors settings,
   // then remove crossPostBorder and crossPostBorderText if they exist.
   if (pCfgObj.genColors.hasOwnProperty["listBoxBorder"] && pCfgObj.genColors.hasOwnProperty["crossPostBorder"])
   {
      // Favor crossPostBorder to preserve backwards compatibility.
      pCfgObj.genColors["listBoxBorder"] = pCfgObj.genColors["crossPostBorder"];
      delete pCfgObj.genColors["crossPostBorder"];
   }
   if (pCfgObj.genColors.hasOwnProperty["listBoxBorderText"] && pCfgObj.genColors.hasOwnProperty["crossPostBorderText"])
   {
      // Favor crossPostBorderText to preserve backwards compatibility.
      pCfgObj.genColors["listBoxBorderText"] = pCfgObj.genColors["crossPostBorderText"];
      delete pCfgObj.genColors["crossPostBorderText"];
   }
}

// Returns whether or not a character is a letter.
//
// Parameters:
//  pChar: The character to test
//
// Return value: Boolean - Whether or not the character is a letter
function charIsLetter(pChar)
{
	if (typeof(charIsLetter.regex) === "undefined")
	{
		var regexStr = "^[A-Z";
		var highASCIICodes = [192, 200, 204, 210, 217, 224, 232, 236, 242, 249, 193, 201, 205, 211, 218, 221, 225, 233, 237, 243, 250, 253, 194, 202, 206, 212, 219, 226, 234, 238, 244, 251, 195, 209, 213, 227, 241, 245, 196, 203, 207, 214, 220, 228, 235, 239, 246, 252, 231, 199, 223, 216, 248, 197, 229, 198, 230, 222, 254, 208, 240];
		for (var i = 0; i < highASCIICodes.length; ++i)
			regexStr += ascii(highASCIICodes[i]);
		regexStr += "]$";
		charIsLetter.regex = new RegExp(regexStr);
	}

	return charIsLetter.regex.test(pChar.toUpperCase());
}

// For configuration files, this function returns a fully-pathed filename.
// This function first checks to see if the file exists in the sbbs/mods
// directory, then the sbbs/ctrl directory, and if the file is not found there,
// this function defaults to the given default path.
//
// Parameters:
//  pFilename: The name of the file to look for
//  pDefaultPath: The default directory (must have a trailing separator character)
function genFullPathCfgFilename(pFilename, pDefaultPath)
{
	var fullyPathedFilename = system.mods_dir + pFilename;
	if (!file_exists(fullyPathedFilename))
		fullyPathedFilename = system.ctrl_dir + pFilename;
	if (!file_exists(fullyPathedFilename))
	{
		if (typeof(pDefaultPath) == "string")
		{
			// Make sure the default path has a trailing path separator
			var defaultPath = backslash(pDefaultPath);
			fullyPathedFilename = defaultPath + pFilename;
		}
		else
			fullyPathedFilename = pFilename;
	}
	return fullyPathedFilename;
}

// Returns the first letter found in a string and its index.  If a letter is
// not found, the string returned will be blank, and the index will be -1.
//
// Parameters:
//  pString: The string to search
//
// Return value: An object with the following properties:
//               letter: The first letter found in the string, or a blank string if none was found
//               idx: The index of the first letter found, or -1 if none was found
function getFirstLetterFromStr(pString)
{
   var retObj = new Object;
   retObj.letter = "";
   retObj.idx = -1;

   var theChar = "";
   for (var i = 0; (i < pString.length) && (retObj.idx == -1); ++i)
   {
      theChar = pString.charAt(i);
      if (charIsLetter(theChar))
      {
         retObj.idx = i;
         retObj.letter = theChar;
      }
   }

   return retObj;
}

// Returns whether or not the first letter in a string is uppercase.  If the
// string doesn't contain any letters, then this function will return false.
//
// Parameters:
//  pString: The string to search
//
// Return value: Boolean - Whether or not the first letter in the string is uppercase
function firstLetterIsUppercase(pString)
{
   var firstIsUpper = false;
   var letterObj = getFirstLetterFromStr(pString);
   if (letterObj.idx > -1)
   {
      var theLetter = pString.charAt(letterObj.idx);
      firstIsUpper = (theLetter == theLetter.toUpperCase());
   }
   return firstIsUpper;
}

// Gets a keypress from the user.  Uses the configured timeout if configured to
// do so and the user is not a sysop; otherwise (no timeout configured or the
// user is a sysop), the configured input timeout will be used.
//
// Parameters:
//  pMode: The input mode flag(s)
//  pCfgObj: The configuration object (stores the input timeout setting)
//
// Return value: The user's keypress (the return value of console.getkey()
//               or console.inkey()).
function getUserKey(pMode, pCfgObj)
{
	var userKey = "";
	var inputTimeoutMS = 300000;

	// If the user is a sysop, then use a much higher timeout.
	if (typeof(pCfgObj) == "object")
	{
		if ((typeof(pCfgObj.userIsSysop) == "boolean") && pCfgObj.userIsSysop)
			inputTimeoutMS = 999999;
		else if (typeof(pCfgObj.userInputTimeout) == "number")
			inputTimeoutMS = pCfgObj.inputTimeoutMS;
	}
	else if (typeof(pCfgObj) == "boolean")
	{
		if (pCfgObj)
			inputTimeoutMS = 999999;
	}

	// Input a key from the user
	userKey = console.inkey(pMode, inputTimeoutMS);

	return userKey;
}

// Gets a string of user input such that each character is validated against a
// set of strings.  Each string contains a list of valid characters, and each
// set of potential valid characters can only appear once in the user input.
// This function was written to be used in color selection in lieu of
// console.getkeys(), which outputs a carriage return at the end, which was not
// desirable.  For instance, color selection involves prompting the user for
// 3 characters (foreground, background, and special).
//
// Parameters:
//  pMode: The input mode bit(s).  See K_* in sbbsdefs.js for mode bits.
//  pValidKeyStrs: An array of strings containing valid keys
//  pCfgObj: The SlyEdit configuration settings object
//  pCurPos: Optional.  Contains x and y coordinates specifying the current
//           cursor position.  If this is not specified, this function will
//           get the cursor position by calling console.getxy().
//
// Return value: The user's input, as a string.  If nothing is input, this
//               function will return an empty string.
function getUserInputWithSetOfInputStrs(pMode, pValidKeyStrs, pCfgObj, pCurPos)
{
	if (pValidKeyStrs == null)
		return "";
	if (pValidKeyStrs.length == 0)
		return "";

	// Get the current cursor position, either from pCurPos or console.getxy().
	var curPos = (pCurPos != null ? pCurPos : console.getxy());
	var originalCurposX = curPos.x;

	// Build one string containing all the valid keys.
	var allValidKeys = "";
	for (var i = 0; i < pValidKeyStrs.length; ++i)
		allValidKeys += pValidKeyStrs[i];
	allValidKeys += BACKSPACE + CTRL_K;

	// User input loop
	var displayChars = !((pMode & K_NOECHO) == K_NOECHO);
	var userInput = "";
	var inputKey = "";
	var userInputIdx = 0; // For moving the cursor left & right.
	var idx = 0;
	var continueOn = true;
	while (continueOn)
	{
		inputKey = getUserKey(pMode|K_NOECHO, pCfgObj);
		// If userInput is blank, then the timeout was probably reached, so don't
		// continue inputting characters.
		if (inputKey.length == 0)
			break;

		switch (inputKey)
		{
			case BACKSPACE: // Delete one key backward
				// If userInput has some characters in it, then remove the current key
				// and move the cursor back one space on the screen.
				if (userInput.length > 0 && userInputIdx > 0)
				{
					//userInput = userInput.substr(0, userInput.length-1);
					userInput = userInput.substring(0, userInputIdx-1) + userInput.substr(userInputIdx+1);
					--userInputIdx;
					if (userInputIdx < 0) userInputIdx = 0; // Shouldn't happen
					// If we are to display the input characters, then also blank out
					// the character on the screen and make sure the cursor is placed
					// properly on the screen.
					if (displayChars && curPos.x > originalCurposX)
					{
						console.gotoxy(--curPos.x, curPos.y);
						console.print(" ");
						console.gotoxy(curPos);
					}
				}
				break;
			case KEY_DEL: // Delete one key forward
				if (userInputIdx < userInput.length)
				{
					userInput = userInput.substr(0, userInputIdx) + userInput.substr(userInputIdx+1);
					if (displayChars)
					{
						var txtToWrite = userInput.substr(userInputIdx);
						console.print(txtToWrite.length > 0 ? txtToWrite : " ");
						console.cleartoeol("\x01n");
						console.gotoxy(curPos.x, curPos.y);
					}
				}
				//else if (userInputIdx == 0 && userInput.length == 1)
				//	userInput = "";
				break;
			case KEY_LEFT:
				// Move the cursor one position to the left
				if (displayChars && userInput.length > 0 && curPos.x > originalCurposX)
				{
					console.gotoxy(--curPos.x, curPos.y);
					--userInputIdx;
					if (userInputIdx < 0) userInputIdx = 0; // Shouldn't happen
				}
				break;
			case KEY_RIGHT:
				// Move the cursor one position to the right
				if (displayChars && userInputIdx < userInput.length)
				{
					console.gotoxy(++curPos.x, curPos.y);
					++userInputIdx;
					if (userInputIdx > userInput.length) userInputIdx = userInput.length; // Shouldn't happen
				}
				break;
			// ESC and Ctrl-K: Cancel out of color selection, whereas
			// ENTER will save the user's input before returning.
			case KEY_ESC:
			case CTRL_K:
				userInput = "";
				userInputIdx = 0;
			case KEY_ENTER:
				continueOn = false;
				break;
			default:
				// If the user pressed a valid key that hasn't been pressed yet, then
				// append/insert it to userInput.
				if (allValidKeys.indexOf(inputKey) > -1 && userInput.indexOf(inputKey) < 0)
				{
					if (userInputIdx == userInput.length)
						userInput += inputKey;
					else if (userInputIdx < userInput.length)
						userInput = userInput.substr(0, userInputIdx) + inputKey + userInput.substr(userInputIdx);
					// If K_NOECHO wasn't passed in pMode, then output the keypress
					if (displayChars)
					{
						//console.print(inputKey);
						var inputToDisplay = userInput.substr(userInputIdx);
						console.print(inputToDisplay);
						++curPos.x;
						if (inputToDisplay.length > 1)
							console.gotoxy(curPos.x, curPos.y);
					}
					++userInputIdx;
				}
				break;
		}
	}
	return userInput;
}

// Reads a text file and returns an array of strings containing the lines from
// the text file.
//
// Parameters:
//  pFilename: The name of the file to read
//  pStripCtrl: Boolean - Whether or not to strip control characters from the lines
//  pIgnoreBlankLines: Boolean - Whether or not to ignore blank lines
//  pMaxNumLines: Optional - The maximum number of lines to read from the file
//
// Return value: An array of strings read from the file
function readTxtFileIntoArray(pFilename, pStripCtrl, pIgnoreBlankLines, pMaxNumLines)
{
   var fileStrs = [];

   var maxNumLines = -1;
   if (typeof(pMaxNumLines) == "number")
   {
      if (pMaxNumLines > -1)
         maxNumLines = pMaxNumLines;
   }
   if (maxNumLines == 0)
      return fileStrs;

   var txtFile = new File(pFilename);
   if (txtFile.open("r"))
   {
      var fileLine = null;  // A line read from the file
      var numLinesRead = 0;
      while (!txtFile.eof)
      {
         // Read the next line from the config file.
         fileLine = txtFile.readln(2048);

         // fileLine should be a string, but I've seen some cases
         // where for some reason it isn't.  If it's not a string,
         // then continue onto the next line.
         if (typeof(fileLine) != "string")
            continue;

         if (pStripCtrl)
            fileLine = strip_ctrl(fileLine);

         if (pIgnoreBlankLines && (fileLine.length == 0))
            continue;

         fileStrs.push(fileLine);

         ++numLinesRead;
         if ((maxNumLines > 0) && (numLinesRead >= maxNumLines))
            break;
      }

      txtFile.close();
   }

   return fileStrs;
}

// Returns whether or not a text file contains lines in it.
//
// Parameters:
//  pFilename: The name of the file to test
//
// Return value: Boolean - Whether or not the file contains lines
function txtFileContainsLines(pFilename)
{
   var fileContainsLines = false;

   var txtFile = new File(pFilename);
   if (txtFile.open("r"))
   {
      var fileLine = null;  // A line read from the file
      var numLinesRead = 0;
      while (!txtFile.eof && (numLinesRead == 0))
      {
         // Read the next line from the config file.
         fileLine = txtFile.readln(2048);

         // fileLine should be a string, but I've seen some cases
         // where for some reason it isn't.  If it's not a string,
         // then continue onto the next line.
         if (typeof(fileLine) != "string")
            continue;
         ++numLinesRead;
      }
      fileContainsLines = (numLinesRead > 0);

      txtFile.close();
   }

   return fileContainsLines;
}

// Reads the user settings file and returns an object containing the user's
// settings.
//
// Parameters:
//  pSlyEdCfgObj: The SlyEdit configuration object, which contains defaults
//                for some of the user settings.  This settings object should
//                be populated before this function is called.
//
// Return value: An object containing the user's settings as properties.
function ReadUserSettingsFile(pSlyEdCfgObj)
{
	// Initialize the settings object with the default settings
	var userSettingsObj = {
		enableTaglines: pSlyEdCfgObj.enableTaglines,
		promptSpellCheckOnSave: false,
		useQuoteLineInitials: pSlyEdCfgObj.useQuoteLineInitials,
		// The next setting specifies whether or not quote lines should be
		// prefixed with a space when using author initials.
		indentQuoteLinesWithInitials: pSlyEdCfgObj.indentQuoteLinesWithInitials,
		// Whether or not to trim spaces from quoted lines
		trimSpacesFromQuoteLines: true,
		autoSignMessages: false,
		autoSignRealNameOnlyFirst: true,
		autoSignEmailsRealName: true,
		dictionaryFilenames: pSlyEdCfgObj.dictionaryFilenames
	};

	// Open the user settings file
	var userSettingsFile = new File(gUserSettingsFilename);
	if (userSettingsFile.open("r"))
	{
		var settingsMode = "behavior";
		var fileLine = null;     // A line read from the file
		var equalsPos = 0;       // Position of a = in the line
		var commentPos = 0;      // Position of the start of a comment
		var setting = null;      // A setting name (string)
		var settingUpper = null; // Upper-case setting name
		var value = null;        // A value for a setting (string)
		var valueUpper = null;   // Upper-cased value
		while (!userSettingsFile.eof)
		{
			// Read the next line from the config file.
			fileLine = userSettingsFile.readln(2048);

			// fileLine should be a string, but I've seen some cases
			// where for some reason it isn't.  If it's not a string,
			// then continue onto the next line.
			if (typeof(fileLine) != "string")
				continue;

			// If the line starts with with a semicolon (the comment
			// character) or is blank, then skip it.
			if ((fileLine.substr(0, 1) == ";") || (fileLine.length == 0))
				continue;

			// If in the "behavior" section, then set the behavior-related variables.
			if (fileLine.toUpperCase() == "[BEHAVIOR]")
			{
				settingsMode = "behavior";
				continue;
			}

			// If the line has a semicolon anywhere in it, then remove
			// everything from the semicolon onward.
			commentPos = fileLine.indexOf(";");
			if (commentPos > -1)
				fileLine = fileLine.substr(0, commentPos);

			// Look for an equals sign, and if found, separate the line
			// into the setting name (before the =) and the value (after the
			// equals sign).
			equalsPos = fileLine.indexOf("=");
			if (equalsPos > 0)
			{
				// Read the setting & value, and trim leading & trailing spaces.
				setting = trimSpaces(fileLine.substr(0, equalsPos), true, false, true);
				settingUpper = setting.toUpperCase();
				value = trimSpaces(fileLine.substr(equalsPos+1), true, false, true);
				valueUpper = value.toUpperCase();

				if (settingsMode == "behavior")
				{
					if (settingUpper == "ENABLETAGLINES")
						userSettingsObj.enableTaglines = (valueUpper == "TRUE");
					else if (settingUpper == "PROMPTSPELLCHECKONSAVE")
						userSettingsObj.promptSpellCheckOnSave = (valueUpper == "TRUE");
					else if (settingUpper == "USEQUOTELINEINITIALS")
						userSettingsObj.useQuoteLineInitials = (valueUpper == "TRUE");
					else if (settingUpper == "INDENTQUOTELINESWITHINITIALS")
						userSettingsObj.indentQuoteLinesWithInitials = (valueUpper == "TRUE");
					else if (settingUpper == "TRIMSPACESFROMQUOTELINES")
						userSettingsObj.trimSpacesFromQuoteLines = (valueUpper == "TRUE");
					else if (settingUpper == "AUTOSIGNMESSAGES")
						userSettingsObj.autoSignMessages = (valueUpper == "TRUE");
					else if (settingUpper == "AUTOSIGNREALNAMEONLYFIRST")
						userSettingsObj.autoSignRealNameOnlyFirst = (valueUpper == "TRUE");
					else if (settingUpper == "AUTOSIGNEMAILSREALNAME")
						userSettingsObj.autoSignEmailsRealName = (valueUpper == "TRUE");
					else if (settingUpper == "DICTIONARYFILENAMES")
						userSettingsObj.dictionaryFilenames = parseDictionaryConfig(value, gStartupPath);
				}
			}
		}
		userSettingsFile.close();
	}
	else
	{
		// We couldn't read the user settings file - So this is probably the
		// first time the user has run SlyEdit.  So, save the settings to the
		// file.
		var saveSucceeded = WriteUserSettingsFile(userSettingsObj);
	}

	return userSettingsObj;
}

// Writes the user settings to the user settings file, overwriting the
// existing file.
//
// Parameters:
//  pUserSettingsObj: The object containing the user's settings
//
// Return value: Boolean - Whether or not this function succeeded in writing the file.
function WriteUserSettingsFile(pUserSettingsObj)
{
	var writeSucceeded = false;

	var userSettingsFile = new File(gUserSettingsFilename);
	if (userSettingsFile.open("w"))
	{
		const behaviorBoolSettingNames = ["enableTaglines",
		                                  "promptSpellCheckOnSave",
		                                  "useQuoteLineInitials",
		                                  "indentQuoteLinesWithInitials",
		                                  "trimSpacesFromQuoteLines",
		                                  "autoSignMessages",
		                                  "autoSignRealNameOnlyFirst",
		                                  "autoSignEmailsRealName"];
		userSettingsFile.writeln("[BEHAVIOR]");
		for (var i = 0; i < behaviorBoolSettingNames.length; ++i)
		{
			if (pUserSettingsObj.hasOwnProperty(behaviorBoolSettingNames[i]))
				userSettingsFile.writeln(behaviorBoolSettingNames[i] + "=" + (pUserSettingsObj[behaviorBoolSettingNames[i]] ? "true" : "false"));
		}

		// Write the spell-check dictionary selection
		var dictionaryList = "";
		for (var i = 0; i < pUserSettingsObj.dictionaryFilenames.length; ++i)
		{
			// Strip the full path to get just the filename, remove the .txt filename
			// extension, and remove the "dictionary_" prefix.
			var dictName = file_getname(pUserSettingsObj.dictionaryFilenames[i]);
			if (/\.txt$/.test(dictName))
				dictName = dictName.substr(0, dictName.length-4);
			if (/^dictionary_/.test(dictName))
				dictName = dictName.substr(11);
			dictionaryList += dictName + ",";
		}
		// Remove any trailing comma
		if (/,$/.test(dictionaryList))
			dictionaryList = dictionaryList.substr(0, dictionaryList.length-1);
		// Write the dictionary list to the user settings file
		userSettingsFile.writeln("dictionaryFilenames=" + dictionaryList);

		userSettingsFile.close();
		writeSucceeded = true;
	}

	return writeSucceeded;
}

// Changes a character in a string, and returns the new string.  If any of the
// parameters are invalid, then the original string will be returned.
//
// Parameters:
//  pStr: The original string
//  pCharIndex: The index of the character to replace
//  pNewText: The new character or text to place at that position in the string
//
// Return value: The new string
function chgCharInStr(pStr, pCharIndex, pNewText)
{
   if (typeof(pStr) != "string")
      return "";
   if ((pCharIndex < 0) || (pCharIndex >= pStr.length))
      return pStr;
   if (typeof(pNewText) != "string")
      return pStr;

   return (pStr.substr(0, pCharIndex) + pNewText + pStr.substr(pCharIndex+1));
}

// Shuffles (randomizes) the contents of an array and returns the new
// array.  This function came from the following web page:
// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
//
// Parameters:
//  pArray: The array to shuffle
//
// Return value: The new array
function shuffleArray(pArray)
{
    var counter = pArray.length, temp, index;

    // While there are elements in the pArray
    while (counter--)
    {
        // Pick a random index
        index = (Math.random() * (counter + 1)) | 0;

        // And swap the last element with it
        temp = pArray[counter];
        pArray[counter] = pArray[index];
        pArray[index] = temp;
    }

    return pArray;
}

// Performs the same function as console.pause(), but also allows input of multi-key
// sequences such as PageUp, PageDown, F1, etc. without writing extra characters on
// the screen.
//
// Parameters:
//  pCfgObj: Optional - The configuration object, which specifies the input timeout.
function consolePauseWithESCChars(pCfgObj)
{
	// Get the pause prompt text from text.dat.  In case that text contains
	// "@EXEC:" (to execute a script), default to a "press a key" message.
	var pausePromptText = bbs.text(Pause); // 563: The "Press a key" text in text.dat
	if (pausePromptText.toUpperCase().indexOf("@EXEC:") > -1)
		pausePromptText = "\x01n\x01c[ Press a key ] ";
	console.print("\x01n" + pausePromptText);
	getKeyWithESCChars(K_NOSPIN|K_NOCRLF|K_NOECHO, pCfgObj);
}

// Sets the "pause" text to an empty string, does a console.pause(), then restores the pause text.
function consolePauseWithoutText()
{
	var originalPausePromptText = bbs.text(Pause); // 563: The "Press a key" text in text.dat
	bbs.replace_text(Pause, "");
	console.pause();
	bbs.revert_text(Pause);
}

// Inputs a keypress from the user and handles some ESC-based
// characters such as PageUp, PageDown, and ESC.  If PageUp
// or PageDown are pressed, this function will return the
// string defined by KEY_PAGE_UP or EY_PAGE_DOWN,
// respectively.  Also, F1-F5 will be returned as "\x01F1"
// through "\x01F5", respectively.
// Thanks goes to Psi-Jack for the original impementation
// of this function.
//
// Parameters:
//  pGetKeyMode: Optional - The mode bits for console.getkey().
//               If not specified, K_NONE will be used.
//  pCfgObj: The configuration object (stores the input timeout setting)
//
// Return value: The user's keypress
function getKeyWithESCChars(pGetKeyMode, pCfgObj)
{
	var getKeyMode = (typeof(pGetKeyMode) == "number" ? pGetKeyMode : K_NONE);
	var userInput = getUserKey(getKeyMode, pCfgObj);
	if (userInput == KEY_ESC)
	{
		switch (console.inkey(K_NOECHO|K_NOSPIN, 2))
		{
			case '[':
				switch (console.inkey(K_NOECHO|K_NOSPIN, 2))
				{
					case 'V':
						userInput = KEY_PAGE_UP;
						break;
					case 'U':
						userInput = KEY_PAGE_DOWN;
						break;
					case '1':
						userInput = KEY_F1;
						break;
					case '2':
						userInput = KEY_F2;
						break;
					case '3':
						userInput = KEY_F3;
						break;
					case '4':
						userInput = KEY_F4;
						break;
					case '5':
						userInput = KEY_F5;
						break;
				}
				break;
			case 'O':
				switch (console.inkey(K_NOECHO|K_NOSPIN, 2))
				{
					case 'P':
						userInput = KEY_F1;
						break;
					case 'Q':
						userInput = KEY_F2;
						break;
					case 'R':
						userInput = KEY_F3;
						break;
					case 'S':
						userInput = KEY_F4;
						break;
					case 't':
						userInput = KEY_F5;
						break;
				}
			default:
				break;
		}
	}

	return userInput;
}

// Returns an array of dictionary filenames, with the filename pattern
// dictionary_*.txt, in either the sbbs/mods dir, sbbs/ctrl, or the
// given default directory.
//
// Parameters:
//  pDefaultPath: The path to look in besides sbbs/mods and sbbs/ctrl
//
// Return value: An array with the full paths & filenames of dictionary
//               files in either of sbbs/mods, sbbs/ctrl, or pDefaultPath
function getDictionaryFilenames(pDefaultPath)
{
	var filenameWildcard = "dictionary_*.txt";
	var dictionaryFilenames = [];
	var dirEntries = directory(backslash(system.mods_dir) + filenameWildcard);
	for (var i = 0; i < dirEntries.length; ++i)
		dictionaryFilenames.push(dirEntries[i]);
	dirEntries = directory(backslash(system.ctrl_dir) + filenameWildcard);
	for (var i = 0; i < dirEntries.length; ++i)
		dictionaryFilenames.push(dirEntries[i]);
	if (typeof(pDefaultPath) == "string")
	{
		dirEntries = directory(backslash(pDefaultPath) + filenameWildcard);
		for (var i = 0; i < dirEntries.length; ++i)
			dictionaryFilenames.push(dirEntries[i]);
	}
	return dictionaryFilenames;
}

// Reads a dictionary file.  Returns an array containing the lines from
// the dictionary file.  The lines will all be lower-case for case-insensitive
// matching.
//
// Parameters:
//  pFilename: The filename of a dictionary file to read
//  pFullyPathed: Boolean - Whether or not the filename is fully pathed
//
// Return value: An array containing the lines read from the file, all lower-case
function readDictionaryFile(pFilename, pFullyPathed)
{
	var dictFilename = "";
	if (pFullyPathed)
		dictFilename = pFilename;
	else
		dictFilename = genFullPathCfgFilename(pFilename, gStartupPath);

	// Read the lines from the dictionary; skip Aspell copyright header lines
	// if they exist, and lower-case all words for case-insensitive matching.
	var dictionary = [];
	var txtFile = new File(dictFilename);
	if (txtFile.open("r"))
	{
		dictionary = txtFile.readAll(2048);
		txtFile.close();
		// See if there's an Aspell copyright header, and if so, remove it.  Also,
		// ensure all the lines are lower-case.
		var inCopyrightHeader = false;
		var copyrightStartIdx = -1; // Will be >= 0 if we find the first line of the copyright header
		var copyrightEndIdx = -1; // Will be >= 0 if we find the copyright end index.  The index of the last line
		for (var i = 0; i < dictionary.length; ++i)
		{
			if (dictionary[i] == "Custom wordlist generated from http://app.aspell.net/create using SCOWL")
			{
				inCopyrightHeader = true;
				copyrightStartIdx = i;
			}
			else if (inCopyrightHeader)
			{
				if (dictionary[i] == "---")
				{
					inCopyrightHeader = false;
					copyrightEndIdx = i;
				}
			}
			else
				dictionary[i] = dictionary[i].toLowerCase();
		}
		// If we found valid indexes for the Aspell copyright header, then remove it.
		if ((copyrightStartIdx >= 0) && (copyrightEndIdx >= 0))
			dictionary.splice(copyrightStartIdx, copyrightEndIdx-copyrightStartIdx+1);
		// Remove any empty strings from the array
		dictionary = dictionary.filter(function(str) { return str.length > 0; });
	}

	return dictionary;
}

// Finds a word's index in a dictionary array.  If the word is not
// found, returns -1.
//
// Parameters:
//  pDict: An array of words.  This should be sorted with all words the same
//         letter case as the word being searched for.
//  pWord: The word to look for in the dictionary.  This should be the same
//         letter case as the words in the dictionary.
//
// Return value: The index of the word in the dictionary array, or -1 if not found.
function findWordIdxInDictionary(pDict, pWord)
{
	if ((typeof(pDict) != "object") || (typeof(pWord) != "string"))
		return -1;

	var wordIdx = -1;

	// Assuming pDict is sorted, do a binary search to see if the word is
	// in the dictionary.
	var startIdx = 0;
	var endIdx = pDict.length;
	var midIdx = 0;
	var lastStartIdx = 0;
	var lastEndIdx = 0;
	var continueOn = true;
	while ((wordIdx == -1) && continueOn)
	{
		lastStartIdx = startIdx;
		lastEndIdx = endIdx;

		midIdx = startIdx + Math.floor((endIdx - startIdx) / 2);
		if (pWord == pDict[midIdx])
			wordIdx = midIdx;
		else if (pWord < pDict[midIdx])
			endIdx = midIdx;
		else if (pWord > pDict[midIdx])
			startIdx = midIdx;

		// Keep searching if either the start index or end index are different
		// from the last iteration.
		continueOn = ((lastStartIdx != startIdx) || (lastEndIdx != endIdx));
	}

	return wordIdx;
}

// Returns whether a word exists in a dictionary.
//
// Parameters:
//  pDict: An array of words.  This should be sorted with all words the same
//         letter case as the word being searched for.
//  pWord: The word to look for in the dictionary.  This should be the same
//         letter case as the words in the dictionary.
//
// Return value: Boolean: Whether or not the word exists in the dictionary.
function wordExists(pDict, pWord)
{
	return (findWordIdxInDictionary(pDict, pWord) > -1);
}

// Returns whether a word exists.  Checks multiple dictionary arrays.
//
// Parameters:
//  pDicts: An array of arrays of words.  The arrays should be sorted with all words the same
//          letter case as the word being searched for.
//  pWord: The word to look for in the dictionary.  This should be the same
//         letter case as the words in the dictionary.
//
// Return value: Boolean: Whether or not the word exists in the dictionary.
function wordExists_MultipleDictionaries(pDicts, pWord)
{
	var foundWord = false;
	for (var i = 0; (i < pDicts.length) && !foundWord; ++i)
		foundWord = wordExists(pDicts[i], pWord);
	return foundWord;
}

// Parses the dictionary configuration line (from the SlyEdit configuration
// file or user settings file).
//
// Parameters:
//  pDictionarySpec: A comma-separated list of dictionary filenames
//  pDefaultPath: The default directory (must have a trailing separator character)
//
// Return value: An array of fully-pathed dictionary filenames
function parseDictionaryConfig(pDictionarySpec, pDefaultPath)
{
	var dictionaryFilenames = [];
	var dictionaryNames = pDictionarySpec.split(",");
	for (var i = 0; i < dictionaryNames.length; ++i)
	{
		// Allow dictionary filenames as either dictionary_<language>
		// or just <language> (where <language> is a language name.
		// If it doesn't start with "dictionary_", then prepend that.
		// If it doesn't end in a .txt, then append ".txt".
		var filename = dictionaryNames[i];
		if (!/^dictionary_/.test(filename))
			filename = "dictionary_" + filename;
		if (!/\.txt$/.test(filename))
			filename += ".txt";
		filename = genFullPathCfgFilename(filename, pDefaultPath);
		// If the file exists, add the filename to the configuration.
		if (file_exists(filename))
			dictionaryFilenames.push(filename);
	}
	return dictionaryFilenames;
}

// Gets the name of a language from a dictionary filename
//
// Parameters:
//  pFilenameFullPath: The full path & filename to a dictionary file
//
// Return value: The language name from the dictionary file
function getLanguageNameFromDictFilename(pFilenameFullPath)
{
	var justFilename = file_getname(pFilenameFullPath);
	var languageName = "";
	var dotIdx = justFilename.indexOf(".");
	if (dotIdx > -1)
		languageName = justFilename.substr(11, dotIdx-11);
	else
		languageName = justFilename.substr(11);
	// Figure out the language name from common standard localization tags
	var languageNameLower = languageName.toLowerCase();
	var isSupplemental = false;
	if (/[a-z]{2}-[a-z]{2}-supplemental/.test(languageNameLower))
	{
		isSupplemental = true;
		languageNameLower = languageNameLower.substr(0, 5);
	}
	var lower_n_tilde = ascii(164);
	var lower_e_forward_accent = ascii(130);
	if (languageNameLower == "en")
		languageName = "English (General)";
	else if (languageNameLower == "fr")
		languageName = "French (General)";
	else if (languageNameLower == "es")
		languageName = "Espa" + lower_n_tilde + "ol (General)";
	else if (languageNameLower == "pt")
		languageName = "Portug" + lower_e_forward_accent + "s (General)";
	else if (languageNameLower == "de")
		languageName = "Deutsch (General)";
	else if (languageNameLower == "nl")
		languageName = "Dutch (General)";
	else if (languageNameLower == "it")
		languageName = "Italian (General)";
	else if (languageNameLower == "bn-BD")
		languageName = "Bangla (Bangladesh)";
	else if (languageNameLower == "bn-in")
		languageName = "Bangla (India)";
	else if (languageNameLower == "nl-be")
		languageName = "Dutch (Belgium)";
	else if (languageNameLower == "nl-nl")
		languageName = "Dutch (Netherlands)";
	else if (languageNameLower == "en-gb")
		languageName = "English (UK)";
	else if (languageNameLower == "en-us")
		languageName = "English (US)";
	else if (languageNameLower == "en-ca")
		languageName = "English (CA)";
	else if (languageNameLower == "en-in")
		languageName = "English (India)";
	else if (languageNameLower == "en-au")
		languageName = "English (AU)";
	else if (languageNameLower == "en-nz")
		languageName = "English (NZ)";
	else if (languageNameLower == "fr-be")
		languageName = "French (Belgium)";
	else if (languageNameLower == "fr-ch")
		languageName = "French (Switzerland)";
	else if (languageNameLower == "fr-fr")
		languageName = "French (France)";
	else if (languageNameLower == "fr-ca")
		languageName = "French (CA)";
	else if (languageNameLower == "de-at")
		languageName = "Deutsch (Austria)";
	else if (languageNameLower == "de-de")
		languageName = "Deutsch (Deutschland)";
	else if (languageNameLower == "de-ch")
		languageName = "Deutsch (Schweiz)";
	else if (languageNameLower == "it-ch")
		languageName = "Italian (Switzerland)";
	else if (languageNameLower == "it-it")
		languageName = "Italian (Italy)";
	else if (languageNameLower == "pt-pt")
		languageName = "Portug" + lower_e_forward_accent + "s (Portugal)";
	else if (languageNameLower == "pt-br")
		languageName = "Portug" + lower_e_forward_accent + "s (BR)";
	else if (languageNameLower == "es-es")
		languageName = "Espa" + lower_n_tilde + "ol (Espa" + lower_n_tilde + "a)";
	else if (languageNameLower == "es-co")
		languageName = "Espa" + lower_n_tilde + "ol (CO)";
	else if (languageNameLower == "es-cl")
		languageName = "Espa" + lower_n_tilde + "ol (CL)";
	else if (languageNameLower == "es-us")
		languageName = "Espa" + lower_n_tilde + "ol (US)";
	else if (languageNameLower == "es-005")
		languageName = "Espa" + lower_n_tilde + "ol (South America)";
	else if (languageNameLower == "zh-cn")
		languageName = "Chinese (China)";
	else if (languageNameLower == "zh-tw")
		languageName = "Chinese (Taiwan)";
	else if (languageNameLower == "zh-hk")
		languageName = "Chinese (Hong Kong)";
	else if (languageNameLower == "zh-Hans")
		languageName = "Chinese (Simplified)";
	else if (languageNameLower == "zh-Hans-cn")
		languageName = "Chinese (Simplified) (China)";
	else if (languageNameLower == "ta-in")
		languageName = "Tamil (India)";
	else if (languageNameLower == "ta-lk")
		languageName = "Tamil (Sri Lanka)";
	else if (languageNameLower == "af-za")
		languageName = "Afrikaans (ZA)";
	// TODO: Add more language tags
	// http://www.lingoes.net/en/translator/langcode.htm
	else // Default to capitalized first letter & lowercase remainder
		languageName = languageName.substr(0, 1).toUpperCase() + languageName.substr(1).toLowerCase();

	if (isSupplemental)
		languageName += " (Supplemental)";

	return languageName;
}
// Function for sorting an array of objects containing a language name and dictionary filename
function languageNameDictFilenameSort(a, b)
{
	var retVal = 0;
	var generalWithSameLanguageNames = false;
	var genRegex = /^(.*) \(General\)$/;
	var matches1 = a.name.match(genRegex);
	var matches2 = b.name.match(genRegex);
	if ((matches1 != null) || (matches2 != null))
	{
		// Get the language names without the part in paranthesis
		var language1Name = (matches1 != null ? matches1[1] : a.name.substr(0, a.name.indexOf("(")-1));
		var language2Name = (matches2 != null ? matches2[1] : b.name.substr(0, b.name.indexOf("(")-1));
		// If the language names are the same, sort the (General) one before the others.
		if (language1Name == language2Name)
		{
			generalWithSameLanguageNames = true;
			if (matches1 != null)
				retVal = -1;
			else
				retVal = 1;
		}
	}
	if (!generalWithSameLanguageNames)
	{
		if (a.name < b.name)
			retVal = -1;
		else if (a.name > b.name)
			retVal = 1;
		// retVal will remain 0 if the names are equal
	}
	return retVal;
}

// Returns whether a language is selected in the user's settings
//
// Parameters:
//  pUserSettings: The user's settings object
//  pFilenameFullPath: The full path & filename of a dictionary file
//
// Return value: Boolean - Whether or not the language is enabled in the user's settings
function languageIsSelectedInUserSettings(pUserSettings, pFilenameFullPath)
{
	var dictionarySelected = false;
	for (var i = 0; (i < pUserSettings.dictionaryFilenames.length) && !dictionarySelected; ++i)
		dictionarySelected = (pFilenameFullPath == pUserSettings.dictionaryFilenames[i]);
	return dictionarySelected;
}

// Shortens a string, accounting for control/attribute codes.  Returns a new
// (shortened) copy of the string.
//
// Parameters:
//  pStr: The string to shorten
//  pNewLength: The new (shorter) length of the string
//  pFromLeft: Optional boolean - Whether to start from the left (default) or
//             from the right.  Defaults to true.
//
// Return value: The shortened version of the string
function shortenStrWithAttrCodes(pStr, pNewLength, pFromLeft)
{
	if (typeof(pStr) != "string")
		return "";
	if (typeof(pNewLength) != "number")
		return pStr;
	if (pNewLength >= console.strlen(pStr))
		return pStr;

	var fromLeft = (typeof(pFromLeft) == "boolean" ? pFromLeft : true);
	var strCopy = "";
	var tmpStr = "";
	var strIdx = 0;
	var lengthGood = true;
	if (fromLeft)
	{
		while (lengthGood && (strIdx < pStr.length))
		{
			tmpStr = strCopy + pStr.charAt(strIdx++);
			if (console.strlen(tmpStr) <= pNewLength)
				strCopy = tmpStr;
			else
				lengthGood = false;
		}
	}
	else
	{
		strIdx = pStr.length - 1;
		while (lengthGood && (strIdx >= 0))
		{
			tmpStr = pStr.charAt(strIdx--) + strCopy;
			if (console.strlen(tmpStr) <= pNewLength)
				strCopy = tmpStr;
			else
				lengthGood = false;
		}
	}
	return strCopy;
}

// Returns a string with text centered in a certain width.
//
// Paramters:
//  pWidth: The width to center the text in
//  pText: The text to center in the width
//
// Return value: A string pWidth wide with the text centered in the width
function centeredText(pWidth, pText)
{
	var givenText = pText;
	var textLen = strip_ctrl(givenText).length;
	if (textLen > pWidth)
	{
		givenText = shortenStrWithAttrCodes(givenText, pWidth);
		textLen = strip_ctrl(givenText).length;
	}
	var textX = Math.floor(pWidth / 2) - Math.floor(textLen/2);
	var textStr = format("%" + textX + "s", "") + givenText;
	var numSpacesRemaining = pWidth - strip_ctrl(textStr).length;
	textStr += format("%" + numSpacesRemaining + "s", "");
	return textStr;
}

// Finds start & end indexes of non-quote blocks in the message lines.
//
// Parameters:
//  pTextLines: The array of message lines
//
// Return value: An array of objects containing the following properties:
//               start: The start index of a non-quote block
//               end: One past the end index of the non-quote block
function findNonQuoteBlockIndexes(pTextLines)
{
	if (typeof(pTextLines) != "object")
		return [];
	if (pTextLines.length == 0)
		return [];
	// Edge case: If there's only one line and if it's a non-quote block, then
	// return an array with an element about it.
	else if (pTextLines.length == 1)
		return (pTextLines[0].isQuoteLine ? [] : [{ start: 0, end: 1}]);

	var nonQuoteBlockIdxes = [];
	var startIdx = 0;
	var lastEndIdx = 0;
	var inQuoteBlock = pTextLines[0].isQuoteLine;
	for (var i = 1; i < pTextLines.length; ++i)
	{
		if (pTextLines[i].isQuoteLine != inQuoteBlock)
		{
			if (pTextLines[i].isQuoteLine)
			{
				nonQuoteBlockIdxes.push({ start: startIdx, end: i });
				lastEndIdx = i;
			}
			else
				startIdx = i;
			inQuoteBlock = pTextLines[i].isQuoteLine;
		}
	}
	// Edge case: If the last line in the array is a non-quote block, then ensure
	// the last non-quote block is added to nonQuoteBlockIdxes
	if (!pTextLines[pTextLines.length-1].isQuoteLine)
		nonQuoteBlockIdxes.push({ start: startIdx, end: pTextLines.length });

	return nonQuoteBlockIdxes;
}

// Finds start & end indexes of quote blocks in the message lines.
//
// Parameters:
//  pTextLines: The array of message lines
//
// Return value: An array of objects containing the following properties:
//               start: The start index of a non-quote block
//               end: One past the end index of the non-quote block
//               prefix: The string prefix for the quote block
function findQuoteBlockIndexes(pTextLines)
{
	if (typeof(pTextLines) != "object")
		return [];
	if (pTextLines.length == 0)
		return [];
	// Edge case: If there's only one line and if it's a quote block, then
	// return an array with an element about it.
	else if (pTextLines.length == 1)
		return (pTextLines[0].isQuoteLine ? [{ start: 0, end: 1}] : []);

	var quoteBlockIdxes = [];
	var startIdx = 0;
	var lastEndIdx = 0;
	var inQuoteBlock = pTextLines[0].isQuoteLine;
	for (var i = 1; i < pTextLines.length; ++i)
	{
		if (pTextLines[i].isQuoteLine != inQuoteBlock)
		{
			if (!pTextLines[i].isQuoteLine)
			{
				quoteBlockIdxes.push({ start: startIdx, end: i });
				lastEndIdx = i;
			}
			else
				startIdx = i;
			inQuoteBlock = pTextLines[i].isQuoteLine;
		}
	}
	// Edge case: If the last line in the array is a quote block, then ensure
	// the last non-quote block is added to quoteBlockIdxes
	if (pTextLines[pTextLines.length-1].isQuoteLine)
		quoteBlockIdxes.push({ start: startIdx, end: pTextLines.length });

	// Find the common prefixes in each quote block
	for (var quoteBlockI = 0; quoteBlockI < quoteBlockIdxes.length; ++quoteBlockI)
	{
		var linePrefix = commonEditLinesPrefix(pTextLines, quoteBlockIdxes[quoteBlockI].start, quoteBlockIdxes[quoteBlockI].end, ">", true);
		quoteBlockIdxes[quoteBlockI].prefix = linePrefix;
	}

	return quoteBlockIdxes;
}

// Finds start & end indexes of quote blocks and non-quote blocks in the message lines.
//
// Parameters:
//  pTextLines: The array of message lines
//
// Return value: An object with the following properties:
//               quoteBlocks: An array of objects containing the following properties:
//                            start: The start index of a quote block
//                            end: One past the end index of the quote block
//                            prefix: The string prefix for the quote block
//               nonQuoteBlocks: An array of objects containing the following properties:
//                               start: The start index of a non-quote block
//                               end: One past the end index of the non-quote block
//               allBlocks: An array of objects containing information about all text
//                          blocks in order, with these properties:
//                          isQuoteBlock: Boolean - Whether or not the block is a quote block
//                          start: The start index of the block
//                          end: One past the end index of the block
function findQuoteAndNonQuoteBlockIndexes(pTextLines)
{
	var retObj = {
		quoteBlocks: findQuoteBlockIndexes(pTextLines),
		nonQuoteBlocks: findNonQuoteBlockIndexes(pTextLines),
		allBlocks: []
	};

	// Go through both the quote and non-quote blocks and populate allBlocks.
	// Then sort allBlocks (by start index, which should be goood enough to sort with).
	for (var i = 0; i < retObj.quoteBlocks.length; ++i)
		retObj.allBlocks.push({ isQuoteBlock: true, start: retObj.quoteBlocks[i].start, end: retObj.quoteBlocks[i].end, prefix: retObj.quoteBlocks[i].prefix });
	for (var i = 0; i < retObj.nonQuoteBlocks.length; ++i)
		retObj.allBlocks.push({ isQuoteBlock: false, start: retObj.nonQuoteBlocks[i].start, end: retObj.nonQuoteBlocks[i].end });
	retObj.allBlocks.sort(function(obj1, obj2) {
		var retVal = 0;
		if (obj1.start < obj2.start)
			retVal = -1;
		else if (obj1.start == obj2.start)
			retVal = 0;
		else if (obj1.start > obj2.start)
			retVal = 1;
		return retVal;
	});

	return retObj;
}

function commonPrefixUtil(pStr1, pStr2)
{
	var result = "";

	var n1 = pStr1.length;
	var n2 = pStr2.length;

	for (var i = 0, j = 0; (i <= n1 - 1) && (j <= n2 - 1); ++i, ++j)
	{
		if (pStr1.charAt(i) != pStr2.charAt(j))
			break;
		else
			result += pStr1.charAt(i);
	}

	return result;
}

function commonPrefix(pStringArr, pLastPrefixChar, lastCharShouldBeSpace)
{
	if (pStringArr.length == 0)
		return "";

	var prefix = pStringArr[0];
	for (var i = 1; i < pStringArr.length; ++i)
		prefix = commonPrefixUtil(prefix, pStringArr[i]);

	if (typeof(pLastPrefixChar) == "string")
	{
		var idx = prefix.lastIndexOf(pLastPrefixChar);
		if (idx > -1)
			prefix = prefix.substr(0, idx+1);
	}

	if ((prefix.length > 0) && lastCharShouldBeSpace)
	{
		if (prefix.charAt(prefix.length-1) != " ")
			prefix += " ";
	}

	return prefix;
}

function commonEditLinesPrefix(pEditLines, pStartIdx, pEndIdx, pLastPrefixChar, lastCharShouldBeSpace)
{
	if (pEditLines.length == 0)
		return "";

	if ((pStartIdx < 0) || (pStartIdx >= pEditLines.length) || (pEndIdx < 0) || (pEndIdx >= pEditLines.length))
		return "";

	// Look for the first non-blank line and set that as the prefix
	var prefix = "";
	for (var i = pStartIdx; (i < pEndIdx) && (prefix.length == 0); ++i)
	{
		if (pEditLines[i].text.length > 0)
			prefix = pEditLines[i].text;
	}
	for (var i = pStartIdx+1; i < pEndIdx; ++i)
	{
		if (pEditLines[i].text.length > 0)
			prefix = commonPrefixUtil(prefix, pEditLines[i].text);
	}

	if (typeof(pLastPrefixChar) == "string")
	{
		var idx = prefix.lastIndexOf(pLastPrefixChar);
		if (idx > -1)
			prefix = prefix.substr(0, idx+1);
	}

	if ((prefix.length > 0) && lastCharShouldBeSpace)
	{
		if (prefix.charAt(prefix.length-1) != " ")
			prefix += " ";
	}

	return prefix;
}

// Separates a text string and any Synchronet attributes in the string.
//
// Parameters:
//  pStr: A string, which might contain Synchronet attributes
//
// Return value: An object containing the following properties:
//               textWithoutAttrs: The string without any attribute codes
//               attrs: An object where the properties are indexes in pStr where Synchronet
//                      attributes exist, and the values are the Synchronet attribute codes at the index
function sepStringAndAttrCodes(pStr)
{
	var retObj = {
		textWithoutAttrs: "",
		attrs: {}
	};

	if (typeof(pStr) !== "string" || pStr.length == 0)
		return retObj;

	retObj.textWithoutAttrs = strip_ctrl(pStr);
	var attrRegex = /(\x01[krgybmcwhifn\-_01234567])+/ig;
	var match = attrRegex.exec(pStr);
	while (match !== null)
	{
		var startTextIdx = +(match.index);
		retObj.attrs[startTextIdx] = match[0];
		match = attrRegex.exec(pStr);
	}
	return retObj;
}

// Finds the index of the first screen-printable character in a string, excluding Synchronet attribute codes.
//
// Parameters:
//  pStr: The string to check
//
// Return value: The index of the first screen-printable character in the string, or -1 if none is found.
function findFirstPrintableChar(pStr)
{
	var firstPrintableIdx = -1;
	var attrRegex = /(\x01[krgybmcwhifn\-_01234567])+/ig;
	var match = attrRegex.exec(pStr);
	if (match !== null)
	{
		if (+(match.index) == 0)
		{
			firstPrintableIdx = attrRegex.lastIndex;
			if (firstPrintableIdx >= pStr.length)
				firstPrintableIdx = -1;
		}
		else
			firstPrintableIdx = 0;
	}
	else
		firstPrintableIdx = (pStr.length > 0 ? 0 : -1);
	return firstPrintableIdx;
}

// This function displays debug text at a given location on the screen, then
// moves the cursor back to a given location.
//
// Parameters:
//  pDebugX: The X lcoation of where to write the debug text
//  pDebugY: The Y lcoation of where to write the debug text
//  pText: The text to write at the debug location
//  pOriginalPos: An object with x and y properties containing the original cursor position
//  pClearDebugLineFirst: Whether or not to clear the debug line before writing the text
//  pPauseAfter: Can be a boolean (whether or not to pause after displaying the text) or a number (number of milliseconds to wait)
function displayDebugText(pDebugX, pDebugY, pText, pOriginalPos, pClearDebugLineFirst, pPauseAfter)
{
	console.gotoxy(pDebugX, pDebugY);
	if (pClearDebugLineFirst)
		console.clearline();
	// Output the text
	console.print(pText);
	if (typeof(pPauseAfter) === "boolean" && pPauseAfter)
		console.pause();
	else if (typeof(pPauseAfter) === "number" && pPauseAfter > 0)
		mswait(pPauseAfter);
	if ((typeof(pOriginalPos) != "undefined") && (pOriginalPos != null))
		console.gotoxy(pOriginalPos);
}