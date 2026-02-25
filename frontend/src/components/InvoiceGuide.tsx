import { useState } from 'react';
import { Info, X } from 'lucide-react';

interface InvoiceGuideProps {
    /** Tetikleyici buton için ek CSS sınıfı */
    className?: string;
}

/**
 * Fatura yükleme rehberi bilgi balonu.
 * Küçük ℹ️ ikonu tıklandığında patlak bir modal açılır.
 */
export default function InvoiceGuide({ className = '' }: InvoiceGuideProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Tetikleyici buton */}
            <button
                onClick={() => setOpen(true)}
                title="Nasıl yüklemelisiniz?"
                aria-label="Fatura yükleme rehberini aç"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full
                    bg-blue-100 hover:bg-blue-200 text-blue-600
                    border border-blue-200 transition-colors ${className}`}
            >
                <Info size={15} />
            </button>

            {/* Modal */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Başlık */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Info size={20} className="text-blue-500" />
                                Fatura / Fiş Nasıl Yüklenmeli?
                            </h2>
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded">
                                <X size={20} />
                            </button>
                        </div>

                        {/* İçerik */}
                        <div className="px-6 py-5 space-y-5 text-sm text-slate-700">

                            {/* Örnek Fatura */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs leading-6">
                                <p className="font-bold text-center text-slate-600 mb-2">══ ÖRNEK FİŞ FORMATI ══</p>
                                <div className="space-y-0.5">
                                    <p><span className="text-slate-400">Satıcı   :</span> ABC Market Ltd. Şti.</p>
                                    <p><span className="text-slate-400">VKN      :</span> 1234567890</p>
                                    <p><span className="text-slate-400">Tarih    :</span> 25.02.2026  12:35</p>
                                    <hr className="border-slate-300 my-1" />
                                    <p><span className="text-slate-400">Kalem    :</span> Ekmek × 3              9,00 TL</p>
                                    <p><span className="text-slate-400">Kalem    :</span> Temizlik Bezi × 2     64,00 TL</p>
                                    <p><span className="text-slate-400">Kalem    :</span> Laptop Çantası       350,00 TL</p>
                                    <hr className="border-slate-300 my-1" />
                                    <p><span className="text-slate-400">Matrah %1  :</span>   7,50 TL  KDV: 0,08 TL</p>
                                    <p><span className="text-slate-400">Matrah %20 :</span> 385,00 TL  KDV: 83,00 TL</p>
                                    <hr className="border-slate-300 my-1" />
                                    <p className="font-bold"><span className="text-slate-400">TOPLAM   :</span> 423,00 TL</p>
                                    <p className="font-bold"><span className="text-slate-400">KDV TOT. :</span>  83,08 TL</p>
                                </div>
                            </div>

                            {/* KDV Oranları */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-2">🧾 Türkiye KDV Oranları</h3>
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="text-left px-2 py-1.5 rounded-tl-md">Oran</th>
                                            <th className="text-left px-2 py-1.5">Ürün / Hizmet Örnekleri</th>
                                            <th className="text-left px-2 py-1.5 rounded-tr-md">İndirim</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-2 py-1.5 font-bold text-green-700">%1</td>
                                            <td className="px-2 py-1.5">Ekmek, un, bakliyat, taze sebze/meyve, gazete</td>
                                            <td className="px-2 py-1.5 text-green-700">✅ Tam</td>
                                        </tr>
                                        <tr>
                                            <td className="px-2 py-1.5 font-bold text-amber-700">%10</td>
                                            <td className="px-2 py-1.5">Giyim, ilaç, otel, sinema, et, süt, eğitim</td>
                                            <td className="px-2 py-1.5 text-green-700">✅ Tam</td>
                                        </tr>
                                        <tr>
                                            <td className="px-2 py-1.5 font-bold text-red-700">%20</td>
                                            <td className="px-2 py-1.5">Elektronik, mobilya, danışmanlık, kargo</td>
                                            <td className="px-2 py-1.5 text-green-700">✅ Tam</td>
                                        </tr>
                                        <tr className="bg-red-50">
                                            <td className="px-2 py-1.5 font-bold text-red-700">—</td>
                                            <td className="px-2 py-1.5">Alkol, sigara, restoran yemeği</td>
                                            <td className="px-2 py-1.5 text-red-600">❌ Yok (Md.30)</td>
                                        </tr>
                                        <tr className="bg-amber-50">
                                            <td className="px-2 py-1.5 font-bold text-amber-700">%20</td>
                                            <td className="px-2 py-1.5">Yakıt, araç bakım</td>
                                            <td className="px-2 py-1.5 text-amber-600">⚠️ %70</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* İpuçları */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-800">📸 Kaliteli Fotoğraf İpuçları</h3>
                                <ul className="space-y-1 list-none">
                                    {[
                                        '✅ Düz zemine fişi koyun, gölge olmadığından emin olun',
                                        '✅ Tüm metin okunaksız ise manuel giriş yapın',
                                        '✅ Fiş veya PDF fatura formatlarını tercih edin',
                                        '✅ Minimum 200×200 piksel, tercihen 1000px üzeri',
                                        '❌ Bulanık veya çok karanlık fotoğraf sisteme yüklenemez',
                                        '❌ Ekran fotoğrafı (screenshot) kalitesi düşük olabilir',
                                    ].map((tip, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                            <span className="leading-5">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Özel Kurallar */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs">
                                <p className="font-semibold text-amber-800 mb-1">⚡ Türk Vergi Kuralları Özeti</p>
                                <ul className="space-y-0.5 text-amber-700 list-disc list-inside">
                                    <li>Yemek giderleri: günlük <strong>330 TL</strong> üstü indirilmez (2026)</li>
                                    <li>Yakıt/araç bakım: tutarın <strong>%70'i</strong> indirilebilir gider</li>
                                    <li>Bireysel (şahıs): <strong>400.000 TL/yıl</strong> genç girişimci muafiyeti</li>
                                    <li>Eğlence/temsil: <strong>tamamı KKEG</strong> (Md.30/d)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="px-6 pb-5">
                            <button
                                onClick={() => setOpen(false)}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Anladım, Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
