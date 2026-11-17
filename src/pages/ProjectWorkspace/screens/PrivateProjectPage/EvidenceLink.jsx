// Opens a saved file or link in a new tab. Mock files use url "#"; those
// are inert until the backend returns real (signed) urls.
function EvidenceLink({ evidence, className, children }) {
  const isPlaceholder = !evidence.url || evidence.url === "#";

  return (
    <a
      className={className}
      href={isPlaceholder ? "#" : evidence.url}
      target={isPlaceholder ? undefined : "_blank"}
      rel={isPlaceholder ? undefined : "noopener noreferrer"}
      onClick={isPlaceholder ? (event) => event.preventDefault() : undefined}
    >
      {children}
    </a>
  );
}

export default EvidenceLink;
