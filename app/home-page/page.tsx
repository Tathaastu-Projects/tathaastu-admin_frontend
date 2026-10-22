"use client";

import { useState, type ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AboutSection } from "@/components/homepage/AboutSection";
import { FeaturedFindsSection } from "@/components/homepage/FeaturedFindsSection";
import { HomeBannersSection } from "@/components/homepage/HomeBannersSection";
import { HomeFaqsSection } from "@/components/homepage/HomeFaqsSection";
import { ShopCategoriesSection } from "@/components/homepage/ShopCategoriesSection";
import { HomeBlogSection } from "@/components/homepage/HomeBlogSection";
import { TestimonialsSection } from "@/components/homepage/TestimonialsSection";
import { ScreenToSpaceSection } from "@/components/homepage/ScreenToSpaceSection";
import { Home } from "lucide-react";

const PORTIONS = [
  {
    id: "portion-banners",
    number: "01",
    title: "Logo and banners",
    text: "The header logo and the images that slide at the top of the homepage.",
  },
  {
    id: "portion-categories",
    number: "02",
    title: "Shop by Category",
    text: "Each frame in the category mosaic: name, image, and the size to upload.",
  },
  {
    id: "portion-about",
    number: "03",
    title: "About",
    text: "The Abhimantrit paragraph and the four points. Paste an image or Drive video link, or upload a photo.",
  },
  {
    id: "portion-faqs",
    number: "04",
    title: "FAQs",
    text: "The questions at the bottom of the homepage.",
  },
  {
    id: "portion-featured",
    number: "05",
    title: "Karungali mala",
    text: "The video and photo shown before the testimonials.",
  },
  {
    id: "portion-screen-to-space",
    number: "06",
    title: "Screen to space (Reels)",
    text: "The shoppable portrait video cards with products and 'SHOP NOW' buttons before testimonials.",
  },
  {
    id: "portion-testimonials",
    number: "07",
    title: "Testimonials",
    text: "The quote cards that slide across the homepage. Change the words, the name, the photo link, and the video link.",
  },
  {
    id: "portion-blog",
    number: "08",
    title: "Blog",
    text: "The photos and videos on Read From Our Blog. Paste a link or upload a photo.",
  },
];

const PANELS: Record<string, ReactNode> = {
  "portion-banners": <HomeBannersSection />,
  "portion-categories": <ShopCategoriesSection />,
  "portion-about": <AboutSection />,
  "portion-faqs": <HomeFaqsSection />,
  "portion-featured": <FeaturedFindsSection />,
  "portion-screen-to-space": <ScreenToSpaceSection />,
  "portion-testimonials": <TestimonialsSection />,
  "portion-blog": <HomeBlogSection />,
};

export default function HomePageAdmin() {
  const [activeId, setActiveId] = useState(PORTIONS[0].id);
  const active = PORTIONS.find((portion) => portion.id === activeId) || PORTIONS[0];

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-brand-softCream">
        <div className="space-y-8 p-6 md:p-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
              <Home className="h-3.5 w-3.5" />
              Store homepage
            </div>
            <h1 className="font-serif text-4xl font-semibold text-brand-deepMaroon">Home Page</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Open one tab at a time. Only that portion is shown.
            </p>
            <div className="mt-5 flex flex-wrap gap-2" role="tablist">
              {PORTIONS.map((portion) => {
                const selected = portion.id === active.id;
                return (
                  <button
                    key={portion.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(portion.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      selected
                        ? "bg-brand-maroon text-white"
                        : "border border-brand-maroon/20 bg-white text-brand-deepMaroon"
                    }`}
                  >
                    {portion.number} {portion.title}
                  </button>
                );
              })}
            </div>
          </div>

          <Portion {...active}>{PANELS[active.id]}</Portion>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Portion({
  id,
  number,
  title,
  text,
  children,
}: {
  id: string;
  number: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 overflow-hidden rounded-[28px] border border-brand-maroon/15 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-brand-maroon/10 bg-[#fbf7f2] px-5 py-4 md:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-maroon text-sm font-semibold text-white">
          {number}
        </span>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brand-deepMaroon">{title}</h2>
          <p className="mt-1 text-sm text-stone-600">{text}</p>
        </div>
      </div>
      <div className="bg-brand-softCream/60 p-5 md:p-6">{children}</div>
    </section>
  );
}
