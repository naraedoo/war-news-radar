# 기술명세서 (Technical Specification)
**프로젝트명**: 전쟁 뉴스 레이더 (War News Radar)
**작성일**: 2026-04-07

## 1. 프로젝트 개요
사용자가 '전쟁' 및 '분쟁' 관련 최신 글로벌 뉴스를 시각적으로 한눈에 확인할 수 있는 인터랙티브 웹 대시보드입니다. 구글 뉴스 RSS 피드를 Python 크롤러로 자동 수집하여 프론트엔드 화면(React)에 카드 형식으로 실시간 렌더링합니다.

## 2. 사용 기술 스택 (Tech Stack)
### Frontend
*   **프레임워크**: React (Vite 템플릿 사용)
*   **스타일링**: Tailwind CSS (`@tailwindcss/vite` 플러그인 연동)
*   **폰트**: Noto Sans KR, Inter (Google Fonts)
*   **아이콘/그리기**: 순수 CSS + SVG 아이콘
*   **외부 연동 SDK**: KakaoTalk JavaScript SDK (기사 공유 기능)

### Backend / Data Crawling
*   **언어**: Python 3.13
*   **크롤링 라이브러리**: 
    - `requests`, `beautifulsoup4`, `lxml` (RSS 구조 파싱)
    - `playwright` (og:image 등 동적 메타데이터 추출용 - 선택적 사용)

### CI/CD & Version Control
*   **VCS**: Git
*   **원격 저장소**: GitHub (`naraedoo/war-news-radar`)
*   **CLI 도구**: GitHub CLI (`gh`)

## 3. 주요 구현 기능 및 파일 구성
### 3.1 Data Pipeline (`crawler.py`)
*   **구글 뉴스 RSS 크롤링**: `https://news.google.com/rss/search?q=전쟁+OR+컨플릭트` 에 접근하여 최대 20개의 최신 기사 타이틀, 링크, 언론사명, 요약, 발행일시를 수집합니다.
*   **데이터 정제**: HTML 태그를 제거하여 순수 텍스트 요약본 추출, `CDATA`로 감싸진 기사 원문 링크(`link` 태그)를 안정적으로 추출합니다.
*   **가공 및 저장**: 로컬 개발 환경의 프론트엔드에서 즉시 불러올 수 있도록 JSON 형태(`war_news.json`)로 추출/저장합니다.

### 3.2 Frontend Application (`src/App.jsx`, `src/index.css`)
*   **컴포넌트 구조**:
    *   `NewsCard`: 개별 기사의 상세 정보를 담는 카드 UI (레이아웃, 이미지 Fallback, 글자 말줄임표 처리, 호버 애니메이션, 카카오 공유 및 기사 읽기 링크 내장)
    *   `SkeletonCard`: 뉴스 데이터를 불러오는 동안 보여주는 로딩용 스켈레톤 UI
    *   `App` (Main): 검색기능, 새로고침, 로딩 상태 관리 및 최종 그리드(Grid) 렌더링을 담당하는 부모 컴포넌트
*   **자동 카테고리 분류 (Auto Category Detection)**:
    *   `App.jsx` 내부의 `detectCategory()` 함수를 통해 기사 제목(Title) 키워드 매칭(예: "이스라엘", "이란" -> "중동")으로 카테고리를 자동 생성 및 필터링합니다.
*   **이미지 Fallback 처리 (`getFallbackImage`)**:
    *   RSS 파싱 시 이미지가 없는 경우를 대비하여 `SOURCE_IMAGES` (언론사별 썸네일 매칭) 및 `DEFAULT_IMAGES` (랜덤 매칭)를 통해 시각적인 빈 공간을 방지합니다.

## 4. 데이터 플로우 (Data Flow)
1. 사용자가 개발 환경에서 커맨드(ex. `python3 crawler.py`)를 통해 크롤러 실행.
2. `crawler.py`가 Google News RSS 서버에서 XML을 파싱해 내부 텍스트를 정제한 후 `war_news.json`을 생성.
3. 생성된 `war_news.json`이 빌드 타임 혹은 Dev 서버 기동 시 `src/App.jsx`로 `import` 됨.
4. React 애플리케이션 진입(Mount) 시, 로딩 화면(Skeleton)을 먼저 노출하고, 0.8초 딜레이(Mock 네트워크 지연) 후 렌더링됨.

## 5. 남은 과제 / 발전 방향 (TO-DO)
*   **자동화 연동**: 로컬에서 수동으로 `crawler.py`를 돌리는 것에서 발전하여, GitHub Actions 등을 활용해 일정 주기로 크롤러를 스케줄링하고 정적 웹페이지(JSON)를 재빌드하는 프로세스 구축
*   **앱 키 관리**: 현재 소스코드 내부 `window.Kakao.init('YOUR_KAKAO_APP_KEY')`에 존재하는 임시 키 대신 안전하게 환경변수(`.env`)로 분리 및 카카오 개발자 콘솔의 실제 JavaScript Key 반영 필요.
*   **Playwright 전체 활성화**: 모든 뉴스 썸네일을 정확히 가져오기 위한 Playwright 기반의 Headless 오리지널 링크 방문 크롤링 기능 활성화 및 성능 최적화.
