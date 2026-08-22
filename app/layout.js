import './globals.css';

export const metadata = {
  title: 'HireLens — AI Resume Analyzer',
  description:
    'Upload your resume and get AI-powered insights: ATS scoring, keyword gaps, line-by-line rewrites, and a full breakdown.',
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-body antialiased"
        style={{
          '--font-display': "'Fraunces', Georgia, serif",
          '--font-body': "'Plus Jakarta Sans', system-ui, sans-serif",
          '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {children}
      </body>
    </html>
  );
}
