# set working directory to the location of this script
Set-Location -Path $PSScriptRoot  

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

$fileA = ".\temp.txt"  # slash or backslash is the same
$fileB = "./temp2.txt"  # slash or backslash is the same
$successFile = "./ps1.success"
$errorFile = "./ps1.error"

Remove-Item $fileA -ErrorAction Ignore
Remove-Item $fileB -ErrorAction Ignore
Remove-Item $successFile -ErrorAction Ignore
Remove-Item $errorFile -ErrorAction Ignore

Set-Content -Path $fileA -Encoding utf8 -Value 'Hello, World'  # create $fileA and put some text inside
Add-Content -Path $fileA -Value 'Hello, World 2'  # append text to $fileA

deno run --allow-read --allow-write https://raw.githubusercontent.com/stefano77it/financial-modeling/master/temp-test-code/v1/rw.ts -i $fileA -o $fileB

if ((Get-FileHash $fileA).hash -eq (Get-FileHash $fileB).hash) {
    Write-Output "execution ended successfully"
    Set-Content -Path $successFile -Encoding utf8 -Value 'success'
}
else {
    Write-Output "execution ended in error"
    Set-Content -Path $errorFile -Encoding utf8 -Value 'error'
}

# remove `$errorFile` if empty
if (Test-Path $errorFile)
    {
        if ((Get-Item $errorFile).length -eq 0) { Remove-Item $errorFile -ErrorAction Ignore }
    }

# Read-Host -Prompt "execution ended, press RETURN to continue";
