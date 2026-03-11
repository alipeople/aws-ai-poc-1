"""Web page fetcher service for URL analysis.

Fetches web pages via httpx and extracts meaningful text content
(title, meta tags, OG data, JSON-LD, body text) for LLM consumption.
Uses only Python stdlib for HTML parsing — no beautifulsoup4 or lxml.
"""

import json
import logging
import re
from html.parser import HTMLParser
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

_DEFAULT_HEADERS = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

_SKIP_TAGS = frozenset({"script", "style", "noscript", "svg", "path", "iframe"})
_MAX_BODY_TEXT_CHARS = 6000
_MAX_TOTAL_CHARS = 8000
_FETCH_TIMEOUT = 15.0


# ── HTML Parser ──────────────────────────────────────────────────────────────


class _ProductPageParser(HTMLParser):
    """Extract structured product info from HTML using stdlib parser."""

    def __init__(self) -> None:
        super().__init__()
        self.title: str = ""
        self.meta: dict[str, str] = {}
        self.json_ld: list[str] = []
        self.body_parts: list[str] = []

        # Parser state
        self._in_title = False
        self._in_skip_tag: Optional[str] = None
        self._skip_depth = 0
        self._in_json_ld = False
        self._json_ld_buf: list[str] = []

    # -- Tag handlers --------------------------------------------------------

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        tag_lower = tag.lower()
        attr_dict = {k.lower(): v for k, v in attrs if v is not None}

        # Track skip tags with depth (handles nested cases)
        if tag_lower in _SKIP_TAGS:
            if tag_lower == "script":
                # Check for JSON-LD
                script_type = attr_dict.get("type", "").lower()
                if script_type == "application/ld+json":
                    self._in_json_ld = True
                    self._json_ld_buf = []
                    return
            if self._in_skip_tag is None:
                self._in_skip_tag = tag_lower
                self._skip_depth = 1
            elif self._in_skip_tag == tag_lower:
                self._skip_depth += 1
            return

        if tag_lower == "title":
            self._in_title = True
            return

        if tag_lower == "meta":
            self._handle_meta(attr_dict)

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()

        if self._in_json_ld and tag_lower == "script":
            self._in_json_ld = False
            raw = "".join(self._json_ld_buf).strip()
            if raw:
                self.json_ld.append(raw)
            return

        if self._in_skip_tag == tag_lower:
            self._skip_depth -= 1
            if self._skip_depth <= 0:
                self._in_skip_tag = None
            return

        if tag_lower == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_json_ld:
            self._json_ld_buf.append(data)
            return

        if self._in_skip_tag:
            return

        if self._in_title:
            self.title += data.strip()
            return

        text = data.strip()
        if text:
            self.body_parts.append(text)

    # -- Meta tag extraction --------------------------------------------------

    _META_KEYS = frozenset({
        "og:title",
        "og:description",
        "og:price:amount",
        "og:price:currency",
        "product:price:amount",
        "product:price:currency",
        "description",
        "keywords",
    })

    def _handle_meta(self, attrs: dict[str, str]) -> None:
        content = attrs.get("content", "")
        if not content:
            return

        # property="og:..." or name="description"
        key = attrs.get("property", attrs.get("name", "")).lower()
        if key in self._META_KEYS:
            self.meta[key] = content


# ── WebPageFetcher Service ───────────────────────────────────────────────────


class WebPageFetcher:
    """Fetches web pages and extracts meaningful text for LLM analysis.

    Uses httpx for async HTTP fetching and Python stdlib HTMLParser
    for content extraction. No external HTML parsing dependencies.
    """

    async def fetch(self, url: str) -> str:
        """Fetch a web page and return extracted text content.

        Args:
            url: The URL to fetch.

        Returns:
            Formatted text containing page title, meta info, body text,
            and structured data (JSON-LD), suitable for LLM consumption.

        Raises:
            httpx.HTTPStatusError: If the server returns a non-2xx response.
            httpx.RequestError: If the request fails (timeout, DNS, etc.).
        """
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(_FETCH_TIMEOUT),
            headers=_DEFAULT_HEADERS,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        html = response.text
        return self._extract_text(html, url)

    def _extract_text(self, html: str, url: str) -> str:
        """Parse HTML and build a structured text summary for LLM."""
        parser = _ProductPageParser()
        try:
            parser.feed(html)
        except Exception:
            logger.warning("HTML parsing error for %s, using partial results", url)

        sections: list[str] = []

        # Header
        sections.append("=== 웹 페이지 분석 데이터 ===")
        sections.append(f"URL: {url}")

        # Title
        if parser.title:
            sections.append(f"제목: {parser.title}")

        # Meta info
        if parser.meta:
            sections.append("\n메타 정보:")
            for key, value in parser.meta.items():
                sections.append(f"  - {key}: {value}")

        # JSON-LD structured data (high priority — include first)
        json_ld_text = ""
        if parser.json_ld:
            pieces: list[str] = []
            for raw in parser.json_ld:
                try:
                    parsed = json.loads(raw)
                    pieces.append(json.dumps(parsed, ensure_ascii=False, indent=2))
                except json.JSONDecodeError:
                    pieces.append(raw[:500])
            json_ld_text = "\n".join(pieces)
            sections.append(f"\n구조화된 데이터 (JSON-LD):\n{json_ld_text}")

        # Body text — fill remaining space
        current_len = sum(len(s) for s in sections)
        remaining = _MAX_TOTAL_CHARS - current_len - 50  # 50 char buffer for labels
        body_budget = min(_MAX_BODY_TEXT_CHARS, max(remaining, 500))

        body_text = self._collapse_whitespace(" ".join(parser.body_parts))
        if body_text:
            if len(body_text) > body_budget:
                body_text = body_text[:body_budget] + "...(생략)"
            sections.append(f"\n본문 텍스트:\n{body_text}")

        result = "\n".join(sections)

        # Final safety truncation
        if len(result) > _MAX_TOTAL_CHARS:
            result = result[:_MAX_TOTAL_CHARS] + "\n...(생략)"

        return result

    @staticmethod
    def _collapse_whitespace(text: str) -> str:
        """Collapse multiple whitespace characters into single spaces."""
        return re.sub(r"\s+", " ", text).strip()
