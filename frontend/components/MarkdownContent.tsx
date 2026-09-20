interface MarkdownContentProps {
  content: string;
}

function isSafeContentUrl(url: string, image = false) {
  if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) return true;
  return !image && (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(url) || /^tel:\+?[0-9().\-\s]+$/i.test(url));
}

function inlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|!?\[[^\]]*\]\([^\s)]+\))/g);

  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      return <strong key={index} className="font-bold text-charcoal">{part.slice(2, -2)}</strong>;
    }
    if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return <code key={index} className="rounded bg-olive-tint px-1.5 py-0.5 font-mono text-sm text-olive-dark">{part.slice(1, -1)}</code>;
    }

    const image = part.match(/^!\[([^\]]*)\]\(([^\s)]+)\)$/);
    if (image) {
      if (!isSafeContentUrl(image[2], true)) return image[1];
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={index} src={image[2]} alt={image[1]} loading="lazy" referrerPolicy="no-referrer" className="my-6 rounded-2xl border border-gold/20" />;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      if (!isSafeContentUrl(link[2])) return link[1];
      const external = /^https?:\/\//i.test(link[2]);
      return <a key={index} href={link[2]} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="text-clay-dark underline underline-offset-4 hover:text-clay-light">{link[1]}</a>;
    }
    return part;
  });
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const headingLevel = heading[1].length;
      const text = inlineMarkdown(heading[2]);
      if (headingLevel === 1) blocks.push(<h2 key={index} className="mt-10 text-3xl font-extrabold text-charcoal">{text}</h2>);
      if (headingLevel === 2) blocks.push(<h3 key={index} className="mt-9 text-2xl font-bold text-charcoal">{text}</h3>);
      if (headingLevel === 3) blocks.push(<h4 key={index} className="mt-7 text-xl font-bold text-olive-dark">{text}</h4>);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={index} className="my-5 space-y-3 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3"><span className="text-clay-dark">✦</span><span>{inlineMarkdown(item)}</span></li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={index} className="my-5 list-decimal space-y-3 pl-6 marker:text-clay-dark">
          {items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item)}</li>)}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index]) && !/^[-*]\s+/.test(lines[index].trim()) && !/^\d+\.\s+/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={index} className="text-lg leading-relaxed text-charcoal-muted">{inlineMarkdown(paragraph.join(" "))}</p>);
  }

  return <div className="article-content space-y-6">{blocks}</div>;
}
