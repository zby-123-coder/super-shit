#!/bin/bash
# 冒烟测试：幂等建号 → 绑定 → 排课/任务/打卡/批阅/课时/进度/内容全链路 + 越权拦截断言。
# 用法：先启动服务（npm run dev:server 或 npm start），再 npm test
# 环境变量：TEST_BASE 默认 http://localhost:3000
set -u
BASE="${TEST_BASE:-http://localhost:3000}"
PSQL="${PSQL:-/opt/homebrew/opt/postgresql@16/bin/psql}"
DB="${DB:-jiajiao}"
PASS=0; FAIL=0

jqget() { python3 -c "import sys,json;print(json.load(sys.stdin).get('$1',''))" 2>/dev/null; }

ensure() { # ensure <login> <role> <name> [extraJsonFragment] → 输出 token
  local out t extra=""
  [ -n "${4:-}" ] && extra=",$4"
  out=$(curl -s -H 'Content-Type: application/json' -X POST -d '{"loginName":"'"$1"'","password":"123456","role":"'"$2"'","name":"'"$3"'"'"$extra"'}' "$BASE/api/auth/register")
  t=$(echo "$out" | jqget token)
  [ -z "$t" ] && t=$(curl -s -H 'Content-Type: application/json' -X POST -d '{"loginName":"'"$1"'","password":"123456"}' "$BASE/api/auth/login" | jqget token)
  echo "$t"
}
api() { # api <method> <path> <token> [body] → 输出 "body [code]"
  local auth=(); [ -n "$3" ] && auth=(-H "Authorization: Bearer $3")
  if [ -n "${4:-}" ]; then
    curl -s -w " [%{http_code}]" ${auth[@]+"${auth[@]}"} -H 'Content-Type: application/json' -X "$1" -d "$4" "$BASE$2"
  else
    curl -s -w " [%{http_code}]" ${auth[@]+"${auth[@]}"} -H 'Content-Type: application/json' -X "$1" "$BASE$2"
  fi
}
expect() { # expect <实际输出> <期望code> <用例名>
  local code; code=$(echo "$1" | grep -o '\[[0-9]*\]$' | tr -d '[]')
  if [ "$code" = "$2" ]; then PASS=$((PASS+1)); echo "  OK $3 [$code]";
  else FAIL=$((FAIL+1)); echo "  FAIL $3 want[$2] got[$code]: $(echo "$1" | head -c 150)"; fi
}
me() { curl -s -H "Authorization: Bearer $1" "$BASE/api/account/me"; }

echo "=== 1. 准备账号（幂等；家长先注册建家庭，学生凭家庭邀请码加入） ==="
ADMIN=$(ensure admin001 admin 运营小赵)
T1=$(ensure teacher001 teacher 周老师)
T2=$(ensure teacher002 teacher 陈老师)
P1=$(ensure parent001 parent 林爸)
for name in ADMIN T1 T2 P1; do
  [ -z "${!name}" ] && { echo "FATAL: $name login failed"; exit 1; }
done
prof() { me "$1" | python3 -c "import sys,json;d=json.load(sys.stdin);p=d.get('profile') or {};print(p.get('$2',''))"; }
FAMILY_CODE=$(prof "$P1" inviteCode)
S1_EXTRA=$(printf '"familyInviteCode":"%s"' "$FAMILY_CODE")
S1=$(ensure student001 student 林小满 "$S1_EXTRA")
[ -z "$S1" ] && { echo "FATAL: S1 register failed"; exit 1; }
S1_ID=$(prof "$S1" userId); S1_CODE=$(prof "$S1" inviteCode)
T2_ID=$(prof "$T2" userId)
# 清理历史测试数据中老师2对学生1的绑定，保证越权用例前提（未绑定）
$PSQL -d "$DB" -c "delete from teaching_link where teacher_user_id='$T2_ID' and student_user_id='$S1_ID'" >/dev/null
echo "familyCode=$FAMILY_CODE student=$S1_ID code=$S1_CODE"

echo "=== 2. 绑定（老师凭学生邀请码） ==="
expect "$(api POST /api/account/teach "$T1" '{"inviteCode":"'"$S1_CODE"'"}')" 201 "老师1加学生1"
expect "$(api POST /api/account/teach "$T2" '{"inviteCode":"NOTEXIST"}')" 409 "老师2加不存在邀请码被拒"

echo "=== 3. 排课 + 越权 ==="
expect "$(api POST /api/course "$T1" '{"studentUserId":"'"$S1_ID"'","subject":"数学","startAt":"2026-10-14T18:30:00.000Z","endAt":"2026-10-14T20:00:00.000Z","location":"线上"}')" 201 "老师1排课"
expect "$(api POST /api/course "$T2" '{"studentUserId":"'"$S1_ID"'","subject":"数学","startAt":"2026-10-15T18:30:00.000Z","endAt":"2026-10-15T20:00:00.000Z"}')" 403 "老师2越权排课"

