"""
Mock data service providing static/in-memory data for POC.
Replicates the HTML prototype's mock data exactly.
"""
from typing import List


class MockDataService:
    """
    Provides mock data for past messages, spam analysis, personalization vars, etc.
    In a real service, these would come from a database.
    """

    def get_past_messages(self) -> List[dict]:
        """Return mock past message history."""
        return [
            {
                "date": "2024.03.01",
                "channel": "SMS",
                "content": "[센드온] 3월 한정! 신규가입 시 첫 발송 50% 할인.",
                "toneAnalysis": "친근한 어투",
                "openRate": 34.2,
            },
            {
                "date": "2024.02.25",
                "channel": "알림톡",
                "content": "{{고객명}}님, 2월 마지막 주 특별 혜택을 준비했어요 🎁",
                "toneAnalysis": "친근한 어투",
                "openRate": 28.7,
            },
            {
                "date": "2024.02.20",
                "channel": "RCS",
                "content": "[센드온 이벤트] 친구 추천하면 크레딧 2배!",
                "toneAnalysis": "직접적 CTA",
                "openRate": 41.5,
            },
        ]

    def get_past_successful_messages(self) -> List[dict]:
        """Return mock successful past messages (high open rate)."""
        return [
            {
                "content": "[센드온] 발렌타인데이 맞이 💝 메시지 발송 이벤트 진행 중!",
                "openRate": 97.3,
                "channel": "SMS",
                "date": "2026.02.14",
            },
            {
                "content": "[센드온] 새해 첫 혜택! 가입하면 크레딧 2배 🎍",
                "openRate": 95.8,
                "channel": "알림톡",
                "date": "2026.01.20",
            },
        ]

    def get_spam_score(self, message: str) -> dict:
        """Return mock spam analysis for a message."""
        return {
            "score": 12,
            "status": "안전",
            "checks": [
                {
                    "label": "스팸 키워드",
                    "passed": True,
                    "detail": "없음",
                },
                {
                    "label": "URL 안전성",
                    "passed": True,
                    "detail": "안전",
                },
                {
                    "label": "특수문자",
                    "passed": True,
                    "detail": "정상 (3.2%)",
                },
                {
                    "label": "대문자 비율",
                    "passed": False,
                    "detail": "소문자 전환 권장",
                },
            ],
        }

    def get_personalization_vars(self) -> List[dict]:
        """Return available personalization variable templates."""
        return [
            {
                "template": "{{고객명}}",
                "description": "수신자 이름",
            },
            {
                "template": "{{최근구매상품}}",
                "description": "구매 상품명",
            },
            {
                "template": "{{적립포인트}}",
                "description": "보유 포인트",
            },
        ]

    def get_fatigue_analysis(self, target: str = "all") -> dict:
        """Return mock message fatigue analysis."""
        return {
            "highFatigueCount": 1247,
            "totalCount": 15420,
            "fatigueRate": 8.1,
            "detail": "수신자 중 1,247명은 최근 7일 내 2회 이상 수신",
            "recommendation": "3일 후 발송 권장 (거부 위험 -62%)",
        }

    def get_season_recommendations(self) -> List[str]:
        """Return current season keyword recommendations."""
        return ["봄맞이", "새학기", "화이트데이", "졸업/입학 시즌", "3월 할인"]
