import { desc } from "framer-motion/client";

export const siteContent = {
  hero: {
    subtitle: "Full Stack AI Engineer",
  },
  sections: {
    aboutMe: "About Me",
    stack: "Stack",
    experience: "Experience",
  },
  about: {
    bioText:
      "Final-year at IIT Madras by day, digital architect by night. I thrive at the intersection of Generative AI and the Full-Stack, specializing in shipping high-fidelity, interactive experiences that transform the standard URL into an intelligent canvas. From training custom models to seamless deployments, I build the future of the web, one pipeline at a time.",
  },
  stack: {
    left: [
      { label: "Next.js", cube: "Next" },
      { label: "Express", cube: "Express" },
      { label: "Git", cube: "Git" },
      { label: "React", cube: "React" },
      { label: "Tailwind", cube: "Tailwind" },
      { label: "JavaScript", cube: "JS" },
      { label: "TypeScript", cube: "Typescript" },
      { label: "AWS", cube: "AWS" },
    ],
    right: [
      { label: "Three.js", cube: "ThreeJS" },
      { label: "GSAP", cube: "GSAP" },
      { label: "WebGL", cube: "Webgl" },
      { label: "Blender", cube: "Blender(Modelling)" },
      { label: "ComfyUI", cube: "Comfy" },
      { label: "Pytorch", cube: "Pytorch" },
      { label: "Python", cube: "Python" },
      { label: "HuggingFace", cube: "HuggingFace" },
    ],
  },
  projects: {
    items: [
      {
        key: "portal",
        title: "PORTAL",
        subText: "AI Editor",
        description:
          "Architected a real-time collaborative 3D engine featuring an AI-driven inference pipeline that synchronizes web-based inputs with Blender via a custom Python plugin.",
        imageSrc: "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/portal.png",
      },
      {
        key: "vizualspace",
        title: "VIZUALSPACE",
        subText: "Founding Engineer",
        description:
          "Developed a full-stack WebXR discovery platform using React, Next.js, R3F, and AWS while leading a lean technical team",
        imageSrc: "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/vizualspace.png",
      },
      {
        key: "arc",
        title: "ARC IITM",
        subText: "Internship",
        description:
          "Developed a Unity-based XR ecosystem featuring on-device Computer Vision and Dolby Atmos spatial mapping to bridge the gap between physical 3D assets and digital accessibility.",
        showCard: false,
      },
      {
        key: "freelance",
        title: "Independent Engineer",
        subText: "Contract Work",
        description:
          "Partnered with a diverse portfolio of startups and government agencies to deploy high-impact 3D and AI solutions",
        showCard: false,
      },
      {
        key: "inter-iit",
        title: "3D Animation",
        subText: "INTER-IIT",
        description:
          "Led a team of 5 to create a 3D animated short for the Inter-IIT Meet-India's premier engineering assembly where the top 0.01% of technical talent competes-overseeing all aspects from concept to post-production",
        videoSrc:
          "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/Riseup.mp4",
        aspectRatio: "9/16",
      },
    ],
    desktop: {
      order: ["portal", "vizualspace", "arc", "freelance", "inter-iit"],
      layouts: {
        portal: {
          titlePosition: { x: "-5%", y: "45%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "10%", y: "53%" },
          descriptionPosition: { x: "60%", y: "42%" },
          descTriggerOffset: "0%",
          spanText: "",
          spanPosition: { x: "25%", y: "20%" },
          spanSize: { width: "30%", height: "60%" },
        },
        vizualspace: {
          titlePosition: { x: "0%", y: "30%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "15%", y: "38%" },
          descriptionPosition: { x: "65%", y: "52%" },
          descTriggerOffset: "-30%",
          spanText: "",
          spanPosition: { x: "35%", y: "25%" },
          spanSize: { width: "22.5%", height: "55%" },
        },
        arc: {
          titlePosition: { x: "10%", y: "45%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "20%", y: "53%" },
          descriptionPosition: { x: "35%", y: "35%" },
          descTriggerOffset: "-50%",
          spanText: "",
          spanPosition: { x: "20%", y: "25%" },
          spanSize: { width: "35%", height: "50%" },
          showLivingCard: false,
        },
        freelance: {
          title: "Independent\nEngineer",
          titleNewLine: true,
          titlePosition: { x: "-15%", y: "38%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "0%", y: "53%" },
          descriptionPosition: { x: "25%", y: "40%" },
          descTriggerOffset: "-50%",
          spanText: "",
          spanPosition: { x: "30%", y: "25%" },
          spanSize: { width: "35%", height: "50%" },
          showLivingCard: false,
          screens: 1,
        },
        "inter-iit": {
          titlePosition: { x: "-20%", y: "35%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "0%", y: "43%" },
          descriptionPosition: { x: "40%", y: "35%" },
          descTriggerOffset: "-80%",
          spanText: "",
          spanPosition: { x: "20%", y: "15%" },
          spanSize: { width: "16%", height: "65%" },
          screens: 1,
        },
      },
    },
  },
  contact: {
    email: "vasanthjanarthanan@gmail.com",
    socials: [
      { name: "GitHub", href: "https://github.com/JV060489" },
      {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/janarthanan-vasanth-64ba45257/",
      },
    ],
  },
} as const;
