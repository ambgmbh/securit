                               Good Time Trivia
                                 Version 1.01
                           Release date: 2022-11-25

                                     by

                                Eric Oulashin
								 AKA Nightfox
                          Sysop of Digital Distortion
                  BBS internet address: digitaldistortionbbs.com
                     Alternate address: digdist.bbsindex.com
                        Email: eric.oulashin@gmail.com



This file describes Good Time Trivia.

Contents
========
1. Disclaimer
2. Introduction
3. Installation & Setup
   - Installation in SCFG
4. Configuration file
5. Optional: Configuring your BBS to host player scores
   - Only do this if you would prefer to host scores on your BBS rather than
     using the inter-BBS scores hosted on Digital Distortion


1. Disclaimer
=============
I cannot guarantee that this script is 100% free of bugs.  However, I have
tested it, and I used it often during development, so I have some confidence
that there are no serious issues with it (at least, none that I have seen).


2. Introduction
===============
Good Time Trivia is a trivia door game written for Synchronet, in JavaScript
(so it will run anywhere Synchronet runs).  Good Time Trivia has a question-
and-answer format and can give the user multiple tries to answer each question,
with clues provided after incorrect answers (the clue will start off with a
totally masked answer, and then reveal one letter at a time for each incorrect
answer given).

Multiple trivia categories are supported, and the user can choose one when
starting the game.  Each category of questions is contained in its own text
file.  If there is only one category, then the game will auto-select that
category when a user enters the game.

Player scores are saved to a file called scores.json in the same directory as
the script.  The scores file is in JSON format.

In the main menu, there will be an extra option for the sysop to clear the high
scores.  This will delete the scores.json file.

This is currently a single-player game, but multiple users on different nodes
can play it simultaneously.

Currently, this trivia game is local to the current BBS only.  In the future,
I think it would be good to add a feature for networked/inter-BBS games.


Answer matching: When a user answers a question, the game can allow non-exact
answer matching in some circumstances, to account for typos and spelling
mistakes.  If the answer is a single word up to 12 characters, the game will
require an exact match for the answer; otherwise, the game will check for a
Levenshtein distance up to 2 in order to determine if the user entered the
correct answer.  The Levenshtein distance checking can be adjusted by changing
the value of the MAX_LEVENSHTEIN_DISTANCE variable in gttrivia.js; however,
increasing it too much would mean allowing wrong answers as correct in some
cases.
For more information on Levenshtein distances:
https://www.cuelogic.com/blog/the-levenshtein-algorithm


3. Installation & Setup
=======================
Aside from readme.txt and revision_history.txt, Good Time Trivia is comprised
of the following files and directories:

1. gttrivia.js            The Good Time Trivia script (this is the script to
                          run)

2. gttrivia.ini           The configuration file (in INI format)

3. gttrivia.asc           The logo/startup screen to be shown to the user.
                          This is in Synchronet attribute code format.

4. install-xtrn.ini       A configuration file for automated installation into
                          Synchronet's external programs section; for use with
						  install-xtrn.js.  This is optional.

5. qa                     This is a subdirectory that contains the trivia
                          question & answer files.  Each file contains a
						  collection of questions, answers, and number of
						  points for each question.  Each filename must have
						  the general format of category_name.qa, where
						  category_name is the name of the category of
						  questions (underscores are required between each
						  word).  The filename extension must be .qa .

6. server                 This directory contains a couple scripts that are
                          used if you enable the gttrivia JSON database (for
						  hosting game scores on a Synchronet BBS so that scores
						  from players on multiple BBSes can be hosted and
						  displayed).  As of this writing, I host scores for
						  Good Time Trivia on my BBS (Digital Distortion), so
						  unless you really want to do your own score hosting,
						  you can have your installation of the game read
						  inter-BBS scores from Digital Distortion.


The trivia category files (in the qa directory, with filenames ending in .qa)
are plain text files and contain questions, their answers, and their number of
points.  For eqch question in a category file, there are 3 lines:
Question
Answer
Number of points

A blank line after each set of 3 lines is optional.  For example, a question
in one of the files might be as follows (this is a simple example):
What color is the sky?
Blue
5

Also, there is a script in the qa directory called converter.js.  This is a
rough script that can be modified to convert a list of trivia questions into
the format that can be used by this door.  It is not a generic script; if you
find a list of questions & answers you might want to add to the game, and you
have some programming knowledge, you could modify this script to convert the
list of questions & answers into the format required by this door.


The configuration file, gttrivia.ini, is a plain text file, in INI format.
There are 2 sections:
[BEHAVIOR] - This section contains behavioral options for the game
[COLORS] - This section specifies colors for various text/items
[CATEGORY_ARS] - This section can specify a lit of trivia categories (filenames
                 without the .qa extension) and an ARS string to restrict
                 access to some trivia categories, if desired


The .js script, .ini file, and qa subdirectory can be placed together in any
directory.  When the game reads the configuration file & theme file, the game
will first look in your sbbs/mods directory, then sbbs/ctrl, then in the same
directory where the .js script is located.  So, if you desire, you could place
gttrivia.js in sbbs/exec and the .ini file sin your sbbs/ctrl directory, for
example.  Note, though, that the qa directory must be in the same directory as
gttrivia.js.


