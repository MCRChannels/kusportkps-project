import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, MapPin, Phone, Facebook, Activity, Dumbbell, Trophy, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NewsSection from '../components/NewsSection';
import ProfileWarning from '../components/ProfileWarning';

const FadeIn = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        });
        if (domRef.current) observer.observe(domRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const Home = () => {
    const DEFAULT_IMAGES = [
        "https://scontent.fbkk22-6.fna.fbcdn.net/v/t39.30808-6/571120155_4122047174607325_964887027510442636_n.png?_nc_cat=104&_nc_cb=99be929b-f3b7c874&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHFZIgMRNH8liPuZQOJOZlesqWbNRDUnJSypZs1ENSclOWZaOBWK4yJeanP4khqTLyruhDrPLee9jfUFdhXSKrP&_nc_ohc=CFTQSspRqiQQ7kNvwEiugRT&_nc_oc=Adn9RoyVKpcm7Q4kFftbzWxNdTaHrMZMdwNWVQlNbqjWL75XHVEVtX9iSwQzzH4gHLrmgxVYQBhnvzTKzCVLRAg6&_nc_zt=23&_nc_ht=scontent.fbkk22-6.fna&_nc_gid=yCPs5tieJpTtvuEwcVqwcQ&oh=00_Afn1q4GHRN-QvXo_s6hcDf4jf9Z4h4dYbslqhtJuuCBs-g&oe=695A4DC7",
        "https://scontent.fbkk31-1.fna.fbcdn.net/v/t39.30808-6/601427499_4192714450873930_2070510421863645213_n.jpg?_nc_cat=106&_nc_cb=99be929b-f3b7c874&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHXpGhtsbUtnGH4XI64V5lfhHdShHAeCJ6Ed1KEcB4Inuc_-i6BRe3Hc8nz9rbCbQjH4HCG0tAP7ehfdZgiYQ45&_nc_ohc=Go9iLUnKKcEQ7kNvwHLd0I4&_nc_oc=Adn-KZCnzkz5pJ5-GzEfLzoLPZ3c35_gBpgNqIiv-fQnG3gTtNHNXbtzX5QA1IlepVDJuqyvMzGQQvbejG0aR_3f&_nc_zt=23&_nc_ht=scontent.fbkk31-1.fna&_nc_gid=yNeAgktcKrPMBMPRSAXSEA&oh=00_AfpaqpV5Qv-FLpNrgJQTMQ2sdn85eSMqBNF7--iufpGM9g&oe=695DAABB",
        "https://scontent.fbkk31-1.fna.fbcdn.net/v/t39.30808-6/605262389_4192715120873863_4246852424786332388_n.jpg?_nc_cat=100&_nc_cb=99be929b-f3b7c874&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGW5ICiw-EvjKhvxw0xjt_IdjeDm72vIt12N4Obva8i3fL39YjUVgbFnwPYmTTllzaiXqWKkzBNHfJqA3aZUxAu&_nc_ohc=WQY94jjdYi0Q7kNvwEzTIor&_nc_oc=AdmPpFJqKPshnOMI9kTOAfplPfck7-bqyP0WW9A7JP9QmeJSOkFz6cItygyEJIGyIzLk8yhlg1-ZZPtv_3aZ2GOL&_nc_zt=23&_nc_ht=scontent.fbkk31-1.fna&_nc_gid=cDlQY9m_Q1t1mm5WADCTVQ&oh=00_Afren6Iy5DtIkzPztfwSKX67Q2cQwqMoVs7nsPqxwt4wcQ&oe=695DAB1Eเ"
    ];

    const [heroImages, setHeroImages] = useState(DEFAULT_IMAGES);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [settings, setSettings] = useState({});

    // Fetch dynamic banners
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data && res.data.hero_banners) {
                    try {
                        const banners = JSON.parse(res.data.hero_banners);
                        if (Array.isArray(banners) && banners.length > 0) {
                            setHeroImages(banners);
                        }
                    } catch (e) {
                        console.error('Failed to parse hero banners', e);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings for banners', error);
            }
        };
        fetchSettings();
    }, []);

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);

    useEffect(() => {
        const interval = setInterval(nextImage, 5000); // 5s Auto rotate
        return () => clearInterval(interval);
    }, [heroImages.length]);

    return (
        <div className="min-h-screen bg-gray-50 font-prompt flex flex-col">
            <Navbar />
            <ProfileWarning />

            {/* Decorative Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
            </div>

            {/* Standard Hero/Carousel Section */}
            <FadeIn>
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-0 md:px-4 py-4 md:py-8">
                        <div className="relative w-full h-[250px] md:h-[450px] lg:h-[500px] overflow-hidden rounded-none md:rounded-sm shadow-sm bg-black group">
                            {heroImages.map((img, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                >
                                    {/* Blurred Background for Ambience */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center blur-md opacity-50 scale-110"
                                        style={{ backgroundImage: `url(${img})` }}
                                    />
                                    {/* Main Image */}
                                    <img
                                        src={img}
                                        alt={`Slide ${index}`}
                                        className="relative w-full h-full object-contain z-10"
                                    />
                                </div>
                            ))}

                            {/* Simple Overlay Text (Bottom Left) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20 flex flex-col justify-end p-6 md:p-12">
                                <div className="max-w-4xl">
                                    <span className="inline-block bg-green-700 text-white text-xs md:text-sm font-bold px-3 py-1 mb-2">
                                        KUKPS SPORTS
                                    </span>
                                    <h2 className="text-2xl md:text-4xl text-white font-bold mb-2 drop-shadow-md">
                                        กองบริหารการกีฬา ท่องเที่ยว และศิลปวัฒนธรรม
                                    </h2>
                                    <p className="text-white/90 text-sm md:text-lg mb-4 drop-shadow-sm font-light hidden md:block">
                                        มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน
                                    </p>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-30 transition hidden group-hover:block">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-30 transition hidden group-hover:block">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* News Section */}
            <FadeIn delay={200}>
                <section className="container mx-auto px-4 py-10 relative z-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
                        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-green-700 pl-3">
                            ข่าวประชาสัมพันธ์
                        </h2>
                    </div>
                    <NewsSection />
                </section>
            </FadeIn>

            {/* Map & Contact Section */}
            <FadeIn delay={400}>
                <section className="container mx-auto px-4 py-10 mb-10">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[400px]">
                        {/* Information Side */}
                        <div className="bg-gray-800 text-white p-8 lg:w-1/3 flex flex-col justify-center relative overflow-hidden">
                            {/* Decorative Circle */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-600 rounded-full opacity-20"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500 rounded-full opacity-10"></div>

                            <h3 className="text-2xl font-bold mb-6 relative z-10 border-l-4 border-green-500 pl-4">ติดต่อเรา</h3>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <h4 className="font-bold text-lg text-green-400 mb-1">กองบริหารการกีฬา ท่องเที่ยว และศิลปวัฒนธรรม</h4>
                                    <p className="text-gray-300 text-sm">มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน</p>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <MapPin className="text-green-500 mt-1 flex-shrink-0" size={20} />
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        อาคารพลศึกษา 2 เลขที่ 1 หมู่ 6 <br />
                                        ต.กำแพงแสน อ.กำแพงแสน จ.นครปฐม 73140
                                    </p>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Phone className="text-green-500 flex-shrink-0" size={20} />
                                    <p className="text-gray-300 text-sm">0 2942 8772-3</p>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Facebook className="text-green-500 flex-shrink-0" size={20} />
                                    <p className="text-gray-300 text-sm">กองบริหารการกีฬา ท่องเที่ยวและศิลปวัฒนธรรม กำเเพงเเสน </p>
                                </div>
                            </div>
                        </div>

                        {/* Map Side */}
                        <div className="lg:w-2/3 h-[300px] lg:h-full relative">
                            <iframe
                                src="https://maps.google.com/maps?q=14.0218125,99.9805166&hl=th&z=17&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0"
                            ></iframe>
                        </div>
                    </div>
                </section>
            </FadeIn>


            <Footer />
        </div>
    );
};

export default Home;
