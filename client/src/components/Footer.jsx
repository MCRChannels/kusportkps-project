import React from 'react';
import { MapPin, Phone, Mail, Facebook, Globe } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white pt-12 pb-6">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Column 1: Info */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold">KU</div>
                            <span className="text-xl font-bold">Sport KPS</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน <br />
                            มุ่งเน้นส่งเสริมสุขภาพและนันทนาการสำหรับนิสิตและบุคลากร
                        </p>
                    </div>

                    {/* Column 2: Contact */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-400">ติดต่อเรา</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start">
                                <MapPin size={18} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>1 ม.6 ต.กำแพงแสน อ.กำแพงแสน จ.นครปฐม 73140</span>
                            </li>
                            <li className="flex items-center">
                                <Phone size={18} className="mr-2 text-green-500" />
                                <span>034-351-169</span>
                            </li>
                            <li className="flex items-center">
                                <Mail size={18} className="mr-2 text-green-500" />
                                <span>sports@ku.ac.th</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Social / Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-green-400">ติดตามข่าวสาร</h3>
                        <div className="flex space-x-4 mb-6">
                            <a href="https://www.facebook.com/membersport/" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition">
                                <Facebook size={20} />
                            </a>
                            <a href="https://stac.kps.ku.ac.th/" className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center hover:bg-blue-500 transition">
                                <Globe size={20} />
                            </a>
                        </div>
                        <div className="text-xs text-gray-500">
                            <a href="#" className="hover:text-white transition mr-4">นโยบายความเป็นส่วนตัว</a>
                            <a href="#" className="hover:text-white transition">ข้อกำหนดการใช้งาน</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
                    &copy; 2025 Kasetsart University Kamphaengsaen Campus. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
