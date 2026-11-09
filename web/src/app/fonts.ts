import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const fontClasses = `${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`;
