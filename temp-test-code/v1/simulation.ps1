# set working directory to the location of this script
Set-Location -Path $PSScriptRoot  

#region functions
function deno-checks-and-upgrade
{
    $last_deno_ver = "1.4.2"
    $running_deno_ver = -split(deno --version | select-string -Pattern 'deno') | Select -Index 1 

    if (!$?) {  # deno is not installed, or there were problems detecting the version
        write "Deno missing, installing..."
        Invoke-WebRequest https://deno.land/x/install/install.ps1 -UseBasicParsing | Invoke-Expression
    }  
    elseif ([version]$running_deno_ver -lt [version]$last_deno_ver) {
        deno upgrade
    }
}
#endregion functions

deno-checks-and-upgrade

# do other actions
write "do other actions..."


############### EXTRA CODE ONLY TO TEST

Set-Content -Path .\temp.txt -Encoding utf8 -Value 'Hello, World'
Add-Content -Path .\temp.txt -Value 'Hello, World 2'

deno run --allow-read --allow-write https://gist.githubusercontent.com/stefano77it/ed4eb26ede8a35d03daeaa5cd3612615/raw/1e42c26c557675ea974e401a2ea939deb9e0be2b/rw.ts -i ./temp.txt -o ./temp2.txt

write "execution ended"
#Read-Host -Prompt "execution ended, press RETURN to continue";
