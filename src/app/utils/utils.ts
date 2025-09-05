import {Page} from 'puppeteer';

export const linkedInCheckIfProfileWasFound = (page: Page): boolean => {
  const currentUrl = page.url();
   console.log("inside linkedInCheckIfProfileWasFound")
  // Check if behind a checkpoint or authwall
  if (currentUrl.includes('https://www.linkedin.com/404/')) {
    console.log("inside currentUrlIncludes for 404")
    throw new Error('LinkedIn Profile Not Found');
  }

  return true;
};

export const linkedInAuthOrChallengeUrlCheck = (page: Page): boolean => {
  const currentUrl = page.url();
  
  // Check if behind a checkpoint or authwall
  if (currentUrl.includes('https://www.linkedin.com/authwall')) {
    throw new Error('LinkedIn authentication required: redirected to authwall');
  } 
  else if (currentUrl.includes('https://www.linkedin.com/checkpoint/challenge')) {
    throw new Error('LinkedIn security challenge detected: manual intervention required');
  }

  return true;
};