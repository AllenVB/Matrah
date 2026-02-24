import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogIn } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            toast.success('Giriş başarılı!');
            navigate('/');
        } catch {
            toast.error('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="card w-full max-w-md p-8 sm:p-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary-700 mb-2">MATRAH</h1>
                    <p className="text-lg text-slate-500">Vergi & Gider Takip Sistemi</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-slate-700 font-medium mb-2 text-lg">E-Posta Adresiniz</label>
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
                        <label className="block text-slate-700 font-medium mb-2 text-lg">Şifreniz</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full mt-4">
                        <LogIn size={24} />
                        Sisteme Giriş Yap
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-600 text-lg">
                        Hesabınız yok mu? <a href="/register" className="text-primary-600 font-semibold hover:underline">Kayıt Olun</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
