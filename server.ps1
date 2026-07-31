$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -ExpandProperty IPAddress

Write-Host "========================================"
Write-Host "  Family Ledger Server"
Write-Host "========================================"
Write-Host ""
Write-Host "IP Addresses:"
foreach ($ip in $ipAddresses) { Write-Host "  $ip" }
Write-Host ""

# Try binding to all interfaces first, fallback to localhost
$listener = New-Object System.Net.HttpListener

try {
    $listener.Prefixes.Add("http://+:8080/")
    $listener.Start()
    Write-Host "Server started on all interfaces!"
    Write-Host ""
    Write-Host "Phone access URL:"
    foreach ($ip in $ipAddresses) {
        Write-Host "   http://${ip}:8080"
    }
} catch {
    Write-Host "Admin privilege not available, trying localhost only..."
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:8080/")
    $listener.Start()
    Write-Host "Server started on localhost only!"
    Write-Host "Phone can NOT access, use PC browser: http://localhost:8080"
}

Write-Host ""
Write-Host "Press Ctrl+C to stop..."

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    
    $filePath = Join-Path $PSScriptRoot $localPath.TrimStart("/")
    
    if (Test-Path $filePath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        switch ($ext) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css" { $response.ContentType = "text/css; charset=utf-8" }
            ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
            ".json" { $response.ContentType = "application/json; charset=utf-8" }
            default { $response.ContentType = "application/octet-stream" }
        }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
