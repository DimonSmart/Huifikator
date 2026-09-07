$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$bump = if ($args.Count -gt 0) { $args[0] } else { "patch" }
if ($bump -notin @("major", "minor", "patch")) {
    throw "Использование: publish-next-version.bat [major|minor|patch]"
}

$package = Get-Content package.json -Raw | ConvertFrom-Json
$parts = $package.version.Split('.') | ForEach-Object { [int]$_ }
switch ($bump) {
    "major" { $parts[0]++; $parts[1] = 0; $parts[2] = 0 }
    "minor" { $parts[1]++; $parts[2] = 0 }
    "patch" { $parts[2]++ }
}
$version = "$($parts[0]).$($parts[1]).$($parts[2])"
$tag = "v$version"

if (git tag --list $tag) { throw "Тэг $tag уже существует." }

$package.version = $version
$package | ConvertTo-Json -Depth 10 | Set-Content package.json -Encoding utf8
$manifest = Get-Content extension/manifest.json -Raw | ConvertFrom-Json
$manifest.version = $version
$manifest | ConvertTo-Json -Depth 10 | Set-Content extension/manifest.json -Encoding utf8

npm install --package-lock-only --ignore-scripts
git add package.json package-lock.json extension/manifest.json
git commit -m "chore: release $version"
git tag -a $tag -m "Release $version"
git push origin HEAD $tag

Write-Host "Опубликован $tag. GitHub Actions соберёт ZIP и создаст Release."
