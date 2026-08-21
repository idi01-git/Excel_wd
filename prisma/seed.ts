// prisma/seed.ts
import {
  PrismaClient,
  Role,
  VerificationStatus,
  MemberSection,
  PublicationCategory,
  PublicationStatus,
  GalleryItemType,
  AchievementCategory,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { LIBRARY_BOOKS } from './books-data';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Test@1234', 10);

  console.log('Seeding staff and club members with new RBAC roles...');

  // 1. Coordinator (God-mode lead)
  const coordinator = await prisma.user.upsert({
    where: { username: 'coordinator' },
    update: {
      role: Role.COORDINATOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.COORDINATORS,
      memberTitle: 'Student Coordinator & Editor-in-Chief',
    },
    create: {
      username: 'coordinator',
      name: 'Sarah Coordinator',
      email: 'coordinator@excelsior',
      passwordHash,
      role: Role.COORDINATOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.COORDINATORS,
      memberTitle: 'Student Coordinator & Editor-in-Chief',
      branch: 'CSE',
      batch: '2022-2026',
      bio: 'Student Coordinator & Editor-in-Chief. Managing editorial vision, publication archives, and role allocations.',
      profilePhoto:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop',
    },
  });

  // 2. Tech Lead
  const techlead = await prisma.user.upsert({
    where: { username: 'techlead' },
    update: {
      role: Role.TECH_LEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.COORDINATORS,
      memberTitle: 'Technical & Platform Lead',
    },
    create: {
      username: 'techlead',
      name: 'Alex Tech Lead',
      email: 'techlead@excelsior',
      passwordHash,
      role: Role.TECH_LEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.COORDINATORS,
      memberTitle: 'Technical & Platform Lead',
      branch: 'CSE',
      batch: '2023-2027',
      bio: 'Technical & Web Architecture Lead. Directing digital platforms, 3D experiences, and infrastructure.',
      profilePhoto:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop',
    },
  });

  // 3. PR Head
  const prHead = await prisma.user.upsert({
    where: { username: 'pr_head' },
    update: {
      role: Role.PR_HEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Public Relations & Outreach Head',
    },
    create: {
      username: 'pr_head',
      name: 'Priya PR Head',
      email: 'pr@excelsior',
      passwordHash,
      role: Role.PR_HEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Public Relations & Outreach Head',
      branch: 'IT',
      batch: '2023-2027',
      bio: 'Public Relations & Outreach Lead. Curating alumni relations, gallery showcases, and press coverage.',
      profilePhoto:
        'https://images.unsplash.com/photo-1534751516642-a131ffd107fd?w=500&h=500&fit=crop',
    },
  });

  // 4. Operations Head
  const opsHead = await prisma.user.upsert({
    where: { username: 'ops_head' },
    update: {
      role: Role.OPERATIONS_HEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Operations & Logistics Head',
    },
    create: {
      username: 'ops_head',
      name: 'Rohan Operations',
      email: 'ops@excelsior',
      passwordHash,
      role: Role.OPERATIONS_HEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Operations & Logistics Head',
      branch: 'ME',
      batch: '2023-2027',
      bio: 'Operations & Logistics Lead. Overseeing campus events, venue setups, and book loans.',
      profilePhoto:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
    },
  });

  // 5. Treasurer
  const treasurer = await prisma.user.upsert({
    where: { username: 'treasurer' },
    update: {
      role: Role.TREASURER,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Treasurer & Finance Head',
    },
    create: {
      username: 'treasurer',
      name: 'Fatima Treasurer',
      email: 'treasurer@excelsior',
      passwordHash,
      role: Role.TREASURER,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.CORE,
      memberTitle: 'Treasurer & Finance Head',
      branch: 'CE',
      batch: '2023-2027',
      bio: 'Treasurer & Finance Lead. Managing event fees, sponsorships, and payment verifications.',
      profilePhoto:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop',
    },
  });

  // 6. Member
  const member = await prisma.user.upsert({
    where: { username: 'member' },
    update: {
      role: Role.MEMBER,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.TEAM,
      memberTitle: 'Senior Staff Writer',
    },
    create: {
      username: 'member',
      name: 'Jane Member',
      email: 'member@excelsior',
      passwordHash,
      role: Role.MEMBER,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      memberSection: MemberSection.TEAM,
      memberTitle: 'Senior Staff Writer',
      branch: 'ECE',
      batch: '2024-2028',
      bio: 'Senior Staff Writer & Anthology Contributor. Fiction, postmodern poetry, and literary essays.',
      profilePhoto:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop',
    },
  });

  // 7. Alumni User
  await prisma.user.upsert({
    where: { username: 'alumni_user' },
    update: {
      role: Role.ALUMNI,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
    },
    create: {
      username: 'alumni_user',
      name: 'David Alumni',
      email: 'alumni@excelsior',
      passwordHash,
      role: Role.ALUMNI,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      branch: 'EE',
      batch: '2016-2020',
      bio: 'Excelsior Alumnus · Class of 2020. Senior Editor at Penguin Random House.',
      profilePhoto:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
    },
  });

  // 8. Visitor
  await prisma.user.upsert({
    where: { username: 'visitor' },
    update: {
      role: Role.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
    },
    create: {
      username: 'visitor',
      name: 'Guest Visitor',
      email: 'visitor@excelsior',
      passwordHash,
      role: Role.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      bio: 'Passionate reader and literature enthusiast visiting Excelsior.',
    },
  });

  console.log('Seeded all staff roles & users successfully.');

  // 2. Seed 3D Editor's Shelf items with rich styling
  const shelfItems = [
    {
      title: 'निर्मला',
      author: 'मुंशी प्रेमचंद',
      slug: 'nirmala',
      coverImage: '/images/image.png',
      genre: ['Classic Literature', 'Hindi Novel', 'Social Realism'],
      spineColor: '#182b5e',
      spineTextColor: '#f3ecd8',
      coverColor: '#1c3370',
      coverTextColor: '#f3ecd8',
      motif: 'lattice',
      foilColor: '#e7b55f',
      width: 1.95,
      height: 3.05,
      spineThickness: 0.38,
      synopsis:
        'मुंशी प्रेमचंद का एक कालजयी सामाजिक उपन्यास। 1920 के दशक के भारत में बेमेल विवाह, दहेज प्रथा और नारी के आत्मसम्मान का मार्मिक चित्रण।',
      excerpt: 'जब मनुष्य पर विपत्ति आती है, तो उसकी बुद्धि भी भ्रष्ट हो जाती है।',
      editorialNote: JSON.stringify({
        editorialText: 'मुंशी प्रेमचंद का एक कालजयी सामाजिक उपन्यास। 1920 के दशक के भारत में बेमेल विवाह, दहेज प्रथा और नारी के आत्मसम्मान का मार्मिक चित्रण।',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'hi',
        retailers: [
          { name: 'Amazon', price: '₹199', url: 'https://www.amazon.in' },
          { name: 'Bookshop', price: '₹240', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.in',
      displayOrder: 10,
    },
    {
      title: 'गुनाहों का देवता',
      author: 'धर्मवीर भारती',
      slug: 'gunaho-ka-devta',
      coverImage: '/images/gunaho%20ka%20devta.png',
      genre: ['Classic Literature', 'Hindi Romance', 'Drama'],
      spineColor: '#ece0ca',
      spineTextColor: '#8b1e1a',
      coverColor: '#f3ebe0',
      coverTextColor: '#8b1e1a',
      motif: 'continuum',
      foilColor: '#8b1e1a',
      width: 2.0,
      height: 3.15,
      spineThickness: 0.42,
      synopsis:
        'धर्मवीर भारती का कालजयी और भावुक उपन्यास। चंदर और सुधा के अनूठे, पवित्र और आत्मबलिदान से भरे प्रेम की अमर गाथा।',
      excerpt: 'किसी से ज़िन्दगी भर स्नेह रखने, प्रेम करने का गुनाह... स्नेह और प्रेम जब अपनी पराकाष्ठा पर पहुँचने लगे तो उसका त्याग करने का गुनाह...',
      editorialNote: JSON.stringify({
        editorialText: 'धर्मवीर भारती का कालजयी और भावुक उपन्यास। चंदर और सुधा के अनूठे, पवित्र और आत्मबलिदान से भरे प्रेम की अमर गाथा।',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'hi',
        retailers: [
          { name: 'Amazon', price: '₹225', url: 'https://www.amazon.in' },
          { name: 'Bookshop', price: '₹260', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.in',
      displayOrder: 20,
    },
    {
      title: 'Good to Great',
      author: 'Jim Collins',
      slug: 'good-to-great',
      genre: ['Strategy', 'Leadership', 'Business'],
      spineColor: '#6d1f1f',
      spineTextColor: '#f3ecd8',
      coverColor: '#571616',
      coverTextColor: '#f3ecd8',
      motif: 'continuum',
      foilColor: '#c8a44a',
      width: 2.05,
      height: 3.20,
      spineThickness: 0.46,
      synopsis:
        "Why some companies make the leap and others don't. A five-year study of 1,435 firms identifies the disciplines — Level 5 leaders, the hedgehog concept, the flywheel — that turn good companies into enduring great ones.",
      excerpt: 'Good is the enemy of great.',
      editorialNote: JSON.stringify({
        editorialText: "Why some companies make the leap and others don't. A five-year study of 1,435 firms identifies the disciplines that turn good companies into enduring great ones.",
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$19.99', url: 'https://www.amazon.com/dp/0066620996' },
          { name: 'Barnes & Noble', price: '$21.99', url: 'https://www.barnesandnoble.com' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0066620996',
      displayOrder: 30,
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      slug: 'atomic-habits',
      genre: ['Psychology', 'Self Improvement', 'Productivity'],
      spineColor: '#b8932a',
      spineTextColor: '#1a1a1a',
      coverColor: '#222018',
      coverTextColor: '#e8d27a',
      motif: 'steps',
      foilColor: '#e8d27a',
      width: 2.0,
      height: 3.0,
      spineThickness: 0.40,
      synopsis:
        "Tiny changes, remarkable results. A practical, evidence-based framework for compounding small habits into outsized outcomes — built around four laws that shape every behaviour you'll ever form.",
      excerpt: 'You do not rise to the level of your goals. You fall to the level of your systems.',
      editorialNote: JSON.stringify({
        editorialText: "Tiny changes, remarkable results. A practical, evidence-based framework for compounding small habits into outsized outcomes.",
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$14.99', url: 'https://www.amazon.com/dp/0735211299' },
          { name: 'Bookshop', price: '$16.19', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0735211299',
      displayOrder: 40,
    },
    {
      title: 'Shoe Dog',
      author: 'Phil Knight',
      slug: 'shoe-dog',
      genre: ['Memoir', 'Biography', 'Entrepreneurship'],
      spineColor: '#a8501f',
      spineTextColor: '#f3ecd8',
      coverColor: '#8f3e12',
      coverTextColor: '#f3ecd8',
      motif: 'runner',
      foilColor: '#f4a261',
      width: 1.95,
      height: 3.0,
      spineThickness: 0.38,
      synopsis:
        "A memoir by the creator of Nike. From a $50 loan from his father to one of the world's most iconic brands, detailing the messy, honest struggle behind extraordinary ambition.",
      excerpt: "Don't tell people how to do things, tell them what to do and let them surprise you with their results.",
      editorialNote: JSON.stringify({
        editorialText: "A memoir by the creator of Nike. From a $50 loan from his father to one of the world's most iconic brands.",
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$16.50', url: 'https://www.amazon.com/dp/1501135929' },
          { name: 'Bookshop', price: '$17.99', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/1501135929',
      displayOrder: 50,
    },
    {
      title: 'The Hard Thing About Hard Things',
      author: 'Ben Horowitz',
      slug: 'hard-thing',
      genre: ['Leadership', 'Management', 'Startups'],
      spineColor: '#1a1a1a',
      spineTextColor: '#cf9b3a',
      coverColor: '#151515',
      coverTextColor: '#cf9b3a',
      motif: 'fracture',
      foilColor: '#d4af37',
      width: 2.0,
      height: 3.10,
      spineThickness: 0.42,
      synopsis:
        'Building a business when there are no easy answers. Ben Horowitz on layoffs, demotions, betrayals, and the crushing weight of decisions no MBA prepares you for.',
      excerpt: 'There is no recipe for the hard things. There is no recipe for really complex, dynamic situations.',
      editorialNote: JSON.stringify({
        editorialText: 'Building a business when there are no easy answers. Ben Horowitz on layoffs, demotions, and the crushing weight of decisions.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$18.99', url: 'https://www.amazon.com/dp/0062273205' },
          { name: 'Barnes & Noble', price: '$20.00', url: 'https://www.barnesandnoble.com' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0062273205',
      displayOrder: 60,
    },
    {
      title: 'The 4-Hour Workweek',
      author: 'Tim Ferriss',
      slug: 'four-hour-week',
      genre: ['Productivity', 'Lifestyle', 'Business'],
      spineColor: '#b8932a',
      spineTextColor: '#1a1a1a',
      coverColor: '#1f1d19',
      coverTextColor: '#f3ecd8',
      motif: 'wave',
      foilColor: '#d4af37',
      width: 2.0,
      height: 3.05,
      spineThickness: 0.44,
      synopsis:
        'Escape 9–5, live anywhere, and join the new rich. Tim Ferriss’s manifesto for trading time-for-money for systems-for-freedom and lifestyle design.',
      excerpt: 'What we fear doing most is usually what we most need to do.',
      editorialNote: JSON.stringify({
        editorialText: 'Escape 9–5, live anywhere, and join the new rich. Tim Ferriss’s manifesto for trading time-for-money for systems-for-freedom.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$15.49', url: 'https://www.amazon.com/dp/0307465357' },
          { name: 'Bookshop', price: '$16.50', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0307465357',
      displayOrder: 70,
    },
    {
      title: 'Principles',
      author: 'Ray Dalio',
      slug: 'principles',
      genre: ['Philosophy', 'Management', 'Economics'],
      spineColor: '#1c2a44',
      spineTextColor: '#f3ecd8',
      coverColor: '#131d2e',
      coverTextColor: '#f3ecd8',
      motif: 'schematic',
      foilColor: '#c5a059',
      width: 2.05,
      height: 3.30,
      spineThickness: 0.58,
      synopsis:
        'Life and work principles from the founder of Bridgewater. Radical transparency, idea meritocracy, and an algorithmic approach to decision-making.',
      excerpt: 'Pain plus reflection equals progress.',
      editorialNote: JSON.stringify({
        editorialText: 'Life and work principles from the founder of Bridgewater. Radical transparency, idea meritocracy, and an algorithmic approach.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$21.99', url: 'https://www.amazon.com/dp/1501124021' },
          { name: 'Bookshop', price: '$23.50', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/1501124021',
      displayOrder: 80,
    },
    {
      title: 'Rework',
      author: 'Jason Fried',
      slug: 'rework',
      genre: ['Business', 'Productivity', 'Culture'],
      spineColor: '#333333',
      spineTextColor: '#f3ecd8',
      coverColor: '#222222',
      coverTextColor: '#f3ecd8',
      motif: 'windows',
      foilColor: '#cccccc',
      width: 1.85,
      height: 2.85,
      spineThickness: 0.30,
      synopsis:
        'Change the way you work forever. Short, blunt essays on the nonsense of business orthodoxy — from planning fallacy to unnecessary meetings.',
      excerpt: 'Planning is guessing. Workaholism is stupid. Meetings are toxic.',
      editorialNote: JSON.stringify({
        editorialText: 'Change the way you work forever. Short, blunt essays on the nonsense of business orthodoxy.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$14.29', url: 'https://www.amazon.com/dp/0307463745' },
          { name: 'Bookshop', price: '$15.00', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0307463745',
      displayOrder: 90,
    },
    {
      title: 'The Innovator’s Dilemma',
      author: 'Clayton Christensen',
      slug: 'innovators-dilemma',
      genre: ['Technology', 'Strategy', 'Innovation'],
      spineColor: '#3f444a',
      spineTextColor: '#f3ecd8',
      coverColor: '#2c3035',
      coverTextColor: '#f3ecd8',
      motif: 'circuit',
      foilColor: '#9ec1cf',
      width: 1.95,
      height: 3.10,
      spineThickness: 0.40,
      synopsis:
        'When new technologies cause great firms to fail. The seminal theory of disruptive innovation that explains how market leaders are toppled.',
      excerpt: 'The very decision-making and resource-allocation processes that are key to the success of established companies are the very processes that reject disruptive technologies.',
      editorialNote: JSON.stringify({
        editorialText: 'When new technologies cause great firms to fail. The seminal theory of disruptive innovation.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$17.99', url: 'https://www.amazon.com/dp/1633691780' },
          { name: 'Bookshop', price: '$18.50', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/1633691780',
      displayOrder: 100,
    },
    {
      title: 'Start with Why',
      author: 'Simon Sinek',
      slug: 'start-with-why',
      genre: ['Leadership', 'Marketing', 'Inspiration'],
      spineColor: '#7a3a2a',
      spineTextColor: '#f3ecd8',
      coverColor: '#59281c',
      coverTextColor: '#f3ecd8',
      motif: 'lattice',
      foilColor: '#e7b55f',
      width: 1.95,
      height: 3.0,
      spineThickness: 0.36,
      synopsis:
        'How great leaders inspire everyone to take action. The Golden Circle framework — start with why, then how, then what — that drives movements.',
      excerpt: 'People don’t buy what you do; they buy why you do it.',
      editorialNote: JSON.stringify({
        editorialText: 'How great leaders inspire everyone to take action. The Golden Circle framework that drives movements.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$15.20', url: 'https://www.amazon.com/dp/1591846447' },
          { name: 'Bookshop', price: '$16.00', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/1591846447',
      displayOrder: 110,
    },
    {
      title: 'Built to Last',
      author: 'Jim Collins',
      slug: 'built-to-last',
      genre: ['Business', 'Management', 'Strategy'],
      spineColor: '#3a1818',
      spineTextColor: '#cf9b3a',
      coverColor: '#2a1010',
      coverTextColor: '#cf9b3a',
      motif: 'branches',
      foilColor: '#cf9b3a',
      width: 2.0,
      height: 3.15,
      spineThickness: 0.48,
      synopsis:
        'Successful habits of visionary companies. What makes an enterprise endure and thrive across generations, beating rivals by 15-to-1.',
      excerpt: 'Preserve the core, stimulate progress.',
      editorialNote: JSON.stringify({
        editorialText: 'Successful habits of visionary companies. What makes an enterprise endure and thrive across generations.',
        categoryBadge: 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: 'en',
        retailers: [
          { name: 'Amazon', price: '$19.50', url: 'https://www.amazon.com/dp/0060516402' },
          { name: 'Bookshop', price: '$20.50', url: 'https://bookshop.org' },
        ],
      }),
      readLink: 'https://www.amazon.com/dp/0060516402',
      displayOrder: 120,
    },
  ];

  for (const item of shelfItems) {
    await prisma.editorShelfItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }
  console.log('Seeded all 12 rich 3D Editor’s Shelf items.');

  // 3. Seed Publications
  await prisma.publication.upsert({
    where: { slug: 'silent-architecture-of-memory' },
    update: {},
    create: {
      title: 'The Silent Architecture of Memory',
      slug: 'silent-architecture-of-memory',
      category: PublicationCategory.ARTICLE,
      status: PublicationStatus.PUBLISHED,
      authorId: coordinator.id,
      readingTime: 6,
      tags: ['Memory', 'Philosophy', 'Essays'],
      coverImage:
        'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=450&fit=crop',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Memory is not an archive; it is a fluid architecture that gets rebuilt every time we enter its rooms. In this essay, we explore how our personal history is shaped not by what actually happened, but by the narratives we construct in retrospect.',
              },
            ],
          },
        ],
      },
      publishedAt: new Date(),
    },
  });

  // 4. Seed Gallery with isFeaturedOnHome
  await prisma.galleryItem.deleteMany();
  await prisma.galleryItem.createMany({
    data: [
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
        caption: 'Excelsior Poetry Slam Night 2025',
        isFeaturedOnHome: true,
        uploadedById: coordinator.id,
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
        caption: 'Alumni Panels & Creative Writing Workshops',
        isFeaturedOnHome: true,
        uploadedById: techlead.id,
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        caption: 'Editorial Board Planning the Annual Anthology',
        isFeaturedOnHome: true,
        uploadedById: prHead.id,
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
        caption: 'Letterpress Typography Workshop',
        isFeaturedOnHome: true,
        uploadedById: coordinator.id,
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
        caption: 'Midnight Soliloquy Chamber',
        isFeaturedOnHome: true,
        uploadedById: prHead.id,
      },
    ],
  });
  console.log('Seeded Gallery Items with Homepage Featured flags.');

  // 5. Seed Achievements
  await prisma.achievement.deleteMany();
  await prisma.achievement.createMany({
    data: [
      {
        title: 'Best College Magazine Award',
        description:
          'Awarded 1st place in the National Campus Press Awards for our annual anthology, "Metaphor".',
        category: AchievementCategory.AWARD,
        date: new Date('2025-11-15'),
        image:
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=1000&fit=crop',
      },
      {
        title: 'Decennial Anniversary Celebration',
        description:
          'Celebrated 10 years of preserving stories, Slam Poetry, and building community on campus.',
        category: AchievementCategory.MILESTONE,
        date: new Date('2025-09-10'),
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=1000&fit=crop',
      },
      {
        title: 'Inter-University Poetry Slam Champion',
        description:
          'Member Jane Member won 1st place at the National Verse Slam Tournament.',
        category: AchievementCategory.COMPETITION,
        date: new Date('2026-02-20'),
        image:
          'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1600&h=1000&fit=crop',
      },
    ],
  });
  console.log('Seeded Achievements.');

  // 6. Seed Events
  await prisma.eventWinner.deleteMany();
  await prisma.eventGalleryItem.deleteMany();
  await prisma.eventReport.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();

  await prisma.event.create({
    data: {
      title: 'Excelsior Poetry Slam 2026',
      slug: 'excelsior-poetry-slam-2026',
      description:
        'Prepare your verses and sharpen your cadence! The annual Excelsior Poetry Slam tournament returns to the Main Auditorium for an evening of spoken word, raw emotion, and rhythm.',
      posterImage:
        'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&h=800&fit=crop',
      coverImage:
        'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1600&h=900&fit=crop',
      date: new Date('2026-08-15T15:00:00.000Z'),
      time: '3:00 PM - 6:00 PM',
      venue: 'Main Auditorium, Campus Hub',
      status: 'UPCOMING',
      isCompetition: true,
      maxCapacity: 100,
      rulebookUrl: 'https://excelsior.club/docs/poetry-slam-2026-rules.pdf',
      socialLink: 'https://instagram.com/excelsior_club',
      customFormFields: {
        access: 'ALL STUDENTS & MEMBERS',
        inclusions: 'PRIZE POOL & PASS',
        standardFields: {
          nameRequired: true,
          nameLabel: 'Full Name',
          namePlaceholder: 'e.g. Sarah Jenkins',
          emailRequired: true,
          emailLabel: 'Email Address',
          emailPlaceholder: 'e.g. sarah@example.com',
          phoneRequired: true,
          phoneLabel: 'WhatsApp / Phone Number',
          phonePlaceholder: '+91 98765 43210',
        },
        fields: [
          {
            id: 'genre',
            label: 'Performance Genre / Style',
            name: 'performance_genre',
            type: 'select',
            required: true,
            options: ['Spoken Word', 'Classical Meter', 'Bilingual / Hindi', 'Free Verse'],
          },
          {
            id: 'poem_title',
            label: 'Working Title of First Round Piece',
            name: 'poem_title',
            type: 'text',
            required: true,
          },
          {
            id: 'bio_note',
            label: 'Stage Introduction (2-3 sentences)',
            name: 'stage_introduction',
            type: 'textarea',
            required: false,
          },
        ],
      },
      requirePayment: false,
    },
  });

  // Seed Paid Event & Student Registrations for Treasurer Testing
  const student1 = await prisma.user.upsert({
    where: { username: 'rahul_student' },
    update: {},
    create: {
      username: 'rahul_student',
      name: 'Rahul Kumar',
      email: 'rahul@excelsior.edu',
      passwordHash,
      role: Role.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      bio: 'Loves classical poetry and short fiction.',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { username: 'priya_student' },
    update: {},
    create: {
      username: 'priya_student',
      name: 'Priya Sharma',
      email: 'priya@excelsior.edu',
      passwordHash,
      role: Role.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      bio: 'Enthusiastic reader and campus blogger.',
    },
  });

  const student3 = await prisma.user.upsert({
    where: { username: 'isha_student' },
    update: {},
    create: {
      username: 'isha_student',
      name: 'Isha Patel',
      email: 'isha@excelsior.edu',
      passwordHash,
      role: Role.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      bio: 'Dramatics society member and occasional poet.',
    },
  });

  const paidEvent = await prisma.event.upsert({
    where: { slug: 'creative-writers-retreat-2026' },
    update: {
      requirePayment: true,
      paymentAmount: '₹250',
      paymentQrImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&h=600&fit=crop',
      paymentInstructions: 'Scan this UPI QR code, pay ₹250, and upload your screenshot below with transaction ID.',
    },
    create: {
      title: 'Creative Writers Retreat 2026',
      slug: 'creative-writers-retreat-2026',
      description: 'Spend an immersive weekend in the hills with professional authors, workshops, and intensive peer feedback sessions.',
      venue: 'Naini Hills Campus Sanctuary',
      date: new Date('2026-08-28T09:00:00.000Z'),
      time: '09:00 AM – 05:00 PM',
      status: 'UPCOMING',
      isCompetition: false,
      maxCapacity: 30,
      requirePayment: true,
      paymentAmount: '₹250',
      paymentQrImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&h=600&fit=crop',
      paymentInstructions: 'Scan this UPI QR code, pay ₹250, and upload your screenshot below with transaction ID.',
    },
  });

  await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId: paidEvent.id,
        userId: student1.id,
      },
    },
    update: {
      paymentStatus: 'PENDING',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&h=800&fit=crop',
    },
    create: {
      eventId: paidEvent.id,
      userId: student1.id,
      name: student1.name,
      email: student1.email,
      phone: '+91 99887 76655',
      paymentStatus: 'PENDING',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&h=800&fit=crop',
    },
  });

  await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId: paidEvent.id,
        userId: student2.id,
      },
    },
    update: {
      paymentStatus: 'VERIFIED',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&h=800&fit=crop',
    },
    create: {
      eventId: paidEvent.id,
      userId: student2.id,
      name: student2.name,
      email: student2.email,
      phone: '+91 88776 65544',
      paymentStatus: 'VERIFIED',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&h=800&fit=crop',
    },
  });

  await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId: paidEvent.id,
        userId: student3.id,
      },
    },
    update: {
      paymentStatus: 'PENDING',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1616077168712-fc6c788bc4ee?w=500&h=800&fit=crop',
    },
    create: {
      eventId: paidEvent.id,
      userId: student3.id,
      name: student3.name,
      email: student3.email,
      phone: '+91 77665 54433',
      paymentStatus: 'PENDING',
      paymentScreenshotUrl: 'https://images.unsplash.com/photo-1616077168712-fc6c788bc4ee?w=500&h=800&fit=crop',
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
