import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

os.environ.setdefault("APP_AUTH_JWT_SECRET", "unittest-only-secret-with-more-than-32-characters")

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.main import app
from app.routers import ai as ai_router


class _Result:
    def scalar_one_or_none(self):
        return None


class _FakeDb:
    async def execute(self, *_args, **_kwargs):
        return _Result()

    def add(self, _item):
        pass

    async def flush(self):
        pass

    async def commit(self):
        pass


async def _db_dependency():
    yield _FakeDb()


async def _no_rate_limit(*_args, **_kwargs):
    return None


async def _run_operation(_db, _user_id, operation):
    return await operation()


class AiMatchEndpointTests(unittest.TestCase):
    def setUp(self):
        self.saved_overrides = dict(app.dependency_overrides)
        app.dependency_overrides[get_db] = _db_dependency
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(id="test-user-1", email="test@example.com")
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.saved_overrides)

    def _post(self, job_description, *, resume_id=None):
        body = {"jobDescription": job_description}
        if resume_id:
            body["resumeId"] = resume_id
        else:
            body["currentResume"] = {"personalInfo": {"summary": "Experienced Python engineer"}}
        return self.client.post("/api/v1/ai/match", json=body)

    def test_authentication_is_required(self):
        app.dependency_overrides.pop(get_current_user)
        response = self._post("A sufficiently long job description with requirements.")
        self.assertEqual(response.status_code, 401)

    def test_saved_resume_owner_mismatch_returns_404(self):
        with patch.object(ai_router, "enforce_ats_rate_limit", _no_rate_limit):
            response = self._post("A sufficiently long job description with requirements.", resume_id="someone-elses-cv")
        self.assertEqual(response.status_code, 404)

    def test_blank_job_description_returns_400(self):
        with patch.object(ai_router, "enforce_ats_rate_limit", _no_rate_limit):
            response = self._post("   \n")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"]["code"], "JOB_EMPTY")

    def test_over_limit_job_description_returns_413(self):
        with patch.object(ai_router, "enforce_ats_rate_limit", _no_rate_limit):
            response = self._post("x" * 20_001)
        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["detail"]["code"], "JOB_TOO_LONG")

    def test_rate_limit_returns_retry_after(self):
        async def limited(*_args, **_kwargs):
            raise HTTPException(429, detail={"code": "RATE_LIMITED"}, headers={"Retry-After": "12"})

        with patch.object(ai_router, "enforce_ats_rate_limit", limited):
            response = self._post("A sufficiently long job description with requirements.")
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["Retry-After"], "12")

    def test_limiter_failure_fails_closed_with_503(self):
        async def unavailable(*_args, **_kwargs):
            raise HTTPException(503, detail={"code": "RATE_LIMIT_UNAVAILABLE"})

        with patch.object(ai_router, "enforce_ats_rate_limit", unavailable):
            response = self._post("A sufficiently long job description with requirements.")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"]["code"], "RATE_LIMIT_UNAVAILABLE")

    def test_product_quota_uses_429_with_a_distinct_code(self):
        async def quota_exceeded(*_args, **_kwargs):
            raise HTTPException(429, detail={"code": "AI_QUOTA_EXCEEDED", "message": "monthly quota reached"})

        with (
            patch.object(ai_router, "enforce_ats_rate_limit", _no_rate_limit),
            patch.object(ai_router, "run_with_ai_reservation", quota_exceeded),
        ):
            response = self._post("A sufficiently long job description with requirements.")
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()["detail"]["code"], "AI_QUOTA_EXCEEDED")

    def test_failed_provider_work_returns_503(self):
        async def provider_failure(*_args, **_kwargs):
            raise HTTPException(503, detail={"code": "ATS_TOTAL_TIMEOUT"})

        with (
            patch.object(ai_router, "enforce_ats_rate_limit", _no_rate_limit),
            patch.object(ai_router, "run_with_ai_reservation", _run_operation),
            patch.object(ai_router.ats_service, "match", provider_failure),
        ):
            response = self._post("A sufficiently long job description with requirements.")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"]["code"], "ATS_TOTAL_TIMEOUT")


if __name__ == "__main__":
    unittest.main()
