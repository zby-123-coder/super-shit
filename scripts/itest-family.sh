#!/bin/bash
# 家庭账户模型联调：家长注册建家庭 → 户主创建孩子 → 第二位家长凭邀请码加入
# → 老师凭学生邀请码带班 → 越权拦截
BASE="http://localhost:8080/app/app_17fv88taywq"
H=(-H 'Cookie: suda-csrf-token=x' -H 'X-Suda-Csrf-Token: x' -H 'Content-Type: application/json')
PSQL=/opt/homebrew/opt/postgresql@16/bin/psql
jqget() { python3 -c "import sys,json;print(json.load(sys.stdin).get('$1',''))"; }
prof() { curl -s -H "Authorization: Bearer $1" "${H[@]}" "$BASE/api/account/me" | python3 -c "import sys,json;d=json.load(sys.stdin);p=d.get('profile') or {};print(p.get('$2',''))"; }
api() { local t="$3"; local auth=(); [ -n "$t" ] && auth=(-H "Authorization: Bearer $t")
  if [ -n "$4" ]; then curl -s -w " [%{http_code}]" "${H[@]}" "${auth[@]}" -X "$1" -d "$4" "$BASE$2";
  else curl -s -w " [%{http_code}]" "${H[@]}" "${auth[@]}" -X "$1" "$BASE$2"; fi; }
reg() { curl -s "${H[@]}" -X POST -d "$1" "$BASE/api/auth/register"; }

echo "=== 1. 清理旧联调数据 ==="
$PSQL -d jiajiao -q -c "truncate auth_session, auth_credential, article_favorite, notice_message, task_checkin, study_task, study_progress, lesson_ledger, lesson_account, course, wrong_question, teaching_link, app_profile, family cascade;" && echo "cleaned"

echo "=== 2. 管理员 & 第一位家长（自动建家庭） ==="
ADMIN=$(reg '{"loginName":"admin001","password":"123456","role":"admin","name":"运营小赵"}' | jqget token)
P1=$(reg '{"loginName":"parent001","password":"123456","role":"parent","name":"林爸"}' | jqget token)
P1_ID=$(prof "$P1" userId)
FCODE=$(prof "$P1" inviteCode)
echo "家长1=$P1_ID 家庭邀请码=$FCODE"

echo "=== 3. 户主创建孩子 ==="
api POST /api/account/child "$P1" '{"loginName":"child001","password":"123456","name":"林小满","grade":"初二"}' | head -c 200; echo
S1=$(curl -s "${H[@]}" -X POST -d '{"loginName":"child001","password":"123456"}' "$BASE/api/auth/login" | jqget token)
S1_ID=$(prof "$S1" userId)
echo "孩子=$S1_ID"

echo "=== 4. 第二位家长凭家庭邀请码加入 ==="
P2=$(reg "{\"loginName\":\"parent002\",\"password\":\"123456\",\"role\":\"parent\",\"name\":\"林妈\",\"familyInviteCode\":\"$FCODE\"}" | jqget token)
P2_ID=$(prof "$P2" userId)
echo "家长2=$P2_ID"
echo "--- 家庭视图（家长1）：应有 2 家长 + 1 孩子 ---"
curl -s -H "Authorization: Bearer $P1" "${H[@]}" "$BASE/api/account/family" | python3 -c "import sys,json;d=json.load(sys.stdin);print('家庭:',d['name'],'| 家长:',[p['name'] for p in d['parents']],'| 孩子:',[s['name'] for s in d['students']])"

echo "=== 5. 学生无邀请码注册（应 400） ==="
reg '{"loginName":"solo001","password":"123456","role":"student","name":"无邀请码学生"}' | head -c 150; echo
echo "=== 6. 学生用错误家庭邀请码（应 400） ==="
reg '{"loginName":"solo002","password":"123456","role":"student","name":"错码学生","familyInviteCode":"ZZZZZZ"}' | head -c 150; echo

echo "=== 7. 老师注册 + 凭学生邀请码带班 ==="
T1=$(reg '{"loginName":"teacher001","password":"123456","role":"teacher","name":"周老师"}' | jqget token)
S1_CODE=$(prof "$S1" inviteCode)
api POST /api/account/teach "$T1" "{\"inviteCode\":\"$S1_CODE\"}" | head -c 120; echo
echo "--- 非老师调用 teach（家长2，应 403） ---"
api POST /api/account/teach "$P2" "{\"inviteCode\":\"$S1_CODE\"}" | head -c 130; echo

echo "=== 8. 业务闭环：排课/任务/打卡/批阅/消课/周报 ==="
api POST /api/course "$T1" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"startAt\":\"2026-10-14T18:30:00.000Z\",\"endAt\":\"2026-10-14T20:00:00.000Z\",\"location\":\"线上\"}" | head -c 120; echo
api POST /api/course/lessons/grant "$ADMIN" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"amount\":20}" | head -c 80; echo
api POST /api/task "$T1" "{\"studentUserIds\":[\"$S1_ID\"],\"title\":\"整理错题本\",\"subject\":\"数学\"}" | head -c 120; echo
TASK_ID=$($PSQL -d jiajiao -tAc "select id from study_task where student_user_id='$S1_ID' order by _created_at desc limit 1")
api POST "/api/task/$TASK_ID/checkin" "$S1" '{"content":"已完成，错题已订正","durationMin":30}' | head -c 100; echo
CK_ID=$($PSQL -d jiajiao -tAc "select id from task_checkin where task_id='$TASK_ID' order by _created_at desc limit 1")
api PATCH "/api/task/checkin/$CK_ID/review" "$T1" '{"status":"approved","comment":"完成得不错"}' | head -c 80; echo
CID=$($PSQL -d jiajiao -tAc "select id from course where student_user_id='$S1_ID' order by _created_at desc limit 1")
api POST "/api/course/$CID/consume" "$T1" | head -c 80; echo

echo "=== 9. 越权：第二位家长也是合法家长，应可见；用不存在用户应 403 ==="
api GET "/api/report/weekly" "$P2" | python3 -c "import sys,json;d=json.load(sys.stdin);print('家长2周报:',d.get('studentName','FORBIDDEN'))" 2>/dev/null
api GET "/api/report/weekly?studentUserId=u_hacker" "$P2" | head -c 110; echo
echo "=== 10. 老师2 未带班该学生（应 403） ==="
T2=$(reg '{"loginName":"teacher002","password":"123456","role":"teacher","name":"陈老师"}' | jqget token)
api POST /api/course "$T2" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"startAt\":\"2026-10-15T18:30:00.000Z\",\"endAt\":\"2026-10-15T20:00:00.000Z\"}" | head -c 130; echo
echo "=== 11. 家长1 不能越权看别的家庭（家长2 家庭邀请码不同，验证 canViewStudent） ==="
api GET "/api/course/lessons?studentUserId=$P2_ID" "$P1" | head -c 130; echo
