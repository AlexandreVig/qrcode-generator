const GITHUB_URL = "https://github.com/AlexandreVig/qrcode-generator";
const PORTFOLIO_URL = "https://avigneau.dev";
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-background">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          Built by{" "}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-foreground underline decoration-primary underline-offset-2"
          >
            Alexandre Vigneau
          </a>
          {" · "}
          <a
            href={LICENSE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline decoration-primary underline-offset-2"
          >
            MIT License
          </a>
        </p>

        <nav className="flex items-center gap-4">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline decoration-primary underline-offset-2"
          >
            Portfolio
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline decoration-primary underline-offset-2 inline-flex items-center gap-1.5"
            aria-label="View source on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-4 h-4 fill-current"
            >
              <path d="M12 .5C5.73.5.66 5.58.66 11.85c0 5.01 3.25 9.26 7.76 10.76.57.1.78-.25.78-.55 0-.27-.01-.99-.02-1.94-3.16.69-3.83-1.52-3.83-1.52-.52-1.31-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.66 1.23 3.31.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16a10.96 10.96 0 0 1 5.74 0c2.19-1.47 3.14-1.16 3.14-1.16.63 1.57.23 2.73.12 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.3-5.19 5.58.41.35.77 1.04.77 2.09 0 1.51-.01 2.73-.01 3.1 0 .3.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.76C23.34 5.58 18.27.5 12 .5Z" />
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
