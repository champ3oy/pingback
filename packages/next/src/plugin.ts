import { readFileSync } from 'fs';
import { globSync } from 'glob';
import { loadConfig } from './config';
import { registerFunctions } from './register';

export function discoverFunctionFilesSync(
  projectRoot: string,
  pattern: string,
): string[] {
  const files = globSync(pattern, { cwd: projectRoot, absolute: true });

  return files.filter((file) => {
    const content = readFileSync(file, 'utf-8');
    return content.includes('@usepingback/next');
  });
}

// Keep async version for tests
export async function discoverFunctionFiles(
  projectRoot: string,
  pattern: string,
): Promise<string[]> {
  return discoverFunctionFilesSync(projectRoot, pattern);
}

// Keep for backward compatibility / tests
export { generateRouteFile } from './generate';

// Module-level singleton so re-evaluations of next.config don't re-register
let registrationPromise: Promise<void> | null = null;

export function withPingback(nextConfig: any = {}): any {
  if (process.env.NODE_ENV === 'production' && !registrationPromise) {
    registrationPromise = runRegistration(process.cwd()).catch((err: Error) => {
      console.error(`[pingback] Registration failed: ${err.message}`);
    });
  }

  const originalHeaders = nextConfig.headers;

  return {
    ...nextConfig,
    // Use headers() as a bundler-agnostic build hook to await registration
    async headers() {
      if (registrationPromise) {
        await registrationPromise;
      }
      return originalHeaders ? originalHeaders() : [];
    },
  };
}

async function runRegistration(projectRoot: string): Promise<void> {
  const config = await loadConfig(projectRoot);
  const files = discoverFunctionFilesSync(projectRoot, config.functionsDir);

  console.log(`[pingback] Found ${files.length} function file(s)`);

  if (files.length === 0) return;

  for (const file of files) {
    try { await import(file); } catch (err) {
      console.warn(`[pingback] Could not import ${file}: ${(err as Error).message}`);
    }
  }

  const result = await registerFunctions(config);
  console.log(`[pingback] Registered ${result.jobs.length} function(s) with platform`);
}
