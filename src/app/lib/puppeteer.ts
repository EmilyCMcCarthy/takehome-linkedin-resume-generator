/* eslint-disable @typescript-eslint/no-unused-vars */
import puppeteer, { Browser, BrowserContext, Page } from 'puppeteer';
import { LoginCredentials, LoginOptions } from '@/app/utils/types';

declare global {
  var browserInstance: Browser | null;
  var browserPromise: Promise<Browser> | null;
  var loginContext: BrowserContext | null;
  var loginPage: Page | null;
  var isLoggedIn: boolean;
}

const activePagesSet = new Set<Page>();
const activeContextsMap = new Map<string, BrowserContext>();

export const getBrowser = async (): Promise<Browser> => {
  if (globalThis.browserInstance && !globalThis.browserInstance.connected) {
    // Browser disconnected, clean up everything
    globalThis.browserInstance = null;
    globalThis.loginContext = null;
    globalThis.loginPage = null;
    globalThis.isLoggedIn = false;
    activeContextsMap.clear();
  }

  if (globalThis.browserInstance) {
    return globalThis.browserInstance;
  }

  if (globalThis.browserPromise) {
    return globalThis.browserPromise;
  }

  globalThis.browserPromise = puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  try {
    globalThis.browserInstance = await globalThis.browserPromise;
    globalThis.loginContext = null;
    globalThis.loginPage = null;
    globalThis.isLoggedIn = false;

    globalThis.browserInstance.on('disconnected', () => {
      globalThis.browserInstance = null;
      globalThis.loginContext = null;
      globalThis.loginPage = null;
      globalThis.isLoggedIn = false;
      activeContextsMap.clear();
    });

    return globalThis.browserInstance;
  } finally {
    globalThis.browserPromise = null;
  }
};

const createFreshLoginContext = async (): Promise<BrowserContext> => {
  const browser = await getBrowser();

  // Close existing login context if it exists
  if (globalThis.loginContext) {
    try {
      await globalThis.loginContext.close();
      console.log('Closed previous login context');
    } catch (error) {
      console.warn('Failed to close previous login context:', error);
    }
  }

  // Create completely fresh context
  globalThis.loginContext = await browser.createBrowserContext();

  return globalThis.loginContext;
};

