export interface Retailer {
  name: string; // e.g. "Amazon", "Barnes & Noble"
  price: string; // e.g. "$15.99"
  url: string; // external link OR # for internal-only CTA
}

export interface BookData {
  id: string; // stable React key; lower-kebab slug
  title: string;
  author: string;
  spineColor: string; // hex; visible spine on shelf
  spineTextColor: string; // hex; vertical title rendered on spine
  coverColor: string; // hex; procedural cover bg + back face
  coverTextColor: string; // hex; procedural cover title colour
  coverImage?: string; // optional CDN URL — overrides procedural
  motif?: string; // procedural foil motif (lattice, orbit, circuit, etc.)
  foilColor?: string; // metallic foil stamp color (gold, bronze, silver)
  synopsis: string; // 1–2 sentences for buy panel
  excerpt: string; // famous quote printed on inside page
  retailers: Retailer[]; // displayed in buy panel
  width: number; // world units; mix 1.85–2.05 for variety
  height: number; // world units; 2.85 (paperback) → 3.30 (oversized hardback)
  spineThickness: number; // world units; 0.30 (slim) → 0.58 (brick)
  categoryBadge?: string; // e.g. "READ OF THE WEEK · FEB 2025"
  leftPageHeader?: string; // e.g. "FROM THE SHELF OF EXCELSIOR"
  rightPageOrnament?: string; // e.g. "— § —"
  readButtonText?: string; // e.g. "READ PUBLICATION"
  readLink?: string; // direct publication or shop URL
  language?: 'en' | 'hi'; // language template
}

// ── Shelf Layout Constants ───────────────────────────────────────────────────
export const SHELF_PITCH = 0.82; // base spacing between spine-mode books
export const COVER_PADDING = 0.85; // extra width added to centred slot — pushes neighbours out
export const COVER_Z_LIFT = 0.18; // forward shift for centred (cover-forward) book
export const SHELF_Y = -3.1; // top of shelf in world Y (book bottoms rest here)

// ── Open / Close Target Constants ────────────────────────────────────────────
export const OPEN_POS_X = -1.25; // desktop: book sits left of centre, panel to its right
export const OPEN_POS_Y = -1.5; // book BOTTOM in world; centre = OPEN_POS_Y + book.height/2
export const OPEN_POS_Z = 2.4; // forward of shelf so the open book reads larger
export const OPEN_ANGLE = Math.PI * 0.8; // 144° front-cover swing (80% of fully flat)
export const OPEN_TILT_X = -0.26; // backward tilt (rad) of the open book

export const OPEN_DURATION = 1.75; // seconds for the open animation
export const CLOSE_DURATION = 1.3;

// ── Other-books Retreat During Open ──────────────────────────────────────────
export const FALL_DEPTH = 3.2; // world units other books recede into -Z
export const SHELF_OPEN_Z = 4.5; // shelf glides forward this far during open
export const SHELF_OPEN_Y = -5.5; // shelf drops this far (sinks below viewport)

// ── Slider Physics ───────────────────────────────────────────────────────────
export const SLIDER_APPROACH = 0.16; // pure exponential decay (no spring, no overshoot)

// ── Wheel / Drag / Interaction ───────────────────────────────────────────────
export const WHEEL_PX_PER_SLIDE = 240;
export const SETTLE_IDLE_MS = 220;
export const DRAG_THRESHOLD_PX = 36;
export const AUTO_ADVANCE_MS = 0; // off

// ── Entrance Animation ───────────────────────────────────────────────────────
export const ENTRANCE_DURATION = 2.0;
export const ENTRANCE_STAGGER = 0.10; // seconds between consecutive book starts
export const ENTRY_FROM_X = 16; // off-screen right
export const ENTRY_FROM_Y_OFFSET = 0.4; // above the shelf line
export const ENTRY_FROM_Z = 0.1;
export const INITIAL_INDEX = 5; // floor(12/2) - 1 => book index 5 (6th book)

