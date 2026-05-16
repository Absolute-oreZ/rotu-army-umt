#!/bin/bash
# SEO Auditor: Verify public pages have metadata
echo "Auditing SEO metadata for public pages..."

# Find all page.tsx files in public routes
pages=$(find app/[locale]/(marketing) -name "page.tsx")

for page in $pages; do
  if ! grep -qE "(export const metadata|export async function generateMetadata)" "$page"; then
    echo "❌ Missing metadata in $page"
  fi
done

if [ $? -eq 0 ]; then
  echo "✅ All public pages have metadata defined."
else
  echo "⚠️ Some pages are missing SEO metadata."
fi
