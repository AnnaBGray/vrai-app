#!/bin/bash
# Remove the service role key from all Git history

git filter-branch --force --index-filter \
'git ls-files -z | xargs -0 sed -i "s/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGFra3hvdGprZHNqdmJ1Zml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjEyNzUxMywiZXhwIjoyMDY3NzAzNTEzfQ.hnejpWaUOs0pKUwHQl_Yk1ulC5hBu8o7BcTWN-RFIaA/REMOVED_SECRET/g"' \
--prune-empty --tag-name-filter cat -- --all 