"use client";

import { LinkedInInputAutoDownload } from "./components/linked-in-resume-input";

export default function Home() {

  return (

    <div className="font-sans min-h-screen flex items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center text-center max-w-md w-full">
        <div className="flex gap-4 items-center flex-col">
          <h1 className="text-2xl font-bold">LinkedIn Resume Generator</h1>
          <p className="text-gray-600">Type the LinkedIn profile Id you want to create a resume for</p>
          <LinkedInInputAutoDownload />
        </div>
      </main>
    </div>
  );
}

