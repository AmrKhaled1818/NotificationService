import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // ramp-up to 50 users
    { duration: '30s', target: 100 }, // steady at 100 users
    { duration: '10s', target: 0 },   // ramp-down
  ],
};

const channels = ['EMAIL', 'SMS', 'PUSH'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const payload = JSON.stringify({
    recipient: `user${Math.floor(Math.random() * 10000)}@example.com`,
    channel: getRandomItem(channels),
    message: `Hello from K6 test ${Math.random().toString(36).substring(7)}!`,
  });

  const headers = { 'Content-Type': 'application/json' };

  const res = http.post('http://localhost:8080/notify', payload, { headers });

  check(res, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response has id': (r) => JSON.parse(r.body).id !== undefined,
  });

  sleep(1);
}
