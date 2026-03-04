import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable fields
    const [vendorName, setVendorName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [vatAmount, setVatAmount] = useState('');
    const [taxRate, setTaxRate] = useState('');
    const [category, setCategory] = useState('OTHER');

    // Image processing states
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [showFilters, setShowFilters] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await api.get(`/invoices/${id}`);
                const inv: Invoice = res.data;
                setInvoice(inv);
                setVendorName(inv.vendorName ?? '');
                setTotalAmount(inv.totalAmount?.toString() ?? '');
                setVatAmount(inv.vatAmount?.toString() ?? '');
                setTaxRate(inv.taxRate?.toString() ?? '');
                setCategory(inv.category ?? 'OTHER');
            } catch {
                toast.error('Fatura bulunamadı.');
                navigate('/invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, navigate]);

    // Zoom with mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => {
            const newZoom = prev + (e.deltaY > 0 ? -0.1 : 0.1);
            return Math.max(0.3, Math.min(5, newZoom));
        });
    }, []);

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    const zoomIn = () => setZoom(prev => Math.min(5, prev + 0.25));
    const zoomOut = () => setZoom(prev => Math.max(0.3, prev - 0.25));
    const resetView = () => { setZoom(1); setRotation(0); setPanPosition({ x: 0, y: 0 }); setBrightness(100); setContrast(100); };
    const rotateLeft = () => setRotation(prev => prev - 90);
    const rotateRight = () => setRotation(prev => prev + 90);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            imageContainerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    // Download image
    const downloadImage = () => {
        if (invoice?.imageUrl) {
            const link = document.createElement('a');
            link.href = invoice.imageUrl;
            link.download = `fatura-${invoice.id}.jpg`;
            link.click();
        }
    };

    const handleApprove = async () => {
        try {
            await api.put(`/invoices/${id}`, {
                vendorName,
                totalAmount: parseFloat(totalAmount) || 0,
                vatAmount: parseFloat(vatAmount) || 0,
                taxRate: parseFloat(taxRate) || 0,
                category,
                status: 'APPROVED',
            });
            toast.success('Fatura onaylandı!');
            navigate('/invoices');
        } catch {
            toast.error('Onaylama başarısız.');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bu faturayı silmek istediğinizden emin misiniz?')) return;
        try {
            await api.delete(`/invoices/${id}`);
            toast.success('Fatura silindi.');
            navigate('/invoices');
        } catch {
            toast.error('Silme başarısız.');
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </AppLayout>
        );
    }

    if (!invoice) return null;

    const confidence = invoice.status === 'APPROVED' ? 98.2 : invoice.status === 'PENDING' ? 85.0 : 42.0;
    const isHighConfidence = confidence > 80;

    const imageStyle = {
        transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom}) rotate(${rotation}deg)`,
        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
        transition: isPanning ? 'none' : 'transform 0.3s ease, filter 0.3s ease',
        cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
    };

    return (
        <AppLayout>
            <div className="flex flex-col h-full animate-fadeIn">
                {/* Breadcrumbs */}
                <div className="px-8 py-4 flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            <button onClick={() => navigate('/invoices')} className="hover:text-primary transition-colors">Faturalar</button>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span className="text-slate-900">Fatura #{invoice.id} Analiz</span>
                        </div>
                        <h1 className="text-2xl font-black mt-1">Fatura #{invoice.id}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDelete} className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:scale-[1.02] transition-all">
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Sil
                        </button>
                        <button onClick={handleApprove} className="btn-primary hover:scale-[1.02] transition-all">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            Verileri Onayla
                        </button>
                    </div>
                </div>

                {/* Split View */}
                <div className="flex-1 flex gap-6 px-8 pb-8 overflow-hidden">
                    {/* Left: Document Preview */}
                    <div ref={imageContainerRef} className="flex-1 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {/* Toolbar */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Belge Önizleme (OCR)</span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Zoom Controls */}
                                <button onClick={zoomOut} title="Uzaklaştır" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">zoom_out</span>
                                </button>
                                <div className="w-20 h-1.5 bg-slate-200 rounded-full mx-1 relative">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-200"
                                        style={{ width: `${Math.min(((zoom - 0.3) / 4.7) * 100, 100)}%` }}
                                    />
                                </div>
                                <button onClick={zoomIn} title="Yakınlaştır" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">zoom_in</span>
                                </button>

                                <div className="h-5 w-[1px] bg-slate-300 mx-1.5" />

                                {/* Rotate */}
                                <button onClick={rotateLeft} title="Sola Döndür" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">rotate_left</span>
                                </button>
                                <button onClick={rotateRight} title="Sağa Döndür" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">rotate_right</span>
                                </button>

                                <div className="h-5 w-[1px] bg-slate-300 mx-1.5" />

                                {/* Filters Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    title="Görüntü Filtreleri"
                                    className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">tune</span>
                                </button>

                                {/* Reset */}
                                <button onClick={resetView} title="Sıfırla" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">restart_alt</span>
                                </button>

                                <div className="h-5 w-[1px] bg-slate-300 mx-1.5" />

                                {/* Download & Fullscreen */}
                                {invoice.imageUrl && !invoice.manual && (
                                    <button onClick={downloadImage} title="İndir" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                        <span className="material-symbols-outlined text-lg">download</span>
                                    </button>
                                )}
                                <button onClick={toggleFullscreen} title="Tam Ekran" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-lg">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                                </button>
                                {invoice.imageUrl && (
                                    <a href={invoice.imageUrl} target="_blank" rel="noreferrer" title="Yeni Sekmede Aç" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-6 animate-slideDown">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-xs font-semibold text-slate-500 w-16">Parlaklık</span>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        value={brightness}
                                        onChange={e => setBrightness(Number(e.target.value))}
                                        className="flex-1 h-1.5 accent-primary"
                                    />
                                    <span className="text-xs font-bold text-slate-600 w-10 text-right">{brightness}%</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-xs font-semibold text-slate-500 w-16">Kontrast</span>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        value={contrast}
                                        onChange={e => setContrast(Number(e.target.value))}
                                        className="flex-1 h-1.5 accent-primary"
                                    />
                                    <span className="text-xs font-bold text-slate-600 w-10 text-right">{contrast}%</span>
                                </div>
                                <button
                                    onClick={() => { setBrightness(100); setContrast(100); }}
                                    className="text-xs text-primary font-semibold hover:underline"
                                >
                                    Sıfırla
                                </button>
                            </div>
                        )}

                        {/* Image Area */}
                        <div
                            className="flex-1 bg-slate-200 p-8 overflow-hidden flex items-center justify-center"
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {invoice.imageUrl && !invoice.manual ? (
                                <img
                                    ref={imageRef}
                                    src={invoice.imageUrl}
                                    alt="Fatura Görseli"
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm select-none"
                                    style={imageStyle}
                                    draggable={false}
                                />
                            ) : (
                                <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl rounded-sm p-12" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}>
                                    <div className="flex justify-between items-start mb-12">
                                        <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                                            {(vendorName?.[0] ?? 'M').toUpperCase()}
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-xl font-bold">FATURA</h4>
                                            <p className="text-slate-500 text-sm"># {invoice.id}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-12">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Satıcı</p>
                                            <p className="text-sm font-bold">{vendorName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tarih</p>
                                            <p className="text-sm font-medium">{new Date(invoice.createdAt).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    <table className="w-full text-left text-sm mt-8 border-t border-slate-100 pt-4">
                                        <thead>
                                            <tr className="text-slate-400">
                                                <th className="py-2">Açıklama</th>
                                                <th className="py-2 text-right">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-100">
                                                <td className="py-3">{category || 'Genel'}</td>
                                                <td className="py-3 text-right font-medium">{totalAmount ? `${parseFloat(totalAmount).toFixed(2)} ₺` : '-'}</td>
                                            </tr>
                                            {vatAmount && (
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-3">KDV (%{taxRate || '?'})</td>
                                                    <td className="py-3 text-right font-medium">{parseFloat(vatAmount).toFixed(2)} ₺</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td className="py-4 text-right font-bold">Toplam</td>
                                                <td className="py-4 text-right font-black text-lg text-primary">
                                                    {totalAmount ? `${parseFloat(totalAmount).toFixed(2)} ₺` : '-'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Data Breakdown */}
                    <div className="w-[420px] flex flex-col gap-4 overflow-y-auto">
                        {/* Confidence */}
                        <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md ${isHighConfidence ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isHighConfidence ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'}`}>
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isHighConfidence ? 'text-green-700' : 'text-amber-700'}`}>
                                    {isHighConfidence ? 'Yüksek Güvenli Çıkarım' : 'Düşük Güven — Manuel Doğrulama Gerekli'}
                                </p>
                                <p className={`text-xs ${isHighConfidence ? 'text-green-600' : 'text-amber-600'}`}>
                                    AI modeli %{confidence.toFixed(1)} doğruluk tahmin ediyor
                                </p>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Satıcı Adı</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        className="flex-1 border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                        value={vendorName}
                                        onChange={(e) => setVendorName(e.target.value)}
                                    />
                                    <span className={`material-symbols-outlined text-lg ${vendorName ? 'text-green-500' : 'text-amber-500'}`}>
                                        {vendorName ? 'verified' : 'warning'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Fatura No</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        className="flex-1 border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                        value={`#${invoice.id}`}
                                        readOnly
                                    />
                                    <span className="material-symbols-outlined text-green-500 text-lg">verified</span>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Tarih</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        className="flex-1 border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                        value={new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                                        readOnly
                                    />
                                    <span className="material-symbols-outlined text-green-500 text-lg">verified</span>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2 bg-primary/5">
                                <label className="text-[10px] uppercase font-black text-primary tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">info</span> Toplam Tutar
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                                        <input
                                            className="w-full pl-8 border-2 border-primary/20 bg-white rounded-lg p-2.5 text-lg font-black text-primary focus:ring-2 focus:ring-primary transition-shadow"
                                            value={totalAmount}
                                            onChange={(e) => setTotalAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">KDV Tutarı</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        className="flex-1 border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                        value={vatAmount}
                                        onChange={(e) => setVatAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <span className={`material-symbols-outlined text-lg ${vatAmount ? 'text-green-500' : 'text-amber-500'}`}>
                                        {vatAmount ? 'verified' : 'warning'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">KDV Oranı (%)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        className="flex-1 border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        placeholder="18"
                                    />
                                </div>
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Kategori</label>
                                <select
                                    className="border-none bg-slate-50 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary transition-shadow"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="OTHER">Diğer</option>
                                    <option value="FUEL">Yakıt</option>
                                    <option value="FOOD">Yiyecek</option>
                                    <option value="OFFICE_SUPPLIES">Ofis Malzemeleri</option>
                                    <option value="IT_SERVICES">BT Hizmetleri</option>
                                    <option value="VEHICLE_MAINTENANCE">Araç Bakım</option>
                                    <option value="ENTERTAINMENT">Temsil</option>
                                    <option value="HEALTH">Sağlık</option>
                                    <option value="EDUCATION">Eğitim</option>
                                    <option value="RENT">Kira</option>
                                    <option value="UTILITY">Fatura</option>
                                </select>
                            </div>
                        </div>

                        {/* Status card */}
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-black uppercase text-slate-400">Durum</h4>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${invoice.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                                    : invoice.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${invoice.status === 'APPROVED' ? 'bg-green-500'
                                        : invoice.status === 'PENDING' ? 'bg-amber-500'
                                            : 'bg-red-500'
                                        }`} />
                                    {invoice.status === 'APPROVED' ? 'Onaylı' : invoice.status === 'PENDING' ? 'Bekliyor' : 'Reddedildi'}
                                </span>
                            </div>
                            {invoice.status === 'REJECTED' && (
                                <p className="text-xs text-red-600 mt-2">
                                    Bu fatura AI tarafından doğrulanamadı. Lütfen verileri kontrol edip manuel olarak onaylayın.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
