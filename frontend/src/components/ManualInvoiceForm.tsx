import { useState } from 'react';
import api from '../api';
import { ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';

const CATEGORIES = [
    { value: 'FUEL', label: '⛽ Yakıt' },
    { value: 'FOOD', label: '🍽️ Yiyecek & İçecek' },
    { value: 'OFFICE', label: '🖊️ Ofis Malzemesi' },
    { value: 'TRAVEL', label: '✈️ Seyahat' },
    { value: 'IT_SERVICES', label: '💻 BT / Yazılım' },
    { value: 'OTHER', label: '📦 Diğer' },
];

interface ManualFormProps {
    onSuccess: () => void;
}

export default function ManualInvoiceForm({ onSuccess }: ManualFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        vendorName: '',
        totalAmount: '',
        taxRate: '18',
        vatAmount: '',
        category: 'OTHER',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        taxId: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.vendorName.trim() || form.vendorName.trim().length < 2) {
            newErrors.vendorName = 'Satıcı adı en az 2 karakter olmalıdır';
        }
        if (/^\d+$/.test(form.vendorName.trim())) {
            newErrors.vendorName = 'Satıcı adı yalnızca rakamdan oluşamaz';
        }
        const amount = parseFloat(form.totalAmount);
        if (!form.totalAmount || isNaN(amount) || amount < 1) {
            newErrors.totalAmount = 'Toplam tutar en az 1 TL olmalıdır';
        }
        const rate = parseFloat(form.taxRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            newErrors.taxRate = 'KDV oranı 0-100 arasında olmalıdır';
        }
        if (form.vatAmount) {
            const vat = parseFloat(form.vatAmount);
            if (!isNaN(vat) && !isNaN(amount) && vat > amount) {
                newErrors.vatAmount = 'KDV tutarı toplam tutardan büyük olamaz';
            }
        }
        if (!form.invoiceDate) {
            newErrors.invoiceDate = 'Fatura tarihi zorunludur';
        } else if (new Date(form.invoiceDate) > new Date()) {
            newErrors.invoiceDate = 'Fatura tarihi gelecekte olamaz';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('Lütfen formdaki hataları düzeltin.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/invoices/manual', {
                vendorName: form.vendorName.trim(),
                totalAmount: parseFloat(form.totalAmount),
                taxRate: parseFloat(form.taxRate),
                vatAmount: form.vatAmount ? parseFloat(form.vatAmount) : null,
                category: form.category,
                invoiceDate: form.invoiceDate,
                invoiceNumber: form.invoiceNumber || null,
                taxId: form.taxId || null,
            });

            toast.success('Fatura başarıyla kaydedildi!');
            // Formu sıfırla
            setForm({
                vendorName: '',
                totalAmount: '',
                taxRate: '18',
                vatAmount: '',
                category: 'OTHER',
                invoiceDate: new Date().toISOString().split('T')[0],
                invoiceNumber: '',
                taxId: '',
            });
            setErrors({});
            onSuccess();
        } catch (err: unknown) {
            const error = err as { response?: { status?: number; data?: { detail?: string; message?: string } } };
            if (error.response?.status === 422) {
                toast.error('Geçersiz fatura: Bilgiler tutarsız veya eksik.');
            } else {
                toast.error('Fatura kaydedilemedi. Lütfen tekrar deneyiniz.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const field = (
        label: string,
        key: keyof typeof form,
        type = 'text',
        placeholder = '',
        required = false
    ) => (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-300'
                    }`}
            />
            {errors[key] && (
                <p className="text-red-500 text-sm">{errors[key]}</p>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={22} className="text-blue-600" />
                <h3 className="text-xl font-bold text-slate-800">Manuel Fatura Girişi</h3>
            </div>
            <p className="text-slate-500 text-sm">
                Elinizde fiş yoksa aşağıdaki alanlara bilgileri girerek faturanızı sisteme ekleyin.
            </p>

            {/* 2 sütunlu grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('Satıcı / Firma Adı', 'vendorName', 'text', 'Örn: XYZ Market A.Ş.', true)}
                {field('Fatura Tarihi', 'invoiceDate', 'date', '', true)}
                {field('Toplam Tutar (TL)', 'totalAmount', 'number', '0.00', true)}
                {field('KDV Oranı (%)', 'taxRate', 'number', '18', true)}
                {field('KDV Tutarı (boş bırakılırsa hesaplanır)', 'vatAmount', 'number', 'Otomatik hesaplanır')}
                {field('Fatura No (isteğe bağlı)', 'invoiceNumber', 'text', 'Örn: FTR-2024-001')}
                {field('VKN / TCKN (isteğe bağlı)', 'taxId', 'text', '10 veya 11 haneli')}
                {/* Kategori */}
                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">
                        Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <span className="animate-pulse">Kaydediliyor...</span>
                ) : (
                    <>
                        <ClipboardList size={22} />
                        Faturayı Kaydet ve İşle
                    </>
                )}
            </button>
        </form>
    );
}
