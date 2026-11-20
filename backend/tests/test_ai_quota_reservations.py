import unittest
from datetime import datetime, timezone
from unittest.mock import ANY, AsyncMock, patch

from app.services.ai_quota_reservations import _next_month, run_with_ai_reservation


class AiQuotaReservationTests(unittest.IsolatedAsyncioTestCase):
    async def test_success_consumes_one_reservation_after_operation(self):
        operation = AsyncMock(return_value="generated")
        with (
            patch("app.services.ai_quota_reservations.reserve_ai_usage", new=AsyncMock(return_value="reservation-id")),
            patch("app.services.ai_quota_reservations.finalize_ai_usage", new=AsyncMock()) as finalize,
        ):
            result = await run_with_ai_reservation(object(), "user-id", operation)
        self.assertEqual(result, "generated")
        finalize.assert_awaited_once_with(ANY, "reservation-id", success=True)

    async def test_failed_operation_releases_reservation_without_consuming_it(self):
        operation = AsyncMock(side_effect=RuntimeError("provider failed"))
        with (
            patch("app.services.ai_quota_reservations.reserve_ai_usage", new=AsyncMock(return_value="reservation-id")),
            patch("app.services.ai_quota_reservations.finalize_ai_usage", new=AsyncMock()) as finalize,
            self.assertRaises(RuntimeError),
        ):
            await run_with_ai_reservation(object(), "user-id", operation)
        finalize.assert_awaited_once_with(ANY, "reservation-id", success=False)

    def test_monthly_reset_clamps_month_end_and_leap_day(self):
        self.assertEqual(
            _next_month(datetime(2026, 1, 31, 12, tzinfo=timezone.utc)),
            datetime(2026, 2, 28, 12, tzinfo=timezone.utc),
        )
        self.assertEqual(
            _next_month(datetime(2024, 1, 31, 12, tzinfo=timezone.utc)),
            datetime(2024, 2, 29, 12, tzinfo=timezone.utc),
        )


if __name__ == "__main__":
    unittest.main()
