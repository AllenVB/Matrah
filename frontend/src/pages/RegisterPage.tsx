import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [taxId, setTaxId] = useState('');
    const [userType, setUserType] = useState('FREELANCER');

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { email, password, taxId, userType });
            localStorage.setItem('token', res.data.token);
            toast.success('Kayıt başarılı! Sisteme giriş yaptınız.');
            navigate('/');
        } catch {
            toast.error('Kayıt oluşturulamadı. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="card w-full max-w-md p-8 sm:p-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-700 mb-2">Yeni Hesap Oluştur</h1>
                    <p className="text-lg text-slate-500">MATRAH'a Hoş Geldiniz</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-slate-700 font-medium mb-1 text-lg">E-Posta Adresiniz</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="ornek@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-1 text-lg">Vergi Numaranız (TCKN/VKN)</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="11111111111"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-1 text-lg">Hesap Türü</label>
                        <select
                            className="input-field bg-white"
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                        >
                            <option value="FREELANCER">Serbest Çalışan (Freelancer)</option>
                            <option value="ACCOUNTANT">Mali Müşavir (Accountant)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-1 text-lg">Şifre Belirleyin</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full mt-6">
                        <UserPlus size={24} />
                        Hesabımı Oluştur
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 text-lg">
                        Zaten hesabınız var mı? <a href="/login" className="text-primary-600 font-semibold hover:underline">Giriş Yapın</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
