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

const CATEGORY_ICONS: Record<string, string> = {
    FUEL: 'local_gas_station',
    FOOD: 'restaurant',
    OFFICE_SUPPLIES: 'print',
    IT_SERVICES: 'cloud',
    VEHICLE_MAINTENANCE: 'directions_car',
    ENTERTAINMENT: 'celebration',
    HEALTH: 'local_hospital',
    EDUCATION: 'school',
    RENT: 'home',
    UTILITY: 'bolt',
    OTHER: 'category',
};

type TabFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
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
            await api.post('/invoices/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Fatura yüklendi! AI analizi başlatıldı.');
            fetchInvoices();
        } catch {
            toast.error('Dosya yüklenirken hata oluştu.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const downloadCSV = () => {
        const header = 'Tarih,Satıcı,Tutar,KDV Oranı,Durum\n';
        const rows = filtered.map((inv) =>
            [
                new Date(inv.createdAt).toLocaleDateString('tr-TR'),
                inv.vendorName ?? '-',
                inv.totalAmount?.toFixed(2) ?? '-',
                inv.taxRate != null ? `%${inv.taxRate}` : '-',
                inv.status,
            ].join(',')
        );
        const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'faturalar.csv';
        link.click();
    };

    const deleteInvoice = async (id: number) => {
        if (!confirm('Bu faturayı silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/invoices/${id}`);
            toast.success('Fatura silindi.');
            fetchInvoices();
        } catch {
            toast.error('Fatura silinirken hata oluştu.');
        }
    };

    const filtered = activeTab === 'ALL' ? invoices : invoices.filter((i) => i.status === activeTab);
    const totalVolume = invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const totalVat = invoices.reduce((s, i) => s + (i.vatAmount ?? 0), 0);

    const tabs: { label: string; value: TabFilter; count?: number }[] = [
        { label: 'Tüm Faturalar', value: 'ALL', count: invoices.length },
        { label: 'Bekleyen', value: 'PENDING', count: invoices.filter((i) => i.status === 'PENDING').length },
        { label: 'Onaylanan', value: 'APPROVED' },
        { label: 'Reddedilen', value: 'REJECTED' },
    ];

    return (
        <AppLayout>
            <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 space-y-6 animate-fadeIn">
                {/* Title */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black leading-tight tracking-tight">Fatura Yönetimi</h1>
                        <p className="text-slate-500 text-base mt-1">Gelen belgelerinizi izleyin, denetleyin ve yönetin.</p>
                    </div>
                    <button onClick={downloadCSV} className="btn-outline bg-slate-200 text-slate-900 font-bold">
                        <span className="material-symbols-outlined text-lg">download</span>
                        CSV İndir
                    </button>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card flex items-center justify-between p-6">
                        <div>
                            <h3 className="text-lg font-bold">Yeni Belge</h3>
                            <p className="text-sm text-slate-500">PDF veya görüntü dosyası yükleyerek OCR işlemi başlatın.</p>
                        </div>
                        <label className="btn-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform cursor-pointer">
                            <span className="material-symbols-outlined">upload_file</span>
                            {isUploading ? 'Yükleniyor...' : 'PDF/Görüntü Yükle'}
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    <div className="card flex items-center justify-between p-6">
                        <div>
                            <h3 className="text-lg font-bold">Manuel Giriş</h3>
                            <p className="text-sm text-slate-500">Fatura bilgilerini sisteme doğrudan girin.</p>
                        </div>
                        <button
                            onClick={() => navigate('/manual-entry')}
                            className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">edit_document</span>
                            Manuel Giriş
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="card">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 px-6 gap-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`flex items-center gap-2 border-b-2 pb-3 pt-4 font-bold text-sm transition-colors ${activeTab === tab.value
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count != null && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${activeTab === tab.value ? 'bg-primary/10' : 'bg-slate-100'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Table body */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Satıcı</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">KDV</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Durum</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Bu kategoride fatura bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {new Date(inv.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm text-slate-500">
                                                            {CATEGORY_ICONS[inv.category ?? 'OTHER'] ?? 'category'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">{inv.vendorName || `Fatura #${inv.id}`}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                {inv.totalAmount != null ? `${inv.totalAmount.toFixed(2)} ₺` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {inv.taxRate != null ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                                                        %{inv.taxRate} KDV
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'APPROVED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : inv.status === 'PENDING'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inv.status === 'APPROVED'
                                                            ? 'bg-green-500'
                                                            : inv.status === 'PENDING'
                                                                ? 'bg-amber-500'
                                                                : 'bg-red-500'
                                                            }`}
                                                    />
                                                    {inv.status === 'APPROVED' ? 'Onaylı' : inv.status === 'PENDING' ? 'Bekliyor' : 'Reddedildi'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                                        title="Detay"
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                                        title="Düzenle"
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteInvoice(inv.id)}
                                                        title="Sil"
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <span className="text-sm text-slate-500">
                            Toplam <span className="font-bold text-slate-900">{filtered.length}</span> fatura
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="card p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm font-medium">Toplam Hacim</span>
                            <span className="material-symbols-outlined text-primary">analytics</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900">{totalVolume.toFixed(2)} ₺</span>
                    </div>
                    <div className="card p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm font-medium">Vergi Yükümlülüğü</span>
                            <span className="material-symbols-outlined text-slate-400">payments</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900">{totalVat.toFixed(2)} ₺</span>
                        <span className="text-xs text-slate-500">{invoices.length} kayıt üzerinden hesaplandı</span>
                    </div>
                    <div className="card p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm font-medium">OCR Doğruluk</span>
                            <span className="material-symbols-outlined text-slate-400">verified</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900">
                            {invoices.length > 0 ? `${Math.round((invoices.filter((i) => i.status === 'APPROVED').length / invoices.length) * 100)}%` : '—'}
                        </span>
                        <span className="text-xs text-primary font-bold">AI destekli analiz</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
