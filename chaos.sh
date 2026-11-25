#!/usr/bin/env bash
# Мини chaos: k6-ийг 2 минут ажиллуулж, дундуур нь серверийг зогсоож (crash), 10с дараа дахин асаана.
# Цагийн тэмдэглэл results/chaos-timeline.txt-д бичигдэнэ.
cd "$(dirname "$0")"
export PATH="/c/Program Files/k6:$PATH"
T=results/chaos-timeline.txt
ts() { date +%H:%M:%S.%3N; }
: > "$T"
node server.js > /dev/null 2>&1 & SRV=$!
sleep 2
echo "$(ts) server started (pid $SRV)" >> "$T"
k6 run --summary-trend-stats "avg,min,med,max,p(90),p(95),p(99)" -e DURATION=2m slo-test.js > results/chaos.txt 2>&1 & K6=$!
echo "$(ts) k6 started (2m)" >> "$T"
sleep 50
kill -9 $SRV
echo "$(ts) SERVER KILLED (crash)" >> "$T"
sleep 10
node server.js > /dev/null 2>&1 & SRV=$!
echo "$(ts) server restart command issued" >> "$T"
until curl -s -o /dev/null -X POST http://localhost:3000/cart/add; do sleep 0.1; done
echo "$(ts) first successful response after restart" >> "$T"
wait $K6; RC=$?; echo "$(ts) k6 finished, exit=$RC" >> "$T"
kill $SRV; wait $SRV 2>/dev/null
