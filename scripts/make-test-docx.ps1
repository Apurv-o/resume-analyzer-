# Builds a minimal but valid .docx used to end-to-end test /api/analyze.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$out = Join-Path $PSScriptRoot 'test-resume.docx'
if (Test-Path $out) { Remove-Item $out }

$zip = [System.IO.Compression.ZipFile]::Open($out, [System.IO.Compression.ZipArchiveMode]::Create)
function Add-Entry([string]$name, [string]$content) {
  $entry = $zip.CreateEntry($name)
  $sw = [System.IO.StreamWriter]::new($entry.Open())
  $sw.Write($content)
  $sw.Close()
}

Add-Entry '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'

Add-Entry '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'

$body = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:r><w:t>Jane Developer</w:t></w:r></w:p>
<w:p><w:r><w:t>Senior Software Engineer with 5 years building React and TypeScript applications.</w:t></w:r></w:p>
<w:p><w:r><w:t>Led a migration to Next.js, improving Lighthouse performance by 40% and cutting bundle size by 22%.</w:t></w:r></w:p>
<w:p><w:r><w:t>Built REST and GraphQL APIs in Node.js backed by PostgreSQL; deployed on AWS.</w:t></w:r></w:p>
<w:p><w:r><w:t>Raised automated test coverage from 30% to 95% with Jest and Playwright.</w:t></w:r></w:p>
<w:p><w:r><w:t>Tech Lead, Acme Corp 2021-present; managed 5 engineers; features shipped to 8M+ users.</w:t></w:r></w:p>
<w:p><w:r><w:t>B.S. Computer Science, State University.</w:t></w:r></w:p>
</w:body></w:document>
'@
Add-Entry 'word/document.xml' $body
$zip.Dispose()
Write-Output ("Created " + (Resolve-Path $out))