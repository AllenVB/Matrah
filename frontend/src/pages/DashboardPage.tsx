import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface Invoice {
    id: number;
    imageUrl: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    vendorName?: string;
    totalAmount?: number;
    vatAmount?: number;
    taxRate?: number;
    category?: string;
    manual?: boolean;
}

export default function DashboardPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch {
            /* silent */
        }
    };

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);
        try {
            const res = await api.post('/invoices/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const result = res.data as Invoice;

            // Fatura başlangıçta PENDING olarak gelir, AI arka planda çalışır
            toast.info('📄 Fatura yüklendi! AI analizi başlatıldı — durum birkaç saniye içinde güncellenecek.', { autoClose: 4000 });

            // AI analizi tamamlanana kadar birkaç kez poll yap
            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                try {
                    const pollRes = await api.get(`/invoices/${result.id ?? result}`);
                    const updated = pollRes.data as Invoice;

                    if (updated.status !== 'PENDING' || attempts >= 10) {
                        clearInterval(pollInterval);
                        if (updated.status === 'APPROVED') {
                            toast.success(`✅ Fatura #${updated.id} AI tarafından onaylandı!`);
                        } else if (updated.status === 'REJECTED') {
                            toast.warning('⚠️ Fatura doğrulanamadı. Lütfen detayları kontrol edin veya geçerli bir belge yükleyin.');
                        } else {
                            toast.info('📋 AI analizi tamamlandı — lütfen fatura verilerini manuel olarak doğrulayın.');
                        }
                        fetchInvoices();
                    }
                } catch {
                    clearInterval(pollInterval);
                }
            }, 2000);

            fetchInvoices();
        } catch {
            toast.error('Dosya yüklenirken hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const downloadReport = async () => {
        try {
            const res = await api.get('/reports/download', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'matrah_vergi_raporu.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error('Rapor indirilemedi.');
        }
    };

    // Stats
    const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;
    const approvedCount = invoices.filter((i) => i.status === 'APPROVED').length;
    const rejectedCount = invoices.filter((i) => i.status === 'REJECTED').length;
    const totalVolume = invoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
    const totalVat = invoices.reduce((sum, i) => sum + (i.vatAmount ?? 0), 0);

    // Recent 3
    const recent = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn">
                {/* Title */}
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">Genel Bakış</h2>
                        <p className="text-slate-500 mt-1">Vergi belgelerinizin gerçek zamanlı durumu.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={downloadReport} className="btn-outline">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Rapor İndir
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" onClick={() => navigate('/invoices')}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                            </div>
                            {pendingCount > 0 && (
                                <span className="text-amber-600 text-sm font-bold bg-amber-50 px-2 py-1 rounded">Aktif</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Bekleyen Faturalar</p>
                        <h3 className="text-3xl font-bold mt-1">{pendingCount}</h3>
                    </div>

                    <div className="card p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" onClick={() => navigate('/invoices')}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded">Normal</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Onaylanan</p>
                        <h3 className="text-3xl font-bold mt-1">{approvedCount}</h3>
                    </div>

                    <div className="card p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" onClick={() => navigate('/invoices')}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">error</span>
                            </div>
                            {rejectedCount > 0 && (
                                <span className="text-rose-600 text-sm font-bold bg-rose-50 px-2 py-1 rounded">Dikkat</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Reddedilen</p>
                        <h3 className="text-3xl font-bold mt-1">{rejectedCount}</h3>
                    </div>
                </div>

                {/* Main Work Area */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Upload + Recent */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Upload Dropzone */}
                        <div className="card border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center group hover:border-primary/50 transition-all">
                            <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                            </div>
                            <h4 className="text-xl font-bold mb-2">Fatura Yükle & Analiz Et</h4>
                            <p className="text-slate-500 max-w-sm mx-auto mb-8">
                                PDF, görüntü veya XML faturanızı sürükleyin. AI tüm vergi verilerini otomatik çıkarır ve doğrular.
                            </p>
                            <div className="flex items-center gap-4">
                                <label className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all cursor-pointer">
                                    {isUploading ? 'Yükleniyor...' : 'Dosya Seç'}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf,.xml"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </label>
                                <span className="text-slate-400 text-sm font-medium">veya dosyayı buraya bırakın</span>
                            </div>
                        </div>

                        {/* Recent Documents */}
                        <div className="card">
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <h4 className="font-bold">Son Belgeler</h4>
                                <button onClick={() => navigate('/invoices')} className="text-primary text-sm font-semibold hover:underline">
                                    Tümünü Gör
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recent.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-slate-400">Henüz belge yüklenmedi.</div>
                                ) : (
                                    recent.map((inv) => (
                                        <div
                                            key={inv.id}
                                            onClick={() => navigate(`/invoice/${inv.id}`)}
                                            className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined">
                                                    {inv.manual ? 'edit_document' : 'picture_as_pdf'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {inv.vendorName || `Fatura #${inv.id}`}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                                                    {inv.totalAmount != null && ` • ${inv.totalAmount.toFixed(2)} ₺`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${inv.status === 'APPROVED'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : inv.status === 'PENDING'
                                                            ? 'bg-amber-50 text-amber-600'
                                                            : 'bg-rose-50 text-rose-600'
                                                        }`}
                                                >
                                                    {inv.status === 'APPROVED'
                                                        ? 'Tamamlandı'
                                                        : inv.status === 'PENDING'
                                                            ? 'İşleniyor'
                                                            : 'Hata'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Stats */}
                    <div className="space-y-6">
                        {/* AI Insight Card */}
                        <div className="bg-primary p-6 rounded-2xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <h4 className="text-lg font-bold mb-4">Vergi Analizi AI</h4>
                            <p className="text-sm opacity-90 leading-relaxed mb-6">
                                {approvedCount > 0
                                    ? `Son ${approvedCount} onaylı faturanıza göre, toplam ${totalVat.toFixed(2)} ₺ KDV tespit edildi. İndirilebilirlik durumunuzu detay sayfasında inceleyebilirsiniz.`
                                    : 'Fatura yükleyerek AI destekli vergi analizine hemen başlayın.'}
                            </p>
                            <button onClick={() => navigate('/invoices')} className="w-full bg-white text-primary font-bold py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                                Detayları Görüntüle
                            </button>
                        </div>

                        {/* Volume Summary */}
                        <div className="card p-6">
                            <h4 className="font-bold mb-6">Toplam Özet</h4>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-600 uppercase tracking-wider">Toplam Tutar</span>
                                        <span>{totalVolume.toFixed(2)} ₺</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-600 uppercase tracking-wider">Toplam KDV</span>
                                        <span>{totalVat.toFixed(2)} ₺</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: totalVolume > 0 ? `${(totalVat / totalVolume) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-600 uppercase tracking-wider">Toplam Fatura</span>
                                        <span>{invoices.length}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Score */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <div>
                                    <h5 className="font-bold">Uyumluluk Skoru</h5>
                                    <p className="text-xs text-slate-400 leading-none mt-1">Güncel</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center py-4">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle className="text-slate-700" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                                        <circle
                                            className="text-primary"
                                            cx="64"
                                            cy="64"
                                            fill="transparent"
                                            r="58"
                                            stroke="currentColor"
                                            strokeDasharray="364.4"
                                            strokeDashoffset={invoices.length > 0 ? 364.4 * (1 - approvedCount / Math.max(invoices.length, 1)) : 182}
                                            strokeLinecap="round"
                                            strokeWidth="8"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black">
                                            {invoices.length > 0 ? Math.round((approvedCount / invoices.length) * 100) : 0}%
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Güven</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-2 px-4">
                                Faturalarınızın %{invoices.length > 0 ? Math.round((approvedCount / invoices.length) * 100) : 0}'i başarıyla doğrulandı.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
