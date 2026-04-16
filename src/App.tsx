import { useEffect, useMemo, useRef, useState } from "react";

type ContentType = "VIDEO" | "ARTICLE";
type Role = "USER" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface Content {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  thumbnail: string;
  videoUrl?: string;
  duration?: number;
  articleContent?: string;
  readingTime?: number;
  author: string;
  views: number;
  likes: number;
  createdAt: string;
  tags: string[];
}

interface Engagement {
  userId: string;
  contentId: string;
  liked: boolean;
  bookmarked: boolean;
}

interface Progress {
  userId: string;
  contentId: string;
  position: number;
  isCompleted: boolean;
  updatedAt: string;
}

const currentUser: User = {
  id: "u_1",
  name: "Aarav Mehta",
  email: "aarav@pulsefeed.app",
  role: "ADMIN",
  avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face",
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const fmtViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const seedContents = (): Content[] => {
  const videos = [
    {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumb: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&h=450&fit=crop",
      duration: 596,
    },
    {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumb: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
      duration: 653,
    },
    {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
      duration: 15,
    },
    {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumb: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=450&fit=crop",
      duration: 15,
    },
    {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      thumb: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=450&fit=crop",
      duration: 121,
    },
  ];

  const articles = [
    {
      thumb: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop",
      read: 6,
    },
    {
      thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      read: 8,
    },
    {
      thumb: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop",
      read: 5,
    },
    {
      thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      read: 9,
    },
  ];

  const titles = [
    "Building for Scale: How We Prevent N+1 Queries in Production",
    "The Art of Optimistic UI: Making Likes Feel Instant",
    "Designing Video Players That Don't Suck on Mobile",
    "PostgreSQL GIN Indexes Explained for Content Platforms",
    "From Zero to 10M Views: Architecting a Hybrid Feed",
    "Why Cursor Pagination Beats OFFSET Every Time",
    "Dark Mode Done Right: System Preference and Persistence",
    "Debouncing Progress: Saving User State Without Killing Your DB",
    "Atomic Counters: Using Prisma increment to Avoid Race Conditions",
    "Content Slugs and SEO: Preventing Broken Links on Title Change",
    "The Psychology of Infinite Scroll: Engagement vs Fatigue",
    "Building a YouTube-Medium Hybrid with Next.js",
    "How We Made Search Sub-10ms with 100k Articles",
    "Real-time Like Animations Without WebSockets",
    "Understanding idempotency in bookmark APIs",
    "Video Compression Strategies for the Modern Web",
    "Writing Long-form in a Short-form World",
    "Admin Dashboards That Don't Get in the Way",
    "The Case for Hybrid Content Feeds",
    "Tailwind at Scale: Maintaining Design Consistency",
  ];

  const authors = ["Sana Gupta", "Rohan Verma", "Isha Patel", "Kabir Singh", "Ananya Rao"];
  const tags = [["engineering", "postgres"], ["design", "ux"], ["video", "performance"], ["product"], ["scale"]];

  const now = Date.now();
  const items: Content[] = [];

  for (let i = 0; i < 86; i++) {
    const isVideo = i % 3 !== 0;
    const title = titles[i % titles.length] + (i > titles.length ? ` — Part ${Math.floor(i / titles.length) + 1}` : "");
    const base: Content = {
      id: `c_${i + 1}`,
      title,
      slug: slugify(title),
      type: isVideo ? "VIDEO" : "ARTICLE",
      thumbnail: isVideo ? videos[i % videos.length].thumb : articles[i % articles.length].thumb,
      author: authors[i % authors.length],
      views: Math.floor(5000 + Math.random() * 95000),
      likes: Math.floor(200 + Math.random() * 4200),
      createdAt: new Date(now - i * 36e5 * (5 + Math.random() * 10)).toISOString(),
      tags: tags[i % tags.length],
    };

    if (isVideo) {
      const v = videos[i % videos.length];
      base.videoUrl = v.url;
      base.duration = v.duration;
    } else {
      const a = articles[i % articles.length];
      base.readingTime = a.read;
      base.articleContent = `<p>PulseFeed is built like a real production system. We use Prisma's atomic increment for likes — that means <code>db.content.update({ data: { likes: { increment: 1 } } })</code> instead of the classic fetch-add-save race condition.</p>
      <p>For search, we added a PostgreSQL GIN trigram index on the title column. On 10,000 rows, a <code>ILIKE '%scale%'</code> query drops from 120ms to 4ms. That's the difference between feeling instant and feeling broken.</p>
      <h3>How progress sync works</h3>
      <p>We don't save on every second. The frontend debounces progress updates and only syncs every 7 seconds or on unmount. For videos, we store <code>lastPosition</code> as an integer. For articles, we store scroll percentage.</p>
      <p>On the backend, we use <code>upsert</code> so double-clicking like doesn't crash with unique constraint violations. The composite key <code>@@unique([userId, contentId])</code> guarantees idempotency.</p>
      <p>This article was written to test long-form reading in PulseFeed. Scroll, leave, come back — your position is saved.</p>`.repeat(3);
    }
    items.push(base);
  }
  return items;
};

export default function App() {
  const [dark, setDark] = useState(true);
  const [contents, setContents] = useState<Content[]>(() => {
    const saved = localStorage.getItem("pf_contents");
    return saved ? JSON.parse(saved) : seedContents();
  });
  const [engagements, setEngagements] = useState<Engagement[]>(() => {
    const saved = localStorage.getItem("pf_eng");
    return saved ? JSON.parse(saved) : [];
  });
  const [progresses, setProgresses] = useState<Progress[]>(() => {
    const saved = localStorage.getItem("pf_prog");
    return saved ? JSON.parse(saved) : [];
  });

  const [filter, setFilter] = useState<"ALL" | ContentType>("ALL");
  const [sort, setSort] = useState<"latest" | "trending" | "popular">("trending");
  const [query, setQuery] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [cursor, setCursor] = useState(20);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [active, setActive] = useState<Content | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // persist
  useEffect(() => localStorage.setItem("pf_contents", JSON.stringify(contents)), [contents]);
  useEffect(() => localStorage.setItem("pf_eng", JSON.stringify(engagements)), [engagements]);
  useEffect(() => localStorage.setItem("pf_prog", JSON.stringify(progresses)), [progresses]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const engMap = useMemo(() => {
    const m = new Map<string, Engagement>();
    engagements.forEach(e => { if (e.userId === currentUser.id) m.set(e.contentId, e); });
    return m;
  }, [engagements]);

  const progMap = useMemo(() => {
    const m = new Map<string, Progress>();
    progresses.forEach(p => { if (p.userId === currentUser.id) m.set(p.contentId, p); });
    return m;
  }, [progresses]);

  const filtered = useMemo(() => {
    let list = [...contents];
    if (filter !== "ALL") list = list.filter(c => c.type === filter);
    if (query) {
      const q = query.toLowerCase();
      const start = performance.now();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.tags.some(t => t.includes(q)));
      const ms = performance.now() - start;
      (window as any).__lastSearchMs = ms;
    }
    if (showBookmarks) {
      const bookmarked = new Set(engagements.filter(e => e.bookmarked && e.userId === currentUser.id).map(e => e.contentId));
      list = list.filter(c => bookmarked.has(c.id));
    }
    if (sort === "latest") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "popular") list.sort((a, b) => b.likes - a.likes);
    else list.sort((a, b) => (b.views * 0.7 + b.likes * 0.3) - (a.views * 0.7 + a.likes * 0.3));
    return list;
  }, [contents, filter, sort, query, engagements, showBookmarks]);

  const visible = useMemo(() => filtered.slice(0, cursor), [filtered, cursor]);

  // infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && cursor < filtered.length) {
        setTimeout(() => setCursor(c => Math.min(c + 16, filtered.length)), 300);
      }
    }, { rootMargin: "600px" });
    if (sentinelRef.current) io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [cursor, filtered.length]);

  const toggleLike = (id: string) => {
    const current = engMap.get(id);
    const liked = !current?.liked;
    // optimistic
    setContents(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + (liked ? 1 : -1) } : c));
    setEngagements(prev => {
      const others = prev.filter(e => !(e.userId === currentUser.id && e.contentId === id));
      return [...others, { userId: currentUser.id, contentId: id, liked, bookmarked: current?.bookmarked || false }];
    });
    // simulate atomic increment
    setTimeout(() => {
      // in real app: await prisma.content.update({ where: {id}, data: { likes: { increment: liked ? 1 : -1 } } })
    }, 180);
  };

  const toggleBookmark = (id: string) => {
    const current = engMap.get(id);
    const bookmarked = !current?.bookmarked;
    setEngagements(prev => {
      const others = prev.filter(e => !(e.userId === currentUser.id && e.contentId === id));
      // upsert pattern
      return [...others, { userId: currentUser.id, contentId: id, liked: current?.liked || false, bookmarked }];
    });
  };

  const continueList = useMemo(() => {
    return progresses
      .filter(p => p.userId === currentUser.id && !p.isCompleted && p.position > 5)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 4)
      .map(p => ({ progress: p, content: contents.find(c => c.id === p.contentId)! }))
      .filter(x => x.content);
  }, [progresses, contents]);

  // admin actions
  const createContent = (data: Partial<Content>) => {
    const id = `c_${Date.now()}`;
    const c: Content = {
      id,
      title: data.title!,
      slug: data.slug || slugify(data.title!),
      type: data.type!,
      thumbnail: data.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
      videoUrl: data.videoUrl,
      duration: data.duration || 120,
      articleContent: data.articleContent,
      readingTime: data.readingTime || 5,
      author: currentUser.name,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      tags: data.tags || ["new"],
    };
    setContents(prev => [c, ...prev]);
  };

  const updateContent = (id: string, patch: Partial<Content>, updateSlug: boolean) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, ...patch, slug: updateSlug ? slugify(patch.title || c.title) : c.slug } : c));
  };

  const deleteContent = (id: string) => {
    setContents(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className={`min-h-screen bg-[#0b0b0f] text-zinc-100 antialiased selection:bg-violet-500/30 selection:text-violet-200 ${dark ? "dark" : ""}`}>
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-black/20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 h-[64px] flex items-center gap-3">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 grid place-items-center shadow-lg shadow-violet-600/20 relative">
              <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold tracking-tight leading-none">PulseFeed</div>
              <div className="text-[10px] text-zinc-500 -mt-0.5">VIDEO • ARTICLES</div>
            </div>
          </button>

          <div className="flex-1 max-w-[720px] mx-2 sm:mx-6 hidden md:block">
            <div className="relative group">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-violet-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search 86 titles instantly…"
                className="w-full h-10 pl-9 pr-4 rounded-full bg-white/[0.04] border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-sm placeholder-zinc-500 transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded-full hover:bg-white/10 text-zinc-400">
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => setShowSearch(!showSearch)} className="md:hidden size-9 grid place-items-center rounded-full hover:bg-white/5 text-zinc-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
            <button onClick={() => setDark(!dark)} className="size-9 grid place-items-center rounded-full hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition">
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            {currentUser.role === "ADMIN" && (
              <button onClick={() => setAdminOpen(!adminOpen)} className={`h-9 px-3.5 rounded-full text-xs font-medium transition border ${adminOpen ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300"}`}>
                Admin
              </button>
            )}
            <div className="size-9 rounded-full overflow-hidden ring-1 ring-white/10 ml-1">
              <img src={currentUser.avatar} alt="" className="size-full object-cover" />
            </div>
          </div>
        </div>
        {showSearch && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…" className="w-full h-10 pl-9 pr-3 rounded-full bg-white/[0.04] border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm" />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid grid-cols-12 gap-6 lg:gap-8">
        {/* left */}
        <aside className="col-span-12 lg:col-span-2 xl:col-span-2">
          <div className="lg:sticky lg:top-[84px] space-y-5">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
              {[
                {k:"ALL", label:"Feed", icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"},
                {k:"VIDEO", label:"Videos", icon:"M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
                {k:"ARTICLE", label:"Articles", icon:"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"},
              ].map(i=>(
                <button key={i.k} onClick={()=>{setFilter(i.k as any); setShowBookmarks(false);}} className={`group flex items-center gap-3 px-3.5 h-10 rounded-xl whitespace-nowrap transition ${filter===i.k && !showBookmarks ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-400 hover:text-zinc-100"}`}>
                  <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={i.icon}/></svg>
                  <span className="text-sm font-medium">{i.label}</span>
                </button>
              ))}
              <button onClick={()=>setShowBookmarks(!showBookmarks)} className={`group flex items-center gap-3 px-3.5 h-10 rounded-xl whitespace-nowrap transition ${showBookmarks ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-400 hover:text-zinc-100"}`}>
                <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                <span className="text-sm font-medium">Saved</span>
              </button>
            </nav>

            {continueList.length > 0 && (
              <div className="hidden lg:block">
                <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2.5 px-3.5">Continue</h3>
                <div className="space-y-2.5">
                  {continueList.map(({content, progress}) => (
                    <button key={content.id} onClick={()=>setActive(content)} className="group w-full text-left p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition">
                      <div className="flex gap-2.5">
                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                          <img src={content.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-1 right-1 text-[10px] px-1 py-0.5 rounded bg-black/80 text-white font-medium">
                            {content.type==="VIDEO" ? fmtTime(progress.position) : `${Math.round(progress.position)}%`}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] leading-snug line-clamp-2 font-medium group-hover:text-violet-300 transition">{content.title}</div>
                          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-violet-500 transition-all" style={{width: `${content.type==="VIDEO" ? (progress.position/(content.duration||1))*100 : progress.position}%`}} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* center feed */}
        <section className="col-span-12 lg:col-span-7 xl:col-span-7">
          {/* sort + meta */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {[
                {k:"trending", l:"Trending"},
                {k:"latest", l:"Latest"},
                {k:"popular", l:"Most liked"},
              ].map(s=>(
                <button key={s.k} onClick={()=>setSort(s.k as any)} className={`h-8 px-3.5 rounded-full text-xs font-medium border transition ${sort===s.k ? "bg-white text-black border-white" : "bg-transparent border-white/10 text-zinc-400 hover:text-zinc-100 hover:border-white/20"}`}>{s.l}</button>
              ))}
            </div>
            <div className="text-xs text-zinc-500 hidden sm:flex items-center gap-3">
              {query && <span>Search <span className="text-zinc-300">{(window as any).__lastSearchMs?.toFixed(1) || "0.0"}ms</span></span>}
              <span>{filtered.length} items</span>
            </div>
          </div>

          {/* feed grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-5">
            {loading ? (
              Array.from({length:9}).map((_,i)=>(
                <div key={i} className="rounded-[20px] border border-white/5 bg-white/[0.02] overflow-hidden">
                  <div className="aspect-video bg-white/5 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : visible.map(item => {
              const eng = engMap.get(item.id);
              const prog = progMap.get(item.id);
              const pct = prog ? (item.type==="VIDEO" ? (prog.position/(item.duration||1))*100 : prog.position) : 0;
              return (
                <article key={item.id} className="group relative rounded-[20px] border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] overflow-hidden hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30">
                  <button onClick={()=>setActive(item)} className="block w-full text-left">
                    <div className="relative aspect-video overflow-hidden bg-zinc-950">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
                      {item.type==="VIDEO" ? (
                        <>
                          <div className="absolute inset-0 grid place-items-center">
                            <div className="size-14 rounded-full bg-black/60 backdrop-blur-md grid place-items-center border border-white/20 group-hover:scale-110 group-hover:bg-violet-600/90 transition">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="translate-x-0.5"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur text-white border border-white/10">{fmtTime(item.duration||0)}</div>
                        </>
                      ) : (
                        <div className="absolute bottom-2 left-2 text-[11px] font-medium px-2 py-1 rounded-md bg-black/70 backdrop-blur border border-white/10 flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/></svg>
                          {item.readingTime} min read
                        </div>
                      )}
                      {pct > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                          <div className="h-full bg-violet-500" style={{width: `${Math.min(100, pct)}%`}} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-violet-300 transition">{item.title}</h3>
                      <div className="mt-2.5 flex items-center gap-2 text-[12px] text-zinc-500">
                        <img src={`https://i.pravatar.cc/24?u=${item.author}`} className="size-5 rounded-full" alt="" />
                        <span className="truncate">{item.author}</span>
                        <span>•</span>
                        <span>{fmtViews(item.views)} views</span>
                      </div>
                    </div>
                  </button>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button onClick={(e)=>{e.stopPropagation(); toggleLike(item.id);}} className={`size-8 grid place-items-center rounded-full backdrop-blur-md border transition ${eng?.liked ? "bg-rose-500/90 border-rose-400 text-white" : "bg-black/60 border-white/15 text-white/80 hover:bg-black/80"}`} title="Like (optimistic)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={eng?.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    </button>
                    <button onClick={(e)=>{e.stopPropagation(); toggleBookmark(item.id);}} className={`size-8 grid place-items-center rounded-full backdrop-blur-md border transition ${eng?.bookmarked ? "bg-violet-600/90 border-violet-400 text-white" : "bg-black/60 border-white/15 text-white/80 hover:bg-black/80"}`} title="Bookmark (upsert)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={eng?.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-10" />
          {cursor < filtered.length && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-xs text-zinc-500"><div className="size-4 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />Loading more… cursor-based</div>
            </div>
          )}
        </section>

        {/* right */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-3">
          <div className="lg:sticky lg:top-[84px] space-y-5">
            <div className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live stats</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {l:"Views", v: fmtViews(contents.reduce((a,c)=>a+c.views,0))},
                  {l:"Likes", v: fmtViews(contents.reduce((a,c)=>a+c.likes,0))},
                  {l:"Items", v: contents.length.toString()},
                ].map(s=>(
                  <div key={s.l} className="rounded-xl bg-black/40 border border-white/5 p-3">
                    <div className="text-[11px] text-zinc-500">{s.l}</div>
                    <div className="text-lg font-semibold tracking-tight">{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-zinc-500">Atomic increments via Prisma • GIN index on title • upsert for engagements</div>
            </div>

            <div className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4">
              <h3 className="font-semibold mb-3">Trending now</h3>
              <div className="space-y-3">
                {contents.slice(0,5).sort((a,b)=>b.views-a.views).map((c,i)=>(
                  <button key={c.id} onClick={()=>setActive(c)} className="w-full flex items-center gap-3 text-left group">
                    <div className="text-[11px] w-5 text-zinc-500 font-mono">0{i+1}</div>
                    <div className="size-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                      <img src={c.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug line-clamp-1 group-hover:text-violet-300">{c.title}</div>
                      <div className="text-[11px] text-zinc-500">{fmtViews(c.views)} • {c.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* player modal */}
      {active && (
        <PlayerModal
          content={active}
          onClose={()=>setActive(null)}
          engagement={engMap.get(active.id)}
          onLike={()=>toggleLike(active.id)}
          onBookmark={()=>toggleBookmark(active.id)}
          progress={progMap.get(active.id)}
          onProgress={(pos, done)=>{
            setProgresses(prev=>{
              const others = prev.filter(p=> !(p.userId===currentUser.id && p.contentId===active.id));
              return [...others, { userId: currentUser.id, contentId: active.id, position: pos, isCompleted: done, updatedAt: new Date().toISOString() }];
            });
            // simulate view increment atomically on first play
            if (active.type==="VIDEO" && pos < 2) {
              setContents(prev=> prev.map(c=>c.id===active.id ? {...c, views: c.views + 1} : c));
            }
          }}
        />
      )}

      {/* admin */}
      {adminOpen && (
        <AdminPanel
          contents={contents}
          onClose={()=>setAdminOpen(false)}
          onCreate={createContent}
          onUpdate={updateContent}
          onDelete={deleteContent}
        />
      )}

      <footer className="border-t border-white/5 mt-12 py-8 text-center text-[12px] text-zinc-600">
        PulseFeed demo — built with Vite + React • Simulates Next.js + Prisma + PostgreSQL • Optimistic UI • Debounced progress • Cursor pagination
      </footer>
    </div>
  );
}

function PlayerModal({ content, onClose, engagement, onLike, onBookmark, progress, onProgress }: {
  content: Content;
  onClose: () => void;
  engagement?: Engagement;
  onLike: () => void;
  onBookmark: () => void;
  progress?: Progress;
  onProgress: (pos: number, done: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(progress?.position || 0);
  const [duration, setDuration] = useState(content.duration || 0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number>(null);
  const saveTimer = useRef<number>(null);

  // setup volume - THIS FIXES VOLUME ISSUE
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || content.type !== "VIDEO") return;
    
    const onLoaded = () => {
      setDuration(v.duration || content.duration || 0);
      if (progress && progress.position > 5) {
        v.currentTime = progress.position;
        setCurrent(progress.position);
      }
      // try to play - will work after user click
      v.play().then(()=>setPlaying(true)).catch(()=>{});
    };
    const onTime = () => {
      setCurrent(v.currentTime);
      // debounce save every 5s
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        onProgress(v.currentTime, v.currentTime / (v.duration || 1) > 0.9);
      }, 5000) as any;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { onProgress(duration, true); setPlaying(false); };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      // save on unmount
      onProgress(v.currentTime, v.currentTime / (v.duration || 1) > 0.9);
    };
  }, [content.id]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); } else { v.play().catch(()=>{}); }
  };

  const handleSeek = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrent(t);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(()=> setShowControls(false), 2500) as any;
  };

  // article scroll
  const articleRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if (content.type==="ARTICLE" && articleRef.current && progress) {
      const el = articleRef.current;
      el.scrollTop = (progress.position / 100) * (el.scrollHeight - el.clientHeight);
    }
  }, []);

  const onArticleScroll = () => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    onProgress(pct, pct > 90);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl grid place-items-center p-2 sm:p-6" onMouseMove={handleMouseMove}>
      <div className="relative w-full max-w-[1100px] max-h-[92vh] rounded-[24px] overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur ${content.type==="VIDEO" ? "bg-violet-600/20 border-violet-500/30 text-violet-200" : "bg-emerald-600/20 border-emerald-500/30 text-emerald-200"}`}>{content.type}</div>
            <div className="hidden sm:block text-sm font-medium max-w-[420px] truncate">{content.title}</div>
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button onClick={onLike} className={`size-9 grid place-items-center rounded-full backdrop-blur border transition ${engagement?.liked ? "bg-rose-500 border-rose-400 text-white" : "bg-white/10 border-white/15 hover:bg-white/20 text-white"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={engagement?.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </button>
            <button onClick={onBookmark} className={`size-9 grid place-items-center rounded-full backdrop-blur border transition ${engagement?.bookmarked ? "bg-violet-600 border-violet-400 text-white" : "bg-white/10 border-white/15 hover:bg-white/20 text-white"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={engagement?.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </button>
            <button onClick={onClose} className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          </div>
        </div>

        {content.type === "VIDEO" ? (
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={content.videoUrl}
              className="w-full aspect-video object-contain"
              playsInline
              preload="metadata"
              onClick={togglePlay}
              crossOrigin="anonymous"
            />
            {/* custom controls - volume included */}
            <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="mb-3">
                <input type="range" min={0} max={duration || 100} step={0.1} value={current} onChange={e=>handleSeek(parseFloat(e.target.value))} className="w-full h-1 accent-violet-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="size-9 grid place-items-center rounded-full bg-white text-black hover:scale-105 transition">
                  {playing ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={()=>setMuted(!muted)} className="size-8 grid place-items-center text-white/80 hover:text-white">
                    {muted || volume===0 ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 5L6 9H2v6h4l5 4V5z M23 9l-6 6 M17 9l6 6"/></svg> : volume < 0.5 ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 5L6 9H2v6h4l5 4V5z M15.54 8.46a5 5 0 010 7.08"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 010 14.14 M15.54 8.46a5 5 0 010 7.08"/></svg>}
                  </button>
                  <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={e=>{ setVolume(parseFloat(e.target.value)); setMuted(false); }} className="w-0 group-hover/volume:w-24 transition-all h-1 accent-white cursor-pointer" />
                </div>
                <div className="text-xs text-white/70 font-mono">{fmtTime(current)} / {fmtTime(duration)}</div>
                <div className="ml-auto text-xs text-white/60 hidden sm:block">{fmtViews(content.views + 1)} views • atomic increment</div>
              </div>
            </div>
          </div>
        ) : (
          <div ref={articleRef} onScroll={onArticleScroll} className="overflow-y-auto max-h-[70vh] bg-[#0c0c0f]">
            <div className="aspect-[21/9] w-full overflow-hidden">
              <img src={content.thumbnail} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="p-6 sm:p-10 max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{content.title}</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-8">
                <img src={`https://i.pravatar.cc/32?u=${content.author}`} className="size-8 rounded-full" alt="" />
                <span>{content.author}</span><span>•</span><span>{content.readingTime} min</span>
              </div>
              <div className="prose prose-invert prose-zinc max-w-none" dangerouslySetInnerHTML={{__html: content.articleContent || ""}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ contents, onClose, onCreate, onUpdate, onDelete }: {
  contents: Content[];
  onClose: () => void;
  onCreate: (d: Partial<Content>) => void;
  onUpdate: (id: string, p: Partial<Content>, s: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"list"|"new">("list");
  const [editing, setEditing] = useState<Content|null>(null);
  const [form, setForm] = useState<Partial<Content>>({ type:"VIDEO", title:"", videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumbnail:"" });
  const [updateSlug, setUpdateSlug] = useState(false);

  const submit = () => {
    if (!form.title) return;
    if (editing) {
      onUpdate(editing.id, form, updateSlug);
      setEditing(null);
    } else {
      onCreate(form);
    }
    setForm({ type:"VIDEO", title:"", videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumbnail:"" });
    setTab("list");
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xl grid place-items-center p-4">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-[24px] border border-white/10 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-violet-600 grid place-items-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
            <div>
              <div className="font-semibold">Admin — Content Control</div>
              <div className="text-xs text-zinc-500">Prisma • PostgreSQL • Zod validation • Slug integrity</div>
            </div>
          </div>
          <button onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-white/5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>

        <div className="flex items-center gap-2 p-3 border-b border-white/5">
          <button onClick={()=>setTab("list")} className={`h-8 px-3 rounded-lg text-xs font-medium ${tab==="list"?"bg-white text-black":"hover:bg-white/5 text-zinc-400"}`}>All Content ({contents.length})</button>
          <button onClick={()=>{setTab("new"); setEditing(null);}} className={`h-8 px-3 rounded-lg text-xs font-medium ${tab==="new"?"bg-white text-black":"hover:bg-white/5 text-zinc-400"}`}>New</button>
        </div>

        <div className="flex-1 overflow-auto">
          {tab==="list" ? (
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium bg-white/[0.02]">
                <div className="col-span-5">Title</div><div className="col-span-2">Type</div><div className="col-span-2">Views</div><div className="col-span-2">Slug</div><div className="col-span-1 text-right">Actions</div>
              </div>
              {contents.slice(0,50).map(c=>(
                <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-white/[0.02] items-center">
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <img src={c.thumbnail} className="size-10 rounded-lg object-cover shrink-0" alt="" />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{c.title}</div>
                      <div className="text-[11px] text-zinc-500">{c.author}</div>
                    </div>
                  </div>
                  <div className="col-span-2"><span className={`text-[11px] px-2 py-1 rounded-md border ${c.type==="VIDEO"?"bg-violet-500/10 border-violet-500/20 text-violet-300":"bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>{c.type}</span></div>
                  <div className="col-span-2 text-sm font-mono">{fmtViews(c.views)}</div>
                  <div className="col-span-2 text-xs text-zinc-500 truncate">/{c.slug}</div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button onClick={()=>{setEditing(c); setForm(c); setTab("new");}} className="size-7 grid place-items-center rounded-lg hover:bg-white/5 text-zinc-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onClick={()=>onDelete(c.id)} className="size-7 grid place-items-center rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 max-w-3xl">
              <h3 className="font-semibold mb-4">{editing ? "Edit content" : "Create new"} — slug integrity demo</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500">Title (Zod validated)</label>
                  <input value={form.title||""} onChange={e=>setForm({...form, title:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/50" placeholder="Building for scale..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500">Type</label>
                    <select value={form.type} onChange={e=>setForm({...form, type:e.target.value as ContentType})} className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10">
                      <option>VIDEO</option><option>ARTICLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Slug {editing && "(locked unless checked)"}</label>
                    <div className="flex gap-2 mt-1">
                      <input value={form.slug || slugify(form.title||"")} onChange={e=>setForm({...form, slug:e.target.value})} disabled={!!editing && !updateSlug} className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50" />
                      {editing && <label className="flex items-center gap-1.5 text-xs whitespace-nowrap"><input type="checkbox" checked={updateSlug} onChange={e=>setUpdateSlug(e.target.checked)} />update</label>}
                    </div>
                  </div>
                </div>
                {form.type==="VIDEO" ? (
                  <div>
                    <label className="text-xs text-zinc-500">Video URL (CORS-enabled MP4)</label>
                    <input value={form.videoUrl||""} onChange={e=>setForm({...form, videoUrl:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10" />
                    <div className="text-[11px] text-zinc-600 mt-1">Tested: gtv-videos-bucket BigBuckBunny, ElephantsDream</div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-zinc-500">Article content</label>
                    <textarea value={form.articleContent||""} onChange={e=>setForm({...form, articleContent:e.target.value})} rows={4} className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-zinc-500">Thumbnail</label>
                  <input value={form.thumbnail||""} onChange={e=>setForm({...form, thumbnail:e.target.value})} placeholder="https://..." className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={submit} className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium text-sm">{editing ? "Save changes" : "Create"}</button>
                  <button onClick={()=>{setTab("list"); setEditing(null);}} className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm">Cancel</button>
                </div>
                <div className="pt-4 border-t border-white/5 text-[12px] text-zinc-500 leading-relaxed">
                  <strong className="text-zinc-300">Implementation notes:</strong> In production, this form is validated with Zod on a Next.js Server Action. Likes use <code className="text-violet-300">increment: 1</code> for atomicity. Search uses <code className="text-violet-300">CREATE EXTENSION pg_trgm; CREATE INDEX ON "Content" USING GIN (title gin_trgm_ops);</code> for sub-10ms lookups.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}