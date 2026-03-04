import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface Invoice {
    id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    vendorName?: string;
    totalAmount?: number;
    vatAmount?: number;
    taxRate?: number;
    category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    FUEL: 'Yakıt', FOOD: 'Yiyecek', OFFICE_SUPPLIES: 'Ofis Malzeme',
    IT_SERVICES: 'BT Hizmetleri', VEHICLE_MAINTENANCE: 'Araç Bakım',
    ENTERTAINMENT: 'Temsil', HEALTH: 'Sağlık', EDUCATION: 'Eğitim',
    RENT: 'Kira', UTILITY: 'Fatura', OTHER: 'Diğer',
};

const CATEGORY_COLORS: Record<string, string> = {
    FUEL: '#f59e0b', FOOD: '#10b981', OFFICE_SUPPLIES: '#6366f1',
    IT_SERVICES: '#3b82f6', VEHICLE_MAINTENANCE: '#ef4444',
    ENTERTAINMENT: '#ec4899', HEALTH: '#14b8a6', EDUCATION: '#8b5cf6',
    RENT: '#f97316', UTILITY: '#06b6d4', OTHER: '#94a3b8',
};

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// SVG Line Chart Component
function LineChart({ data, width = 600, height = 220 }: { data: { label: string; amount: number; count: number }[]; width?: number; height?: number }) {
    if (data.length === 0) return <div className="flex items-center justify-center h-56 text-slate-400 text-sm">Henüz yeterli veri yok.</div>;

    const padding = { top: 20, right: 30, bottom: 40, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.map(d => d.amount), 1);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
        y: padding.top + chartH - ((d.amount - minVal) / range) * chartH,
        ...d,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Y-axis labels
    const yTicks = 5;
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = minVal + (range / yTicks) * i;
        return { val, y: padding.top + chartH - (i / yTicks) * chartH };
    });

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            style={{ maxHeight: `${height}px` }}
        >
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#137fec" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#137fec" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map((yl, i) => (
                <g key={i}>
                    <line x1={padding.left} y1={yl.y} x2={width - padding.right} y2={yl.y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={i > 0 ? '4 4' : '0'} />
                    <text x={padding.left - 10} y={yl.y + 4} textAnchor="end" fontSize={10} fill="#94a3b8" fontWeight={500}>
                        {yl.val >= 1000 ? `${(yl.val / 1000).toFixed(0)}K` : yl.val.toFixed(0)}
                    </text>
                </g>
            ))}

            {/* Area fill */}
            <path d={areaD} fill="url(#areaGrad)" />

            {/* Main line */}
            <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {/* X-axis labels */}
            {points.map((p, i) => (
                <text key={i} x={p.x} y={height - 10} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={600}>
                    {p.label}
                </text>
            ))}

            {/* Data points + hover areas */}
            {points.map((p, i) => (
                <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                    {/* Invisible hover area */}
                    <rect x={p.x - 20} y={padding.top} width={40} height={chartH} fill="transparent" />

                    {/* Vertical guide line on hover */}
                    {hoveredIdx === i && (
                        <line x1={p.x} y1={padding.top} x2={p.x} y2={padding.top + chartH} stroke="#137fec" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                    )}

                    {/* Point */}
                    <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} fill="white" stroke="#137fec" strokeWidth={2.5}
                        style={{ transition: 'r 0.15s ease' }} />
                    {hoveredIdx === i && (
                        <circle cx={p.x} cy={p.y} r={12} fill="#137fec" opacity={0.1} />
                    )}

                    {/* Tooltip */}
                    {hoveredIdx === i && (
                        <g>
                            <rect x={p.x - 55} y={p.y - 48} width={110} height={36} rx={8} fill="#1e293b" opacity={0.95} />
                            <text x={p.x} y={p.y - 33} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>
                                {p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                            </text>
                            <text x={p.x} y={p.y - 19} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                                {p.count} fatura
                            </text>
                        </g>
                    )}
                </g>
            ))}
        </svg>
    );
}

