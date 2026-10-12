#!/bin/bash
# 本地联调 v2：幂等（已存在则登录），验证业务闭环 + 越权拦截
BASE="http://localhost:8080/app/app_17fv88taywq"
H=(-H 'Cookie: suda-csrf-token=x' -H 'X-Suda-Csrf-Token: x' -H 'Content-Type: application/json')
PSQL=/opt/homebrew/opt/postgresql@16/bin/psql
jqget() { python3 -c "import sys,json;print(json.load(sys.stdin).get('$1',''))"; }

ensure() { # ensure <login> <role> <name> → 输出 token
  local out
  out=$(curl -s "${H[@]}" -X POST -d "{\"loginName\":\"$1\",\"password\":\"123456\",\"role\":\"$2\",\"name\":\"$3\"}" "$BASE/api/auth/register")
  local t; t=$(echo "$out" | jqget token)
  if [ -z "$t" ]; then
    out=$(curl -s "${H[@]}" -X POST -d "{\"loginName\":\"$1\",\"password\":\"123456\"}" "$BASE/api/auth/login")
    t=$(echo "$out" | jqget token)
  fi
  echo "$t"
}
api() { local t="$3"; local auth=(); [ -n "$t" ] && auth=(-H "Authorization: Bearer $t")
  if [ -n "$4" ]; then curl -s -w " [%{http_code}]" "${H[@]}" "${auth[@]}" -X "$1" -d "$4" "$BASE$2";
  else curl -s -w " [%{http_code}]" "${H[@]}" "${auth[@]}" -X "$1" "$BASE$2"; fi
}
me() { curl -s -H "Authorization: Bearer $1" "${H[@]}" "$BASE/api/account/me"; }

echo "=== 1. 准备账号（幂等） ==="
ADMIN=$(ensure admin001 admin 运营小赵)
T1=$(ensure teacher001 teacher 周老师)
T2=$(ensure teacher002 teacher 陈老师)
S1=$(ensure student001 student 林小满)
P1=$(ensure parent001 parent 林爸)
prof() { me "$1" | python3 -c "import sys,json;d=json.load(sys.stdin);p=d.get('profile') or {};print(p.get('$2',''))"; }
S1_ID=$(prof "$S1" userId); S1_CODE=$(prof "$S1" inviteCode)
T2_ID=$(prof "$T2" userId)
echo "学生1=$S1_ID 邀请码=$S1_CODE"

echo "=== 2. 绑定（老师1带学生1、家长绑学生1） ==="
api POST /api/account/bind "$T1" "{\"inviteCode\":\"$S1_CODE\"}" | head -c 120; echo
api POST /api/account/bind "$P1" "{\"inviteCode\":\"$S1_CODE\"}" | head -c 120; echo

echo "=== 3. 排课：老师1（应 200）/ 老师2 越权（应 403） ==="
api POST /api/course "$T1" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"startAt\":\"2026-10-14T18:30:00.000Z\",\"endAt\":\"2026-10-14T20:00:00.000Z\",\"location\":\"线上\"}" | head -c 130; echo
api POST /api/course "$T2" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"startAt\":\"2026-10-15T18:30:00.000Z\",\"endAt\":\"2026-10-15T20:00:00.000Z\"}" | head -c 130; echo

echo "=== 4. 任务：老师1 布置（应 200）/ 老师2 越权（应 403） ==="
api POST /api/task "$T1" "{\"studentUserId\":\"$S1_ID\",\"title\":\"整理错题本\",\"subject\":\"数学\",\"dueAt\":\"2026-10-16T12:00:00.000Z\"}" | head -c 130; echo
api POST /api/task "$T2" "{\"studentUserId\":\"$S1_ID\",\"title\":\"越权任务\"}" | head -c 130; echo

echo "=== 5. 打卡 → 批阅（老师1 应 200 / 老师2 应 403） ==="
TASK_ID=$($PSQL -d jiajiao -tAc "select id from study_task where student_user_id='$S1_ID' order by _created_at desc limit 1")
api POST "/api/task/$TASK_ID/checkin" "$S1" '{"content":"已完成，错题已订正","durationMin":30}' | head -c 130; echo
CK_ID=$($PSQL -d jiajiao -tAc "select id from task_checkin where task_id='$TASK_ID' order by _created_at desc limit 1")
api PATCH "/api/task/checkin/$CK_ID/review" "$T1" '{"status":"approved","comment":"完成得不错"}' | head -c 100; echo
api PATCH "/api/task/checkin/$CK_ID/review" "$T2" '{"status":"rejected","comment":"越权尝试"}' | head -c 130; echo

echo "=== 6. 课时闭环：admin 发放 → 家长查看 → 老师1 消课 → 家长再查 ==="
api POST /api/course/lessons/grant "$ADMIN" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"amount\":20,\"remark\":\"联调用\"}" | head -c 100; echo
api GET "/api/course/lessons?studentUserId=$S1_ID" "$P1" | head -c 240; echo
COURSE_ID=$($PSQL -d jiajiao -tAc "select id from course where student_user_id='$S1_ID' order by _created_at desc limit 1")
api POST "/api/course/$COURSE_ID/consume" "$T1" | head -c 100; echo
api POST "/api/course/$COURSE_ID/consume" "$T2" | head -c 130; echo
api GET "/api/course/lessons?studentUserId=$S1_ID" "$P1" | head -c 240; echo

echo "=== 7. 学生自己看自己的课时（应 200） ==="
api GET "/api/course/lessons" "$S1" | head -c 200; echo

echo "=== 8. 进度：老师1 更新（应 200）/ 老师2 越权（应 403） ==="
api POST /api/progress "$T1" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"chapter\":\"第3章 函数\",\"percent\":72,\"currentPoint\":\"二次函数最值\"}" | head -c 130; echo
api POST /api/progress "$T2" "{\"studentUserId\":\"$S1_ID\",\"subject\":\"数学\",\"chapter\":\"第3章 函数\",\"percent\":99}" | head -c 130; echo

echo "=== 9. 内容：admin 发布（应 200）/ 老师发布（应 403） ==="
api POST /api/content "$ADMIN" '{"title":"联调测试案例","columnType":"case","summary":"s","content":"c"}' | head -c 130; echo
api POST /api/content "$T1" '{"title":"x","columnType":"case","content":"c"}' | head -c 130; echo

echo "=== 10. 消息：老师看自己的消息（应 200） ==="
api GET /api/message "$S1" | head -c 200; echo
