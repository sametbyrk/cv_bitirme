import unittest

from pydantic import ValidationError

from app.schemas.resume import ResumeContent, ResumeResponse
from app.schemas.ai import MAX_JOB_DESCRIPTION_CHARS


class ResumeFieldLimitTests(unittest.TestCase):
    def assert_field_limit(self, make_resume, limit):
        self.assertIsNotNone(make_resume("x" * limit))
        with self.assertRaises(ValidationError):
            make_resume("x" * (limit + 1))

    def test_name_limit_is_30(self):
        self.assert_field_limit(
            lambda value: ResumeContent(personalInfo={"fullName": value}), 30
        )

    def test_summary_limit_is_600(self):
        self.assert_field_limit(
            lambda value: ResumeContent(personalInfo={"summary": value}), 600
        )

    def test_experience_position_limit_is_60(self):
        self.assert_field_limit(
            lambda value: ResumeContent(experience=[{"position": value}]), 60
        )

    def test_experience_description_limit_is_1200(self):
        self.assert_field_limit(
            lambda value: ResumeContent(experience=[{"description": value}]), 1200
        )

    def test_project_description_limit_is_800(self):
        self.assert_field_limit(
            lambda value: ResumeContent(projects=[{"description": value}]), 800
        )

    def test_skill_limit_is_50(self):
        self.assert_field_limit(lambda value: ResumeContent(skills=[value]), 50)

    def test_job_description_limit_is_3000(self):
        self.assertEqual(MAX_JOB_DESCRIPTION_CHARS, 3000)

    def test_read_response_preserves_legacy_content_over_new_input_caps(self):
        legacy_summary = "x" * 700
        response = ResumeResponse(
            id="resume-1",
            userId="user-1",
            title="Legacy CV",
            content={"personalInfo": {"summary": legacy_summary}},
        )
        self.assertEqual(response.content["personalInfo"]["summary"], legacy_summary)
        with self.assertRaises(ValidationError):
            ResumeContent(personalInfo={"summary": legacy_summary})


if __name__ == "__main__":
    unittest.main()
