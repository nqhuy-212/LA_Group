import importlib


def test_docs_disabled_in_prod(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    monkeypatch.setenv("JWT_SECRET_KEY", "mot-secret-that-du-dai-cho-production-2026")
    monkeypatch.setenv("CORS_ORIGINS", '["https://lahr.vn"]')

    import app.core.config as config_module
    import app.main as main_module

    try:
        importlib.reload(config_module)
        importlib.reload(main_module)

        from starlette.testclient import TestClient

        with TestClient(main_module.app, base_url="https://testserver") as prod_client:
            assert prod_client.get("/docs").status_code == 404
            assert prod_client.get("/redoc").status_code == 404
            assert prod_client.get("/openapi.json").status_code == 404
    finally:
        monkeypatch.undo()
        importlib.reload(config_module)
        importlib.reload(main_module)


def test_docs_enabled_in_dev():
    from starlette.testclient import TestClient

    from app.main import app

    with TestClient(app, base_url="https://testserver") as dev_client:
        assert dev_client.get("/docs").status_code == 200
