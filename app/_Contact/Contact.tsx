"use client";

import { BlurFade } from "./BlurFade";
import { Magnetic } from "./Magnetic";
import { AvatarMosaic } from "./AvatarMosaic";
import { siteContent } from "@/app/content/siteContent";

export default function Contact() {
  return (
    <section className="relative w-full px-6 py-20 bg-black">
      <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
        {/* Scattered Assembly Avatar — fragments fly together on scroll */}
        <AvatarMosaic className="mb-16" />

        <BlurFade delay={0.3} inView>
          <div className="mt-4">
            <Magnetic strength={0.15}>
              <a
                href={`mailto:${siteContent.contact.email}`}
                className="group inline-flex select-none items-center gap-2 rounded-full bg-[var(--gray-12)] px-6 py-3 text-[14px] font-medium text-black transition-transform duration-200 active:scale-[0.96] text font-aldrich"
              >
                {siteContent.contact.email}
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </a>
            </Magnetic>
          </div>
        </BlurFade>

        {/* Social links */}
        <BlurFade delay={0.4} inView>
          <div className="mt-12 flex gap-6 ">
            {siteContent.contact.socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-md font-aldrich text-[var(--gray-6)] transition-colors duration-200 hover:text-[var(--gray-10)]"
              >
                {s.name}
              </a>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
