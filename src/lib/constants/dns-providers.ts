import type { DnsProvider } from '@/types/dns';

// DNS Provider documentation links
export const DNS_PROVIDERS: DnsProvider[] = [
    {
        name: 'Cloudflare',
        slug: 'cloudflare',
        docsUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
    },
    {
        name: 'GoDaddy',
        slug: 'godaddy',
        docsUrl: 'https://www.godaddy.com/help/add-a-txt-record-19232',
    },
    {
        name: 'OVH',
        slug: 'ovh',
        docsUrl: 'https://docs.ovh.com/fr/domains/editer-ma-zone-dns/',
    },
    {
        name: 'Namecheap',
        slug: 'namecheap',
        docsUrl: 'https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkim-records-to-my-domain/',
    },
    {
        name: 'AWS Route53',
        slug: 'route53',
        docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html',
    },
    {
        name: 'Google Domains',
        slug: 'google-domains',
        docsUrl: 'https://support.google.com/domains/answer/3290350',
    },
];

// SPF Record for Google Workspace
export const SPF_RECORD = 'v=spf1 include:_spf.google.com ~all';

// DKIM - Default selector for Google
export const DKIM_SELECTOR_DEFAULT = 'google';

// DMARC minimum recommendation
export const getDmarcRecord = (domain: string): string =>
    `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`;

// Extract domain from email address
export const extractDomainFromEmail = (email: string): string | null => {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
};

// Personal Gmail domains that are auto-handled
export const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];
