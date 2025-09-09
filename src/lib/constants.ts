import { Facebook, Instagram, Twitter } from "lucide-react";
import {Vehicle} from "@/lib/types";

export const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Vehicles', href: '/vehicles' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About Us', href: '/about-us' },
    { name: 'Contact Us', href: '/contact-us' },
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
            { name: 'About Us', href: '/about-us' },
        ],
    },
    {
        title: 'Support',
        links: [
            { name: 'Contact Us', href: '/contact-us' },
            { name: 'FAQ', href: '/faq' },
            { name: 'Terms of Service', href: '/legal/terms' },
            { name: 'Refund Policy', href: '/legal/refund' },
            { name: 'Privacy Policy', href: '/privacy' },
        ],
    },
    {
        title: 'Blogs',
        links: [
            { name: 'Tech', href: '/blog' },
            { name: 'News', href: '/blog' },
            { name: 'Events', href: '/blog' },
        ],
    },
];

export const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Twitter', href: '#', icon: Twitter },
];



