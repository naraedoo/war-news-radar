"""
전쟁 뉴스 크롤러 - BeautifulSoup + Playwright
사용법:
  pip install requests beautifulsoup4 playwright lxml
  playwright install chromium
  python crawler.py
"""

import json
import time
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ─────────────────────────────────────────────
# 1. Google News RSS (requests + BeautifulSoup)
# ─────────────────────────────────────────────

GOOGLE_NEWS_RSS_URL = (
    "https://news.google.com/rss/search"
    "?q=%EC%A0%84%EC%9F%81+OR+%EC%BB%A8%ED%94%8C%EB%A6%AD%ED%8A%B8"  # 전쟁 OR 컨플릭트
    "&hl=ko&gl=KR&ceid=KR:ko"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def fetch_google_news_rss(max_items: int = 20) -> list[dict]:
    """Google News RSS에서 전쟁 관련 뉴스를 파싱합니다."""
    print(f"[RSS] 뉴스 로드 중: {GOOGLE_NEWS_RSS_URL}")
    try:
        resp = requests.get(GOOGLE_NEWS_RSS_URL, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[RSS] 요청 실패: {e}")
        return []

    soup = BeautifulSoup(resp.content, "xml")
    items = soup.find_all("item")
    print(f"[RSS] {len(items)}개 항목 발견")

    news_list = []
    for item in items[:max_items]:
        title = item.find("title")
        link = item.find("link")
        pub_date = item.find("pubDate")
        source_tag = item.find("source")
        description = item.find("description")

        # 날짜 파싱
        date_str = ""
        if pub_date and pub_date.text:
            try:
                dt = datetime.strptime(pub_date.text.strip(), "%a, %d %b %Y %H:%M:%S %Z")
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except ValueError:
                date_str = pub_date.text.strip()

        # 요약문 정리 (HTML 태그 제거)
        summary = ""
        if description:
            desc_soup = BeautifulSoup(description.text, "html.parser")
            summary = desc_soup.get_text(separator=" ").strip()
            summary = re.sub(r"\s+", " ", summary)[:200]

        # Google News RSS에서 link는 CDATA 형태 → .string 또는 get_text() 사용
        raw_link = ""
        if link:
            raw_link = (link.string or link.get_text(strip=True) or "").strip()
        if not raw_link:
            raw_link = "#"

        news_list.append({
            "title": title.text.strip() if title else "제목 없음",
            "link": raw_link,
            "source": source_tag.text.strip() if source_tag else "알 수 없음",
            "date": date_str,
            "summary": summary,
            "image": "",  # RSS에는 이미지 없음 → Playwright로 보완
        })

    return news_list


# ─────────────────────────────────────────────
# 2. Playwright로 이미지 추출 (선택사항)
# ─────────────────────────────────────────────

def enrich_with_images_playwright(news_list: list[dict], max_items: int = 5) -> list[dict]:
    """
    각 기사 URL에서 og:image를 추출합니다.
    max_items: 이미지를 가져올 최대 기사 수 (속도 조절용)
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[Playwright] 설치되지 않음. 이미지 추출 건너뜀.")
        return news_list

    print(f"[Playwright] 상위 {max_items}개 기사에서 이미지 추출 중...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers(HEADERS)

        for i, news in enumerate(news_list[:max_items]):
            url = news["link"]
            if not url or url == "#":
                continue
            try:
                page.goto(url, timeout=10000, wait_until="domcontentloaded")
                og_image = page.evaluate("""
                    () => {
                        const meta = document.querySelector('meta[property="og:image"]');
                        return meta ? meta.getAttribute('content') : '';
                    }
                """)
                if og_image:
                    news_list[i]["image"] = og_image
                    print(f"  [{i+1}] 이미지 추출 성공: {og_image[:60]}...")
                time.sleep(0.5)
            except Exception as e:
                print(f"  [{i+1}] 실패 ({url[:50]}...): {e}")

        browser.close()

    return news_list


# ─────────────────────────────────────────────
# 3. 결과 저장 및 출력
# ─────────────────────────────────────────────

def save_results(news_list: list[dict], output_path: str = "war_news.json"):
    path = Path(output_path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(news_list, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 결과 저장 완료: {path.resolve()} ({len(news_list)}건)")


def print_summary(news_list: list[dict]):
    print("\n" + "─" * 60)
    print(f"📰 전쟁 뉴스 요약 (총 {len(news_list)}건)")
    print("─" * 60)
    for i, news in enumerate(news_list, 1):
        print(f"\n[{i:02d}] {news['title']}")
        print(f"      출처: {news['source']}  |  날짜: {news['date']}")
        if news.get("summary"):
            print(f"      요약: {news['summary'][:80]}...")
        if news.get("image"):
            print(f"      이미지: {news['image'][:60]}...")


# ─────────────────────────────────────────────
# 4. 메인 실행
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  전쟁 뉴스 크롤러 시작")
    print(f"  실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: RSS 파싱
    news_list = fetch_google_news_rss(max_items=20)

    if not news_list:
        print("\n❌ RSS 데이터를 가져오지 못했습니다. 네트워크 상태를 확인하세요.")
        exit(1)

    # Step 2: Playwright로 이미지 보완 (선택)
    USE_PLAYWRIGHT = False  # True로 변경하면 이미지 추출 활성화
    if USE_PLAYWRIGHT:
        news_list = enrich_with_images_playwright(news_list, max_items=5)

    # Step 3: 콘솔 출력
    print_summary(news_list)

    # Step 4: JSON 저장
    save_results(news_list, "war_news.json")

    print("\n🚀 크롤링 완료!")
    print("   저장된 war_news.json 파일을 React 앱에서 import하여 실제 데이터로 교체하세요.")
