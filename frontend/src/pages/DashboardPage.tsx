import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { UploadCloud, FileText, CheckCircle, Clock, LogOut, Download } from 'lucide-react';
import { toast } from 'react-toastify';

interface Invoice {
    id: number;
    imageUrl: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export default function DashboardPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (err) {
            const error = err as { response?: { status?: number } };
            if (error.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchInvoices();
        // Canlı veri takibi (Live Update) için her 5 saniyede bir faturaları yeniler
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            await api.post('/invoices/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Fatura yüklendi! Yapay zeka analizi başlatıldı.');
            fetchInvoices();
        } catch {
            toast.error('Dosya yüklenirken hata oluştu.');
        } finally {
            setIsUploading(false);
            // Inputu temizle
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Üst Menü */}
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-700 flex items-center gap-2">
                        <FileText size={28} /> MATRAH
                    </h1>
                    <button
                        onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                        className="text-slate-600 hover:text-red-600 font-medium flex items-center gap-2 text-lg lg:text-base border border-slate-200 rounded-lg px-4 py-2"
                    >
                        <LogOut size={20} /> Çıkış
                    </button>
                </div>
            </nav>

            {/* Ana İçerik */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Yükleme Bölümü */}
                <div className="card p-8 sm:p-12 text-center bg-white border-2 border-dashed border-primary-200 hover:border-primary-400 transition-colors">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">Yeni Fiş / Fatura Yükle</h2>
                    <p className="text-slate-600 text-lg mb-8 max-w-lg mx-auto">
                        Fişinizin fotoğrafını çekin veya cihazınızdan seçin. Sistemimiz KDV ve matrah hesaplamasını saniyeler içinde otomatik yapsın.
                    </p>

                    <label className="btn-primary inline-flex cursor-pointer px-10 py-4 text-xl shadow-md w-full sm:w-auto">
                        <UploadCloud size={28} />
                        {isUploading ? 'Yükleniyor...' : 'Fotoğraf Seç veya Çek'}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Mobil cihazlarda direkt kamerayı açmayı önerir
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
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
                                <div key={inv.id} className="card flex flex-col hover:border-primary-300 transition-colors">
                                    <div className="h-48 bg-slate-200 overflow-hidden relative">
                                        <img src={inv.imageUrl} alt="Fatura" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Durum Rozeti */}
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                                            {inv.status === 'APPROVED' ? (
                                                <><CheckCircle size={16} className="text-green-600" /> <span className="text-green-700">Analiz Tamamlandı</span></>
                                            ) : inv.status === 'PENDING' ? (
                                                <><Clock size={16} className="text-amber-500 animate-pulse" /> <span className="text-amber-700">İşleniyor...</span></>
                                            ) : (
                                                <span className="text-red-600">Hata</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white">
                                        <p className="text-slate-500 font-medium text-sm">
                                            Yükleme: {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                                        </p>
                                        {/* Detay sayfasına yönlendirme eklenebilir */}
                                        <button className="w-full text-left mt-3 font-semibold text-primary-600 hover:text-primary-800 text-lg">
                                            Detayları İncele →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
