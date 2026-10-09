$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$destination = Join-Path (Split-Path $root -Parent) ('Before-Sending-Demo-transfer-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
$folders = @('src', 'public', 'assets', 'vendor', 'tools')
$files = @('index.html', 'package.json', 'package-lock.json', 'vite.config.mjs', 'start-demo.cmd', 'README.md', 'PROJECT_HANDOFF.md')
$items = @($files | ForEach-Object { Get-Item -LiteralPath (Join-Path $root $_) })
foreach ($folder in $folders) {
    $path = Join-Path $root $folder
    if (Test-Path -LiteralPath $path) { $items += Get-ChildItem -LiteralPath $path -Recurse -File }
}
$stream = [System.IO.File]::Open($destination, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $items) {
        if ($file.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw "Linked file excluded: $($file.FullName)" }
        $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
        if ($relative -match '(^|/)(__pycache__|node_modules)(/|$)') { continue }
        $entry = 'Before-Sending-Demo/' + $relative
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archive.Dispose(); $stream.Dispose() }
$check = [System.IO.Compression.ZipFile]::OpenRead($destination)
try {
    foreach ($required in @('package.json','package-lock.json','src/App.jsx','src/visual-restoration.css','public/assets/administrators/home-original.png','public/assets/writing-desk/paper.png','public/assets/demo-cutouts/drawer-bg.jpg')) {
        if (-not $check.GetEntry('Before-Sending-Demo/' + $required)) { throw "Missing file: $required" }
    }
    Write-Output ("Verified {0} files in migration archive." -f $check.Entries.Count)
} finally { $check.Dispose() }
Get-Item -LiteralPath $destination | Select-Object FullName, Length
