import './globals.css';

export const metadata = {
  title: 'HireLens — AI resume review, marked up like an editor would',
  description:
    'Upload your resume and get it annotated: what to cut, what to prove with numbers, and what an ATS will miss.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-body"
        style={{
          '--font-display': "'Fraunces', Georgia, serif",
          '--font-body': "'Inter', system-ui, sans-serif",
          '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
        }}
      >
        {children}
      </body>
    </html>
  );
}
