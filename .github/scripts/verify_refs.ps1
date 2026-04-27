$rootPath = "D:\Anson\Thesis"
Write-Host "Verifying Knowledge Base..."
$indexFile = "$rootPath\docs\knowledge\index.md"
if (Test-Path $indexFile) {
    Get-Content $indexFile | Select-String "\]\(([^)]+)\)" -AllMatches | ForEach-Object {
        $_.Matches | ForEach-Object {
            $link = $_.Groups[1].Value
            if ($link -notmatch "^http") {
                if (-not (Test-Path "$rootPath\$link")) { Write-Warning "Broken: $link" }
            }
        }
    }
}
Write-Host "Done."
