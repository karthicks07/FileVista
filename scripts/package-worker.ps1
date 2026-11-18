
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

$workerSource = Join-Path $projectRoot "node_modules\pdfjs-dist\build\pdf.worker.min.mjs"

$mpkDirectory = Join-Path $projectRoot "dist"

if (!(Test-Path $workerSource)) {
    throw "PDF.js worker not found: $workerSource"
}

$mpk = Get-ChildItem $mpkDirectory -Recurse -Filter "*.mpk" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (!$mpk) {
    throw "Generated MPK file was not found."
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = [System.IO.Compression.ZipFile]::Open(
    $mpk.FullName,
    [System.IO.Compression.ZipArchiveMode]::Update
)

try {
    $entryName = "rapiddata/filevista/assets/pdf.worker.min.mjs"

    # Remove an existing worker entry before replacing it.
    $existingEntry = $archive.GetEntry($entryName)

    if ($existingEntry) {
        $existingEntry.Delete()
    }

    # Add the worker to the MPK.
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $archive,
        $workerSource,
        $entryName,
        [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null

    Write-Host "PDF.js worker added successfully." -ForegroundColor Green
    Write-Host "MPK: $($mpk.FullName)"
}
finally {
    $archive.Dispose()
}

Write-Host "Worker packaging completed."
