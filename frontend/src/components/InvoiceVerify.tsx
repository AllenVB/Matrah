import { useState } from 'react';
import { CheckCircle, Edit3, ChevronDown, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

/** AI'nın ilk analiz sonucu */
export interface AIResult {
    invoiceId: number;
    status: string;
    imageUrl?: string;
    vendorName?: string;
    totalAmount?: number;
    vatAmount?: number;
    taxRate?: number;
    category?: string;
    isDeductible?: boolean;
    deductibilityNote?: string;
}

interface InvoiceVerifyProps {
    result: AIResult;
    onConfirmed: () => void;
    onDiscard: () => void;
}

const CATEGORIES = [
    { value: 'FOOD', label: '🍽️ Yiyecek' },
    { value: 'FUEL', label: '⛽ Yakıt' },
    { value: 'VEHICLE_MAINTENANCE', label: '🔧 Araç Bakım' },
    { value: 'OFFICE', label: '🖊️ Ofis Malzemesi' },
    { value: 'IT_SERVICES', label: '💻 BT / Yazılım' },
    { value: 'TRAVEL', label: '✈️ Seyahat' },
    { value: 'ENTERTAINMENT', label: '🎭 Temsil/Eğlence' },
    { value: 'HEALTH', label: '🏥 Sağlık' },
    { value: 'EDUCATION', label: '📚 Eğitim' },
    { value: 'RENT', label: '🏠 Kira' },
    { value: 'UTILITY', label: '💡 Fatura/Abonelik' },
    { value: 'OTHER', label: '📦 Diğer' },
];

/**
 * Aşama 4: AI doğrulama ve düzeltme ekranı.
 * Sol: fatura fotoğrafı / PDF önizleme.
 * Sağ: AI çıkarılan veriler + kullanıcı düzeltme formu.
 */
export default function InvoiceVerify({ result, onConfirmed, onDiscard }: InvoiceVerifyProps) {
    const [form, setForm] = useState({
        vendorName: result.vendorName ?? '',
        totalAmount: result.totalAmount?.toString() ?? '',
        vatAmount: result.vatAmount?.toString() ?? '',
        taxRate: result.taxRate?.toString() ?? '',
        category: result.category ?? 'OTHER',
    });
    const [saving, setSaving] = useState(false);

    const field = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

    const getDeductibilityBadge = () => {
        if (result.isDeductible === false) {
            return (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{result.deductibilityNote ?? 'Bu gider KDV indiriminden yararlanamaz.'}</span>
                </div>
            );
        }
        if (result.deductibilityNote) {
            return (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <span>{result.deductibilityNote}</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <CheckCircle size={16} />
                <span>Bu gider KDV indiriminden yararlanabilir.</span>
            </div>
        );
    };

    const handleConfirm = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/invoices/${result.invoiceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    vendorName: form.vendorName,
                    totalAmount: parseFloat(form.totalAmount) || 0,
                    vatAmount: parseFloat(form.vatAmount) || 0,
                    taxRate: parseFloat(form.taxRate) || 20,
                    category: form.category,
                }),
            });
            if (!res.ok) throw new Error('Kayıt başarısız');
            toast.success('Fatura onaylandı ve kaydedildi!');
            onConfirmed();
        } catch {
            toast.error('Kaydedilemedi, lütfen tekrar deneyin.');
        } finally {
            setSaving(false);
        }
    };

    // Tahmini KDV tasarrufu
    const vatAmount = parseFloat(form.vatAmount) || 0;
    const saving_ = vatAmount > 0 ? `${vatAmount.toFixed(2)} TL` : null;

    return (
        <div className="grid md:grid-cols-2 gap-0 min-h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">

            {/* ── Sol Taraf: Fatura Görseli ─────────────────── */}
            <div className="bg-slate-800 flex flex-col items-center justify-center p-4">
                {result.imageUrl ? (
                    result.imageUrl.endsWith('.pdf') ? (
                        <div className="text-center text-slate-400">
                            <div className="w-24 h-32 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <span className="text-4xl">📄</span>
                            </div>
                            <p className="text-sm">PDF Dosyası</p>
                            <a href={`/api${result.imageUrl}`} target="_blank" rel="noreferrer"
                                className="mt-2 inline-block px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                                PDF'i Görüntüle
                            </a>
                        </div>
                    ) : (
                        <img
                            src={`/api${result.imageUrl}`}
                            alt="Fatura"
                            className="max-h-[450px] max-w-full rounded-lg object-contain border border-slate-600"
                        />
                    )
                ) : (
                    <div className="text-slate-500 text-center">
                        <div className="text-6xl mb-3">🧾</div>
                        <p className="text-sm">Görüntü bulunamadı</p>
                    </div>
                )}

                {/* AI Güven Etiketi */}
                <div className="mt-4 px-3 py-1.5 bg-blue-600/30 border border-blue-500/40 rounded-full text-blue-300 text-xs">
                    🤖 AI tarafından analiz edildi — lütfen doğrulayın
                </div>
            </div>

            {/* ── Sağ Taraf: Form ───────────────────────────── */}
            <div className="bg-white flex flex-col">
                {/* Başlık */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Edit3 size={18} className="text-blue-500" />
                    <h2 className="font-bold text-slate-800">Bilgileri Doğrula &amp; Düzelt</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* KDV Uyarısı */}
                    {getDeductibilityBadge()}

                    {/* KDV Tasarrufu */}
                    {saving_ && (
                        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2">
                            💰 Bu fatura: <strong>{saving_}</strong> KDV tasarrufu sağlıyor
                        </div>
                    )}

                    {/* Satıcı Adı */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Satıcı / Firma Adı</label>
                        <input
                            type="text"
                            value={form.vendorName}
                            onChange={e => field('vendorName', e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Örn: ABC Market Ltd. Şti."
                        />
                    </div>

                    {/* Tutarlar */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Toplam Tutar (TL)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                value={form.totalAmount}
                                onChange={e => field('totalAmount', e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">KDV Tutarı (TL)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                value={form.vatAmount}
                                onChange={e => field('vatAmount', e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                    {/* KDV Oranı */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">KDV Oranı (%)</label>
                        <div className="flex gap-2">
                            {[1, 10, 20].map(r => (
                                <button
                                    key={r}
                                    onClick={() => field('taxRate', r.toString())}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                                        ${form.taxRate === r.toString()
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
                                >
                                    %{r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Harcama Kategorisi</label>
                        <div className="relative">
                            <select
                                value={form.category}
                                onChange={e => field('category', e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Aksiyonlar */}
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onDiscard}
                        className="flex-1 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    >
                        Reddet &amp; Sil
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {saving ? 'Kaydediliyor…' : 'Onayla & Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
