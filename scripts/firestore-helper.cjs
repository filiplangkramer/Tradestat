/**
 * Firestore helper for TradeStat — reusable utility for the AI agent
 * to read/modify user data in Firebase.
 *
 * Usage from another script:
 *   const fs = require('./firestore-helper');
 *   const db = fs.connect();
 *   const trades = await fs.readTrades(db);
 *   // modify trades...
 *   await fs.saveTrades(db, trades, 'reason for change');
 *
 * Always creates a Firestore-side backup before saving. Never commit
 * firebase-key.json (it's in .gitignore).
 */
const admin = require('firebase-admin');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'firebase-key.json');
const UID = 'Nd8Gh5jBRTSQOPcY3rdYZgn9uLo2'; // Filip's UID — single-user app

function connect() {
  if (admin.apps.length === 0) {
    const key = require(KEY_PATH);
    admin.initializeApp({ credential: admin.credential.cert(key), projectId: key.project_id });
  }
  return admin.firestore();
}

async function readDoc(db, key) {
  const snap = await db.doc(`users/${UID}/data/${key}`).get();
  if (!snap.exists) return null;
  const raw = snap.data().v;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}

async function writeDoc(db, key, data) {
  await db.doc(`users/${UID}/data/${key}`).set({ v: JSON.stringify(data) });
}

async function backup(db, key, label = 'auto') {
  const snap = await db.doc(`users/${UID}/data/${key}`).get();
  if (!snap.exists) return null;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupKey = `${key}_backup_${label}_${ts}`;
  await db.doc(`users/${UID}/data/${backupKey}`).set({ v: snap.data().v });
  return backupKey;
}

const readTrades  = (db) => readDoc(db, 'trades');
const saveTrades  = async (db, trades, label = 'change') => {
  const b = await backup(db, 'trades', label);
  await writeDoc(db, 'trades', trades);
  return b;
};
const readGoals   = (db) => readDoc(db, 'goals');
const readJournal = (db) => readDoc(db, 'journal');
const readMkData  = (db) => readDoc(db, 'mkdata');

module.exports = { connect, readDoc, writeDoc, backup, readTrades, saveTrades, readGoals, readJournal, readMkData, UID };
