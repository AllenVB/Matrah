import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import AppLayout from '../components/AppLayout';

export default function ManualEntryPage() {
    const navigate = useNavigate();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [vatAmount, setVatAmount] = useState('');
    const [taxRate, setTaxRate] = useState('20');
    const [category, setCategory] = useState('OTHER');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const total = parseFloat(totalAmount) || 0;
    const vat = parseFloat(vatAmount) || 0;

    const handleClear = () => {
        setInvoiceNumber('');
        setInvoiceDate('');
        setVendorName('');
        setTaxId('');
        setTotalAmount('');
        setVatAmount('');
        setTaxRate('20');
        setCategory('OTHER');
    };

    const handleSubmit = async () => {
        if (!vendorName || !totalAmount) {
            toast.error('Satıcı adı ve toplam tutar zorunludur.');
            return;
        }
        // invoiceDate boşsa bugünü kullan
        const dateToSend = invoiceDate || new Date().toISOString().split('T')[0];
        setIsSubmitting(true);
        try {
            await api.post('/invoices/manual', {
                vendorName,
                totalAmount: total,
                vatAmount: vat,
                taxRate: parseFloat(taxRate) || 0,
                category,
                taxId: taxId || null,
                invoiceDate: dateToSend,
                invoiceNumber: invoiceNumber || null,
            });
            toast.success('Fatura başarıyla kaydedildi!');
            navigate('/invoices');
        } catch {
            toast.error('Fatura kaydedilemedi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 space-y-6 animate-fadeIn">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <button onClick={() => navigate('/invoices')} className="hover:text-primary transition-colors">Faturalar</button>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-slate-900">Manuel Giriş</span>
                </div>

                {/* Title */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Manuel Fatura Girişi</h1>
                        <p className="text-slate-500 mt-1">Otomatik vergi hesaplaması için belge bilgilerini doğru girin.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleClear} className="btn-outline">Formu Temizle</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Invoice Info */}
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <span className="material-symbols-outlined">info</span>
                                Fatura Bilgileri
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Fatura Numarası</label>
                                    <input
                                        className="input-field"
                                        placeholder="INV-2024-001"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Fatura Tarihi</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Satıcı Adı</label>
                                    <input
                                        className="input-field"
                                        placeholder="Acme Corporation"
                                        value={vendorName}
                                        onChange={(e) => setVendorName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Vergi Kimlik No (VKN)</label>
                                    <input
                                        className="input-field"
                                        placeholder="1234567890"
                                        value={taxId}
                                        onChange={(e) => setTaxId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <span className="material-symbols-outlined">payments</span>
                                Tutar Detayları
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Matrah (KDV Hariç)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₺</span>
                                        <input
                                            className="input-field pl-8"
                                            placeholder="0.00"
                                            value={totalAmount}
                                            onChange={(e) => setTotalAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">KDV Tutarı (%{taxRate})</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₺</span>
                                        <input
                                            className="input-field pl-8"
                                            placeholder="0.00"
                                            value={vatAmount}
                                            onChange={(e) => setVatAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Toplam Tutar</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₺</span>
                                        <input
                                            className="input-field pl-8 border-2 border-primary/30 text-primary font-black text-lg"
                                            value={(total + vat).toFixed(2)}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">KDV Oranı</label>
                                    <select
                                        className="input-field"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                    >
                                        <option value="1">%1</option>
                                        <option value="8">%8</option>
                                        <option value="10">%10</option>
                                        <option value="18">%18</option>
                                        <option value="20">%20</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                                    <select
                                        className="input-field"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="OTHER">Diğer</option>
                                        <option value="FUEL">Yakıt</option>
                                        <option value="FOOD">Yiyecek</option>
                                        <option value="OFFICE">Ofis Malzemeleri</option>
                                        <option value="IT_SERVICES">BT Hizmetleri</option>
                                        <option value="VEHICLE_MAINTENANCE">Araç Bakım</option>
                                        <option value="TRAVEL">Seyahat</option>
                                        <option value="ENTERTAINMENT">Temsil</option>
                                        <option value="HEALTH">Sağlık</option>
                                        <option value="EDUCATION">Eğitim</option>
                                        <option value="RENT">Kira</option>
                                        <option value="UTILITY">Fatura</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="space-y-6">
                        {/* Live Preview Card */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">preview</span>
                                    <span className="text-sm font-bold uppercase">Önizleme</span>
                                </div>
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Taslak</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Fatura Numarası</p>
                                    <p className="text-sm font-bold">{invoiceNumber || 'INV-0000-000'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tarih</p>
                                        <p className="text-sm font-medium">{invoiceDate ? new Date(invoiceDate).toLocaleDateString('tr-TR') : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">VKN</p>
                                        <p className="text-sm font-medium">{taxId || '—'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Satıcı</p>
                                    <p className="text-base font-bold">{vendorName || '—'}</p>
                                </div>

                                <div className="border-t border-slate-700 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Matrah</span>
                                        <span>{total.toFixed(2)} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">KDV (%{taxRate})</span>
                                        <span>{vat.toFixed(2)} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-700">
                                        <span className="text-primary">TOPLAM</span>
                                        <span className="text-primary">{(total + vat).toFixed(2)} ₺</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                                <span className="material-symbols-outlined text-lg">lightbulb</span>
                                <span className="text-sm font-bold">Bilgi</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                VKN'nin resmi veritabanıyla eşleştiğinden emin olun. Yanlış VKN, üç aylık denetimde uyumsuzluk sorunlarına yol açabilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
