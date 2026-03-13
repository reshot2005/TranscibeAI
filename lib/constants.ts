// Cyprus Color Palette
export const CYPRUS = {
  50: '#F0F6F5',
  100: '#D9E7E6',
  200: '#B3CFCE',
  300: '#5AA69D',
  400: '#00796B',
  500: '#006B5E',
  600: '#005A51',
  700: '#004643',
  800: '#002E2C',
  900: '#001F1D',
}

// Sand Color Palette
export const SAND = {
  50: '#FAF8F6',
  100: '#F5F2EC',
  200: '#EBE5DB',
  300: '#E0D9CD',
  400: '#D9D2C8',
  500: '#C4BDB0',
  600: '#A89E94',
  700: '#8B8278',
  800: '#6E665E',
  900: '#F0EDE5',
}

// Primary Colors
export const COLORS = {
  primary: CYPRUS[700],
  secondary: CYPRUS[400],
  accent: CYPRUS[800],
  background: SAND[900],
  text: CYPRUS[700],
  border: SAND[200],
  muted: SAND[100],
}

// Dark Mode Colors
export const DARK_COLORS = {
  primary: SAND[900],
  secondary: CYPRUS[400],
  accent: SAND[900],
  background: CYPRUS[900],
  text: SAND[900],
  border: CYPRUS[700],
  muted: CYPRUS[400],
}

// Animation Config
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.5,
  slow: 0.8,
  slower: 1.2,
}

export const ANIMATION_EASE = {
  ease: 'easeOut',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  easeInOut: 'easeInOut',
  easeInBack: 'easeInBack',
  easeOutBack: 'easeOutBack',
  easeInOutBack: 'easeInOutBack',
}

// Intersection Observer Options
export const INTERSECTION_OBSERVER_OPTIONS = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px',
}

// Scroll Trigger Options
export const SCROLL_TRIGGER_OPTIONS = {
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px',
}

// Feature Data
export const FEATURES = [
  {
    id: 1,
    title: 'Real-time Transcription',
    description: 'Instant, accurate transcription as you record or import audio files.',
    icon: 'Zap',
  },
  {
    id: 2,
    title: 'Speaker Detection',
    description: 'Automatically identify and separate multiple speakers in conversations.',
    icon: 'Users',
  },
  {
    id: 3,
    title: 'AI-Powered Insights',
    description: 'Extract key topics, sentiment analysis, and action items automatically.',
    icon: 'Brain',
  },
  {
    id: 4,
    title: 'Full Search',
    description: 'Search across all transcriptions with powerful filtering options.',
    icon: 'Search',
  },
  {
    id: 5,
    title: 'Export Options',
    description: 'Export transcripts in multiple formats including SRT, VTT, and PDF.',
    icon: 'Download',
  },
  {
    id: 6,
    title: 'Secure & Private',
    description: 'Enterprise-grade encryption ensures your data stays confidential.',
    icon: 'Lock',
  },
]

// Stats Data
export const STATS = [
  {
    number: 99.8,
    suffix: '%',
    label: 'Accuracy Rate',
  },
  {
    number: 150,
    suffix: '+',
    label: 'Languages Supported',
  },
  {
    number: 50000,
    suffix: '+',
    label: 'Active Users',
  },
  {
    number: 10000000,
    suffix: '+',
    label: 'Hours Processed',
  },
]

// Pricing Plans
export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for individuals and small teams',
    features: [
      '10 hours/month transcription',
      'Basic speaker detection',
      'Up to 5 saved conversations',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing teams and professionals',
    features: [
      '100 hours/month transcription',
      'Advanced speaker detection',
      'Unlimited saved conversations',
      'Priority email & chat support',
      'Custom exports',
      'Integration API',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'For large organizations',
    features: [
      'Unlimited transcription',
      'Advanced analytics',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise deployment',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
  },
]

// Testimonials
export const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    title: 'Product Manager at TechCorp',
    quote: 'VoiceVault has transformed how we handle our meeting notes. The accuracy is impressive and the workflow is seamless.',
    avatar: '👩‍💼',
  },
  {
    name: 'Marcus Johnson',
    title: 'Freelance Journalist',
    quote: 'The best transcription tool I\'ve ever used. Fast, accurate, and reasonably priced. Highly recommend!',
    avatar: '👨‍💻',
  },
  {
    name: 'Emma Rodriguez',
    title: 'CEO at Creative Studio',
    quote: 'We\'ve saved countless hours with VoiceVault. It\'s become essential to our creative process.',
    avatar: '👩‍🎨',
  },
]

// Navigation Items
export const NAV_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

// Integrations
export const INTEGRATIONS = [
  { name: 'Slack', icon: '💬' },
  { name: 'Zapier', icon: '⚡' },
  { name: 'Google Meet', icon: '📹' },
  { name: 'Zoom', icon: '🎥' },
  { name: 'Microsoft Teams', icon: '👥' },
  { name: 'Notion', icon: '📝' },
]
