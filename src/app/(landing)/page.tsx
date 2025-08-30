import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  features,
  howItWorksSteps,
  pricingPlans,
  testimonials,
  faqItems,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CheckCircle, Zap, BatteryCharging, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {HeroSlider} from "@/components/landing/hero-slider";
import {HowItWorks} from "@/components/landing/how-it-works";
import {Plans} from "@/components/landing/plans";
import {Pricing} from "@/components/landing/pricing";
import {TrustAndBenefits} from "@/components/landing/trust-and-benefits";
import {Faq} from "@/components/landing/faq";
import {Suspense} from "react";
import {MobileBottomBar} from "@/components/landing/mobile-bottom-bar";

const iconMap: { [key: string]: React.ElementType } = {
  Zap,
  BatteryCharging,
  MapPin,
  ShieldCheck,
};


export default function Home() {
  return (
      <div className="flex flex-col overflow-hidden sm:overflow-hidden">
        {/* Hero Section */}
        <HeroSlider />
        {/* Features Section */}
        <HowItWorks />

        {/* Pricing Section */}
        <Plans />
        <Pricing />

        {/* Testimonials Section */}
        <TrustAndBenefits/>

        {/* FAQ Section */}
        <Faq />

        {/* Final CTA */}
          <Suspense fallback={null}>
              <MobileBottomBar />
          </Suspense>
      </div>
  );
}
