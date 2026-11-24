# Live Tixati Real-Time Speed & Bandwidth Monitor
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Tixati Live Speed Monitor (MB/s vs Mbps)"

Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "               TIXATI LIVE SPEED & BANDWIDTH MONITOR                  " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Internet Plan Baseline: 30 Mbps (Theoretical Max ~3.75 MB/s)" -ForegroundColor Gray
Write-Host " Press Ctrl+C at any time to exit.`n" -ForegroundColor DarkGray

$tixatiProc = Get-Process -Name tixati -ErrorAction SilentlyContinue
if (-not $tixatiProc) {
    Write-Host "[!] Tixati is not running. Please open Tixati first!" -ForegroundColor Red
    pause
    exit
}

$sampleInterval = 1
$planMbps = 30.0

while ($true) {
    try {
        $sample = Get-Counter -Counter "\Process(tixati)\IO Write Bytes/sec" -SampleInterval $sampleInterval -MaxSamples 1 -ErrorAction SilentlyContinue
        $bytesPerSec = $sample.CounterSamples[0].CookedValue

        # Calculate MB/s and Mbps
        $mbPerSec = [math]::Round(($bytesPerSec / 1MB), 2)
        $mbps = [math]::Round((($bytesPerSec * 8) / 1000000), 2)
        
        # Calculate percentage of 30 Mbps connection
        $percentOfLine = [math]::Min(100, [math]::Round((($mbps / $planMbps) * 100), 1))

        # Check connected TCP peers
        $peersCount = (Get-NetTCPConnection -OwningProcess $tixatiProc.Id -State Established -ErrorAction SilentlyContinue | Measure-Object).Count

        # Progress bar string (25 blocks)
        $blocksFilled = [int][math]::Max(0, [math]::Min(25, [math]::Round(($percentOfLine / 100) * 25)))
        $bar = "[" + ("#" * $blocksFilled) + ("-" * (25 - $blocksFilled)) + "]"

        # Color based on speed
        $color = "Yellow"
        if ($mbps -ge 15.0) { $color = "Green" }
        elseif ($mbps -lt 3.0) { $color = "Red" }

        # Output line
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
        Write-Host "Speed: " -NoNewline -ForegroundColor White
        Write-Host "$mbps Mbps " -NoNewline -ForegroundColor $color
        Write-Host "($mbPerSec MB/s) " -NoNewline -ForegroundColor Cyan
        Write-Host " $bar $percentOfLine% of 30 Mbps " -NoNewline -ForegroundColor White
        Write-Host "| Peers: $peersCount" -ForegroundColor Magenta
    }
    catch {
        Write-Host "[!] Waiting for Tixati activity..." -ForegroundColor DarkYellow
    }
}
