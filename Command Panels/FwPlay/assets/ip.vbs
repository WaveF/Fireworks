Dim ip
GetIP
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FolderExists("C:\fwplay") Then
fso.CreateFolder("C:\fwplay")
End If
Set file = fso.CreateTextFile("C:\fwplay\winip.txt", true)
file.Write ip
file.Close
Public Function GetIP
ComputerName="."
Dim objWMIService,colItems,objItem,objAddress
Set objWMIService = GetObject("winmgmts:\\" & ComputerName & "\root\cimv2")
Set colItems = objWMIService.ExecQuery("Select * From Win32_NetworkAdapterConfiguration Where IPEnabled = True")
For Each objItem in colItems
For Each objAddress in objItem.IPAddress
If objAddress <> "" then
ip = objAddress
Exit Function
End If
Next
Next
End Function