import {
  FIREBASE_PROJECT_ID,
  FIREBASE_API_KEY,
} from '@env';

if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
  throw new Error('Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY in .env');
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => ({
            mapValue: { fields: toFirestoreFields(item as Record<string, any>) }
          }))
        }
      };
    } else if (val !== null && typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val as Record<string, any>) } };
    }
  }
  return fields;
}

function fromFirestoreFields(fields: Record<string, any>): any {
  const obj: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    const v: any = val;
    if (v.stringValue !== undefined) obj[key] = v.stringValue;
    else if (v.doubleValue !== undefined) obj[key] = v.doubleValue;
    else if (v.arrayValue) {
      obj[key] = (v.arrayValue.values || []).map((elem: any) =>
        fromFirestoreFields(elem.mapValue.fields)
      );
    } else if (v.mapValue) {
      obj[key] = fromFirestoreFields(v.mapValue.fields);
    }
  }
  return obj;
}

export async function getBudget(groupId: string) {
  const url = `${BASE_URL}/budgets/${groupId}?key=${FIREBASE_API_KEY}`;
  console.log('[REST] GET ->', url);
  const res = await fetch(url);
  if (res.status === 200) {
    const json = await res.json();
    return fromFirestoreFields(json.fields || {});
  } else if (res.status === 404) {
    return null;
  } else {
    throw new Error(`Firestore GET error ${res.status}`);
  }
}

export async function setBudget(groupId: string, data: any) {
  const url = `${BASE_URL}/budgets/${groupId}?key=${FIREBASE_API_KEY}`;
  console.log('[REST] PATCH ->', url, data);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    throw new Error(`Firestore PATCH error ${res.status}`);
  }
  return res.json();
}
