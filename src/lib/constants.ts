import { Facebook, Instagram, Twitter } from "lucide-react";
import {Vehicle} from "@/lib/types";

export const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Availability', href: '/availability' },
    { name: 'Track My Booking', href: '/track' },
    { name: 'FAQ', href: '/faq' },
];

export const features = [
    {
        icon: 'Zap',
        title: 'Instant Booking',
        description: 'Book your scooter in seconds with our easy-to-use platform.',
    },
    {
        icon: 'BatteryCharging',
        title: 'Long-Lasting Battery',
        description: 'Our scooters are equipped with high-capacity batteries for longer rides.',
    },
    {
        icon: 'MapPin',
        title: 'Wide Coverage Area',
        description: 'Find ZapGo scooters available at convenient locations across the city.',
    },
    {
        icon: 'ShieldCheck',
        title: 'Safety First',
        description: 'All our scooters undergo regular maintenance and safety checks.',
    },
];

export const pricingPlans = [
    {
        name: 'Daily Pass',
        price: '₹299',
        period: '/day',
        features: ['Unlimited rides', '24/7 support', 'Includes helmet'],
        cta: 'Choose Daily',
    },
    {
        name: 'Weekly Pass',
        price: '₹1499',
        period: '/week',
        features: ['Best value', 'Unlimited rides', 'Priority support', 'Includes helmet & gloves'],
        cta: 'Choose Weekly',
        popular: true,
    },
];

export const howItWorksSteps = [
    {
        step: 1,
        title: 'Book Online',
        description: 'Select your dates, choose a scooter, and complete your booking online.',
    },
    {
        step: 2,
        title: 'Unlock Your Ride',
        description: 'Use the QR code from your booking to unlock your scooter at a designated spot.',
    },
    {
        step: 3,
        title: 'Enjoy Your Trip',
        description: 'Ride safely and explore the city with your ZapGo scooter.',
    },
    {
        step: 4,
        title: 'Park & End Ride',
        description: 'Park your scooter at any ZapGo zone and end your ride through the app.',
    },
];

export const testimonials = [
    {
        quote: "ZapGo has completely changed my daily commute. It's affordable, convenient, and so much fun!",
        name: 'Priya Sharma',
        title: 'Daily Commuter',
        avatar: 'https://placehold.co/100x100.png',
    },
    {
        quote: 'The booking process was incredibly smooth. I had my scooter ready in minutes. Highly recommended for tourists!',
        name: 'John Doe',
        title: 'Tourist',
        avatar: 'https://placehold.co/100x100.png',
    },
    {
        quote: "I love the weekly pass option. It's perfect for my work week and saves me a lot of money compared to other options.",
        name: 'Anjali Singh',
        title: 'Working Professional',
        avatar: 'https://placehold.co/100x100.png',
    },
];

export const faqItems = [
    {
        question: 'What do I need to rent a scooter?',
        answer: 'You need to be at least 18 years old, have a valid government-issued ID (like Aadhar or a Driver\'s License), and a smartphone to complete the booking process.',
    },
    {
        question: 'Are helmets provided?',
        answer: 'Yes, a helmet is provided with every rental for your safety. We strongly encourage you to wear it at all times while riding.',
    },
    {
        question: 'What is the range of the scooters on a full charge?',
        answer: 'Our scooters typically have a range of 45-50 km on a full charge, which is more than enough for city-wide travel. The range may vary slightly based on riding conditions.',
    },
    {
        question: 'Where can I park the scooter?',
        answer: 'You can park your scooter in any designated ZapGo parking zone, which are clearly marked in our service area. Please park responsibly and do not block public pathways.',
    },
];

