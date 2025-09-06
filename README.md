## General Description

This is a project that was created as a take home assignment. It creates a pdf resume and downloads it for a given input of a linkedIn user name (for example: 'sramana' or 'brenebrown' or 'adammgrant'). It populates the profile photo if it is available and the name. And it also populates the education and experience sections. 

## Setting Up your local development build

First, create a .env.local file following the convention of .env.sample file to add your linkedIn credentials (or your company's or a temporarily made linkedIn). 

then install the dependencies:

```bash
npm install
```

then run the development server:

```bash
npm run dev
```

OR to run a build (instead of development server):

```bash
npm run build
```

```bash
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## What I did

I used a create next app to start with a boilerplate for this project.

I used @react-pdf to generate PDFs and download them

I used puppeteer to retrieve html from linked in profiles. I needed to log in using .env variables to pass their authwall

I used cheerio a little to extract information from the html retrieved from linkedin. 



## Things I Like about my work on this project

I liked using Promise.all with multiple wait conditions  

I liked using cheerio's extract method

I like that I went to the different pages of linked in for the content. Because somem users with a lot of education or experience aren't show on the main profile page.

I like that I try cleaning up the browser pages once I'm done with them. 

I like my user interface and error handling on the client components. When I was first testing this, I clicked a button to get the data and then had to click a button to download it. But then I managed to autodownload the file using a ref and added a backup button to click if the autodownload option didn't work. So that way the user only has to click a button once to get the PDF downloaded. 

I split concerns between data fetching/UX (LinkedInInputAutoDownload) and PDF rendering (PDFDocLinkedIn) for maintainability

Missing profile images, empty sections, and malformed data are all handled without breaking

## Thoughts / Things I'd do differently

I need more typesafety.

I need more testing of edge cases 

I think with more time I'd like to do the three linkedin page calls in parallel. Since linkedIn pages load somewhat slowly and there are only three pages we need for the 

I'd like to think longer about where to generate the PDF. (Right now I'm generating the pdf on the client after using a API request for the data needed for the PDF )

I'd ask more questions about the use case of this web app tool, and potentially / likely go a different direction than using linkedIn credentials in the .env variables

I'd dig in and do more testing about some of the timeouts in the GET request

LinkedIn is pretty quick to be suspicious of unusual activity and then it isn't possible to use the same credentials in this web app. 

As of now I only check that we haven't hit a paywall at the first linkedIn page. If we hit the authwall for some reason at the experience page or education page it would give an error about not being able to find '#profile-content' that makes debugging confusing.

I used to use wrap={false} for the sections and for individual items in the sections of the PDF , but I dropped that because on some long content profiles like sramana came out with text on a single page that was impossible to read. So I'd see if I could come up with an approach that would make it make more logical page breaks , but wouldn't stay on the same page for a long profile like that. 

I'd put some time into making sure to not have "remember me" clicked. Which would reduce the number of emails from linkedIn I got while testing my code .

I'd look at the 500 ms delay in the pdf generation 
