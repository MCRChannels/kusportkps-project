import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { User, Shield, Search } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch users", error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message;
            setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้: " + msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            (user.username && user.username.toLowerCase().includes(query)) ||
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.id && user.id.toString().includes(query))
        );
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Shield className="mr-2 text-green-600" />
                ผู้ใช้งาน
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Premium Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="relative flex-1 max-w-lg group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, email"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all text-gray-700 bg-gray-50/50 focus:bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    {searchQuery && (
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 fade-in">
                            พบ {filteredUsers.length} รายการ
                        </span>
                    )}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <User size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.username || 'No Username'}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="user">ผู้ใช้งาน</option>
                                        <option value="staff">เจ้าหน้าที่</option>
                                        <option value="admin">ผู้ดูแลระบบ</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                                    {user.id}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-gray-900 truncate">{user.username || 'No Username'}</div>
                                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <span className="text-sm text-gray-500">สิทธิการใช้งาน:</span>
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="text-sm border-gray-200 rounded-lg shadow-sm focus:border-green-500 focus:ring-green-500 py-1.5 pl-3 pr-8"
                            >
                                <option value="user">ผู้ใช้งาน</option>
                                <option value="staff">เจ้าหน้าที่</option>
                                <option value="admin">ผู้ดูแลระบบ</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