// ── Mobile Open ─────────────────────────────────────────────────────────────
export const MOBILE_OPEN_POS_X = 0.8; // cancels the spread's natural ~0.8-unit leftward drift
export const MOBILE_OPEN_POS_Y = 0.05; // book TOP positioned higher for spacious mobile reading room
export const MOBILE_OPEN_POS_Z = -1.5; // pushed back so spread fills ~90% of portrait viewport width

// ── Book Mesh ───────────────────────────────────────────────────────────────
export const COVER_THICK = 0.05;
export const SPINE_WRAP_T = 0.06;
export const PAGE_INSET = 0.025;

// ── Background Images (Dual Theme Crossfade) ────────────────────────────────
export const BG_IMAGE_DARK = "/images/night%20shelf.png";
export const BG_IMAGE_LIGHT = "/images/Day%20shelf%202.png";

// ── The 12-Book Curated Reference Collection ────────────────────────────────
export const BOOKS: BookData[] = [
  {
    id: "nirmala",
    title: "निर्मला",
    author: "मुंशी प्रेमचंद",
    spineColor: "#182b5e",
    spineTextColor: "#f3ecd8",
    coverColor: "#1c3370",
    coverTextColor: "#f3ecd8",
    coverImage: "/images/image.png",
    motif: "lattice",
    foilColor: "#e7b55f",
    synopsis:
      "मुंशी प्रेमचंद का एक कालजयी सामाजिक उपन्यास। 1920 के दशक के भारत में बेमेल विवाह, दहेज प्रथा और नारी के आत्मसम्मान का मार्मिक चित्रण।",
    excerpt: "जब मनुष्य पर विपत्ति आती है, तो उसकी बुद्धि भी भ्रष्ट हो जाती है।",
    retailers: [
      { name: "Amazon", price: "₹199", url: "https://www.amazon.in" },
      { name: "Bookshop", price: "₹240", url: "https://bookshop.org" },
    ],
    width: 1.95,
    height: 3.05,
    spineThickness: 0.38,
  },
  {
    id: "gunaho-ka-devta",
    title: "गुनाहों का देवता",
    author: "धर्मवीर भारती",
    spineColor: "#ece0ca",
    spineTextColor: "#8b1e1a",
    coverColor: "#f3ebe0",
    coverTextColor: "#8b1e1a",
    coverImage: "/images/gunaho%20ka%20devta.png",
    motif: "continuum",
    foilColor: "#8b1e1a",
    synopsis:
      "धर्मवीर भारती का कालजयी और भावुक उपन्यास। चंदर और सुधा के अनूठे, पवित्र और आत्मबलिदान से भरे प्रेम की अमर गाथा।",
    excerpt: "किसी से ज़िन्दगी भर स्नेह रखने, प्रेम करने का गुनाह... स्नेह और प्रेम जब अपनी पराकाष्ठा पर पहुँचने लगे तो उसका त्याग करने का गुनाह...",
    retailers: [
      { name: "Amazon", price: "₹225", url: "https://www.amazon.in" },
      { name: "Bookshop", price: "₹260", url: "https://bookshop.org" },
    ],
    width: 2.0,
    height: 3.15,
    spineThickness: 0.42,
  },
  {
    id: "good-to-great",
    title: "Good to Great",
    author: "Jim Collins",
    spineColor: "#6d1f1f",
    spineTextColor: "#f3ecd8",
    coverColor: "#571616",
    coverTextColor: "#f3ecd8",
    motif: "continuum",
    foilColor: "#c8a44a",
    synopsis:
      "Why some companies make the leap and others don't. A five-year study of 1,435 firms identifies the disciplines — Level 5 leaders, the hedgehog concept, the flywheel — that turn good companies into enduring great ones.",
    excerpt: "Good is the enemy of great.",
    retailers: [
      { name: "Amazon", price: "$19.99", url: "https://www.amazon.com/dp/0066620996" },
      { name: "Barnes & Noble", price: "$21.99", url: "https://www.barnesandnoble.com" },
    ],
    width: 2.05,
    height: 3.20,
    spineThickness: 0.46,
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    spineColor: "#b8932a",
    spineTextColor: "#1a1a1a",
    coverColor: "#222018",
    coverTextColor: "#e8d27a",
    motif: "steps",
    foilColor: "#e8d27a",
    synopsis:
      "Tiny changes, remarkable results. A practical, evidence-based framework for compounding small habits into outsized outcomes — built around four laws that shape every behaviour you'll ever form.",
    excerpt: "You do not rise to the level of your goals. You fall to the level of your systems.",
    retailers: [
      { name: "Amazon", price: "$14.99", url: "https://www.amazon.com/dp/0735211299" },
      { name: "Bookshop", price: "$16.19", url: "https://bookshop.org" },
    ],
    width: 2.0,
    height: 3.0,
    spineThickness: 0.40,
  },
  {
    id: "shoe-dog",
    title: "Shoe Dog",
    author: "Phil Knight",
    spineColor: "#a8501f",
    spineTextColor: "#f3ecd8",
    coverColor: "#8f3e12",
    coverTextColor: "#f3ecd8",
    motif: "runner",
    foilColor: "#f4a261",
    synopsis:
      "A memoir by the creator of Nike. From a $50 loan from his father to one of the world's most iconic brands, detailing the messy, honest struggle behind extraordinary ambition.",
    excerpt:
      "Don't tell people how to do things, tell them what to do and let them surprise you with their results.",
    retailers: [
      { name: "Amazon", price: "$16.50", url: "https://www.amazon.com/dp/1501135929" },
      { name: "Bookshop", price: "$17.99", url: "https://bookshop.org" },
    ],
    width: 1.95,
    height: 3.0,
    spineThickness: 0.38,
  },
  {
    id: "hard-thing",
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    spineColor: "#1a1a1a",
    spineTextColor: "#cf9b3a",
    coverColor: "#151515",
    coverTextColor: "#cf9b3a",
    motif: "fracture",
    foilColor: "#d4af37",
    synopsis:
      "Building a business when there are no easy answers. Ben Horowitz on layoffs, demotions, betrayals, and the crushing weight of decisions no MBA prepares you for.",
    excerpt: "There is no recipe for the hard things. There is no recipe for really complex, dynamic situations.",
    retailers: [
      { name: "Amazon", price: "$18.99", url: "https://www.amazon.com/dp/0062273205" },
      { name: "Barnes & Noble", price: "$20.00", url: "https://www.barnesandnoble.com" },
    ],
    width: 2.0,
    height: 3.10,
    spineThickness: 0.42,
  },
  {
    id: "four-hour-week",
    title: "The 4-Hour Workweek",
    author: "Tim Ferriss",
    spineColor: "#b8932a",
    spineTextColor: "#1a1a1a",
    coverColor: "#1f1d19",
    coverTextColor: "#f3ecd8",
    motif: "wave",
    foilColor: "#d4af37",
    synopsis:
      "Escape 9–5, live anywhere, and join the new rich. Tim Ferriss's manifesto for trading time-for-money for systems-for-freedom and lifestyle design.",
    excerpt: "What we fear doing most is usually what we most need to do.",
    retailers: [
      { name: "Amazon", price: "$15.49", url: "https://www.amazon.com/dp/0307465357" },
      { name: "Bookshop", price: "$16.50", url: "https://bookshop.org" },
    ],
    width: 2.0,
    height: 3.05,
    spineThickness: 0.44,
  },
  {
    id: "principles",
    title: "Principles",
    author: "Ray Dalio",
    spineColor: "#1c2a44",
    spineTextColor: "#f3ecd8",
    coverColor: "#131d2e",
    coverTextColor: "#f3ecd8",
    motif: "schematic",
    foilColor: "#c5a059",
    synopsis:
      "Life and work principles from the founder of Bridgewater. Radical transparency, idea meritocracy, and an algorithmic approach to decision-making.",
    excerpt: "Pain plus reflection equals progress.",
    retailers: [
      { name: "Amazon", price: "$21.99", url: "https://www.amazon.com/dp/1501124021" },
      { name: "Bookshop", price: "$23.50", url: "https://bookshop.org" },
    ],
    width: 2.05,
    height: 3.30,
    spineThickness: 0.58,
  },
  {
    id: "rework",
    title: "Rework",
    author: "Jason Fried",
    spineColor: "#333333",
    spineTextColor: "#f3ecd8",
    coverColor: "#222222",
    coverTextColor: "#f3ecd8",
    motif: "windows",
    foilColor: "#cccccc",
    synopsis:
      "Change the way you work forever. Short, blunt essays on the nonsense of business orthodoxy — from planning fallacy to unnecessary meetings.",
    excerpt: "Planning is guessing. Workaholism is stupid. Meetings are toxic.",
    retailers: [
      { name: "Amazon", price: "$14.29", url: "https://www.amazon.com/dp/0307463745" },
      { name: "Bookshop", price: "$15.00", url: "https://bookshop.org" },
    ],
    width: 1.85,
    height: 2.85,
    spineThickness: 0.30,
  },
  {
    id: "innovators-dilemma",
    title: "The Innovator's Dilemma",
    author: "Clayton Christensen",
    spineColor: "#3f444a",
    spineTextColor: "#f3ecd8",
    coverColor: "#2c3035",
    coverTextColor: "#f3ecd8",
    motif: "circuit",
    foilColor: "#9ec1cf",
    synopsis:
      "When new technologies cause great firms to fail. The seminal theory of disruptive innovation that explains how market leaders are toppled.",
    excerpt:
      "The very decision-making and resource-allocation processes that are key to the success of established companies are the very processes that reject disruptive technologies.",
    retailers: [
      { name: "Amazon", price: "$17.99", url: "https://www.amazon.com/dp/1633691780" },
      { name: "Bookshop", price: "$18.50", url: "https://bookshop.org" },
    ],
    width: 1.95,
    height: 3.10,
    spineThickness: 0.40,
  },
  {
    id: "start-with-why",
    title: "Start with Why",
    author: "Simon Sinek",
    spineColor: "#7a3a2a",
    spineTextColor: "#f3ecd8",
    coverColor: "#59281c",
    coverTextColor: "#f3ecd8",
    motif: "lattice",
    foilColor: "#e7b55f",
    synopsis:
      "How great leaders inspire everyone to take action. The Golden Circle framework — start with why, then how, then what — that drives movements.",
    excerpt: "People don't buy what you do; they buy why you do it.",
    retailers: [
      { name: "Amazon", price: "$15.20", url: "https://www.amazon.com/dp/1591846447" },
      { name: "Bookshop", price: "$16.00", url: "https://bookshop.org" },
    ],
    width: 1.95,
    height: 3.0,
    spineThickness: 0.36,
  },
  {
    id: "built-to-last",
    title: "Built to Last",
    author: "Jim Collins",
    spineColor: "#3a1818",
    spineTextColor: "#cf9b3a",
    coverColor: "#2a1010",
    coverTextColor: "#cf9b3a",
    motif: "branches",
    foilColor: "#cf9b3a",
    synopsis:
      "Successful habits of visionary companies. What makes an enterprise endure and thrive across generations, beating rivals by 15-to-1.",
    excerpt: "Preserve the core, stimulate progress.",
    retailers: [
      { name: "Amazon", price: "$19.50", url: "https://www.amazon.com/dp/0060516402" },
      { name: "Bookshop", price: "$20.50", url: "https://bookshop.org" },
    ],
    width: 2.0,
    height: 3.15,
    spineThickness: 0.48,
  },
];
