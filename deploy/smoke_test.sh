#!/usr/bin/env bash
##############################################################################
# Cognito LMS — Post-deploy Smoke Test
#
# Usage:
#   chmod +x smoke_test.sh
#   ./smoke_test.sh https://your-domain.com
#
# Exits 0 if all checks pass, 1 on first failure.
##############################################################################

set -euo pipefail

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base_url>  (e.g. https://your-domain.com)"
  exit 1
fi

# Strip trailing slash
BASE_URL="${BASE_URL%/}"

PASS=0
FAIL=0

check() {
  local description="$1"
  local result="$2"   # "PASS" or "FAIL"
  if [[ "$result" == "PASS" ]]; then
    echo "  ✅  $description"
    ((PASS++))
  else
    echo "  ❌  $description"
    ((FAIL++))
  fi
}

echo ""
echo "🔍 Cognito LMS Smoke Test — $BASE_URL"
echo "══════════════════════════════════════"

# ─── 1. Course list is publicly accessible ────────────────────────────────────
echo ""
echo "§1  Public API"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/courses/")
[[ "$STATUS" == "200" ]] && check "GET /api/courses/ returns 200" PASS || check "GET /api/courses/ returns 200 (got $STATUS)" FAIL

# ─── 2. HTTPS redirect works ──────────────────────────────────────────────────
echo ""
echo "§2  HTTPS"
HTTP_URL="${BASE_URL/https/http}"
REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "$HTTP_URL/api/courses/")
[[ "$REDIRECT" == "301" || "$REDIRECT" == "302" || "$REDIRECT" == "308" ]] \
  && check "HTTP → HTTPS redirect in place ($REDIRECT)" PASS \
  || check "HTTP → HTTPS redirect missing (got $REDIRECT)" FAIL

# ─── 3. Django admin loads (validates STATIC_ROOT + Nginx static serving) ─────
echo ""
echo "§3  Static files"
STATIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/admin/css/base.css")
[[ "$STATIC_STATUS" == "200" ]] \
  && check "Django admin CSS served correctly" PASS \
  || check "Django admin CSS missing (got $STATIC_STATUS — check STATIC_ROOT / Nginx alias)" FAIL

# ─── 4. Registration blocks role escalation ───────────────────────────────────
echo ""
echo "§4  Security"
REG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/register/" \
  -H "Content-Type: application/json" \
  -d '{"username":"smoke_hacker_'$RANDOM'","email":"smoke@test.invalid","password":"Sm0kePass!","role":"ADMIN"}')
ROLE=$(echo "$REG_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('role','UNKNOWN'))" 2>/dev/null || echo "NOT_IN_RESPONSE")
[[ "$ROLE" == "STUDENT" || "$ROLE" == "NOT_IN_RESPONSE" ]] \
  && check "Registration role escalation blocked (role field not returned / forced STUDENT)" PASS \
  || check "SECURITY FAIL: Registration returned role=$ROLE" FAIL

# ─── 5. Unauthenticated write to courses is rejected ─────────────────────────
POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/courses/" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Hack","description":"Should fail"}')
[[ "$POST_STATUS" == "401" || "$POST_STATUS" == "403" ]] \
  && check "Unauthenticated course creation rejected ($POST_STATUS)" PASS \
  || check "Unauthenticated course creation NOT rejected (got $POST_STATUS)" FAIL

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════"
echo "  Results: ${PASS} passed / ${FAIL} failed"
echo ""
if [[ $FAIL -gt 0 ]]; then
  echo "  ⚠️  Fix the failures above before going live."
  exit 1
else
  echo "  🎉  All checks passed — good to go!"
  exit 0
fi
