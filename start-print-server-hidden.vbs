' Launches the print server silently in the background (no console window).
' Used by the Windows Startup shortcut for auto-start on login.
' Uses full paths so it does not depend on PATH being set at login time.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Folder where this script lives (the project folder)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Full path to Node and to the server script
nodeExe = "C:\Program Files\nodejs\node.exe"
serverScript = scriptDir & "\print-server.js"
logFile = scriptDir & "\print-server-startup.log"

' Build the command: run node with full paths, capture output to a log file.
' cmd /c stays hidden because we pass window style 0 below.
cmdLine = "cmd /c """"" & nodeExe & """ """ & serverScript & """ > """ & logFile & """ 2>&1"""

' 0 = hidden window, False = do not wait
WshShell.Run cmdLine, 0, False

Set WshShell = Nothing
Set fso = Nothing
