import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function ensureGogEnabled() {
  // Safety: this only works in environments that have gog installed + tokens.
  // Keep it explicit so we don't surprise-deploy to Vercel.
  if (process.env.JARVIS_BOARD_ENABLE_GOG_DRIVE !== '1') {
    throw new Error('Drive upload not enabled (set JARVIS_BOARD_ENABLE_GOG_DRIVE=1)');
  }
}

export async function gogDriveMkdir(params: {
  name: string;
  account: string;
  parent?: string;
}) {
  ensureGogEnabled();
  const args = ['drive', 'mkdir', params.name, '--account', params.account, '--json', '--no-input'];
  if (params.parent) args.push('--parent', params.parent);
  const { stdout } = await execFileAsync('gog', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = JSON.parse(stdout);
  // Expected: { id, name, mimeType, ... }
  return json;
}

export async function gogDriveUpload(params: {
  localPath: string;
  account: string;
  name?: string;
  parent?: string;
}) {
  ensureGogEnabled();
  const args = ['drive', 'upload', params.localPath, '--account', params.account, '--json', '--no-input'];
  if (params.name) args.push('--name', params.name);
  if (params.parent) args.push('--parent', params.parent);
  const { stdout } = await execFileAsync('gog', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = JSON.parse(stdout);
  return json;
}

export async function gogDriveUrl(params: { fileId: string; account: string }) {
  ensureGogEnabled();
  const args = ['drive', 'url', params.fileId, '--account', params.account, '--json', '--no-input'];
  const { stdout } = await execFileAsync('gog', args, { maxBuffer: 10 * 1024 * 1024 });
  const json = JSON.parse(stdout);
  // Sometimes url returns { urls: [...] } or { url: ... } depending on version.
  return json;
}
