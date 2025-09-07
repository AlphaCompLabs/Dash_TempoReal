import sys
import time
import json
import logging
from typing import Dict, Any, Optional
from urllib import request, error


def emit_json(payload: Dict[str, Any],
              to_file: Optional[str],
              post_url: Optional[str],
              post_timeout: float,
              post_retries: int,
              file_append: bool) -> int:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    # POST (com retries)
    if post_url:
        req = request.Request(post_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        attempt = 0
        backoff = 0.8
        while True:
            try:
                with request.urlopen(req, timeout=post_timeout) as resp:
                    body = resp.read().decode("utf-8", errors="ignore")
                    logging.debug("POST OK: %s", body.strip())
                    break
            except error.HTTPError as e:
                body = e.read().decode("utf-8", errors="ignore")
                logging.error("POST HTTP %s: %s", e.code, body.strip())
                return 1
            except Exception as e:
                if attempt >= post_retries:
                    logging.error("POST ERROR (tentativas esgotadas): %s", e)
                    return 1
                attempt += 1
                sleep_s = backoff * (2 ** (attempt - 1))
                logging.warning("POST falhou (%s). Tentando novamente em %.1fs (%d/%d)...",
                                e, sleep_s, attempt, post_retries)
                time.sleep(sleep_s)

    # Arquivo
    if to_file:
        try:
            mode = "ab" if file_append else "wb"
            with open(to_file, mode) as f:
                f.write(data)
                if file_append:
                    f.write(b"\n")
            if not post_url:
                logging.info("JSON %s em %s", "acrescentado" if file_append else "salvo", to_file)
        except Exception as e:
            logging.error("FILE ERROR: %s", e)
            return 1

    # STDOUT (se nada mais)
    if not post_url and not to_file:
        try:
            sys.stdout.buffer.write(data)
            sys.stdout.write("\n")
            sys.stdout.flush()
        except Exception as e:
            logging.error("STDOUT ERROR: %s", e)
            return 1

    return 0