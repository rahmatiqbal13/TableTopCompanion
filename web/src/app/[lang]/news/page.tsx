import { listing } from "@/components/content-pages";

const section = listing("news");
export const generateMetadata = section.generateMetadata;
export default section.Page;
