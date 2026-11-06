import { detail } from "@/components/content-pages";

const article = detail("guides");
export const generateStaticParams = article.generateStaticParams;
export const generateMetadata = article.generateMetadata;
export default article.Page;
