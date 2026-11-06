import { listing } from "@/components/content-pages";

const section = listing("guides");
export const generateMetadata = section.generateMetadata;
export default section.Page;