Installation in SCFG
--------------------
This is an example of adding the game in one of your external programs sections
in SCFG (note that the 'Native Executable/Script value doesn't matter for JS
scripts):
╔═════════════════════════════════════════════════════[< >]╗
║                     Good Time Trivia                     ║
╠══════════════════════════════════════════════════════════╣
║ │Name                       Good Time Trivia             ║
║ │Internal Code              GTTRIVIA                     ║
║ │Start-up Directory         ../xtrn/gttrivia             ║
║ │Command Line               ?gttrivia.js                 ║
║ │Clean-up Command Line                                   ║
║ │Execution Cost             None                         ║
║ │Access Requirements                                     ║
║ │Execution Requirements                                  ║
║ │Multiple Concurrent Users  Yes                          ║
║ │I/O Method                 FOSSIL or UART               ║
║ │Native Executable/Script   Yes                          ║
║ │Use Shell or New Context   No                           ║
║ │Modify User Data           No                           ║
║ │Execute on Event           No                           ║
║ │Pause After Execution      No                           ║
║ │Disable Local Display      No                           ║
║ │BBS Drop File Type         None                         ║
╚══════════════════════════════════════════════════════════╝



4. Configuration File
=====================
gttrivia.ini is the configuration file for the door game.  There are 3 sections:
[BEHAVIOR], [COLORS], and [CATEGORY_ARS].  The settings are described below:

[BEHAVIOR] section
------------------
Setting                           Description
-------                           -----------
numQuestionsPerPlay               The maximum number of trivia questions
                                  allowed each time a user plays a game

numTriesPerQuestion               The maximum number of times a user is
                                  allowed to try to answer a question. After
                                  the user gives a wrong answer the first
                                  time, Good Time Trivia will start
                                  showing clues.

maxNumPlayerScoresToDisplay       The maximum number of player scores to display
                                  in the list of high scores

[COLORS] section
----------------
In this section, the color codes are simply specified by a string of color
(attribute) code characters (i.e., YH for yellow and high).  See this page for
Synchronet attribute codes:
http://wiki.synchro.net/custom:ctrl-a_codes

Setting                           Element applied to
-------                           -------------------
error                             Errors
triviaCategoryHdr                 Text for the trivia category
triviaCategoryListNumbers         Text for the numbers in the category list
triviaCategoryListSeparator       Separator text after the numbers in the
                                  category list
triviaCategoryName                Category names in the category list
categoryNumPrompt                 Prompt text for the trivia category number
                                  input
categoryNumPromptSeparator        Separator text after the prompt for the
                                  category number input
categoryNumInput                  User input for the category number
questionHdr                       Header text for the trivia questions
questionHdrNum                    Numbers in the trivia question header text
question                          Trivia question
answerPrompt                      Prompt text for trivia answers
answerPromptSep                   Separator text in trivia answer prompt
answerInput                       User input for trivia answers
userScore                         Outputted user score
scoreSoFarText                    "Your score so far" text
clueHdr                           Header text for clues
clue                              Clue text
answerAfterIncorrect              The answer printed after incorrect response

[CATEGORY_ARS] section
----------------------
In this section, the format is section_name=ARS string
section_name must match the part of a filename in the qa directory without the
filename extension.  The ARS string is a string that Synchronet uses to describe
access requirement(s).  The ARS strings in this section can be used to set up
access requirements for certain trivia categories (i.e., if there are any
categories that you may want age-restricted, for instance).  See the following
web page for documentation on Synchronet's ARS strings:
http://wiki.synchro.net/access:requirements

[REMOTE_SERVER] section
-----------------------
This section is used for specifying a remote server to connect to.  Currently,
this is used for writing & reading player scores on the remote system.  Inter-
BBS scores (retrieved from the remote system) can be optionally viewed when a
user is viewing scores.

Setting                           Description
-------                           -----------
server                            The server hostname/IP address.  The default
                                  value can be used if you want to use Digital
								  Distortion BBS.

port                              The port number to use to connect to the
                                  remote host.  The default value is set for
								  Digital Distortion.

[SERVER] section
----------------
This section is only used if you decide to host scores for Good Time Trivia.

Setting                           Description
-------                           -----------
deleteScoresOlderThanDays         The number of days to keep old player scores.
                                  The background service will remove player
								  scores older than this number of days.


5. Optional: Configuring your BBS to host player scores
=======================================================
You should only do this if you would prefer to host scores on your BBS rather
than using the inter-BBS scores hosted on Digital Distortion.

If you want to host player scores for Good Time Trivia, first ensure you have a
section in your ctrl/services.ini configured to run json-service.js (usually
with a name of JSON, or JSON in the name):

[JSON]
Port=10088
Options=STATIC | LOOP
Command=json-service.js

Note that those settings configure it to run on port 10088.  Also, you might
already have a similar section in your services.ini if you currently host any
JSON databases.

Then, open your ctrl/json-service.ini and add these lines to enable the gttrivia
JSON dtaabase:

[gttrivia]
dir=../xtrn/gttrivia/server/

It would then probably be a good idea to stop and re-start your Synchronet BBS
in order for it to recognize that you have a new JSON database configured.