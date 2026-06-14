param(
  [Parameter(Mandatory = $true)]
  [string]$ExecutablePath
)

$ErrorActionPreference = "SilentlyContinue"
$regRoot = "HKCU:\Control Panel\NotifyIconSettings"

if (-not (Test-Path $regRoot)) {
  exit 0
}

$target = [System.IO.Path]::GetFullPath($ExecutablePath)
$promoted = 0

Get-ChildItem $regRoot | ForEach-Object {
  $props = Get-ItemProperty -Path $_.PSPath
  $entryPath = [string]$props.ExecutablePath

  if (-not $entryPath) {
    return
  }

  try {
    $entryFullPath = [System.IO.Path]::GetFullPath($entryPath)
  }
  catch {
    return
  }

  if ($entryFullPath -ieq $target) {
    Set-ItemProperty -Path $_.PSPath -Name IsPromoted -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $_.PSPath -Name Enabled -Value 1 -Type DWord -Force
    $promoted = 1
  }
}

Write-Output $promoted
