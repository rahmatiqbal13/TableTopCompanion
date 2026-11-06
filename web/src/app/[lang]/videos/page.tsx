import { listing } from "@/components/content-pages";

const section = listing("videos");
export const generateMetadata = section.generateMetadata;
export default section.Page;
