# set working directory to the location of this script
Set-Location -Path $PSScriptRoot  

#region JS scripts
$JS_asciiart=@"
// run with `deno run THIS.ts -o "output message"`
import { parse } from "https://deno.land/std/flags/mod.ts";
import { text } from 'https://x.nest.land/deno-figlet@0.0.5/mod.js';
const args = parse(Deno.args);
console.log(await text(args.o, "big"));
"@
#endregion JS scripts

#region functions
function test-and-update-deno {
    $last_deno_ver = "1.4.2"
    $running_deno_ver = -split (deno --version | select-string -Pattern 'deno') | Select -Index 1 

    if (!$?) {
        # deno is not installed, or there were problems detecting the version
        Write-Output "Deno missing, installing..."
        Invoke-WebRequest https://deno.land/x/install/install.ps1 -UseBasicParsing | Invoke-Expression
    }  
    elseif ([version]$running_deno_ver -lt [version]$last_deno_ver) {
        deno upgrade
    }
}
#endregion functions

test-and-update-deno

# do other actions
Write-Output "do other actions..."


############### EXTRA CODE ONLY TO TEST

#region dummy actions, to remove later
$fileA = ".\temp.txt"  # slash or backslash is the same
$fileB = "./temp2.txt"  # slash or backslash is the same
#endregion dummy actions, to remove later

$successFile = "./ps1.success.txt"
$warningFile = "./ps1.warning.txt"
$errorFile = "./ps1.error.txt"

Remove-Item $fileA -ErrorAction Ignore
Remove-Item $fileB -ErrorAction Ignore
Remove-Item $successFile -ErrorAction Ignore
Remove-Item $warningFile -ErrorAction Ignore
Remove-Item $errorFile -ErrorAction Ignore

Set-Content -Path $fileA -Encoding utf8 -Value 'Hello, World'  # create $fileA and put some text inside
Add-Content -Path $fileA -Value 'Hello, World 2'  # append text to $fileA

deno run --allow-read --allow-write https://raw.githubusercontent.com/stefano77it/financial-modeling/master/temp-test-code/v1/zTempSomeCodeOnlyToTestACallToRemoteDenoCode.ts -i $fileA -o $fileB

if ((Get-FileHash $fileA).hash -eq (Get-FileHash $fileB).hash) {
    Write-Output $JS_asciiart | deno run --allow-net - -o "Success!"
    Write-Output $JS_asciiart | deno run --allow-net - -o "Success!" | Set-Content -Path $successFile -Encoding utf8 
}
else {
    Write-Output $JS_asciiart | deno run --allow-net - -o "Execution error!"
    Write-Output $JS_asciiart | deno run --allow-net - -o "Execution error!" | Set-Content -Path $errorFile -Encoding utf8 
}

if (Test-Path $errorFile) { if ((Get-Item $errorFile).length -eq 0) { Remove-Item $errorFile -ErrorAction Ignore } }  #remove file if empty
if (Test-Path $warningFile) { if ((Get-Item $warningFile).length -eq 0) { Remove-Item $warningFile -ErrorAction Ignore } }  #remove file if empty

#Read-Host -Prompt "execution ended, press RETURN to continue";
