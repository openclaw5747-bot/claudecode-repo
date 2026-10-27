// Everything lives in one JSON file on your own disk. Writes go to a temporary file first and are
// renamed into place, so a crash mid-write never leaves half a file.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const STATUSES = ['Saved', 'Drafting', 'Applied', 'Interview', 'Offer', 'Rejected'];

const EMPTY = () => ({
  profile: {
    name: '', email: '', phone: '', town: '', postcode: '', linkedin: '', website: '',
    rightToWork: '', noticePeriod: '', drivingLicence: false, clearance: '',
    headline: '', statement: '', skills: [], languages: [],
    experience: [], education: [], certifications: [], projects: [],
    references: 'Available on request',
  },
  applications: [],
  saved: [],
  dismissed: [],
});

export const newId = () => crypto.randomUUID();

export class Store {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'shortlist.json');
    this.data = null;
    this.queue = Promise.resolve();
  }

  async load() {
    try { this.data = { ...EMPTY(), ...JSON.parse(await fs.readFile(this.file, 'utf8')) }; }
    catch (err) { if (err.code !== 'ENOENT') throw err; this.data = EMPTY(); }
    return this.data;
  }

  /** Runs `fn` on the data and saves it; calls are serialised so writes never interleave. */
  update(fn) {
    const run = this.queue.then(async () => {
      const result = await fn(this.data);
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2));
      await fs.rename(tmp, this.file);
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  application(id) {
    return this.data.applications.find((a) => a.id === id) || null;
  }
}
