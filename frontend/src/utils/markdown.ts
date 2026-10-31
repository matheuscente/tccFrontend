import DOMPurify from "dompurify";
import { marked } from "marked";

// o HTML gerado passa pelo DOMPurify antes de ir para o v-html (o conteúdo vem do usuário)
export const renderMarkdown = (source: string): string =>
  DOMPurify.sanitize(marked.parse(source, { async: false, gfm: true, breaks: true }), { ADD_ATTR: ["target"] });

export const isMarkdownFile = (name: string, mimeType: string) =>
  mimeType === "text/markdown" || /\.(md|markdown)$/i.test(name);
