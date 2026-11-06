import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseYouTubeId } from "@/lib/youtube";
import { YouTubeEmbed } from "./youtube-embed";

/**
 * Renders post Markdown. Raw HTML is not allowed (react-markdown escapes it),
 * and a paragraph that is only a YouTube link becomes an embedded player.
 */
export function Markdown({ source, playLabel }: { source: string; playLabel: string }) {
  const components: Components = {
    p({ node, children }) {
      const only = node?.children.length === 1 ? node.children[0] : null;
      if (only?.type === "element" && only.tagName === "a") {
        const id = parseYouTubeId(String(only.properties?.href ?? ""));
        if (id) return <div className="my-6"><YouTubeEmbed id={id} title="YouTube video" playLabel={playLabel} /></div>;
      }
      return <p>{children}</p>;
    },
    a({ href, children }) {
      const external = href?.startsWith("http");
      return <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>;
    },
    // eslint-disable-next-line @next/next/no-img-element -- author images from any host
    img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="rounded-xl" />,
  };
  return (
    <div className="prose-ttc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{source}</ReactMarkdown>
    </div>
  );
}