export const footerLinks = [
    {
        title: 'Company',
        links: [
            { name: 'About Us', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Press', href: '#' },
        ],
    },
    {
        title: 'Support',
        links: [
            { name: 'Contact Us', href: '/contact' },
            { name: 'FAQ', href: '/faq' },
            { name: 'Terms of Service', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
        ],
    },
    {
        title: 'Blogs',
        links: [
            { name: 'Tech', href: '#' },
            { name: 'News', href: '#' },
            { name: 'Events', href: '#' },
        ],
    },
];

export const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Twitter', href: '#', icon: Twitter },
];

export const vehicles: Vehicle[] = [
    {
        id: 'ola-s1-pro',
        name: 'Ola S1 Pro',
        brand: 'Ola Electric',
        thumbnail: 'https://picsum.photos/seed/ola-s1-pro/600/400',
        images: ['https://picsum.photos/seed/ola-s1-pro/1024/768', 'https://picsum.photos/seed/ola-s1-pro-2/1024/768'],
        colorways: ['Black', 'White', 'Red'],
        specs: { rangeKm: 181, topSpeedKmph: 116, battery: '4 kWh', chargingTimeHrs: 6.5 },
        features: ['Digital Console', 'App Lock', 'USB Charger', 'Reverse Mode'],
        compatiblePlans: ['Pro'],
        baseRatePerDay: 550,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.8,
        tags: ['long-range', 'popular'],
    },
    {
        id: 'ather-450x',
        name: 'Ather 450X',
        brand: 'Ather Energy',
        thumbnail: 'https://picsum.photos/seed/ather-450x/600/400',
        images: ['https://picsum.photos/seed/ather-450x/1024/768'],
        colorways: ['Space Grey', 'Mint Green'],
        specs: { rangeKm: 146, topSpeedKmph: 90, battery: '3.7 kWh', chargingTimeHrs: 5.75 },
        features: ['Touchscreen Dashboard', 'Google Maps', 'Fast Charging'],
        compatiblePlans: ['Pro'],
        baseRatePerDay: 520,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.7,
        tags: ['popular', 'new'],
    },
    {
        id: 'hero-vida-v1',
        name: 'Hero Vida V1',
        brand: 'Hero MotoCorp',
        thumbnail: 'https://picsum.photos/seed/hero-vida-v1/600/400',
        images: ['https://picsum.photos/seed/hero-vida-v1/1024/768'],
        colorways: ['Matte White', 'Orange'],
        specs: { rangeKm: 165, topSpeedKmph: 80, battery: '3.94 kWh', chargingTimeHrs: 5.9 },
        features: ['Removable Battery', 'Cruise Control', 'SOS Alert'],
        compatiblePlans: ['Pro'],
        baseRatePerDay: 480,
        cityCodes: ['Siliguri'],
        deliverySupported: false,
        rating: 4.5,
        tags: [],
    },
    {
        id: 'tvs-iqube',
        name: 'TVS iQube',
        brand: 'TVS Motor',
        thumbnail: 'https://picsum.photos/seed/tvs-iqube/600/400',
        images: ['https://picsum.photos/seed/tvs-iqube/1024/768'],
        colorways: ['Pearl White'],
        specs: { rangeKm: 100, topSpeedKmph: 78, battery: '3.04 kWh', chargingTimeHrs: 4.5 },
        features: ['Silent Start', 'Geo-fencing', 'Helmet included'],
        compatiblePlans: ['Lite', 'Pro'],
        baseRatePerDay: 450,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.6,
        tags: ['popular'],
    },
    {
        id: 'bajaj-chetak',
        name: 'Bajaj Chetak',
        brand: 'Bajaj Auto',
        thumbnail: 'https://picsum.photos/seed/bajaj-chetak/600/400',
        images: ['https://picsum.photos/seed/bajaj-chetak/1024/768'],
        colorways: ['Indigo Metallic', 'Brooklyn Black'],
        specs: { rangeKm: 108, topSpeedKmph: 63, battery: '3 kWh', chargingTimeHrs: 5 },
        features: ['Retro Design', 'Metal Body', 'App Lock'],
        compatiblePlans: ['Lite', 'Pro'],
        baseRatePerDay: 460,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.4,
        tags: [],
    },
    {
        id: 'hero-electric-photon',
        name: 'Hero Electric Photon',
        brand: 'Hero Electric',
        thumbnail: 'https://picsum.photos/seed/hero-photon/600/400',
        images: ['https://picsum.photos/seed/hero-photon/1024/768'],
        colorways: ['Beige', 'Black'],
        specs: { rangeKm: 90, topSpeedKmph: 45, battery: '1.9 kWh', chargingTimeHrs: 5 },
        features: ['Telescopic Suspension', 'Remote Lock', 'Anti-theft alarm'],
        compatiblePlans: ['Lite'],
        baseRatePerDay: 350,
        cityCodes: ['Siliguri'],
        deliverySupported: false,
        rating: 4.1,
        tags: ['budget-friendly'],
    },
    {
        id: 'okinawa-praise-pro',
        name: 'Okinawa PraisePro',
        brand: 'Okinawa Autotech',
        thumbnail: 'https://picsum.photos/seed/okinawa-praise/600/400',
        images: ['https://picsum.photos/seed/okinawa-praise/1024/768'],
        colorways: ['Glossy Red Black', 'Glossy Sparkle Black'],
        specs: { rangeKm: 88, topSpeedKmph: 58, battery: '2 kWh', chargingTimeHrs: 3 },
        features: ['Central Locking', 'Keyless Entry', 'USB Port'],
        compatiblePlans: ['Lite'],
        baseRatePerDay: 380,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.2,
        tags: ['fast-charging'],
    },
    {
        id: 'revolt-rv400',
        name: 'Revolt RV400',
        brand: 'Revolt Motors',
        thumbnail: 'https://picsum.photos/seed/revolt-rv400/600/400',
        images: ['https://picsum.photos/seed/revolt-rv400/1024/768'],
        colorways: ['Cosmic Black', 'Rebel Red'],
        specs: { rangeKm: 150, topSpeedKmph: 85, battery: '3.24 kWh', chargingTimeHrs: 4.5 },
        features: ['AI-Enabled', 'Customizable Sounds', 'Removable Battery'],
        compatiblePlans: ['Pro'],
        baseRatePerDay: 500,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.6,
        tags: ['long-range', 'popular'],
    },
    {
        id: 'simple-one',
        name: 'Simple One',
        brand: 'Simple Energy',
        thumbnail: 'https://picsum.photos/seed/simple-one/600/400',
        images: ['https://picsum.photos/seed/simple-one/1024/768'],
        colorways: ['Namma Red', 'Brazen Black'],
        specs: { rangeKm: 212, topSpeedKmph: 105, battery: '5 kWh', chargingTimeHrs: 6 },
        features: ['Best-in-class Range', 'Huge Boot Space', 'Touchscreen'],
        compatiblePlans: ['Pro'],
        baseRatePerDay: 600,
        cityCodes: ['Siliguri'],
        deliverySupported: true,
        rating: 4.9,
        tags: ['long-range', 'new'],
    },
    {
        id: 'ampere-magnus-ex',
        name: 'Ampere Magnus EX',
        brand: 'Ampere Vehicles',
        thumbnail: 'https://picsum.photos/seed/ampere-magnus/600/400',
        images: ['https://picsum.photos/seed/ampere-magnus/1024/768'],
        colorways: ['Galactic Grey', 'Graphite Black'],
        specs: { rangeKm: 121, topSpeedKmph: 50, battery: '2.2 kWh', chargingTimeHrs: 5 },
        features: ['Detachable Battery', 'Large Legroom', 'Keyless Entry'],
        compatiblePlans: ['Lite'],
        baseRatePerDay: 400,
        cityCodes: ['Siliguri'],
        deliverySupported: false,
        rating: 4.3,
        tags: [],
    },
];

