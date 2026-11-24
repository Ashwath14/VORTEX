param([string]$ipList)
$ips = $ipList.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

# Query Windows NetNeighbor cache for actual connection states
$neighborMap = @{}
try {
    $rawNeighbors = Get-NetNeighbor -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.LinkLayerAddress -and $_.LinkLayerAddress -ne '00-00-00-00-00-00' }
    foreach ($n in $rawNeighbors) {
        $stateStr = 'Reachable'
        switch ($n.State) {
            0 { $stateStr = 'Unreachable' }
            1 { $stateStr = 'Incomplete' }
            2 { $stateStr = 'Probe' }
            3 { $stateStr = 'Delay' }
            4 { $stateStr = 'Stale' }
            5 { $stateStr = 'Reachable' }
            6 { $stateStr = 'Permanent' }
            default { $stateStr = 'Reachable' }
        }
        $neighborMap[$n.IPAddress] = @{
            mac = $n.LinkLayerAddress
            state = $stateStr
        }
    }
} catch {}

# Fast parallel ping using .NET Ping and Task.WhenAll
$tasks = foreach ($ip in $ips) {
    [PSCustomObject]@{
        IP = $ip
        Task = (New-Object System.Net.NetworkInformation.Ping).SendPingAsync($ip, 350)
    }
}

$results = foreach ($item in $tasks) {
    $ip = $item.IP
    $rtt = -1
    $status = 'Offline'
    try {
        $reply = $item.Task.GetAwaiter().GetResult()
        if ($reply.Status -eq 'Success') {
            $status = 'Online'
            $rtt = $reply.RoundtripTime
        }
    } catch {}

    $hn = ''
    if ($ip -eq '192.168.29.1') {
        $hn = 'reliance.reliance'
    } elseif ($rtt -ge 0) {
        # Quick non-blocking DNS check
        try {
            $dnsTask = [System.Net.Dns]::GetHostEntryAsync($ip)
            if ($dnsTask.Wait(200)) {
                $hn = $dnsTask.Result.HostName
            }
        } catch {}
    }

    $nInfo = $neighborMap[$ip]
    $connState = if ($rtt -ge 0) { 'Reachable' } elseif ($nInfo) { $nInfo.state } else { 'Stale' }

    [PSCustomObject]@{
        ip = $ip
        status = $status
        rtt = $rtt
        hostname = $hn
        connectionState = $connState
    }
}

$results | ConvertTo-Json -Compress
