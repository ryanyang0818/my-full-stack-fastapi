from fastapi.testclient import TestClient

from app.core.config import settings


# 確認測試 API 會回傳純字串
def test_read_hello(client: TestClient) -> None:
    response = client.get(f'{settings.API_V1_STR}/test/hello')

    assert response.status_code == 200
    assert response.json() == 'Hello'
