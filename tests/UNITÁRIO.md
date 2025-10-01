======================================================================================= test session starts =======================================================================================
platform win32 -- Python 3.12.10, pytest-8.4.2, pluggy-1.6.0 -- C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API
plugins: anyio-4.10.0
collected 4 items                                                                                                                                                                                  

tests/test_Unitário.py::test_ingest_and_get_traffic_data PASSED                                                                                                                              [ 25%]
tests/test_Unitário.py::test_get_protocol_drilldown_data PASSED                                                                                                                              [ 50%]
tests/test_Unitário.py::test_get_traffic_when_empty PASSED                                                                                                                                   [ 75%]
tests/test_Unitário.py::test_get_protocol_for_nonexistent_client PASSED                                                                                                                      [100%]

======================================================================================== warnings summary =========================================================================================
BackEnd_RESTful\main.py:138
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\BackEnd_RESTful\main.py:138: DeprecationWarning: 
          on_event is deprecated, use lifespan event handlers instead.
  
          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).

    @app.on_event("startup")

servidores_teste\venv\Lib\site-packages\fastapi\applications.py:4495
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Lib\site-packages\fastapi\applications.py:4495: DeprecationWarning:
          on_event is deprecated, use lifespan event handlers instead.

          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).

    return self.router.on_event(event_type)

servidores_teste\venv\Lib\site-packages\_pytest\cacheprovider.py:475
  C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\servidores_teste\venv\Lib\site-packages\_pytest\cacheprovider.py:475: PytestCacheWarning: could not create cache path C:\Users\diogo\OneDrive\Área de Trabalho\Back-End_API\.pytest_cache\v\cache\nodeids: [WinError 5] Acesso negado: 'C:\\Users\\diogo\\OneDrive\\Área de Trabalho\\Back-End_API\\.pytest_cache\\v\\cache'
    config.cache.set("cache/nodeids", sorted(self.cached_nodeids))

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
================================================================================== 4 passed, 3 warnings in 0.48s ==================================================================================