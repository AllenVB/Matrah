import { useEffect, useState } from 'react';
import api from '../api';
import {
    UploadCloud, FileText, CheckCircle, Clock, Download,
    ClipboardList, Pencil, Trash2, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceGuide from '../components/InvoiceGuide';

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

const CATEGORY_MAP: Record<string, string> = {
    FUEL: '⛽ Yakıt',
    FOOD: '🍽️ Yiyecek',
    OFFICE: '🖊️ Ofis',
    TRAVEL: '✈️ Seyahat',
    IT_SERVICES: '💻 BT',
    VEHICLE_MAINTENANCE: '🔧 Araç Bakım',
    ENTERTAINMENT: '🎭 Temsil',
    HEALTH: '🏥 Sağlık',
    EDUCATION: '📚 Eğitim',
    RENT: '🏠 Kira',
    UTILITY: '💡 Fatura',
    OTHER: '📦 Diğer',
};

type Tab = 'upload' | 'manual';

export default function DashboardPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch {
            // sessizce geç
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
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const result = res.data as Invoice;
            if (result.status === 'REJECTED') {
                toast.error('⚠️ Fatura tanınamadı! Lütfen geçerli bir fiş/fatura fotoğrafı yükleyin veya elle giriş yapın.');
            } else {
                toast.success('Fatura yüklendi! Yapay zeka analizi başlatıldı.');
            }
            fetchInvoices();
        } catch {
            toast.error('Dosya yüklenirken hata oluştu.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/invoices/${id}`);
            toast.success('Fatura silindi.');
            setDeletingId(null);
            fetchInvoices();
        } catch {
            toast.error('Fatura silinemedi.');
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Üst Menü */}
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-700 flex items-center gap-2">
                        <FileText size={28} /> MATRAH
                    </h1>
                    <div className="flex items-center gap-3">
                        <InvoiceGuide />
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <Download size={16} /> Rapor İndir
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Yükleme Sekmeli Bölümü */}
                <div className="card bg-white">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold transition-colors ${activeTab === 'upload' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <UploadCloud size={20} /> Fiş / Fatura Fotoğrafı Yükle
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-semibold transition-colors ${activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <ClipboardList size={20} /> Elle Giriş Yap
                        </button>
                    </div>

                    <div className="p-8 sm:p-10">
                        {activeTab === 'upload' ? (
                            <div className="text-center border-2 border-dashed border-primary-200 hover:border-primary-400 rounded-xl p-8 transition-colors">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-3">Yeni Fiş / Fatura Yükle</h2>
                                <p className="text-slate-500 text-base mb-6">
                                    Geçerli bir fiş veya fatura fotoğrafı seçin. Rastgele fotoğraflar reddedilir.
                                </p>
                                <label className="btn-primary inline-flex cursor-pointer px-10 py-4 text-xl shadow-md w-full sm:w-auto">
                                    <UploadCloud size={28} />
                                    {isUploading ? 'Yükleniyor...' : 'Fotoğraf Seç veya Çek'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                        ) : (
                            <InvoiceForm mode="create" onSuccess={fetchInvoices} />
                        )}
                    </div>
                </div>

                {/* Fatura Listesi */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-2xl font-bold text-slate-800">Geçmiş Belgeler</h3>
                        <button onClick={downloadReport} className="btn-outline text-primary-700 border-primary-300 hover:bg-primary-50">
                            <Download size={20} />
                            <span className="hidden sm:inline">Rapor (PDF) İndir</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="card p-8 text-center text-slate-500 text-lg bg-white opacity-80">
                            Henüz yüklenmiş bir belgeniz bulunmuyor.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {invoices.map((inv) => (
                                <div key={inv.id} className={`card flex flex-col bg-white hover:border-primary-300 transition-colors overflow-hidden ${inv.status === 'REJECTED' ? 'border-red-300 bg-red-50/30' : ''}`}>
                                    {/* Görsel / İkon */}
                                    {inv.manual ? (
                                        <div className="h-28 bg-blue-50 flex flex-col items-center justify-center gap-1">
                                            <ClipboardList size={32} className="text-blue-400" />
                                            <span className="text-xs font-medium text-blue-600">Manuel Giriş</span>
                                        </div>
                                    ) : inv.status === 'REJECTED' ? (
                                        <div className="h-28 bg-red-50 flex flex-col items-center justify-center gap-1">
                                            <XCircle size={32} className="text-red-400" />
                                            <span className="text-xs font-medium text-red-600">Geçersiz / Reddedildi</span>
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-slate-100 overflow-hidden">
                                            <img src={inv.imageUrl} alt="Fatura" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="p-4 flex flex-col gap-1 flex-1">
                                        {/* Durum */}
                                        <div className="flex items-center gap-1.5 text-sm font-semibold mb-1">
                                            {inv.status === 'APPROVED' ? (
                                                <><CheckCircle size={15} className="text-green-600" /><span className="text-green-700">Kabul Edildi</span></>
                                            ) : inv.status === 'PENDING' ? (
                                                <><Clock size={15} className="text-amber-500 animate-pulse" /><span className="text-amber-700">İşleniyor...</span></>
                                            ) : (
                                                <><XCircle size={15} className="text-red-500" /><span className="text-red-600">Reddedildi – Düzenle</span></>
                                            )}
                                        </div>

                                        {inv.vendorName && <p className="font-semibold text-slate-800 text-base truncate">{inv.vendorName}</p>}
                                        {inv.totalAmount != null && (
                                            <p className="text-slate-600 text-sm">
                                                <span className="font-bold text-slate-800">{inv.totalAmount.toFixed(2)} TL</span>
                                                {inv.vatAmount != null && <> · KDV: {inv.vatAmount.toFixed(2)} TL</>}
                                            </p>
                                        )}
                                        {inv.category && <span className="text-xs text-slate-400">{CATEGORY_MAP[inv.category] ?? inv.category}</span>}
                                        <p className="text-slate-400 text-xs">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</p>

                                        {/* Aksiyon Butonları */}
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                                            <button
                                                onClick={() => setEditingInvoice(inv)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg py-2 transition-colors border border-amber-200"
                                            >
                                                <Pencil size={14} /> Düzenle
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(inv.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg py-2 transition-colors border border-red-200"
                                            >
                                                <Trash2 size={14} /> Sil
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Düzenleme Modalı */}
            {editingInvoice && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
                        <InvoiceForm
                            mode="edit"
                            invoice={editingInvoice}
                            onSuccess={fetchInvoices}
                            onClose={() => setEditingInvoice(null)}
                        />
                    </div>
                </div>
            )}

            {/* Silme Onay Modalı */}
            {deletingId !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5">
                        <Trash2 size={44} className="text-red-400 mx-auto" />
                        <h3 className="text-xl font-bold text-slate-800">Faturayı Sil</h3>
                        <p className="text-slate-500">Bu fatura kalıcı olarak silinecek. Emin misiniz?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
