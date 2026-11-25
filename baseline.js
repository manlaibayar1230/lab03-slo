import http from 'k6/http';
import { check, sleep } from 'k6';

// Босго сонгохын өмнөх суурь хэмжилт, 20 VU, 1 минут.
// Энд тавьсан threshold-ууд үргэлж PASS (max>=0) — зөвхөн tag тус бүрийн
// тоог summary-д гаргуулах зорилготой, SLO биш.
export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    'http_req_duration{name:cart}': ['max>=0'],
    'http_req_duration{name:report}': ['max>=0'],
    'http_req_duration{name:pay}': ['max>=0'],
    'http_req_failed{name:pay}': ['rate>=0'],
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
