// src/lib/seo.ts

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.excelsioriet.in';

export const DEFAULT_SEO = {
  siteName: 'Excelsior | The Literary Club of IET Lucknow',
  title: 'Excelsior | The Official Literary Club of IET Lucknow',
  titleTemplate: '%s | Excelsior - IET Lucknow',
  description:
    'Excelsior is the official literary, debating, and creative society of the Institute of Engineering and Technology (IET), Lucknow. Established in 2014, showcasing original poetry, articles, book reviews, campus journalism, and literary events.',
  keywords: [
    'Excelsior',
    'Excelsior IET',
    'Excelsior IET Lucknow',
    'Excelsior Literary Club',
    'Excelsior Literary Society',
    'IET Lucknow Club',
    'IET Lucknow Society',
    'IET Lucknow Literary Club',
    'Literary Society IET Lucknow',
    'Institute of Engineering and Technology Lucknow',
    'IET Lucknow',
    'College Literary Club',
    'Lucknow Literary Society',
    'Campus Journalism Lucknow',
    'Student Publications',
    'Poetry',
    'Creative Writing',
    'College Debating Society',
    'Literary Events IET Lucknow',
    'Professo',
    'Ink Blot',
    'IET Hub Excelsior',
    'Excelsior Auditions',
  ],
  author: 'Excelsior Literary Society, IET Lucknow',
  publisher: 'Institute of Engineering and Technology, Lucknow',
  foundingDate: '2014-08-27',
  social: {
    instagram: 'https://www.instagram.com/iet.excelsior/',
    linkedin: 'https://www.linkedin.com/company/excelsior-iet-lucknow/',
    facebook: 'https://www.facebook.com/excelsior.iet/',
    iethub: 'https://iethub.org/clubs/10',
    email: 'excelsior@ietlucknow.ac.in',
    collegeUrl: 'https://ietlucknow.ac.in',
    phone: '+919336025201',
  },
};

export function getAbsoluteUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Excelsior - The Literary Club of IET Lucknow',
    alternateName: [
      'Excelsior',
      'Excelsior IET',
      'Excelsior IET Lucknow',
      'Excelsior Literary Society',
      'The Literary Club of IET Lucknow',
      'IET Lucknow Literary Club',
    ],
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description:
      'Excelsior is the official literary, debating, and creative society of the Institute of Engineering and Technology (IET), Lucknow. Established on August 27, 2014, conducting annual Professo and Ink Blot auditions, open mics, debates, and bilingual literary publications.',
    foundingDate: '2014-08-27',
    knowsLanguage: ['en', 'hi'],
    knowsAbout: [
      'Creative Writing',
      'Debating',
      'Poetry',
      'Elocution',
      'Quizzing',
      'Policy Drafting',
      'Campus Journalism',
      'Bilingual Literature',
      'Professo',
      'Ink Blot',
    ],
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Institute of Engineering and Technology, Lucknow',
      alternateName: 'IET Lucknow',
      url: 'https://ietlucknow.ac.in',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Sitapur Road',
        addressLocality: 'Lucknow',
        addressRegion: 'Uttar Pradesh',
        postalCode: '226021',
        addressCountry: 'IN',
      },
    },
    sameAs: [
      DEFAULT_SEO.social.instagram,
      DEFAULT_SEO.social.linkedin,
      DEFAULT_SEO.social.facebook,
      DEFAULT_SEO.social.iethub,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: DEFAULT_SEO.social.email,
      telephone: DEFAULT_SEO.social.phone,
      contactType: 'editorial',
    },
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Excelsior | The Literary Club of IET Lucknow',
    alternateName: 'Excelsior IET Lucknow',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateArticleSchema({
  title,
  description,
  slug,
  coverImage,
  authorName,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  slug: string;
  coverImage?: string | null;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/publications/${slug}`,
    },
    headline: title,
    description: description,
    image: coverImage ? [coverImage] : [`${SITE_URL}/favicon.ico`],
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || datePublished || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: authorName || 'Excelsior Contributor',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'Excelsior - The Literary Club of IET Lucknow',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.ico`,
      },
    },
  };
}

export function generateEventSchema({
  title,
  description,
  slug,
  date,
  venue,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  date: string | Date;
  venue: string;
  image?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${title} | Excelsior IET Lucknow`,
    description,
    startDate: new Date(date).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue || 'IET Lucknow Campus',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Institute of Engineering and Technology, Sitapur Road',
        addressLocality: 'Lucknow',
        addressRegion: 'Uttar Pradesh',
        postalCode: '226021',
        addressCountry: 'IN',
      },
    },
    image: image ? [image] : undefined,
    organizer: {
      '@type': 'EducationalOrganization',
      name: 'Excelsior - The Literary Club of IET Lucknow',
      url: SITE_URL,
    },
  };
}

export function generateFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Excelsior at IET Lucknow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excelsior is the official literary, debating, and creative society of the Institute of Engineering and Technology (IET), Lucknow, established on August 27, 2014. It provides a platform for engineering students to cultivate creative writing, poetry, elocution, campus journalism, and debating in both English and Hindi.',
        },
      },
      {
        '@type': 'Question',
        name: 'When was Excelsior founded?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excelsior was founded on August 27, 2014, at the Institute of Engineering and Technology, Sitapur Road, Lucknow.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the annual traditions and auditions of Excelsior?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excelsior conducts annual auditions featuring Professo (spontaneous speech and mentor discussion) and Ink Blot (original creative write-up and essay evaluation), welcoming writers, debaters, and graphic designers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What works does Excelsior publish?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Excelsior has published over 150 student works spanning articles, personal essays, poetry, book reviews on the Editor’s Shelf, and campus journalism pieces.',
        },
      },
    ],
  };
}

