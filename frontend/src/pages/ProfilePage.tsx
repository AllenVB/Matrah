import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../components/AppLayout';

interface UserProfile {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    taxId: string;
    companyType: string;
    address: string;
    city: string;
    role: string;
    avatarColor: string;
}

const AVATAR_COLORS = [
    '#137fec', '#0b6dd4', '#0a57ab', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
];

const COMPANY_TYPES = [
    { value: 'SOLE_PROPRIETORSHIP', label: 'Şahıs Şirketi' },
    { value: 'LIMITED', label: 'Limited Şirket' },
    { value: 'JOINT_STOCK', label: 'Anonim Şirket' },
    { value: 'COOPERATIVE', label: 'Kooperatif' },
    { value: 'FREELANCER', label: 'Serbest Meslek' },
];

export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'security' | 'preferences'>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('matrah_profile');
        if (saved) return JSON.parse(saved);
        return {
            fullName: 'Demo Kullanıcı',
            email: 'demo@matrah.ai',
            phone: '+90 555 123 4567',
            companyName: 'Matrah Teknoloji A.Ş.',
            taxId: '1234567890',
            companyType: 'LIMITED',
            address: 'Levent Mah. İş Kuleleri No:12',
            city: 'İstanbul',
            role: 'Vergi Sorumlusu',
            avatarColor: '#137fec',
        };
    });

    const [editForm, setEditForm] = useState<UserProfile>(profile);

    // Preferences
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('matrah_darkmode') === 'true');
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [autoAnalysis, setAutoAnalysis] = useState(true);
    const [language, setLanguage] = useState('tr');

    // Security
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        localStorage.setItem('matrah_profile', JSON.stringify(profile));
    }, [profile]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 800));
        setProfile(editForm);
        setIsEditing(false);
        setIsSaving(false);
        toast.success('Profil bilgileri güncellendi!');
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Tüm şifre alanlarını doldurun.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Şifre en az 6 karakter olmalı.');
            return;
        }
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 800));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsSaving(false);
        toast.success('Şifre başarıyla güncellendi!');
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        localStorage.setItem('matrah_darkmode', darkMode.toString());
        await new Promise(r => setTimeout(r, 500));
        setIsSaving(false);
        toast.success('Tercihler kaydedildi!');
    };

    const startEditing = () => {
        setEditForm({ ...profile });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

    const sections = [
        { id: 'profile' as const, icon: 'person', label: 'Kişisel Bilgiler' },
        { id: 'company' as const, icon: 'business', label: 'Şirket Bilgileri' },
        { id: 'security' as const, icon: 'lock', label: 'Güvenlik' },
        { id: 'preferences' as const, icon: 'tune', label: 'Tercihler' },
    ];

    const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <AppLayout>
            <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-8 space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: profile.avatarColor }}
                    >
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{profile.fullName}</h1>
                        <p className="text-slate-500 mt-0.5">{profile.role} • {profile.companyName}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                Aktif
                            </span>
                            <span className="text-xs text-slate-400">Son giriş: Bugün, 15:30</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <div className="card p-2 space-y-1">
                            {sections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setActiveSection(s.id); setIsEditing(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSection === s.id
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="card p-4 mt-4 space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Hesap Özeti</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Üyelik</span>
                                <span className="text-sm font-bold text-primary">Pro</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Fatura Limiti</span>
                                <span className="text-sm font-bold">∞</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">API Kullanımı</span>
                                <span className="text-sm font-bold">245 / 1000</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '24.5%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="card animate-slideUp">
                                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">Kişisel Bilgiler</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">Hesap bilgilerinizi görüntüleyin ve güncelleyin.</p>
                                    </div>
                                    {!isEditing ? (
                                        <button onClick={startEditing} className="btn-outline text-sm">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            Düzenle
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={cancelEditing} className="btn-outline text-sm">İptal</button>
                                            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary text-sm">
                                                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Avatar Color Picker */}
                                    {isEditing && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-3">Avatar Rengi</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {AVATAR_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setEditForm({ ...editForm, avatarColor: color })}
                                                        className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${editForm.avatarColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.fullName}
                                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.fullName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.phone}
                                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.phone}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Unvan / Rol</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.role}
                                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.role}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Section */}
                        {activeSection === 'company' && (
                            <div className="card animate-slideUp">
                                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">Şirket Bilgileri</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">Vergi hesaplamalarında kullanılan şirket bilgileriniz.</p>
                                    </div>
                                    {!isEditing ? (
                                        <button onClick={startEditing} className="btn-outline text-sm">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            Düzenle
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={cancelEditing} className="btn-outline text-sm">İptal</button>
                                            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary text-sm">
                                                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Şirket Adı</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.companyName}
                                                    onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.companyName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vergi Kimlik No</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.taxId}
                                                    onChange={e => setEditForm({ ...editForm, taxId: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.taxId}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Şirket Türü</label>
                                            {isEditing ? (
                                                <select
                                                    className="input-field"
                                                    value={editForm.companyType}
                                                    onChange={e => setEditForm({ ...editForm, companyType: e.target.value })}
                                                >
                                                    {COMPANY_TYPES.map(ct => (
                                                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">
                                                    {COMPANY_TYPES.find(ct => ct.value === profile.companyType)?.label ?? profile.companyType}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Şehir</label>
                                            {isEditing ? (
                                                <input
                                                    className="input-field"
                                                    value={editForm.city}
                                                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.city}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                                        {isEditing ? (
                                            <textarea
                                                className="input-field min-h-[80px] resize-none"
                                                value={editForm.address}
                                                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg px-4 py-2.5">{profile.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6 animate-slideUp">
                                <div className="card">
                                    <div className="px-6 py-4 border-b border-slate-200">
                                        <h3 className="font-bold text-lg">Şifre Değiştir</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">Hesap güvenliğiniz için güçlü bir şifre kullanın.</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mevcut Şifre</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                placeholder="••••••••"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Yeni Şifre</label>
                                                <input
                                                    type="password"
                                                    className="input-field"
                                                    placeholder="••••••••"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Şifre Tekrar</label>
                                                <input
                                                    type="password"
                                                    className="input-field"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button onClick={handleChangePassword} disabled={isSaving} className="btn-primary text-sm">
                                                {isSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sessions */}
                                <div className="card">
                                    <div className="px-6 py-4 border-b border-slate-200">
                                        <h3 className="font-bold text-lg">Aktif Oturumlar</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <div className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <span className="material-symbols-outlined">computer</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">Windows • Chrome 122</p>
                                                <p className="text-xs text-slate-500">İstanbul, Türkiye — Aktif oturum</p>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" />
                                                Şu an
                                            </span>
                                        </div>
                                        <div className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined">phone_iphone</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">iPhone • Safari</p>
                                                <p className="text-xs text-slate-500">İstanbul, Türkiye — 2 gün önce</p>
                                            </div>
                                            <button className="text-xs text-red-600 font-bold hover:underline">Sonlandır</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Section */}
                        {activeSection === 'preferences' && (
                            <div className="card animate-slideUp">
                                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">Tercihler</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">Uygulama tercihlerinizi özelleştirin.</p>
                                    </div>
                                    <button onClick={handleSavePreferences} disabled={isSaving} className="btn-primary text-sm">
                                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {/* Language */}
                                    <div className="px-6 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Dil</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Uygulamanın görüntüleme dili.</p>
                                        </div>
                                        <select
                                            className="input-field w-40"
                                            value={language}
                                            onChange={e => setLanguage(e.target.value)}
                                        >
                                            <option value="tr">Türkçe</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>

                                    {/* Dark Mode */}
                                    <div className="px-6 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Karanlık Mod</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Göz yorgunluğunu azaltan koyu tema.</p>
                                        </div>
                                        <button
                                            onClick={() => setDarkMode(!darkMode)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Email Notifications */}
                                    <div className="px-6 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">E-posta Bildirimleri</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Fatura durumu ve rapor bildirimleri.</p>
                                        </div>
                                        <button
                                            onClick={() => setEmailNotif(!emailNotif)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${emailNotif ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${emailNotif ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Push Notifications */}
                                    <div className="px-6 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Anlık Bildirimler</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Tarayıcı üzerinden anlık bildirim alın.</p>
                                        </div>
                                        <button
                                            onClick={() => setPushNotif(!pushNotif)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${pushNotif ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${pushNotif ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Auto Analysis */}
                                    <div className="px-6 py-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">Otomatik AI Analizi</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Yüklenen belgeleri otomatik olarak analiz et.</p>
                                        </div>
                                        <button
                                            onClick={() => setAutoAnalysis(!autoAnalysis)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${autoAnalysis ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${autoAnalysis ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
