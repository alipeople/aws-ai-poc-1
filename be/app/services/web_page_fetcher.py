"""Web page fetcher service for URL analysis.

Fetches web pages and extracts meaningful text content
(title, meta tags, OG data, JSON-LD, body text) for LLM consumption.

Fetching strategy (ordered by priority):
  1. httpx  — fast, async, works for most sites
  2. curl_cffi — Chrome TLS fingerprint impersonation, bypasses basic bot detection

Uses only Python stdlib for HTML parsing (no beautifulsoup4 / lxml).
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

# Bot challenge page indicators
_BOT_CHALLENGE_MARKERS = [
    "sec-if-cpt-container",       # Akamai Bot Manager
    "behavioral-content",         # Akamai challenge
    "cf-browser-verification",    # Cloudflare
    "challenge-platform",         # Cloudflare
    "Access Denied",              # Generic WAF block
    "Just a moment...",           # Cloudflare waiting page
]
_MIN_VALID_HTML_LENGTH = 5000  # Real product pages are typically > 5KB


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


class FetchError(Exception):
    """Raised when all fetch strategies fail."""

    pass


class BotBlockedError(FetchError):
    """Raised when the target site's anti-bot system blocks the request."""

    def __init__(self, url: str, site_name: str = "") -> None:
        site = site_name or url
        super().__init__(
            f"{site} 사이트의 봇 차단 정책으로 페이지를 가져올 수 없습니다. "
            f"해당 페이지의 상품 정보를 직접 복사하여 입력해주세요."
        )
        self.url = url


class RateLimitError(FetchError):
    """Raised when the target site returns 429 Too Many Requests."""

    def __init__(self, url: str, site_name: str = "") -> None:
        site = site_name or url
        super().__init__(
            f"{site} 사이트에서 요청을 제한하고 있습니다 (429). "
            f"잠시 후 다시 시도하거나, 상품 정보를 직접 입력해주세요."
        )
        self.url = url


