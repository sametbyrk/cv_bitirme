
import { ApifyClient } from 'apify-client';

export async function scrapeJobDescription(url: string) {
    if (!process.env.APIFY_API_TOKEN) {
        throw new Error("APIFY_API_TOKEN is not configured");
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_TOKEN,
    });

    // Using a generic web scraper or a specific LinkedIn scraper Actor.
    // NOTE: LinkedIn scrapers usually require cookies or are paid actors.
    // For this implementation, we will assume a generic page scraper or a specific actor ID 
    // that the user will provide/enable in their Apify dashboard.
    // Here we use a popular LinkedIn job scraper actor ID (placeholder).
    // You might need to change this Actor ID based on which one you use.
    // Example: 'hMvNSpz3JloGh5gRI' is a LinkedIn Jobs Scraper.

    // For safety and to avoid blocking, user acts as a wrapper around the client.
    try {
        const run = await client.actor("hMvNSpz3JloGh5gRI").call({
            startUrls: [{ url: url }],
            limit: 1, // Only need 1 job
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            const jobData = items[0] as any;
            // Return relevant fields
            return {
                title: jobData.title || "Job Title",
                description: jobData.description || jobData.text || "No description found",
                company: jobData.companyName || "Company"
            };
        }
        return null;
    } catch (error) {
        console.error("Apify scraping failed:", error);
        throw new Error("Failed to scrape job description. Ensure the link is valid and public.");
    }
}
