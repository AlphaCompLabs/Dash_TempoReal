import logging, sys, os
from .config import load_settings_from_env
from .aggregator import SlidingAggregator
from .capture_service import CaptureService
from .api import create_app
import uvicorn

def setup_logging(level: str):
    root = logging.getLogger()
    root.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
    handler.setFormatter(fmt)
    root.handlers.clear()
    root.addHandler(handler)

def run():
    settings = load_settings_from_env()
    setup_logging(settings.log_level)

    aggregator = SlidingAggregator(window_seconds=settings.window_seconds)
    capturer = CaptureService(settings, aggregator)
    capturer.start()

    app = create_app(settings, capturer, aggregator)
    # Uvicorn roda a API; captura segue em thread
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

if __name__ == "__main__":
    run()
