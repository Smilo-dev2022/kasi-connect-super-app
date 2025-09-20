import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = { vus: 5, duration: '30s' };

export default function () {
  const base = __ENV.TARGET_URL || 'http://localhost:4000';
  const res = http.get(`${base}/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
