import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Lock, CircuitBoard } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);

    // Form States
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login Logic: Allow Username OR Email
                let loginEmail = email;

                if (!email.includes('@')) {
                    // Reverted to direct table lookup as requested, BUT added timeout to prevent infinite hang
                    const queryPromise = supabase
                        .from('profiles')
                        .select('email')
                        .eq('username', email)
                        .maybeSingle();

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Username lookup timed out')), 3000)
                    );

                    let data, fetchError;
                    try {
                        const result = await Promise.race([queryPromise, timeoutPromise]);
                        data = result.data;
                        fetchError = result.error;
                    } catch (e) {
                        fetchError = e;
                    }

                    if (fetchError || !data) {
                        console.warn("Lookup failed:", fetchError);
                        throw new Error('ไม่พบชื่อผู้ใช้นี้ หรือใส่รหัสผ่านผิดครับ');
                    }
                    loginEmail = data.email;
                }

                const { error } = await signIn({ email: loginEmail, password });
                if (error) throw error;
                navigate('/');

            } else {
                // Sign Up Logic
                const { error } = await signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                            role: 'user'
                        }
                    }
                });
                if (error) throw error;
                alert('สมัครสมาชิกสำเร็จ!');
                setIsLogin(true);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'เกิดข้อผิดพลาดในการทำรายการ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Visual / Decor */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-green-600 to-emerald-900 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>

                {/* Decorative circles */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-green-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-white text-center px-12">
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                            <CircuitBoard size={48} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">KU Sport KPS</h1>
                    <p className="text-lg text-green-100 font-light leading-relaxed">
                        ระบบจองสนามกีฬามหาวิทยาลัยเกษตรศาสตร์<br />
                        สะดวก รวดเร็ว และทันสมัยที่สุด
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 sm:p-12 lg:p-24 relative">
                {/* Mobile Background Decor */}
                <div className="absolute lg:hidden inset-0 bg-green-50 z-0"></div>

                <div className="w-full max-w-md space-y-8 relative z-10 bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none border lg:border-none border-gray-100">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {isLogin ? 'ยินดีต้อนรับกลับ!' : 'เริ่มต้นใช้งาน'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {isLogin ? 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ' : 'สมัครสมาชิกใหม่เพื่อจองสนาม'}
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">

                            {/* Only show separate Username field in Sign Up mode */}
                            {!isLogin && (
                                <div className="space-y-1">
                                    <label htmlFor="username" className="text-sm font-medium text-gray-700 block">ชื่อผู้ใช้</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required={!isLogin}
                                            className="block w-full pl-10 px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                                            placeholder="ตั้งชื่อผู้ใช้ของคุณ"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                    {isLogin ? 'ชื่อผู้ใช้ หรือ อีเมล' : 'อีเมลของคุณ'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {isLogin ? <User className="h-5 w-5 text-gray-400" /> : <Mail className="h-5 w-5 text-gray-400" />}
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type={isLogin ? "text" : "email"}
                                        autoComplete={isLogin ? "username" : "email"}
                                        required
                                        className="block w-full pl-10 px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                                        placeholder={isLogin ? "กรอกชื่อผู้ใช้ หรือ อีเมล" : "example@ku.th"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700 block">รหัสผ่าน</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">หรือ</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center space-y-2">
                            <p className="text-sm text-gray-600">
                                {isLogin ? 'ยังไม่มีบัญชีใช้งาน?' : 'มีบัญชีอยู่แล้ว?'}
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                    }}
                                    className="ml-2 font-semibold text-green-600 hover:text-green-500 transition-colors"
                                >
                                    {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                                </button>
                            </p>

                            <div>
                                <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                    &larr; กลับหน้าหลัก
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
