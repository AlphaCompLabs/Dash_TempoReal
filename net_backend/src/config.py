from pydantic import BaseModel, Field, IPvAnyAddress, PositiveInt
from typing import Optional
import os

DEFAULT_WINDOW_SECONDS = 5

class Settings(BaseModel):
    server_ip: IPvAnyAddress = Field(..., description="IP do servidor-alvo espelhado no switch.")
    iface: str = Field(..., description="Interface de captura (ex: eth0, en0, Wi-Fi).")
    window_seconds: PositiveInt = Field(DEFAULT_WINDOW_SECONDS, description="Tamanho da janela de agregação.")
    bpf_extra: Optional[str] = Field(None, description="Filtro BPF adicional (opcional).")
    enable_promisc: bool = Field(True, description="Modo promíscuo.")
    max_queued_packets: int = Field(200_000, description="Métrica de backpressure (fila interna).")
    log_level: str = Field("INFO", description="DEBUG|INFO|WARNING|ERROR")

def load_settings_from_env() -> Settings:
    # Variáveis de ambiente prevalecem; caia em defaults sensatos
    server_ip = os.getenv("SERVER_IP", None)
    iface = os.getenv("IFACE", None)
    window_seconds = int(os.getenv("WINDOW_SECONDS", DEFAULT_WINDOW_SECONDS))
    bpf_extra = os.getenv("BPF_EXTRA", None)
    enable_promisc = os.getenv("ENABLE_PROMISC", "true").lower() in ("1", "true", "yes")
    max_queued_packets = int(os.getenv("MAX_QUEUED_PACKETS", "200000"))
    log_level = os.getenv("LOG_LEVEL", "INFO")

    if not server_ip or not iface:
        raise ValueError("SERVER_IP e IFACE são obrigatórios.")

    return Settings(
        server_ip=server_ip,
        iface=iface,
        window_seconds=window_seconds,
        bpf_extra=bpf_extra,
        enable_promisc=enable_promisc,
        max_queued_packets=max_queued_packets,
        log_level=log_level,
    )