import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FaqItem = {
  q: string;
  a: string | string[];
};

const sections: { title: string; items: FaqItem[] }[] = [
  {
    title: 'About Strawb3rry',
    items: [
      {
        q: 'Why is it called Strawb3rry?',
        a: [
          'The name came from a famous early failure of large language models: when asked "How many Rs are in the word strawberry?", early AI systems consistently got it wrong — answering 2 instead of 3.',
          'That moment sparked a realisation: we are living at the intersection of machine intelligence and human physicality. AI can reason across vast knowledge but stumble on something a child could count. We are in a genuinely novel era — and we needed a place to log it.',
          'Strawb3rry is that place. The 3 in the name is a quiet nod to the three Rs, and to the age we are now in.',
        ],
      },
      {
        q: 'What is Strawb3rry?',
        a: [
          'Strawb3rry is a private personal log — think of it as a smarter replacement for Apple Notes, built for the age of AI.',
          'It holds your projects and working context, your stray ideas, your passwords and sensitive references, your media files, and your running log of AI interactions. Everything in one place, accessible across devices.',
        ],
      },
      {
        q: 'Who is it for?',
        a: 'Anyone who works alongside AI tools and wants a single private place to keep their thinking, context, and credentials — without relying on scattered notes apps, browser bookmarks, or memory.',
      },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      {
        q: 'Is my data private?',
        a: [
          'Your Secrets vault is encrypted client-side using AES-256 before it ever leaves your device. Only you can decrypt it — we never have access to your vault contents or your master password.',
          'Other content (projects, ideas, media) is stored securely in your account and is not accessible to other users, but is not encrypted at rest in the same way as the Secrets vault.',
        ],
      },
      {
        q: 'How does the Secrets vault work?',
        a: [
          'When you set up the vault, you choose a master password. All secrets are encrypted in your browser using that password before being saved. The master password is never stored or transmitted.',
          'This means if you forget your master password, your vault contents cannot be recovered — by us or anyone else. Think of it like a combination lock: we hold the box, you hold the combination.',
        ],
      },
      {
        q: 'What if I forget my vault master password?',
        a: 'The vault contents cannot be recovered without the master password. This is by design — it ensures nobody but you can access your secrets. You can reset the vault and start fresh, but previous entries will be lost. Keep your master password somewhere safe.',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        q: 'What are Projects?',
        a: [
          'Projects are structured logs for ongoing work. Each project has a context block — notes, decisions, current state — and a learnings section for recording what you\'ve figured out.',
          'The "Copy context" button bundles all of this into a clean block you can paste directly into a new AI chat, so you never have to re-explain your situation from scratch.',
        ],
      },
      {
        q: 'What is the Ideas section?',
        a: 'A quick-capture scratchpad. Drop thoughts, observations, links, or fragments without needing to organise them immediately. Ideas can optionally be linked to a project.',
      },
      {
        q: 'What is the Secrets section?',
        a: 'A secure, encrypted store for passwords, recovery phrases, API keys, and other sensitive references you want accessible but protected. Different from a formal password manager — it\'s designed for the things you reference often but don\'t want floating in a plain notes app.',
      },
      {
        q: 'What is the Media section?',
        a: 'File storage for two types of assets: Secure files (QR codes, mnemonic phrase screenshots, recovery keys) and Project Assets (icons, SVGs, reference images). Images preview inline; PDFs open in a viewer; all files can be downloaded.',
      },
      {
        q: 'Can I use it on multiple devices?',
        a: 'Yes. Sign in with the same account on any device or browser. Your data syncs automatically. The app also works as a PWA — you can add it to your iPhone home screen from Safari for a native-like experience.',
      },
    ],
  },
  {
    title: 'Account & Pricing',
    items: [
      {
        q: 'Is there a free trial?',
        a: 'Yes. You can sign up and use Strawb3rry free for a trial period. After that, a one-time payment unlocks full access permanently — no subscriptions.',
      },
      {
        q: 'What does the paid version include?',
        a: [
          'The free trial gives you access to all features so you can see whether it fits your workflow.',
          'The one-time unlock includes unlimited projects, full Secrets vault access, Media storage, and all future core features.',
        ],
      },
      {
        q: 'How do I delete my account?',
        a: 'You can delete your account from the Settings page. This permanently removes all your data — projects, ideas, secrets, and media. This action cannot be undone.',
      },
      {
        q: 'Is there a web version?',
        a: 'Yes — cr33pylabs.com. The web and iOS versions share the same account and data.',
      },
    ],
  },
];

function FaqItem({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  const paragraphs = Array.isArray(a) ? a : [a];

  return (
    <div className="border-b border-slate-700 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-start justify-between gap-4 py-4 text-white hover:text-indigo-300 transition-colors"
      >
        <span className="font-medium text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 mt-0.5 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 mt-0.5 text-slate-400" />}
      </button>
      {open && (
        <div className="pb-4 space-y-2">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-slate-400 text-sm leading-relaxed">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">FAQ</h2>
        <p className="text-slate-400 text-sm mt-0.5">Everything you need to know about Strawb3rry</p>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">{section.title}</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-5">
            {section.items.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
