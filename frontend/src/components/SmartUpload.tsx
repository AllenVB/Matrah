import { useCallback, useState, useRef } from 'react';
import { UploadCloud, FileText, FileCode, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/** Desteklenen dosya türleri */
const ACCEPTED = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/xml': ['.xml'],
    'application/xml': ['.xml'],
} as const;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'quality_error';

interface UploadResult {
    invoiceId: number;
    status: string;
    vendorName?: string;
    totalAmount?: number;
    taxRate?: number;
    qualityWarning?: string;
}

interface SmartUploadProps {
    onUploadComplete: (result: UploadResult) => void;
    onUploadStart?: () => void;
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return <Image size={28} className="text-blue-500" />;
    if (type === 'application/pdf') return <FileText size={28} className="text-red-500" />;
    return <FileCode size={28} className="text-green-600" />;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SmartUpload({ onUploadComplete, onUploadStart }: SmartUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const isAccepted = (f: File) =>
        Object.keys(ACCEPTED).includes(f.type) || f.name.endsWith('.xml');

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const f = files[0];
        if (!isAccepted(f)) {
            setErrorMsg('Sadece JPEG, PNG, PDF veya XML (e-Fatura) dosyaları kabul edilir.');
            setStatus('error');
            return;
        }
        if (f.size > 20 * 1024 * 1024) {
            setErrorMsg('Dosya boyutu 20 MB\'ı aşamaz.');
            setStatus('error');
            return;
        }
        setFile(f);
        setStatus('idle');
        setErrorMsg('');
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, []);

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);

    const upload = async () => {
        if (!file) return;
        setStatus('uploading');
        setProgress(10);
        onUploadStart?.();

        const form = new FormData();
        form.append('file', file);

        // Endpoint: PDF ve XML için ayrı endpoint, görüntü için normal endpoint
        const endpoint = file.type === 'application/pdf' || file.name.endsWith('.xml')
            ? '/api/invoices/upload-doc'
            : '/api/invoices/upload';

        try {
            const token = localStorage.getItem('token');
            setProgress(40);

            const res = await fetch(`/api${endpoint.replace('/api', '')}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: form,
            });

            setProgress(80);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                // Kalite hatası (bulanık görüntü)
                if (res.status === 400 && errData?.error === 'low_quality') {
                    setErrorMsg(errData.message || 'Görüntü kalitesi yetersiz. Lütfen daha net bir fotoğraf çekin.');
                    setStatus('quality_error');
                    return;
                }
                throw new Error(errData?.message || 'Yükleme başarısız');
            }

            const data: UploadResult = await res.json();
            setProgress(100);
            setStatus('success');
            onUploadComplete(data);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
            setErrorMsg(message);
            setStatus('error');
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setErrorMsg('');
        setProgress(0);
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !file && inputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer select-none
                    transition-all duration-200
                    ${isDragging ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'}
                    ${file ? 'cursor-default' : ''}
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.xml"
                    onChange={e => handleFiles(e.target.files)}
                />

                {!file ? (
                    <div className="space-y-3">
                        <UploadCloud size={48} className="mx-auto text-slate-400" />
                        <div>
                            <p className="font-semibold text-slate-700">Dosyayı sürükle & bırak</p>
                            <p className="text-sm text-slate-500 mt-1">veya tıklayarak seç</p>
                        </div>
                        <div className="flex justify-center gap-2 flex-wrap">
                            {[
                                { label: 'JPEG/PNG', color: 'bg-blue-100 text-blue-700' },
                                { label: 'PDF', color: 'bg-red-100 text-red-700' },
                                { label: 'e-Fatura XML', color: 'bg-green-100 text-green-700' },
                            ].map(b => (
                                <span key={b.label} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${b.color}`}>
                                    {b.label}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">Max. 20 MB</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        {getFileIcon(file.type)}
                        <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-slate-800 truncate">{file.name}</p>
                            <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                        </div>
                        {status === 'idle' && (
                            <button onClick={e => { e.stopPropagation(); reset(); }}
                                className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {status === 'uploading' && (
                <div className="space-y-2">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Dosya analiz ediliyor…
                    </p>
                </div>
            )}

            {/* Success */}
            {status === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">AI analizi tamamlandı — bilgileri doğrulayın</span>
                </div>
            )}

            {/* Error / Quality Error */}
            {(status === 'error' || status === 'quality_error') && (
                <div className={`flex items-start gap-2 p-3 border rounded-xl text-sm
                    ${status === 'quality_error'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">{status === 'quality_error' ? '📷 Görüntü Kalitesi Düşük' : 'Hata'}</p>
                        <p>{errorMsg}</p>
                        {status === 'quality_error' && (
                            <p className="mt-1 text-amber-600">Manuel giriş sekmesini kullanabilirsiniz.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Button */}
            {file && status === 'idle' && (
                <button
                    onClick={upload}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <UploadCloud size={18} />
                    {file.name.endsWith('.xml') ? 'e-Fatura XML Analiz Et' : 'AI ile Analiz Et'}
                </button>
            )}

            {(status === 'error' || status === 'quality_error') && (
                <button onClick={reset} className="w-full py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                    Başka Dosya Seç
                </button>
            )}
        </div>
    );
}
