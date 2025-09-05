// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio')
import {
  getAuthenticatedPage
} from '@/app/lib/puppeteer';

import {
  linkedInAuthOrChallengeUrlCheck,
  linkedInCheckIfProfileWasFound
} from '@/app/utils/utils';

const EMAIL_SELECTOR = '#username';
const PASSWORD_SELECTOR = '#password';
const SUBMIT_SELECTOR = '#app__container > main > div.card-layout > #organic-div > form.login__form > div.login__form_action_container > button';
const LINKEDIN_LOGIN_URL = 'https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin';
const LINKEDIN_REMEMBER_ME_SELECTOR = '#rememberMeOptIn-checkbox';

const credentials = {
  username: process.env.LINKEDIN_USERNAME,
  password: process.env.LINKEDIN_PASSWORD,
  loginUrl: LINKEDIN_LOGIN_URL,
  usernameSelector: EMAIL_SELECTOR,
  passwordSelector: PASSWORD_SELECTOR,
  submitSelector: SUBMIT_SELECTOR,
  rememberMeSelector: LINKEDIN_REMEMBER_ME_SELECTOR,
  successIndicator: 'https://www.linkedin.com/feed',
  timeout: 30000,
  maxRetries: 2
};

async function getLinkedInData(linkedInUsername: string) {
  let page;
  try {
    // automatically log in if not already logged in
    page = await getAuthenticatedPage(credentials);
    const timeout = 10000;

    console.log('✅ Got authenticated page');

    // ===== MAIN PROFILE PAGE =====
    console.log('Navigating to main profile...');

    const mainUrl = `https://www.linkedin.com/in/${linkedInUsername}`;
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.waitForSelector('div', { timeout: 10000 }),
      page.waitForFunction(
        () => window.location.href.includes('www.linkedin.com/in/') ||
          window.location.href.includes('www.linkedin.com/checkpoint/challenge') ||
          window.location.href.includes('www.linkedin.com/authwall') ||
          window.location.href.includes('www.linkedin.com/404')
      ),
      page.goto(mainUrl)
    ]);

    linkedInAuthOrChallengeUrlCheck(page);
    linkedInCheckIfProfileWasFound(page);

    console.log('✅ Main profile loaded, extracting data...');
    const mainPageContent = await page.content();

    // Process main page data
    const $ = cheerio.load(mainPageContent);
    const extractedGeneral = $.extract({
      name: {
        selector: 'h1',
      },
      mainSectionMediumText: [{
        selector: 'main > section:first .text-body-medium',
        value: (el, key) => {
          const trim = $(el).text().trim();
          return `${trim}`;
        }
      }],
      mainSectionSmallText: [{
        selector: 'main > section:first .text-body-small',
        value: (el, key) => {
          const trim = $(el).text().trim();
          return `${trim}`;
        }
      }],
      profilePicture: {
        selector: '#profile-content div.body img',
        value: 'src'
      }
    });

    console.log('General data extracted:', extractedGeneral);

    // ===== EDUCATION PAGE =====
    console.log('Navigating to education page...');

    const educationUrl = `https://www.linkedin.com/in/${linkedInUsername}/details/education`;
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.waitForSelector('#profile-content', { timeout: 10000 }),
      page.goto(educationUrl)
    ]);

    console.log('✅ Education page loaded, extracting data...');
    const educationPageContent = await page.content();

    // Process education data
    const $education = cheerio.load(educationPageContent);
    const educationItems = $education('main').find('li');
    console.log(`Found ${educationItems.length} education items`);

    const educationResult = [...$education("main")].map(e =>
      [...$education(e).find("li.pvs-list__paged-list-item")].map(e =>
        [...$education(e).find("span.visually-hidden")].map(e => $education(e).text())
      )
    );

    console.log("Education data extracted:", JSON.stringify(educationResult, null, 2));

    // ===== EXPERIENCE PAGE =====
    console.log('Navigating to experience page...');
    const experienceUrl = `https://www.linkedin.com/in/${linkedInUsername}/details/experience`;
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.waitForSelector('#profile-content', { timeout: 10000 }),
      page.goto(experienceUrl)
    ]);

    console.log('✅ Experience page loaded, extracting data...');
    const experiencePageContent = await page.content();

    // Process experience data
    const $experience = cheerio.load(experiencePageContent);
    const experienceItems = $experience('main').find('li');
    console.log(`Found ${experienceItems.length} experience items`);

    const experienceResult = [...$experience("main")].map(e =>
      [...$experience(e).find("li.pvs-list__paged-list-item")].map(e =>
        [...$experience(e).find("span.visually-hidden")].map(e => $experience(e).text())
      )
    );

    console.log("Experience data extracted:", JSON.stringify(experienceResult, null, 2));

    // Return all collected data
    const finalData = {
      general: extractedGeneral,
      education: educationResult,
      experience: experienceResult,
      rawContent: {
        main: mainPageContent,
        education: educationPageContent,
        experience: experiencePageContent
      }
    };

    console.log('✅ All LinkedIn data extraction completed');
    return finalData;

  } catch (error) {
    console.error('❌ LinkedIn data extraction failed:', error.message);
    throw error;
  } finally {
    // Clean up page
    if (page && !page.isClosed()) {
      await page.close();
      console.log('Page closed');
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('linkedInUser');

  try {
    console.log(`Starting LinkedIn data extraction for: ${username}`);

    // Get all the LinkedIn data
    const linkedinData = await getLinkedInData(username);

    console.log('✅ LinkedIn data extraction completed successfully');

    return Response.json({
      user: username,
      data: linkedinData,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API Error:', error);

    return Response.json({
      user: username,
      error: `${username} not found. Tip: Double check the spelling. Error: ${error.message}`,
    }, { status: 400 });
  }
}