export const login = async (
  credentials: LoginCredentials,
  options: LoginOptions = {}
): Promise<boolean> => {
  const timeout = credentials.timeout || 30000;
  const maxRetries = credentials.maxRetries || 2;

  if (!credentials.username || !credentials.password || !credentials.loginUrl) {
    throw new Error('Missing required credentials');
  }

  console.log('Creating fresh browser context...');
  const loginContext = await createFreshLoginContext();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Close previous login page if exists
      if (globalThis.loginPage && !globalThis.loginPage.isClosed()) {
        await globalThis.loginPage.close();
      }

      // Create page in fresh context
      globalThis.loginPage = await loginContext.newPage();
      const page = globalThis.loginPage;

      console.log(`Login attempt ${attempt}/${maxRetries} in fresh context`);

      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);

      // Navigate to login page (completely clean slate)
      await page.goto(credentials.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout
      });

      const pageContent = await page.content();
      // Login process
      const usernameSelector = credentials.usernameSelector ||
        'input[name="username"], input[name="email"], input[type="email"], #username, #email';
      const passwordSelector = credentials.passwordSelector ||
        'input[name="password"], input[type="password"], #password';
      const submitSelector = credentials.submitSelector ||
        'button[type="submit"], input[type="submit"]';


      console.log('Waiting for login form...');
      await page.waitForSelector(usernameSelector, { timeout: 10000 });
      await page.waitForSelector(passwordSelector, { timeout: 10000 });

      console.log('Filling credentials...');
      await page.click(usernameSelector, { clickCount: 3 });
      await page.type(usernameSelector, credentials.username);

      await page.click(passwordSelector, { clickCount: 3 });
      await page.type(passwordSelector, credentials.password);

      console.log('Submitting login form...');
      const navigationPromise = page.waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout
      });

      await page.click(submitSelector);
      await navigationPromise;

      const loginSuccess = await validateLoginSuccess(page, credentials);

      if (loginSuccess) {
        console.log('✅ Login successful in context!');
        globalThis.isLoggedIn = true;
        return true;
      } else if (attempt < maxRetries) {
        console.warn(`⚠️ Login attempt ${attempt} failed, creating new context...`);

        // Create completely fresh context for retry
        await createFreshLoginContext();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Login attempt ${attempt} failed:`, errorMessage);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  globalThis.isLoggedIn = false;
  return false;
};

// Success validation 
const validateLoginSuccess = async (
  page: Page,
  credentials: LoginCredentials
): Promise<boolean> => {
  try {
    // Check success indicator
    if (credentials.successIndicator) {
      if (credentials.successIndicator.startsWith('http')) {
        console.log(page.url(), "page.url()");
        return page.url().includes(credentials.successIndicator);
      } else {
        try {
          await page.waitForSelector(credentials.successIndicator);
          console.log('found selector');
          return true;
        } catch {
          return false;
        }
      }
    }
    
    // No success indicator provided - assume failure
    return false;
    
  } catch (error: unknown) {
    console.error('Login validation error:', error);
    return false;
  }
};

// Check if we're logged in (context-aware)
export const isLoggedIn = async (): Promise<boolean> => {
  if (!globalThis.isLoggedIn) return false;

  try {
    if (!globalThis.browserInstance?.connected) {
      globalThis.isLoggedIn = false;
      return false;
    }

    if (!globalThis.loginContext) {
      globalThis.isLoggedIn = false;
      return false;
    }

    if (!globalThis.loginPage || globalThis.loginPage.isClosed()) {
      globalThis.isLoggedIn = false;
      return false;
    }

    return true;
  } catch {
    globalThis.isLoggedIn = false;
    return false;
  }
};

// Require login with context
export const requireLogin = async (
  credentials: LoginCredentials,
  options: LoginOptions = {}
): Promise<void> => {
  const loggedIn = await isLoggedIn();

  if (!loggedIn || options.forceRelogin) {
    const loginResult = await login(credentials, options);

    if (!loginResult) {
      throw new Error('Authentication failed');
    }
  }
};

// Get authenticated page - creates in the SAME context as login
export const getAuthenticatedPage = async (
  credentials: LoginCredentials,
  options: LoginOptions = {}
): Promise<Page> => {
  await requireLogin(credentials, options);

  if (!globalThis.loginContext) {
    throw new Error('No login context available');
  }

  // Create page in the SAME context where we logged in
  // This preserves the session cookies from login
  const page = await globalThis.loginContext.newPage();

  console.log('Created authenticated page in same context');

  // Track for cleanup
  activePagesSet.add(page);
  page.once('close', () => activePagesSet.delete(page));

  return page;
};

// Session validation in incognito context
export const validateSession = async (
  testUrl: string,
  timeoutMs: number = 10000
): Promise<boolean> => {
  if (!globalThis.loginContext) {
    return false;
  }

  try {
    const testPage = await globalThis.loginContext.newPage();

    testPage.setDefaultTimeout(timeoutMs);
    await testPage.goto(testUrl, { waitUntil: 'networkidle0' });

    const currentUrl = testPage.url();
    const redirectedToLogin = currentUrl.toLowerCase().includes('login');



    await testPage.close();

    if (redirectedToLogin) {
      globalThis.isLoggedIn = false;
    }

    return !redirectedToLogin;
  } catch (error) {
    console.error('Session validation failed:', error);
    globalThis.isLoggedIn = false;
    return false;
  }
};

// Force fresh login (creates completely new incognito context)
export const forceRelogin = async (credentials: LoginCredentials): Promise<boolean> => {
  console.log('Forcing fresh login with new incognito context...');

  // Clear all state
  globalThis.isLoggedIn = false;

  if (globalThis.loginPage && !globalThis.loginPage.isClosed()) {
    await globalThis.loginPage.close();
  }
  globalThis.loginPage = null;

  // create a completely fresh incognito context
  return await login(credentials, { forceRelogin: true });
};

// Get context info for debugging
export const getContextInfo = (): {
  isLoggedIn: boolean;
  hasLoginContext: boolean;
  activeContexts: string[];
  activePages: number;
} => {
  return {
    isLoggedIn: globalThis.isLoggedIn || false,
    hasLoginContext: globalThis.loginContext !== null,
    activeContexts: Array.from(activeContextsMap.keys()),
    activePages: activePagesSet.size
  };
};

// Comprehensive cleanup
export const cleanup = async (options: {
  keepBrowser?: boolean;  // Keep browser running but close contexts
} = {}): Promise<void> => {
  console.log('Starting cleanup...');

  // Close all tracked pages
  const closePromises = Array.from(activePagesSet).map(async (page) => {
    if (!page.isClosed()) {
      try {
        await page.close();
      } catch (error) {
        console.warn('Failed to close page:', error);
      }
    }
  });

  await Promise.allSettled(closePromises);
  activePagesSet.clear();

  // Close all contexts (including login context)
  const contextPromises = Array.from(activeContextsMap.entries()).map(async ([id, context]) => {
    try {
      await context.close();
      console.log(`Closed ${id} context`);
    } catch (error) {
      console.warn(`Failed to close ${id} context:`, error);
    }
  });

  await Promise.allSettled(contextPromises);
  activeContextsMap.clear();

  // Close login context specifically
  if (globalThis.loginContext) {
    try {
      await globalThis.loginContext.close();
      console.log('Closed login context');
    } catch (error) {
      console.warn('Failed to close login context:', error);
    }
    globalThis.loginContext = null;
  }

  globalThis.loginPage = null;
  globalThis.isLoggedIn = false;

  // Close browser unless keeping it
  if (!options.keepBrowser && globalThis.browserInstance) {
    try {
      await globalThis.browserInstance.close();
      console.log('Closed browser');
    } catch (error) {
      console.warn('Failed to close browser:', error);
    }
    globalThis.browserInstance = null;
  }

  globalThis.browserPromise = null;
  console.log('✅ Cleanup complete');
};