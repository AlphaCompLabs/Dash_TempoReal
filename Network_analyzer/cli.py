import argparse

def parse_args():
    ap = argparse.ArgumentParser(
        description="Producer REAL v2: captura com Scapy, agrega por janela e entrega JSON (stdout/arquivo/POST)."
    )
    ap.add_argument("--server-ip", required=False,
                    help="IP do servidor observado (define direção in/out). Recomendado.")
    ap.add_argument("--iface", help="Interface (ex.: 'Ethernet', 'Wi-Fi', 'eth0').")
    ap.add_argument("--interval", type=float, default=5.0, help="Tamanho da janela/intervalo de emissão (s).")
    ap.add_argument("--post", help="URL para POST do JSON (ex.: http://localhost:8000/api/ingest).")
    ap.add_argument("--post-timeout", type=float, default=10.0, help="Timeout do POST (s).")
    ap.add_argument("--post-retries", type=int, default=2, help="Tentativas extras no POST (backoff exponencial).")
    ap.add_argument("--file", help="Salvar JSON em arquivo. Por padrão, sobrescreve a cada janela.")
    ap.add_argument("--file-append", action="store_true", help="Se setado, grava NDJSON (1 JSON por linha).")
    ap.add_argument("--mock", action="store_true", help="Injeta eventos fictícios (útil p/ teste).")
    ap.add_argument("--no-capture", action="store_true", help="Desliga captura (só mock/PCAP).")
    ap.add_argument("--bpf", help="Filtro BPF (ex.: 'host 192.168.1.11 and (tcp port 8080 or icmp)')")
    ap.add_argument("--pcap", help="Ler pacotes de um arquivo .pcap em vez de capturar (para testes).")
    ap.add_argument("--log-level", default="INFO", choices=["DEBUG","INFO","WARNING","ERROR","CRITICAL"],
                    help="Nível de log.")
    ap.add_argument("--log-file", help="Arquivo de log (opcional).")
    ap.add_argument("--max-clients", type=int, default=0,
                    help="Mantém apenas os N clientes com maior tráfego (0 = ilimitado).")
    ap.add_argument("--anon", action="store_true",
                    help="Anonimiza IPs (hash HMAC-SHA1). Usa chave de ANON_KEY envvar ou aleatória.")
    ap.add_argument("--anon-key", help="Chave para HMAC (se não setada, usa ANON_KEY do ambiente ou gera aleatória).")
    return ap.parse_args()