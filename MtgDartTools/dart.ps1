[CmdletBinding(DefaultParameterSetName = 'None')]
param()
Trace-VstsEnteringInvocation $MyInvocation
try {
    $command = Get-VstsInput -Name command -Require
    $sourcePath = Get-VstsInput -Name sourcePath -Require
    $destinationPath = Get-VstsInput -Name destinationPath

    Write-Host "command: $command"
    Write-Host "Source Path: $sourcePath"
    Write-Host "Destination Path: $destinationPath"

    [string]$exePath = [System.IO.Path]::GetFullPath(".\dart-sdk\bin\pub.bat")
		 
    if(!(Test-Path $exePath)) {
        Throw [System.IO.FileNotFoundException] "DartSDK not found at $exePath"
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $exePath
    $psi.WorkingDirectory = $sourcePath
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $args = "";
    if ($command -eq "get") {
        $args = "get"
    }
    elseif ($command -eq "build") {
        $args = "build --output=$destinationPath"
    }

    $psi.Arguments = $args
    Write-Host "pub $args"

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi

    $isNewProcessStarted = $process.Start() 
    $hasExited = $process.WaitForExit(10 * 60 * 1000) # wait 10 minutes for process to exit
    
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    
    Write-Host "$stdout"
    Write-Host "$stderr" 

    $exitCode = $process.ExitCode
    if ($exitCode -ne 0) 
    {
        throw [System.Exception] "pub $args exited with $exitCode"
    }
} finally {
    Trace-VstsLeavingInvocation $MyInvocation
}
