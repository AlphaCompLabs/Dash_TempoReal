from fastapi import FastAPI, HTTPException
from fastapi.responses import ORJSONResponse
from .models import HealthStatus, ConfigIn
from .aggregator import SlidingAggregator
from .config import Settings
from datetime import datetime, timezone
import logging

def create_app(settings: Settings, capturer, aggregator: SlidingAggregator) -> FastAPI:
    app = FastAPI(title="Network Capture API", default_response_class=ORJSONResponse)
    log = logging.getLogger("api")

    @app.get("/health", response_model=HealthStatus)
    def health():
        return HealthStatus(
            status="ok",
            iface=settings.iface,
            server_ip=str(settings.server_ip),
            window_seconds=settings.window_seconds,
            queue_len=0,
            capturing=True
        )

    @app.get("/config")
    def get_config():
        return settings.model_dump()

    @app.post("/config")
    def set_config(cfg: ConfigIn):
        # Nesta versão simples, apenas loga; reinicialização “quente” pode ser implementada
        log.info("Config requisitada (requer restart manual): %s", cfg.model_dump())
        return {"detail": "Config recebida. Reinicie o serviço para aplicar."}

    @app.get("/metrics/live")
    def metrics_live(n: int = 3):
        n = max(1, min(n, 60))
        return [s.model_dump() for s in aggregator.last_n_summaries(n)]

    @app.get("/metrics/window")
    def metrics_in_window(window_start_epoch: int):
        s = aggregator.window_summary(window_start_epoch)
        if not s:
            raise HTTPException(404, "Janela não encontrada")
        return s.model_dump()

    @app.get("/metrics/window/{window_start_epoch}/client/{client_ip}/direction/{direction}/protocols")
    def client_protocols(window_start_epoch: int, client_ip: str, direction: str):
        direction = direction.lower()
        if direction not in ("in", "out"):
            raise HTTPException(400, "direction deve ser 'in' ou 'out'")
        pb = aggregator.client_proto_breakdown(window_start_epoch, client_ip, direction)  # type: ignore
        return pb.model_dump()

    @app.get("/server-time")
    def server_time():
        now = datetime.now(timezone.utc)
        return {"utc": now.isoformat(), "epoch": int(now.timestamp())}

    return app
