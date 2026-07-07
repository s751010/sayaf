import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "كلاود منيو — المنيو الرقمي الذكي",
    short_name: "كلاود منيو",
    description: "المنيو الرقمي الذكي للمطاعم السعودية.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#141210",
    theme_color: "#141210",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
