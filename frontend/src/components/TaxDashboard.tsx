import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, AlertCircle, Calculator, PiggyBank, Receipt } from 'lucide-react';

interface TaxSummaryData {
    month: number;
    year: number;
    totalIncome: number;
    totalExpense: number;
    totalDeductibleExpense: number;
    totalKkeg: number;
    collectedVat: number;
    paidVat: number;
    netVatPayable: number;
    taxBase: number;
    estimatedTax: number;
}

const MONTH_NAMES = [
    '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/** Sayıyı TL formatında gösterir */
function tl(n: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);
}

export default function TaxDashboard() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<TaxSummaryData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/tax/summary?month=${month}&year=${year}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (res.ok) setData(await res.json());
            } catch { /* sessizce geç */ }
            finally { setLoading(false); }
        };
        load();
    }, [month, year]);

    const vatSavings = data ? Math.max(0, data.paidVat) : 0;
    const taxSavings = data ? Math.max(0, data.totalDeductibleExpense * 0.20) : 0; // kaba tahmin

    return (
        <div className="space-y-6">
            {/* Dönem Seçici */}
            <div className="flex items-center gap-3">
                <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    {MONTH_NAMES.slice(1).map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <span className="text-slate-500 text-sm font-medium">
                    {MONTH_NAMES[month]} {year} Dönemi
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Hesaplanıyor…</div>
            ) : data ? (
                <>
                    {/* Ana Metrikler */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                            icon={<Calculator size={22} className="text-blue-500" />}
                            label="Tahmini Vergi"
                            value={tl(data.estimatedTax)}
                            sub="Bu ay ödemeniz gereken"
                            color="blue"
                            alert={data.estimatedTax > 5000}
                        />
                        <MetricCard
                            icon={<PiggyBank size={22} className="text-emerald-500" />}
                            label="KDV Tasarrufu"
                            value={tl(vatSavings)}
                            sub="İndirilecek KDV"
                            color="emerald"
                        />
                        <MetricCard
                            icon={<TrendingDown size={22} className="text-violet-500" />}
                            label="Vergi Tasarrufu"
                            value={tl(taxSavings)}
                            sub="Gider indirimi sayesinde"
                            color="violet"
                        />
                        <MetricCard
                            icon={<Receipt size={22} className="text-rose-500" />}
                            label="KKEG Tutarı"
                            value={tl(data.totalKkeg)}
                            sub="İndirilemyen giderler"
                            color="rose"
                            alert={data.totalKkeg > 0}
                        />
                    </div>

                    {/* Vergi Danışmanlık Kartı */}
                    <AdvisorCard data={data} vatSavings={vatSavings} taxSavings={taxSavings} month={month} />

                    {/* KDV Dökümü */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">KDV Özeti</h3>
                        <div className="space-y-3">
                            <Bar label="Tahsil Edilen KDV (satışlar)" value={data.collectedVat} max={Math.max(data.collectedVat, data.paidVat)} color="bg-blue-400" />
                            <Bar label="Ödenen KDV (alınan faturalar)" value={data.paidVat} max={Math.max(data.collectedVat, data.paidVat)} color="bg-emerald-400" />
                            <div className="mt-3 p-3 rounded-xl border border-slate-100 bg-slate-50 flex justify-between text-sm">
                                <span className="text-slate-600">Ödenecek / İade Edilecek KDV</span>
                                <span className={`font-bold ${data.netVatPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {data.netVatPayable > 0 ? `⚠️ ${tl(data.netVatPayable)} ödeme` : `✅ ${tl(Math.abs(data.netVatPayable))} iade`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Gelir - Gider Analizi */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">Gelir / Gider Analizi</h3>
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <p className="text-slate-500 text-xs mb-1">Toplam Gelir</p>
                                <p className="font-bold text-blue-700">{tl(data.totalIncome)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-slate-500 text-xs mb-1">İndirilebilir Gider</p>
                                <p className="font-bold text-emerald-700">{tl(data.totalDeductibleExpense)}</p>
                            </div>
                            <div className="p-3 bg-violet-50 rounded-xl">
                                <p className="text-slate-500 text-xs mb-1">Vergi Matrahı</p>
                                <p className="font-bold text-violet-700">{tl(data.taxBase)}</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-slate-400">
                    <Receipt size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Bu dönem için veri bulunamadı.</p>
                    <p className="text-sm mt-1">Fatura yükleyerek başlayın.</p>
                </div>
            )}
        </div>
    );
}

// ─── Alt Bileşenler ──────────────────────────────────────────

function MetricCard({ icon, label, value, sub, color, alert }: {
    icon: React.ReactNode;
    label: string; value: string; sub: string;
    color: 'blue' | 'emerald' | 'violet' | 'rose';
    alert?: boolean;
}) {
    const colorMap = {
        blue: 'border-blue-100 bg-blue-50',
        emerald: 'border-emerald-100 bg-emerald-50',
        violet: 'border-violet-100 bg-violet-50',
        rose: 'border-rose-100 bg-rose-50',
    };
    return (
        <div className={`relative p-4 rounded-2xl border ${colorMap[color]}`}>
            {alert && (
                <AlertCircle size={14} className="absolute top-3 right-3 text-amber-500" />
            )}
            <div className="mb-2">{icon}</div>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
    );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function AdvisorCard({ data, vatSavings, taxSavings, month }: {
    data: TaxSummaryData; vatSavings: number; taxSavings: number; month: number;
}) {
    const tips: { icon: string; msg: string; type: 'info' | 'warn' | 'success' }[] = [];

    if (data.estimatedTax > 0) {
        tips.push({
            icon: '📅',
            msg: `${MONTH_NAMES[month]} sonu itibarıyla yaklaşık ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.estimatedTax)} vergi ödemeniz çıkabilir. Hazırlıklı olun!`,
            type: 'warn'
        });
    }
    if (vatSavings > 0) {
        tips.push({
            icon: '💡',
            msg: `Bu ayki faturalarınız sayesinde ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(vatSavings)} KDV iadesi/indirimi hakkınız oluştu.`,
            type: 'success'
        });
    }
    if (taxSavings > 0) {
        tips.push({
            icon: '🏆',
            msg: `Gider kayıtlarınız vergi matrahınızı düşürdü. Tahmini ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(taxSavings)} vergi tasarrufu sağladınız.`,
            type: 'success'
        });
    }
    if (data.totalKkeg > 0) {
        tips.push({
            icon: '⚠️',
            msg: `${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.totalKkeg)} tutarındaki harcama KKEG sayıldı. Mali müşavirinize danışmanızı öneririz.`,
            type: 'warn'
        });
    }

    if (tips.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-blue-400" />
                <h3 className="font-semibold">Mali Müşavir Önerileri</h3>
            </div>
            <div className="space-y-3">
                {tips.map((t, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm
                        ${t.type === 'warn' ? 'bg-amber-500/15 border border-amber-500/20' :
                            t.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/20' :
                                'bg-blue-500/15 border border-blue-500/20'}`}>
                        <span className="text-lg leading-none">{t.icon}</span>
                        <p className={t.type === 'warn' ? 'text-amber-200' : t.type === 'success' ? 'text-emerald-200' : 'text-blue-200'}>
                            {t.msg}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
