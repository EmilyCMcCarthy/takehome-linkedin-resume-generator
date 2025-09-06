'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { ProfileDataRes } from "../utils/types";
import { PDFDocLinkedIn } from '@/app/components/pdf-resume-linkedin';
import { PDFDownloadLink } from '@react-pdf/renderer';

export const LinkedInInputAutoDownload = () => {
    const [inputValue, setInputValue] = useState("");
    const [profileDataRes, setProfileDataRes] = useState<ProfileDataRes | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'ready' | 'downloading' | 'complete'>('idle');
    const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputValue.trim()) {
            setError("Please enter a LinkedIn username");
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        setProfileDataRes(null);
        setDownloadStatus('idle');

        try {
            const encodedUser = encodeURIComponent(inputValue.trim());
            const response = await fetch(`/api/linkedin-profiles?linkedInUser=${encodedUser}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;

                try {
                    const errorData = await response.json();
                    if (errorData?.error) {
                        errorMessage += ` - ${errorData.error.message}`;
                    }
                } catch {
                    // JSON parsing failed, use default message
                }

                throw new Error(errorMessage);
            }

            const userData: ProfileDataRes = await response.json();
            setProfileDataRes(userData);
            setDownloadStatus('ready');

        } catch (err) {
            console.error("Error fetching LinkedIn data:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch LinkedIn data");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-download effect
    useEffect(() => {
        if (profileDataRes && downloadStatus === 'ready' && downloadLinkRef.current) {
            setDownloadStatus('downloading');
            setTimeout(() => {
                downloadLinkRef.current?.click();
                setDownloadStatus('complete');
            }, 500); // delay to ensure PDF generation
        }
    }, [profileDataRes, downloadStatus]);

    return (
        <div className="max-w-md mx-auto p-4">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleChange}
                            placeholder="Enter the LinkedIn user Id you want"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                            PDF will download automatically after data loads
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading LinkedIn Data...
                            </span>
                        ) : (
                            'Generate & Download PDF Resume'
                        )}
                    </button>

                    {/* Status Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {downloadStatus === 'ready' && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                            <p className="text-sm">📄 Generating PDF...</p>
                        </div>
                    )}

                    {downloadStatus === 'downloading' && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                            <p className="text-sm">⬇️ Starting download...</p>
                        </div>
                    )}

                    {downloadStatus === 'complete' && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            <p className="text-sm">✅ PDF downloaded successfully for {profileDataRes?.user}!</p>
                        </div>
                    )}

                    {/* Hidden PDF Download Link - Auto-triggered */}
                    {profileDataRes && (
                        <PDFDownloadLink
                            document={<PDFDocLinkedIn profileData={profileDataRes.data} />}
                            fileName={`${profileDataRes.user}_resume.pdf`}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ref={downloadLinkRef as React.Ref<any>}  
                            style={{ display: 'none' }}
                        >
                            {({ blob, url, loading, error }) => ''}
                        </PDFDownloadLink>
                    )}

                    {/* Manual download backup (if auto-download fails) */}
                    {downloadStatus === 'complete' && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600 mb-2">
                                Didn&apos;t download automatically? Click below:
                            </p>
                            <PDFDownloadLink
                                document={<PDFDocLinkedIn profileData={profileDataRes!.data} />}
                                fileName={`${profileDataRes!.user}_resume.pdf`}
                                className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                            >
                                {({ blob, url, loading, error }) =>
                                    loading ? 'Generating PDF...' : 'Download PDF Resume'
                                }
                            </PDFDownloadLink>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};
