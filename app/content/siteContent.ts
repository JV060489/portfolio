export const siteContent = {
  hero: {
    subtitle: "XR AI Engineer",
  },
  sections: {
    aboutMe: "About Me",
    stack: "Stack",
    experience: "Experience",
  },
  about: {
    bioText:
      "From IIT Madras, I bring 3+ years of experience designing and building at the intersection of Generative AI and XR systems, specializing in shipping high-fidelity, immersive experiences that transform our reality. From training custom models to seamless interactions, I build the future of the XR, one pipeline at a time.",
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
        key: "vizualspace",
        title: "VIZUALSPACE",
        subText: "Founding Engineer",
        description:
          "Worked on integrating XR into education to create immersive learning experiences that improve student engagement and understanding.",
        imageSrc: "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/vizualspace.png",
        href: "",
      },
      {
        key: "arc",
        title: "ARC IITM",
        subText: "Internship",
        description:
          "Built inclusive XR educational systems integrated with immersive Dolby spatial audio to deliver engaging STEM learning experiences",
        showCard: false,
      },
      {
        key: "freelance",
        title: "Independent Engineer" ,
        subText: "Contract Work",
        description:
          "Worked with IITM Pravartak Technologies Foundation and Tamil Nadu State Transport Corporation to deliver innovative technological solutions, including spatial reality applications and immersive museum experiences.",
        showCard: false,
      },
      {
        key: "inter-iit",
        title: "3D Animation",
        subText: "INTER-IIT",
        description:
          "Produced a 3D animated short for the Inter-IIT Meet, managing all stages from ideation and animation to final post-production.",
        videoSrc:
          "https://ehhcbsxrpaziywth.public.blob.vercel-storage.com/Riseup.mp4",
        aspectRatio: "9/16",
        href: "",
      },
    ],
    desktop: {
      order: ["vizualspace", "arc", "freelance", "inter-iit"],
      layouts: {
        portal: {
          titlePosition: { x: "-5%", y: "45%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "10%", y: "53%" },
          descriptionPosition: { x: "60%", y: "38%" },
          descTriggerOffset: "0%",
          spanText: "",
          spanPosition: { x: "25%", y: "20%" },
          spanSize: { width: "30%", height: "60%" },
        },
        vizualspace: {
          titlePosition: { x: "0%", y: "30%" },
          titleParallaxSpeed: 1.15,
          subTextPosition: { x: "15%", y: "38%" },
          descriptionPosition: { x: "68%", y: "45%" },
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
          titlePosition: { x: "-20%", y: "38%" },
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