echo "=== 4. 任务 + 越权 ==="
expect "$(api POST /api/task "$T1" '{"studentUserId":"'"$S1_ID"'","title":"整理错题本","subject":"数学","dueAt":"2026-10-16T12:00:00.000Z"}')" 201 "老师1布置任务"
expect "$(api POST /api/task "$T2" '{"studentUserId":"'"$S1_ID"'","title":"越权任务"}')" 403 "老师2越权布置"

echo "=== 5. 打卡 → 批阅 + 越权 ==="
TASK_ID=$($PSQL -d "$DB" -tAc "select id from study_task where student_user_id='$S1_ID' order by _created_at desc limit 1")
expect "$(api POST "/api/task/$TASK_ID/checkin" "$S1" '{"content":"已完成，错题已订正","durationMin":30}')" 201 "学生打卡"
CK_ID=$($PSQL -d "$DB" -tAc "select id from task_checkin where task_id='$TASK_ID' order by _created_at desc limit 1")
expect "$(api PATCH "/api/task/checkin/$CK_ID/review" "$T1" '{"status":"approved","comment":"完成得不错"}')" 200 "老师1批阅通过"
expect "$(api PATCH "/api/task/checkin/$CK_ID/review" "$T2" '{"status":"rejected","comment":"越权尝试"}')" 403 "老师2越权批阅"

echo "=== 6. 课时闭环 + 越权 ==="
expect "$(api POST /api/course/lessons/grant "$ADMIN" '{"studentUserId":"'"$S1_ID"'","subject":"数学","amount":20,"remark":"联调用"}')" 201 "admin发放课时"
expect "$(api GET "/api/course/lessons?studentUserId=$S1_ID" "$P1")" 200 "家长查课时"
COURSE_ID=$($PSQL -d "$DB" -tAc "select id from course where student_user_id='$S1_ID' order by _created_at desc limit 1")
expect "$(api POST "/api/course/$COURSE_ID/consume" "$T1")" 201 "老师1确认消课"
expect "$(api POST "/api/course/$COURSE_ID/consume" "$T2")" 403 "老师2越权消课"
expect "$(api GET "/api/course/lessons" "$S1")" 200 "学生自查课时"

echo "=== 7. 进度 + 越权 ==="
expect "$(api POST /api/progress "$T1" '{"studentUserId":"'"$S1_ID"'","subject":"数学","chapter":"第3章 函数","percent":72,"currentPoint":"二次函数最值"}')" 201 "老师1更新进度"
expect "$(api POST /api/progress "$T2" '{"studentUserId":"'"$S1_ID"'","subject":"数学","chapter":"第3章 函数","percent":99}')" 403 "老师2越权更新进度"

echo "=== 8. 内容 + 越权 ==="
expect "$(api POST /api/content "$ADMIN" '{"title":"联调测试案例","columnType":"case","summary":"s","content":"c"}')" 201 "admin发布内容"
expect "$(api POST /api/content "$T1" '{"title":"x","columnType":"case","content":"c"}')" 403 "老师越权发布内容"

echo "=== 9. 消息与鉴权 ==="
expect "$(api GET /api/message "$S1")" 200 "学生看消息"
expect "$(api GET /api/account/me "")" 401 "无token访问被拒"

echo "=== 10. AI 识图批改权限（学生/未绑定老师 403，带班老师 201） ==="
TASK_ID2=$($PSQL -d "$DB" -tAc "select id from study_task where student_user_id='$S1_ID' order by _created_at desc limit 1")
expect "$(api POST "/api/ai/grade-homework/$TASK_ID2" "$S1")" 403 "学生越权识图批改"
expect "$(api POST "/api/ai/grade-homework/$TASK_ID2" "$T2")" 403 "未绑定老师越权识图批改"
expect "$(api POST "/api/ai/grade-homework/$TASK_ID2" "$T1")" 201 "带班老师识图批改"

echo "=== 11. 题库与举一反三（学生可推荐，录题仅老师） ==="
expect "$(api POST /api/question-bank/recommend "$S1" '{"subject":"数学","knowledgePoint":"二次函数最值","count":3}')" 201 "学生获取同类题推荐"
expect "$(api POST /api/question-bank "$S1" '{"subject":"数学","title":"x"}')" 403 "学生越权录题"
expect "$(api POST /api/question-bank "$T1" '{"subject":"数学","knowledgePoint":"联调知识点","title":"联调录题"}')" 201 "老师录题"

echo "=== 12. 运营工作流（学生 403，管理员可用） ==="
expect "$(api POST /api/ops/generate "$S1" '{"grade":"初二","region":"杭州","subject":"数学"}')" 403 "学生越权使用运营台"
expect "$(api POST /api/ops/generate "$ADMIN" '{"grade":"初二","region":"杭州","subject":"数学","material":"联调素材"}')" 201 "管理员生成运营文案"

