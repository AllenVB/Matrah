import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/invoices', icon: 'description', label: 'Faturalarım' },
    { path: '/reports', icon: 'bar_chart', label: 'Raporlar' },
    { path: '/settings', icon: 'settings', label: 'Ayarlar' },
];

interface Notification {
    id: number;
    icon: string;
    iconColor: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 1, icon: 'check_circle', iconColor: 'text-emerald-500', title: 'Fatura Onaylandı', desc: 'Fatura #1042 AI analizi tamamlandı ve onaylandı.', time: '2 dk önce', read: false },
    { id: 2, icon: 'warning', iconColor: 'text-amber-500', title: 'Düşük Kalite Uyarısı', desc: 'Yüklenen görüntü kalitesi düşük, yeniden yüklemenizi öneriyoruz.', time: '15 dk önce', read: false },
    { id: 3, icon: 'receipt_long', iconColor: 'text-primary', title: 'Yeni Rapor Hazır', desc: 'Mart 2026 vergi raporu indirilmeye hazır.', time: '1 saat önce', read: true },
    { id: 4, icon: 'auto_awesome', iconColor: 'text-violet-500', title: 'AI Güncelleme', desc: 'Görüntü işleme modeli v2.1 olarak güncellendi.', time: '3 saat önce', read: true },
    { id: 5, icon: 'security', iconColor: 'text-slate-500', title: 'Güvenlik', desc: 'Hesabınıza yeni bir cihazdan giriş yapıldı.', time: 'Dün', read: true },
];

const HELP_ITEMS = [
    { icon: 'school', label: 'Başlangıç Rehberi', desc: 'Matrah AI\'ı kullanmaya başlayın.' },
    { icon: 'description', label: 'Dokümantasyon', desc: 'API ve özellik belgeleri.' },
    { icon: 'video_library', label: 'Video Eğitimler', desc: 'Adım adım video rehberler.' },
    { icon: 'forum', label: 'Topluluk Forumu', desc: 'Diğer kullanıcılarla etkileşim kurun.' },
    { icon: 'bug_report', label: 'Hata Bildir', desc: 'Sorunları bize bildirin.' },
    { icon: 'mail', label: 'Destek İletişim', desc: 'destek@matrah.ai' },
];

const SEARCH_SUGGESTIONS = [
    { icon: 'description', label: 'Faturalarım', path: '/invoices' },
    { icon: 'bar_chart', label: 'Raporlar', path: '/reports' },
    { icon: 'add', label: 'Manuel Fatura Girişi', path: '/manual-entry' },
    { icon: 'person', label: 'Profil Ayarları', path: '/profile' },
    { icon: 'settings', label: 'Ayarlar', path: '/settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Dropdown states
    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const notifRef = useRef<HTMLDivElement>(null);
    const helpRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
            if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowHelp(false);
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Keyboard shortcut for search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowNotifications(false);
                setShowHelp(false);
                setShowUserMenu(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const filteredSearch = SEARCH_SUGGESTIONS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get profile info from localStorage
    const savedProfile = localStorage.getItem('matrah_profile');
    const profile = savedProfile ? JSON.parse(savedProfile) : null;
    const userName = profile?.fullName ?? 'Demo Kullanıcı';
    const userRole = profile?.role ?? 'Vergi Sorumlusu';
    const avatarColor = profile?.avatarColor ?? '#137fec';
    const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none">Matrah AI</h1>
                        <p className="text-xs text-slate-500">Akıllı Fatura Analiz</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive =
                            item.path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:translate-x-0.5'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 mt-auto border-t border-slate-200">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200 group cursor-pointer"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-110"
                            style={{ backgroundColor: avatarColor }}
                        >
                            {initials}
                        </div>
                        <div className="overflow-hidden text-left flex-1">
                            <p className="text-sm font-medium truncate">{userName}</p>
                            <p className="text-xs text-slate-500 truncate">{userRole}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-primary transition-colors">chevron_right</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                {/* Header */}
                <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                    {/* Search */}
                    <div ref={searchRef} className="relative flex items-center flex-1 max-w-xl">
                        <div
                            className="relative w-full cursor-pointer"
                            onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                        >
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                ref={searchInputRef}
                                className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-20 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Fatura, rapor veya ayar ara..."
                                type="text"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                                onFocus={() => setShowSearch(true)}
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
                        </div>

                        {/* Search Dropdown */}
                        {showSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-dropdownIn">
                                <div className="p-2">
                                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hızlı Erişim</p>
                                    {filteredSearch.length === 0 ? (
                                        <p className="px-3 py-4 text-sm text-slate-400 text-center">Sonuç bulunamadı.</p>
                                    ) : (
                                        filteredSearch.map(item => (
                                            <button
                                                key={item.path}
                                                onClick={() => { navigate(item.path); setShowSearch(false); setSearchQuery(''); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg text-slate-400">{item.icon}</span>
                                                {item.label}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => { setShowNotifications(!showNotifications); setShowHelp(false); setShowUserMenu(false); }}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors"
                                title="Bildirimler"
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-dropdownIn">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="font-bold text-sm">Bildirimler</h4>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                                                Tümünü Okundu İşaretle
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                        {notifications.map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => markAsRead(n.id)}
                                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-slate-100'}`}>
                                                    <span className={`material-symbols-outlined text-lg ${n.iconColor}`}>{n.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.desc}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                                                </div>
                                                {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2.5 border-t border-slate-100">
                                        <button className="w-full text-center text-xs text-primary font-bold hover:underline">
                                            Tüm Bildirimleri Gör
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Help */}
                        <div ref={helpRef} className="relative">
                            <button
                                onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); setShowUserMenu(false); }}
                                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                title="Yardım & Destek"
                            >
                                <span className="material-symbols-outlined">help</span>
                            </button>

                            {showHelp && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-dropdownIn">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <h4 className="font-bold text-sm">Yardım & Destek</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Size nasıl yardımcı olabiliriz?</p>
                                    </div>
                                    <div className="p-2">
                                        {HELP_ITEMS.map(item => (
                                            <button
                                                key={item.label}
                                                onClick={() => setShowHelp(false)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">{item.label}</p>
                                                    <p className="text-xs text-slate-400">{item.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                                        <p className="text-[10px] text-slate-400 text-center">Matrah AI v2.1 • © 2026</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                        {/* User Menu */}
                        <div ref={userMenuRef} className="relative">
                            <button
                                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowHelp(false); }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Kullanıcı Menüsü"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {initials}
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-dropdownIn">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-bold truncate">{userName}</p>
                                        <p className="text-xs text-slate-500 truncate">{userRole}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg text-slate-400">person</span>
                                            Profil
                                        </button>
                                        <button
                                            onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg text-slate-400">settings</span>
                                            Ayarlar
                                        </button>
                                        <button
                                            onClick={() => { navigate('/reports'); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg text-slate-400">bar_chart</span>
                                            Raporlar
                                        </button>
                                    </div>
                                    <div className="p-1.5 border-t border-slate-100">
                                        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <NavLink
                            to="/invoices"
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 hover:scale-[1.02]"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Yeni Belge
                        </NavLink>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
