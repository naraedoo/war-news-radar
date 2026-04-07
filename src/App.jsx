import { useState, useEffect, useCallback } from 'react'
import RAW_NEWS from './war_news.json'

// ─── 제목에서 " - 언론사명" 제거 ───────────────────────────────────
function cleanTitle(title) {
  return title.replace(/\s*[-–—]\s*[^-–—]+$/, '').trim()
}

// ─── 키워드 기반 자동 카테고리 감지 ─────────────────────────────────
function detectCategory(title) {
  const t = title
  if (/이란|이스라엘|가자|하마스|호르무즈|중동|후티|예멘|시리아/.test(t)) return '중동'
  if (/우크라이나|러시아|크림|하르키우|흑해|돈바스|키이우/.test(t)) return '우크라이나'
  if (/북한|김정은|한반도|주한미군|ICBM|핵미사일/.test(t)) return '한반도'
  if (/중국|대만|필리핀|미얀마|아프간|파키스탄|인도태평양/.test(t)) return '아시아'
  if (/나토|NATO|유럽|폴란드|발트|우크라이나/.test(t)) return '유럽'
  if (/수단|에티오피아|소말리아|콩고|아프리카/.test(t)) return '아프리카'
  if (/G7|유엔|UN|제재|국제|외무/.test(t)) return '국제'
  return '분쟁'
}

// ─── 데이터 정제 ────────────────────────────────────────────────────
const LIVE_NEWS = RAW_NEWS.map((item, i) => ({
  id: i + 1,
  title: cleanTitle(item.title),
  source: item.source,
  summary: item.summary || item.title,
  date: item.date,
  image: item.image || '',
  url: item.link,
  category: detectCategory(item.title),
}))

// ─── 언론사 썸네일 이미지 ────────────────────────────────────────────
const SOURCE_IMAGES = {
  '한겨레': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
  '조선일보': 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=600&q=80',
  '연합인포맥스': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  '뉴스1': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
  '채널A': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  '문화일보': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
  '오피니언뉴스': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  '의학신문': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
  '메디칼업저버': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80',
  '전국매일신문': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80',
  '한경매거진&북': 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=600&q=80',
  'v.daum.net': 'https://images.unsplash.com/photo-1580092795-bbc19a56fe1f?w=600&q=80',
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1580092795-bbc19a56fe1f?w=600&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=600&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80',
]

function getFallbackImage(news) {
  return SOURCE_IMAGES[news.source] || DEFAULT_IMAGES[news.id % DEFAULT_IMAGES.length]
}

const CATEGORY_COLORS = {
  '중동':      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  '우크라이나': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '한반도':    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  '아시아':    'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '유럽':      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  '아프리카':  'bg-green-500/20 text-green-300 border-green-500/30',
  '국제':      'bg-slate-500/20 text-slate-300 border-slate-500/30',
  '분쟁':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── 뉴스 카드 ───────────────────────────────────────────────────────
function NewsCard({ news, index }) {
  const [imgSrc, setImgSrc] = useState(news.image || getFallbackImage(news))
  const [shared, setShared] = useState(false)

  const handleImgError = () => setImgSrc(getFallbackImage(news))

  const handleKakaoShare = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: news.title,
          description: news.summary,
          imageUrl: imgSrc,
          link: { mobileWebUrl: news.url, webUrl: news.url }
        }
      })
    } else {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const catColor = CATEGORY_COLORS[news.category] || CATEGORY_COLORS['분쟁']

  return (
    <div
      className="animate-fade-in-up group relative bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-700">
        <img
          src={imgSrc}
          alt={news.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${catColor}`}>
          {news.category}
        </span>
        <span className="absolute bottom-3 right-3 text-xs text-slate-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {formatDate(news.date)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {news.source}
        </div>

        <h2 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-red-300 transition-colors duration-200">
          {news.title}
        </h2>

        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-1">
          {news.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-700/50">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            기사 읽기
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <button
            onClick={handleKakaoShare}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              shared
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 hover:bg-yellow-400/20 hover:scale-105'
            }`}
            title="카카오톡으로 공유"
          >
            {shared ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                공유됨
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.569 1.397 4.836 3.545 6.257L4.5 21l4.943-2.722A11.6 11.6 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
                </svg>
                카카오 공유
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 skeleton rounded-full" />
        <div className="h-4 skeleton rounded" />
        <div className="h-4 w-4/5 skeleton rounded" />
        <div className="h-3 skeleton rounded" />
        <div className="h-3 skeleton rounded" />
        <div className="h-3 w-3/4 skeleton rounded" />
      </div>
    </div>
  )
}

const ALL_CATEGORIES = ['전체', ...Array.from(new Set(LIVE_NEWS.map(n => n.category)))]

// ─── 메인 앱 ─────────────────────────────────────────────────────────
export default function App() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [categories, setCategories] = useState(ALL_CATEGORIES)

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('YOUR_KAKAO_APP_KEY')
    }
    const timer = setTimeout(() => {
      setNews(LIVE_NEWS)
      setCategories(['전체', ...Array.from(new Set(LIVE_NEWS.map(n => n.category)))])
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const filtered = news.filter(n => {
    const matchCat = filter === '전체' || n.category === filter
    const matchSearch = !search || n.title.includes(search) || n.summary.includes(search) || n.source.includes(search)
    return matchCat && matchSearch
  })

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setNews([...LIVE_NEWS].sort(() => Math.random() - 0.5))
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
    }, 600)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" async />

      {/* BG decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  전쟁 뉴스 <span className="text-red-500">레이더</span>
                </h1>
                <p className="text-xs text-slate-500">Google News 실시간 크롤링 데이터</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="뉴스 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full sm:w-52 bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 whitespace-nowrap"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
            <span>총 {filtered.length}건</span>
            {lastUpdated && <span>마지막 업데이트: {lastUpdated}</span>}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 hover:scale-105 ${
                filter === cat
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <svg className="w-16 h-16 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">검색 결과가 없습니다</p>
            <p className="text-sm mt-1">다른 검색어나 카테고리를 선택해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item, i) => (
              <NewsCard key={item.id} news={item} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="relative mt-12 border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        <p>📡 Google News RSS 실시간 크롤링 데이터 ({LIVE_NEWS.length}건) · 크롤링 시각: {LIVE_NEWS[0]?.date?.split(' ')[0] || ''}</p>
        <p className="mt-1">실제 기사 링크 클릭 시 Google News를 통해 원문으로 이동합니다.</p>
      </footer>
    </div>
  )
}
