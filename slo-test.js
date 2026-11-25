import http from 'k6/http';
import { check, sleep } from 'k6';

// SLO → threshold. README-ийн SLO хүснэгттэй яг ижил тоонууд.
// PASS:  k6 run slo-test.js                     (1 минут)
// Chaos: k6 run -e DURATION=2m slo-test.js      (2 минут, дундуур нь сервер зогсооно)
export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    'http_req_duration{name:cart}': ['p(95)<20', 'p(99)<50'], // Performance SLO
    'http_req_failed{name:pay}': ['rate<0.08'],               // Reliability SLO
    'checks': ['rate>0.90'],                                  // Availability SLO
    'http_req_duration{name:report}': ['p(95)<450'],          // Нэмэлт: /report performance SLO
  },
};

export default function () {
  const base = 'http://localhost:3000';
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1);
}
