python .\sink.py --port 8000 --ingest-path /api/ingest --current-path /api/current
python .\run.py --server-ip 192.168.1.11 --iface "Ethernet 2" --interval 5 --post "http://localhost:8000/api/ingest"

Invoke-WebRequest "http://192.168.1.10:8080" -OutFile $env:TEMP\test.html
>>
>> # Loop pra gerar bastante tráfego:
>> while ($true) {
>>   Invoke-WebRequest "http://192.168.1.11:8080" -OutFile $env:TEMP\test.html | Out-Null
>>   Start-Sleep -Milliseconds 200
>> }


python -m http.server 8080 --bind 0.0.0.0
>> # (opcional) abrir a porta no firewall
>> netsh advfirewall firewall add rule name="Python HTTP 8080" dir=in action=allow protocol=TCP localport=8080

https://npcap.com/ <- necesario para utilizar scapy no windows