class WebPageFetcher:
    """Fetches web pages and extracts meaningful text for LLM analysis.

    Two-stage fetch strategy:
      1. httpx (fast, async) — works for most sites
      2. curl_cffi with Chrome impersonation — bypasses basic TLS-based bot detection

    Detects bot challenge pages and raises BotBlockedError instead of
    returning useless challenge HTML.
    """

    _MAX_RETRIES = 2
    _RETRY_DELAY = 2.0  # seconds

    async def fetch(self, url: str) -> str:
        """Fetch a web page and return extracted text content.

        Args:
            url: The URL to fetch.

        Returns:
            Formatted text suitable for LLM consumption.

        Raises:
            RateLimitError: If the site returns 429 after retries.
            BotBlockedError: If the site's anti-bot system blocks the request.
            FetchError: If all fetch strategies fail.
        """
        import asyncio

        html: Optional[str] = None
        got_429 = False
        got_challenge = False

        # Strategy 1: httpx (fast, async) — with retry for 429
        for attempt in range(1 + self._MAX_RETRIES):
            try:
                html = await self._fetch_httpx(url)
                if self._is_valid_page(html):
                    logger.info("httpx: fetched %d chars from %s", len(html), url)
                    return self._extract_text(html, url)
                logger.info("httpx: got challenge/blocked page from %s", url)
                got_challenge = True
                html = None
                break  # challenge page won't change with retry
            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                if status == 429:
                    got_429 = True
                    if attempt < self._MAX_RETRIES:
                        delay = self._RETRY_DELAY * (attempt + 1)
                        logger.info("httpx: 429 from %s, retrying in %.1fs (%d/%d)", url, delay, attempt + 1, self._MAX_RETRIES)
                        await asyncio.sleep(delay)
                        continue
                    logger.warning("httpx: 429 from %s after %d retries", url, self._MAX_RETRIES)
                elif status == 403:
                    logger.info("httpx: 403 from %s, trying curl_cffi", url)
                else:
                    logger.warning("httpx: HTTP %s from %s", status, url)
                break
            except Exception as e:
                logger.warning("httpx: failed for %s: %s", url, e)
                break

        # Strategy 2: curl_cffi with Chrome TLS impersonation
        try:
            html = await self._fetch_curl_cffi(url)
            if self._is_valid_page(html):
                logger.info("curl_cffi: fetched %d chars from %s", len(html), url)
                return self._extract_text(html, url)
            logger.info("curl_cffi: got challenge/blocked page from %s", url)
            got_challenge = True
        except Exception as e:
            if "429" in str(e):
                got_429 = True
            logger.warning("curl_cffi: failed for %s: %s", url, e)

        # Strategy 3: Site-specific extractors (e.g. Naver brand store)
        try:
            result = await self._fetch_site_specific(url)
            if result:
                logger.info("site-specific: fetched product data from %s", url)
                return result
        except Exception as e:
            logger.warning("site-specific: failed for %s: %s", url, e)

        # All strategies exhausted — raise specific error
        site_name = self._extract_site_name(url)
        if got_429:
            raise RateLimitError(url, site_name)
        raise BotBlockedError(url, site_name)

    # -- Fetch strategies -----------------------------------------------------

    async def _fetch_httpx(self, url: str) -> str:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(_FETCH_TIMEOUT),
            headers=_DEFAULT_HEADERS,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
        return response.text

    async def _fetch_site_specific(self, url: str) -> Optional[str]:
        """Try site-specific extraction strategies for known domains."""
        from urllib.parse import urlparse

        host = urlparse(url).hostname or ""
        if "brand.naver.com" in host or "smartstore.naver.com" in host:
            return await self._fetch_naver_brand_store(url)
        return None

    async def _fetch_naver_brand_store(self, url: str) -> Optional[str]:
        """Extract product data from Naver brand/smart store.

        Naver brand store product pages (brand.naver.com/{channel}/products/{id})
        aggressively rate-limit direct requests (429). Instead, we fetch the
        channel's main page which embeds product data in __PRELOADED_STATE__,
        then extract the specific product by ID.
        """
        import asyncio
        from urllib.parse import urlparse

        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split("/") if p]

        # Extract channel name and product ID from URL
        # Pattern: /eucerin/products/11355567271
        channel_name: Optional[str] = None
        product_id: Optional[str] = None
        for i, part in enumerate(path_parts):
            if part == "products" and i + 1 < len(path_parts):
                product_id = path_parts[i + 1]
                channel_name = path_parts[i - 1] if i > 0 else None
                break

        if not channel_name or not product_id:
            return None

        # Fetch the channel main page (this is NOT rate-limited)
        channel_url = f"https://brand.naver.com/{channel_name}"

        def _sync_fetch() -> Optional[str]:
            from curl_cffi import requests as curl_requests

            r = curl_requests.get(
                channel_url,
                impersonate="chrome131",
                headers={"Accept-Language": "ko-KR,ko;q=0.9"},
                timeout=_FETCH_TIMEOUT,
            )
            r.raise_for_status()
            return r.text

        html = await asyncio.to_thread(_sync_fetch)
        if not html:
            return None

        # Extract __PRELOADED_STATE__ JSON
        marker = "__PRELOADED_STATE__="
        start_idx = html.find(marker)
        if start_idx == -1:
            return None

        script_end = html.find("</script>", start_idx)
        if script_end == -1:
            return None

        json_str = html[start_idx + len(marker) : script_end].strip().rstrip(";")
        try:
            state = json.loads(json_str)
        except json.JSONDecodeError:
            return None

        # Recursively find the product by ID in the state tree
        product = self._find_naver_product(state, product_id)
        if not product:
            return None

        return self._format_naver_product(product, url)

    @staticmethod
    def _find_naver_product(obj: object, product_id: str) -> Optional[dict]:
        """Recursively search __PRELOADED_STATE__ for a product by ID."""
        if isinstance(obj, dict):
            if str(obj.get("id", "")) == product_id and "name" in obj:
                return obj
            for v in obj.values():
                result = WebPageFetcher._find_naver_product(v, product_id)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = WebPageFetcher._find_naver_product(item, product_id)
                if result:
                    return result
        return None

    @staticmethod
    def _format_naver_product(product: dict, url: str) -> str:
        """Format Naver product JSON into structured text for LLM."""
        benefits = product.get("benefitsView", {})
        category = product.get("category", {})
        channel = product.get("channel", {})
        search_info = product.get("naverShoppingSearchInfo", {})
        review_info = product.get("reviewAmount", {})

        sections = [
            "=== 웹 페이지 분석 데이터 ===",
            f"URL: {url}",
            f"제목: {product.get('name', '')}",
            "\n메타 정보:",
            f"  - 상품명: {product.get('name', '')}",
            f"  - 표시명: {product.get('dispName', '')}",
            f"  - 정가: {product.get('salePrice', '')}원",
            f"  - 할인가: {benefits.get('discountedSalePrice', '')}원",
            f"  - 할인율: {benefits.get('discountedRatio', '')}%",
            f"  - 카테고리: {category.get('wholeCategoryName', '')}",
            f"  - 브랜드: {search_info.get('brandName', '')}",
            f"  - 제조사: {search_info.get('manufacturerName', '')}",
            f"  - 스토어: {channel.get('channelName', '')}",
            f"  - 판매상태: {product.get('productStatusType', '')}",
        ]

        if review_info:
            total = review_info.get("totalReviewCount", 0)
            avg = review_info.get("averageReviewScore", 0)
            if total:
                sections.append(f"  - 리뷰: {total}건 (평점 {avg})")

        seo = product.get("seoInfo", {})
        if seo.get("metaDescription"):
            sections.append(f"\n상품 설명:\n{seo['metaDescription']}")

        tags = seo.get("sellerTags", [])
        if tags:
            tag_texts = [t.get("text", "") for t in tags if t.get("text")]
            sections.append(f"\n태그: {', '.join(tag_texts)}")

        return "\n".join(sections)

    async def _fetch_curl_cffi(self, url: str) -> str:
        """Fetch using curl_cffi with Chrome TLS fingerprint impersonation."""
        import asyncio

        def _sync_fetch() -> str:
            from curl_cffi import requests as curl_requests

            r = curl_requests.get(
                url,
                impersonate="chrome131",
                headers={
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Referer": self._build_referer(url),
                },
                timeout=_FETCH_TIMEOUT,
            )
            r.raise_for_status()
            return r.text

        return await asyncio.to_thread(_sync_fetch)

    # -- Validation -----------------------------------------------------------

    @staticmethod
    def _is_valid_page(html: str) -> bool:
        """Detect bot challenge / blocked pages vs real content."""
        if len(html) < _MIN_VALID_HTML_LENGTH:
            return False
        for marker in _BOT_CHALLENGE_MARKERS:
            if marker in html:
                return False
        return True

    @staticmethod
    def _extract_site_name(url: str) -> str:
        """Extract human-readable site name from URL."""
        from urllib.parse import urlparse

        host = urlparse(url).hostname or ""
        # Remove www/m prefix and .com/.co.kr suffix
        name = re.sub(r"^(www\.|m\.)", "", host)
        name = re.sub(r"\.(com|co\.kr|net|io)$", "", name)
        return name.capitalize() if name else ""

    @staticmethod
    def _build_referer(url: str) -> str:
        """Build Referer header from URL origin."""
        from urllib.parse import urlparse

        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.hostname}/"

    # -- Text extraction ------------------------------------------------------

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
                parsed = self._parse_json_ld(raw)
                if parsed is not None:
                    pieces.append(json.dumps(parsed, ensure_ascii=False, indent=2))
                else:
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
    def _parse_json_ld(raw: str) -> Optional[dict]:
        """Parse JSON-LD with recovery for common malformed patterns.

        Many sites emit slightly broken JSON-LD (trailing commas, etc.).
        Try strict parsing first, then fix common issues and retry.
        """
        raw = raw.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Fix trailing commas before } or ]  (e.g. "price": "21,000",} )
        fixed = re.sub(r",\s*([}\]])", r"\1", raw)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            logger.debug("JSON-LD parse failed even after trailing-comma fix")
            return None

    @staticmethod
    def _collapse_whitespace(text: str) -> str:
        """Collapse multiple whitespace characters into single spaces."""
        return re.sub(r"\s+", " ", text).strip()
