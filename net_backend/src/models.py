from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Dict, Literal, List
from datetime import datetime

Direction = Literal["in", "out"]

class ProtoBreakdown(BaseModel):
    # bytes por protocolo normalizado (HTTP/HTTPS/FTP/DNS/ICMP/Other-TCP/Other-UDP/Other)
    by_proto: Dict[str, int] = Field(default_factory=dict)

class ClientWindowStats(BaseModel):
    window_start: datetime
    window_end: datetime
    client_ip: IPvAnyAddress
    direction: Direction
    bytes: int
    proto: ProtoBreakdown

class WindowSummary(BaseModel):
    window_start: datetime
    window_end: datetime
    totals_by_client: Dict[str, Dict[Direction, int]]  # {"10.0.0.5": {"in": 123, "out": 456}}
    # opcional: agregados globais
    total_in: int
    total_out: int

class HealthStatus(BaseModel):
    status: Literal["ok"]
    iface: str
    server_ip: str
    window_seconds: int
    queue_len: int
    capturing: bool

class ConfigIn(BaseModel):
    server_ip: str
    iface: str
    window_seconds: int
    bpf_extra: str | None = None
    enable_promisc: bool = True