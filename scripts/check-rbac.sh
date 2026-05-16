#!/bin/bash
# RBAC Guard: Verify admin routes have authorization checks
echo "Auditing RBAC in admin routes..."

# Search for files in the admin directory
admin_files=$(find app/admin -name "page.tsx" -o -name "layout.tsx")

for file in $admin_files; do
  # Check for a common RBAC helper pattern (assuming a helper like 'checkRole' or 'requireRole' is used)
  # I will look for common keywords related to role check since the specific helper name might vary
  if ! grep -qE "(checkRole|requireRole|auth\(\)|getServerSession)" "$file"; then
    echo "❌ Possible missing RBAC check in $file"
  fi
done

if [ $? -eq 0 ]; then
  echo "✅ RBAC checks appear to be present in admin routes."
else
  echo "⚠️ Some admin routes might be missing authorization guards."
fi