echo "=== 13. 数据飞轮：诊断 → 复习 → 讲解 ==="
# 诊断（家长看孩子：200；未绑定老师：403；天数非法：400）
expect "$(api GET "/api/report/diagnosis?days=30" "$P1")" 200 "家长查看学情诊断"
expect "$(api GET "/api/report/diagnosis?studentUserId=$S1_ID" "$T2")" 403 "未绑定老师越权看诊断"
expect "$(api GET "/api/report/diagnosis?days=15" "$P1")" 400 "诊断天数参数非法被拒"

# 错题 → 订正自动排期 → 完成复习推进阶段
WQ_ID=$($PSQL -d "$DB" -tAc "select id from wrong_question where student_user_id='$S1_ID' order by _created_at desc limit 1")
if [ -z "$WQ_ID" ]; then
  WQ_OUT=$(api POST /api/wrong-question "$S1" '{"subject":"数学","title":"联调错题","reason":"概念不清"}')
  WQ_ID=$(echo "$WQ_OUT" | jqget id)
fi
expect "$(api PATCH "/api/wrong-question/$WQ_ID/corrected" "$S1")" 200 "学生标记订正（自动排期）"
expect "$(api GET /api/wrong-question/review-plan "$S1")" 200 "复习计划可见"
expect "$(api POST "/api/wrong-question/$WQ_ID/review-done" "$S1")" 201 "完成一轮复习"
expect "$(api POST "/api/wrong-question/$WQ_ID/review-skip" "$S1")" 201 "跳过一轮复习"

# 复习提醒触发（仅管理员）
expect "$(api POST /api/wrong-question/review-reminder/run "$ADMIN")" 201 "管理员触发复习提醒"
expect "$(api POST /api/wrong-question/review-reminder/run "$S1")" 403 "学生越权触发复习提醒"

# 引导式讲题（学生可用；规则版 available=false 也是 200）
expect "$(api POST /api/ai/explain "$S1" '{"subject":"数学","title":"已知 x²=16，求 x","knowledgePoint":"二次函数","wrongReason":"概念不清"}')" 201 "学生获取引导式讲解"

echo "=== 14. AI 陪练 Agent（人设/多轮/数据隔离） ==="
CS=$(api POST /api/companion/start "$S1" '{}')
CS_ID=$(echo "$CS" | python3 -c "import sys,json,re; raw=sys.stdin.read(); m=re.search(r'\"session\":\{\"id\":\"([^\"]+)\"', raw); print(m.group(1) if m else '')")
expect "$CS" 201 "学生开启 AI 陪练"
if [ -n "$CS_ID" ]; then
  expect "$(api POST "/api/companion/sessions/$CS_ID/messages" "$S1" '{"content":"我卡在第一步"}')" 201 "陪练多轮对话"
  expect "$(api GET "/api/companion/sessions/$CS_ID" "$T2")" 403 "他人访问陪练会话被拒"
fi

echo "=== 15. 状态洞察与决策编排 ==="
expect "$(api GET "/api/insight/$S1_ID" "$P1")" 200 "家长查看学生状态"
expect "$(api POST "/api/insight/evaluate/$S1_ID" "$T1")" 201 "老师触发状态评估"
expect "$(api GET /api/insight "$S1")" 403 "学生越权看风险名单"
expect "$(api POST /api/insight/scan "$S1")" 403 "学生越权触发全局扫描"

echo "=== 16. 择校知识库 ==="
expect "$(api GET /api/admission/schools "$S1")" 200 "学校库查询"
expect "$(api POST /api/admission/match "$S1" '{"subjects":["物理","化学","生物"]}')" 201 "选科匹配可报专业"

echo ""
echo "=== 17. 教育知识库（中高考信息检索） ==="
expect "$(api GET "/api/kb/search?keyword=%E5%B9%B3%E8%A1%8C%E5%BF%97%E6%84%BF" "$S1")" 200 "关键词检索：平行志愿"
expect "$(api GET "/api/kb/search?stage=zhongkao&category=policy" "$S1")" 200 "过滤检索：中考政策"
expect "$(api GET "/api/kb/search?keyword=%E4%B8%8D%E5%AD%98%E5%9C%A8xyzq" "$S1")" 200 "无结果返回空数组"
expect "$(api GET /api/kb/stats "$S1")" 200 "分类统计"
expect "$(api POST /api/kb/entries "$S1" '{"stage":"gaokao","category":"faq","title":"itest临时条目","content":"itest 验证用，可被覆盖"}')" 201 "人工补库 upsert"
expect "$(api POST /api/kb/entries "$S1" '{"stage":"gaokao","category":"faq","title":"itest临时条目","content":"itest 覆盖更新"}')" 201 "重复 upsert 幂等"
expect "$(api POST /api/kb/entries "$S1" '{"stage":"bad","category":"faq","title":"x","content":"y"}')" 400 "非法 stage 被拒"

echo ""
echo "========== RESULT: $PASS passed, $FAIL failed =========="
[ "$FAIL" -eq 0 ]
