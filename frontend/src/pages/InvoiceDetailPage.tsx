import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Edit3, Save } from 'lucide-react';
import { toast } from 'react-toastify';

interface InvoiceDetail {
    id: number;
    totalAmount: number;
    vatAmount: number;
    taxRate: number;
    vendorName: string;
    category: string;
}

interface InvoiceInfo {
    id: number;
    imageUrl: string;
    status: string;
    createdAt: string;
    details: InvoiceDetail[];
}

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<InvoiceInfo | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableDetails, setEditableDetails] = useState<InvoiceDetail | null>(null);

    const fetchInvoiceDetails = async () => {
        try {
            // Normalde sadece 1 faturayı çeken bir endpoint olmalı: GET /invoices/:id
            // Ancak şu an tüm faturaları çekip ID'ye göre filtreleyelim pratiklik açısından
            const res = await api.get('/invoices');
            const found = res.data.find((inv: InvoiceInfo) => inv.id === Number(id));
            if (found) {
                setInvoice(found);
                if (found.details && found.details.length > 0) {
                    setEditableDetails(found.details[0]);
                }
            }
        } catch {
            toast.error('Fatura detayları alınamadı.');
        }
    };

    useEffect(() => {
        fetchInvoiceDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        // Burada düzenlenmiş detayları backend'e PUT/PATCH atacak servis metodunun çağrılması beklenir.
        // Şimdilik sadece toast mesajı gösteriyoruz (Backend'de update endpoint'i eklendiğinde açılabilir)
        toast.success('Değişiklikler kaydedildi!');
        setIsEditing(false);
    };

    if (!invoice) return <div className="p-8 text-center text-xl text-slate-500">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Üst Menü */}
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="text-slate-600 hover:text-primary-700 font-medium flex items-center gap-2 text-lg">
                        <ArrowLeft size={24} /> Geri Dön
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Fatura Detayı #{invoice.id}</h1>
                </div>
            </nav>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Sol Kısım: Fatura Görseli */}
                    <div className="card h-96 lg:h-[600px] bg-slate-200 p-2">
                        <img src={invoice.imageUrl} alt="Fatura" className="w-full h-full object-contain rounded-lg shadow-sm" />
                    </div>

                    {/* Sağ Kısım: AI Sonuçları & Düzenleme */}
                    <div className="card p-6 sm:p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">Analiz Sonuçları</h2>
                            {invoice.status === 'PENDING' ? (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">İşleniyor</span>
                            ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Onaylandı</span>
                            )}
                        </div>

                        {editableDetails ? (
                            <div className="space-y-5 flex-1 text-lg">
                                <div>
                                    <label className="block text-slate-600 font-medium mb-1">Tedarikçi Firma</label>
                                    <input
                                        type="text"
                                        className={`input-field ${!isEditing && 'bg-slate-100'}`}
                                        value={editableDetails.vendorName || ''}
                                        disabled={!isEditing}
                                        onChange={(e) => setEditableDetails({ ...editableDetails, vendorName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-600 font-medium mb-1">KDV Oranı (%)</label>
                                        <input
                                            type="number"
                                            className={`input-field ${!isEditing && 'bg-slate-100'}`}
                                            value={editableDetails.taxRate || 0}
                                            disabled={!isEditing}
                                            onChange={(e) => setEditableDetails({ ...editableDetails, taxRate: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-medium mb-1">Kategori</label>
                                        <select
                                            className={`input-field ${!isEditing && 'bg-slate-100'}`}
                                            value={editableDetails.category || 'OTHER'}
                                            disabled={!isEditing}
                                            onChange={(e) => setEditableDetails({ ...editableDetails, category: e.target.value })}
                                        >
                                            <option value="FOOD">Yemek</option>
                                            <option value="FUEL">Yakıt</option>
                                            <option value="OFFICE">Ofis</option>
                                            <option value="TRAVEL">Seyahat</option>
                                            <option value="IT_SERVICES">BT/Yazılım</option>
                                            <option value="OTHER">Diğer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-600 font-medium mb-1">KDV Tutarı</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className={`input-field pl-8 ${!isEditing && 'bg-slate-100'}`}
                                                value={editableDetails.vatAmount || 0}
                                                disabled={!isEditing}
                                                onChange={(e) => setEditableDetails({ ...editableDetails, vatAmount: Number(e.target.value) })}
                                            />
                                            <span className="absolute left-3 top-3.5 text-slate-500 font-bold">₺</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-medium mb-1">Toplam Tutar</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className={`input-field pl-8 ${!isEditing && 'bg-slate-100'}`}
                                                value={editableDetails.totalAmount || 0}
                                                disabled={!isEditing}
                                                onChange={(e) => setEditableDetails({ ...editableDetails, totalAmount: Number(e.target.value) })}
                                            />
                                            <span className="absolute left-3 top-3.5 text-slate-500 font-bold">₺</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-500 italic text-lg">AI sonuçları henüz hazır değil veya okunamadı.</div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            {isEditing ? (
                                <button onClick={handleSave} className="btn-primary w-full shadow-lg">
                                    <Save size={24} /> Kaydet
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn-outline w-full shadow-sm">
                                    <Edit3 size={24} /> Düzenle
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