// SVG Bar Chart Component for category/invoice count
function BarChart({ data, width = 600, height = 220 }: { data: { label: string; count: number; color: string }[]; width?: number; height?: number }) {
    if (data.length === 0) return <div className="flex items-center justify-center h-56 text-slate-400 text-sm">Veri bulunamadı.</div>;

    const padding = { top: 10, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const barWidth = Math.min(40, (chartW / data.length) * 0.6);
    const gap = (chartW - barWidth * data.length) / (data.length + 1);

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: `${height}px` }}>
            {/* Grid */}
            {Array.from({ length: 4 }, (_, i) => {
                const y = padding.top + (chartH / 4) * i;
                const val = maxVal - (maxVal / 4) * i;
                return (
                    <g key={i}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{Math.round(val)}</text>
                    </g>
                );
            })}
            <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="#e2e8f0" strokeWidth={1} />

            {/* Bars */}
            {data.map((d, i) => {
                const barH = (d.count / maxVal) * chartH;
                const x = padding.left + gap + i * (barWidth + gap);
                const y = padding.top + chartH - barH;
                const isHovered = hoveredIdx === i;
                return (
                    <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
                        <rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={d.color} opacity={isHovered ? 1 : 0.8}
                            style={{ transition: 'opacity 0.2s, y 0.3s, height 0.3s' }} />
                        <text x={x + barWidth / 2} y={padding.top + chartH + 18} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={600}>
                            {d.label}
                        </text>
                        {isHovered && (
                            <g>
                                <rect x={x + barWidth / 2 - 30} y={y - 28} width={60} height={22} rx={6} fill="#1e293b" opacity={0.95} />
                                <text x={x + barWidth / 2} y={y - 13} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>
                                    {d.count} adet
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

// Donut Chart Component
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;

    const size = 160;
    const cx = size / 2, cy = size / 2;
    const radius = 60, inner = 40;
    let cumAngle = -90;

    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((d, i) => {
                    const pct = d.value / total;
                    const startAngle = cumAngle;
                    cumAngle += pct * 360;
                    const endAngle = cumAngle;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const largeArc = pct > 0.5 ? 1 : 0;

                    const r = hovered === i ? radius + 4 : radius;
                    const ir = hovered === i ? inner - 2 : inner;

                    const x1 = cx + r * Math.cos(startRad);
                    const y1 = cy + r * Math.sin(startRad);
                    const x2 = cx + r * Math.cos(endRad);
                    const y2 = cy + r * Math.sin(endRad);
                    const ix1 = cx + ir * Math.cos(endRad);
                    const iy1 = cy + ir * Math.sin(endRad);
                    const ix2 = cx + ir * Math.cos(startRad);
                    const iy2 = cy + ir * Math.sin(startRad);

                    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

                    return (
                        <path key={i} d={path} fill={d.color} opacity={hovered === null || hovered === i ? 1 : 0.4}
                            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                            style={{ transition: 'opacity 0.2s, d 0.3s', cursor: 'pointer' }} />
                    );
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={800} fill="#1e293b">
                    {total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={600}>TOPLAM ₺</text>
            </svg>
            <div className="space-y-1.5 flex-1">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs group"
                        onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-semibold text-slate-600 flex-1 truncate group-hover:text-slate-900 transition-colors">{d.label}</span>
                        <span className="font-bold text-slate-800">{d.value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺</span>
                        <span className="text-slate-400 w-10 text-right">%{((d.value / total) * 100).toFixed(0)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [activeChart, setActiveChart] = useState<'line' | 'bar'>('line');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/invoices');
                setInvoices(res.data);
            } catch { /* silent */ }
        };
        fetch();
    }, []);

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
            toast.success('Rapor indiriliyor!');
        } catch {
            toast.error('Rapor indirilemedi.');
        }
    };

    const approved = invoices.filter(i => i.status === 'APPROVED');
    const totalRevenue = approved.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const totalVat = approved.reduce((s, i) => s + (i.vatAmount ?? 0), 0);
    const avgInvoice = approved.length > 0 ? totalRevenue / approved.length : 0;

    // Monthly trend data
    const monthlyData = useMemo(() => {
        const monthMap: Record<string, { amount: number; count: number }> = {};
        approved.forEach(inv => {
            const d = new Date(inv.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthMap[key]) monthMap[key] = { amount: 0, count: 0 };
            monthMap[key].amount += inv.totalAmount ?? 0;
            monthMap[key].count++;
        });
        return Object.entries(monthMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)
            .map(([key, val]) => {
                const [y, m] = key.split('-');
                return {
                    label: `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`,
                    amount: Math.round(val.amount * 100) / 100,
                    count: val.count,
                };
            });
    }, [approved]);

    // Category breakdown (for donut chart)
    const categoryData = useMemo(() => {
        const catMap: Record<string, number> = {};
        approved.forEach(inv => {
            const cat = inv.category ?? 'OTHER';
            catMap[cat] = (catMap[cat] ?? 0) + (inv.totalAmount ?? 0);
        });
        return Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => ({
                label: CATEGORY_LABELS[cat] ?? cat,
                value: Math.round(val * 100) / 100,
                color: CATEGORY_COLORS[cat] ?? '#94a3b8',
            }));
    }, [approved]);

    // Monthly invoice count for bar chart
    const monthlyCountData = useMemo(() => {
        const monthMap: Record<string, { pending: number; approved: number; rejected: number }> = {};
        invoices.forEach(inv => {
            const d = new Date(inv.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthMap[key]) monthMap[key] = { pending: 0, approved: 0, rejected: 0 };
            if (inv.status === 'APPROVED') monthMap[key].approved++;
            else if (inv.status === 'PENDING') monthMap[key].pending++;
            else monthMap[key].rejected++;
        });
        return Object.entries(monthMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)
            .map(([key, val]) => {
                const [y, m] = key.split('-');
                return {
                    label: `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`,
                    count: val.approved + val.pending + val.rejected,
                    color: '#137fec',
                };
            });
    }, [invoices]);

    // Status breakdown
    const statusStats = useMemo(() => {
        const pending = invoices.filter(i => i.status === 'PENDING').length;
        const approved = invoices.filter(i => i.status === 'APPROVED').length;
        const rejected = invoices.filter(i => i.status === 'REJECTED').length;
        return { pending, approved, rejected, total: invoices.length };
    }, [invoices]);

    return (
        <AppLayout>
            <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Raporlar & Analiz</h1>
                        <p className="text-slate-500 mt-1">Vergi performansınızı detaylı olarak inceleyin.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            {(['month', 'quarter', 'year'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${period === p ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {p === 'month' ? 'Aylık' : p === 'quarter' ? 'Çeyreklik' : 'Yıllık'}
                                </button>
                            ))}
                        </div>
                        <button onClick={downloadReport} className="btn-primary text-sm">
                            <span className="material-symbols-outlined text-lg">download</span>
                            PDF İndir
                        </button>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Toplam Ciro', value: totalRevenue, icon: 'trending_up', iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: `${approved.length} onaylı fatura`, subColor: 'text-emerald-600' },
                        { label: 'Toplam KDV', value: totalVat, icon: 'receipt_long', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', sub: 'İndirilebilir vergi', subColor: 'text-slate-500' },
                        { label: 'Fatura Başı Ort.', value: avgInvoice, icon: 'calculate', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', sub: 'Toplam / Adet', subColor: 'text-slate-500' },
                        { label: 'AI Doğruluk', value: null, icon: 'verified', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', sub: `${statusStats.pending} bekliyor`, subColor: 'text-amber-600' },
                    ].map((stat, idx) => (
                        <div key={idx} className="card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{stat.label}</span>
                                <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
                                    <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-black">
                                {stat.value !== null
                                    ? `${stat.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                    : invoices.length > 0
                                        ? `${Math.round((statusStats.approved / invoices.length) * 100)}%`
                                        : '—'}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${stat.subColor}`}>{stat.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="xl:col-span-2 card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-lg">
                                    {activeChart === 'line' ? 'Aylık Harcama Trendi' : 'Aylık Fatura Sayıları'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Son 8 aya ait veriler</p>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setActiveChart('line')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${activeChart === 'line' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">show_chart</span>
                                    Tutar
                                </button>
                                <button
                                    onClick={() => setActiveChart('bar')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${activeChart === 'bar' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">bar_chart</span>
                                    Adet
                                </button>
                            </div>
                        </div>

                        {activeChart === 'line' ? (
                            <LineChart data={monthlyData} />
                        ) : (
                            <BarChart data={monthlyCountData} />
                        )}
                    </div>

                    {/* Donut Chart — Category Breakdown */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-1">Kategori Dağılımı</h3>
                        <p className="text-xs text-slate-400 mb-5">Onaylanan faturalar bazında</p>
                        {categoryData.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Veri bulunamadı.</p>
                        ) : (
                            <DonutChart data={categoryData} />
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Status Breakdown */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4">Durum Dağılımı</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Onaylı', count: statusStats.approved, color: '#10b981', icon: 'check_circle' },
                                { label: 'Bekliyor', count: statusStats.pending, color: '#f59e0b', icon: 'pending' },
                                { label: 'Reddedildi', count: statusStats.rejected, color: '#ef4444', icon: 'cancel' },
                            ].map(s => {
                                const pct = statusStats.total > 0 ? (s.count / statusStats.total) * 100 : 0;
                                return (
                                    <div key={s.label} className="group">
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base" style={{ color: s.color }}>{s.icon}</span>
                                                <span className="font-semibold text-slate-700">{s.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{s.count}</span>
                                                <span className="text-xs text-slate-400">%{pct.toFixed(0)}</span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                                                style={{ width: `${pct}%`, backgroundColor: s.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Toplam Fatura</span>
                            <span className="text-lg font-black">{statusStats.total}</span>
                        </div>
                    </div>

                    {/* Recent Approved */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4">Son Onaylanan Faturalar</h3>
                        {approved.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Henüz onaylanan fatura yok.</p>
                        ) : (
                            <div className="space-y-2">
                                {approved.slice(-5).reverse().map(inv => (
                                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{inv.vendorName || `Fatura #${inv.id}`}</p>
                                            <p className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">
                                                {(inv.totalAmount ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {CATEGORY_LABELS[inv.category ?? 'OTHER'] ?? 'Diğer'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
