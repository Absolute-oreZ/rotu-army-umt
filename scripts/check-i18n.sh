#!/bin/bash
# i18n Validator: Scan for hardcoded strings in TSX files
# Looks for text inside tags that isn't wrapped in a translation helper or variable

echo "Checking for hardcoded strings in public components..."
# This is a simplified check: looking for text between > and < that isn't a variable or a known tag
# We search for strings that look like prose (starting with uppercase or common words)
grep -rE ">[A-Z][^<]*<" app/[locale]/(marketing) components/marketing 2>/dev/null

if [ $? -eq 0 ]; then
  echo "⚠️ Potential hardcoded strings found. Please move them to dictionaries."
else
  echo "✅ No obvious hardcoded strings found in public areas."
fi
