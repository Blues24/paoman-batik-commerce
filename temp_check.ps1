Get-ChildItem frontend/css -Filter *.css | ForEach-Object {
    $f = $_.Name
    $found = Select-String -Pattern [regex]::Escape($f) -Path frontend/src/**/*.html,frontend/src/**/*.js -SimpleMatch -Quiet
    if ($found) { Write-Output "USED:$f" } else { Write-Output "UNUSED:$f" }
}
