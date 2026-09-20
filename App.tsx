import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Cloud,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PenTool,
  Rocket,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Ticket,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';

const navItems = ['Home', 'Services', 'Pricing', 'Portfolio', 'About Us', 'Contact'];

type IconType = LucideIcon;
type View = 'Home' | 'Services' | 'Pricing' | 'Portfolio' | 'About Us' | 'Contact' | 'Dashboard' | 'Jadon AI';

const services: { title: string; description: string; icon: IconType; tone: string; features: string[] }[] = [
  { title: 'Web Development', description: 'We build fast, secure and responsive websites that represent your brand perfectly.', icon: Code2, tone: 'blue', features: ['Custom Website', 'E-commerce', 'CMS Development'] },
  { title: 'Mobile App Development', description: 'We create powerful mobile apps for Android and iOS platforms.', icon: Smartphone, tone: 'violet', features: ['Android Apps', 'iOS Apps', 'Cross Platform Apps'] },
  { title: 'Digital Marketing', description: 'We help you grow your business with smart marketing strategies.', icon: Target, tone: 'orange', features: ['SEO Services', 'Social Media Marketing', 'Google Ads'] },
  { title: 'AI Solutions', description: 'We provide AI-powered solutions to automate and grow your business.', icon: Bot, tone: 'cyan', features: ['AI Chatbots', 'AI Automation', 'AI Analytics'] },
  { title: 'Domain & Hosting', description: 'Find the perfect domain name and get blazing fast hosting.', icon: Cloud, tone: 'blue', features: ['Domain Registration', 'Web Hosting', 'Business Email'] },
  { title: 'UI/UX Design', description: 'Beautiful designs that create amazing user experiences.', icon: PenTool, tone: 'violet', features: ['Brand Identity', 'Web Design', 'Product Design'] },
];

const plans = [
  { name: 'Starter', price: '₹2,999', inrBase: 2999, usdPrice: 36, note: 'Perfect for small businesses', features: ['1 Page Website', 'Responsive Design', 'WhatsApp Support', 'Basic SEO', 'SSL Certificate', '7 Days Support'] },
  { name: 'Pro', price: '₹5,999', inrBase: 5999, usdPrice: 72, note: 'Best for growing businesses', popular: true, features: ['Up to 5 Pages', 'Premium Design', 'Domain & Hosting', 'Basic SEO', 'SSL Certificate', '30 Days Support', 'Gallery', 'Blog Section'] },
  { name: 'Pro Max', price: '₹9,999', inrBase: 9999, usdPrice: 120, note: 'For advanced businesses', features: ['Up to 15 Pages', 'Premium UI/UX', 'AI Chatbot (Jadon AI)', 'Domain & Hosting', 'Business Email', 'SEO Optimization', '90 Days Support', 'Priority Support'] },
];

// Razorpay Checkout script is loaded via <script> in index.html (not an npm import),
// so declare the minimal shape we use on `window` here.
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const quickLinks = [
  ['My Projects', BriefcaseBusiness], ['Invoices', FileText], ['Support Tickets', Ticket], ['Downloads', ArrowRight],
  ['Profile Settings', UserRound], ['Notifications', Bell], ['Document Center', FileText], ['AI Assistant', Bot],
] as [string, IconType][];

function App() {
  const [view, setView] = useState<View>('Home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [priceMode, setPriceMode] = useState<'monthly' | 'yearly'>('monthly');
  const [filter, setFilter] = useState('All Services');
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Hello! I'm Jadon AI\nHow can I help you today?" },
    { from: 'user', text: 'I need a website for my business.' },
    { from: 'ai', text: 'Great! I can help you with that.\nPlease tell me about your business.' },
    { from: 'user', text: "It's an e-commerce store." },
    { from: 'ai', text: "Awesome! I'll suggest the best solution\nfor your e-commerce business." },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const filteredServices = useMemo(() => filter === 'All Services' ? services : services.filter((service) => {
    if (filter === 'Development') return service.title.includes('Development');
    if (filter === 'Marketing') return service.title.includes('Marketing');
    if (filter === 'Design') return service.title.includes('Design');
    return service.title.includes('Hosting') || service.title.includes('AI');
  }), [filter]);

  const navigate = (nextView: View) => {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendMessage = () => {
    const message = chatInput.trim();
    if (!message) return;
    setMessages((current) => [...current, { from: 'user', text: message }, { from: 'ai', text: 'Thanks for sharing. I can help you choose the right digital solution.\nWould you like to explore our plans?' }]);
    setChatInput('');
  };

  const handleBuyPlan = async (planName: string) => {
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planName }),
      });
      if (!orderRes.ok) throw new Error('Could not create order');
      const order = await orderRes.json();

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AS Jadon Solutions',
        description: `${planName} Plan (incl. 18% GST)`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert(`Payment successful! ${planName} plan activated.`);
              navigate('Dashboard');
            } else {
              alert('Payment verification failed. Please contact support if the amount was deducted.');
            }
          } catch {
            alert('Payment verification failed. Please contact support if the amount was deducted.');
          }
        },
        modal: {
          ondismiss: () => {
            fetch('/api/payment/mark-failed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id: order.orderId }),
            }).catch(() => {});
          },
        },
        theme: { color: '#0ea5e9' },
      });
      razorpay.open();
    } catch (err) {
      console.error(err);
      alert('Unable to start payment right now. Please try again.');
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('Home')} aria-label="AS Jadon Solutions home">
          <span className="brand-mark"><Sparkles size={15} /></span>
          <span><strong>AS JADON</strong><small>SOLUTIONS</small></span>
        </button>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          {navItems.map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => navigate(item as View)}>{item}</button>)}
          <button className="mobile-cta" onClick={() => navigate('Dashboard')}>Get Started</button>
        </nav>
        <div className="header-actions">
          <button className="header-cta" onClick={() => navigate('Dashboard')}>Get Started <ArrowRight size={14} /></button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      <main>
        {view === 'Home' && <Home navigate={navigate} />}
        {view === 'Services' && <ServicesPage filter={filter} setFilter={setFilter} services={filteredServices} navigate={navigate} />}
        {view === 'Pricing' && <PricingPage priceMode={priceMode} setPriceMode={setPriceMode} navigate={navigate} onBuy={setCheckoutPlan} />}
        {view === 'Portfolio' && <PortfolioPage navigate={navigate} />}
        {view === 'About Us' && <AboutPage navigate={navigate} />}
        {view === 'Contact' && <ContactPage navigate={navigate} />}
        {view === 'Dashboard' && <Dashboard navigate={navigate} />}
        {view === 'Jadon AI' && <AiPage messages={messages} chatInput={chatInput} setChatInput={setChatInput} sendMessage={sendMessage} navigate={navigate} />}
      </main>
      <footer className="site-footer"><span>© 2025 AS Jadon Solutions</span><span>Digital solutions that move you forward <Zap size={13} /></span></footer>
      {checkoutPlan && (
        <CheckoutCalculator
          plan={plans.find((p) => p.name === checkoutPlan)!}
          onCancel={() => setCheckoutPlan(null)}
          onPay={() => { setCheckoutPlan(null); handleBuyPlan(checkoutPlan); }}
        />
      )}
    </div>
  );
}

// New: tax/GST breakdown screen shown after clicking a plan's Buy button, before Razorpay opens.
function CheckoutCalculator({ plan, onCancel, onPay }: { plan: typeof plans[number]; onCancel: () => void; onPay: () => void }) {
  const gst = Math.round(plan.inrBase * 0.18 * 100) / 100;
  const total = Math.round((plan.inrBase + gst) * 100) / 100;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
      <div style={{ background: 'linear-gradient(150deg,#111432,#090b23)', border: '1px solid rgba(136,139,255,.18)', borderRadius: 15, padding: 28, width: '100%', maxWidth: 380, fontFamily: 'inherit', color: '#f7f7ff', boxShadow: '0 20px 70px rgba(0,0,0,.5)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 20, color: '#f7f7ff', fontFamily: "'Space Grotesk', sans-serif" }}>{plan.name} Plan</h3>
        <p style={{ margin: '0 0 18px', color: '#9296b8', fontSize: 12 }}>Price breakdown before payment</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(136,139,255,.18)', color: '#c6c8dc', fontSize: 13 }}>
          <span>Base Price</span><strong style={{ color: '#f7f7ff' }}>₹{plan.inrBase.toLocaleString('en-IN')}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(136,139,255,.18)', color: '#c6c8dc', fontSize: 13 }}>
          <span>GST (18%)</span><strong style={{ color: '#f7f7ff' }}>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 18px', fontSize: 17, color: '#f7f7ff' }}>
          <span>Total Payable</span><strong>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: '1px solid #495080', background: 'rgba(14,15,43,.6)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={onPay} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: 'linear-gradient(105deg,#7442ff,#ac3bff)', boxShadow: '0 9px 26px rgba(110,54,255,.35)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Pay ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</button>
        </div>
      </div>
    </div>
  );
}

function Home({ navigate }: { navigate: (view: View) => void }) {
  return <>
    <section className="hero section-wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot" /> Welcome to AS Jadon Solutions</div>
        <h1>We Build Digital<br />Solutions That<br /><em>Grow Your Business</em></h1>
        <p className="hero-subtitle">Web Development, Mobile Apps, AI Solutions,<br className="desktop-only" /> Digital Marketing &amp; Complete IT Services</p>
        <div className="button-row"><button className="primary-btn" onClick={() => navigate('Services')}>Explore Services <ArrowRight size={16} /></button><button className="outline-btn" onClick={() => navigate('Jadon AI')}><Bot size={16} /> Talk to Jadon AI</button></div>
        <div className="hero-trust"><span><ShieldCheck size={16} /> Secure by design</span><span><Users size={16} /> 500+ clients</span></div>
      </div>
      <TechIllustration />
    </section>
    <Stats />
    <section className="section-wrap home-services"><SectionHeading eyebrow="Our Services" title={<>Complete Digital <em>Solutions</em><br />Under One Roof</>} text="From idea to execution, we provide everything your business needs to grow in the digital world." /><div className="service-grid">{services.map((service) => <ServiceCard key={service.title} service={service} onClick={() => navigate('Services')} />)}</div></section>
    <section className="impact section-wrap"><SectionHeading eyebrow="Our Impact" title={<>We Deliver <em>Results</em></>} text="Real numbers from real projects" /><div className="impact-grid"><ImpactStat value="10K+" label="Lines of Code" icon={Code2} /><ImpactStat value="98%" label="Client Satisfaction" icon={Activity} /><ImpactStat value="3X" label="Avg. Business Growth" icon={TrendingUp} /><ImpactStat value="24/7" label="Support" icon={Headphones} /></div></section>
  </>;
}

function TechIllustration() {
  return <div className="hero-art" aria-label="Futuristic digital workspace illustration"><div className="orb orb-one" /><div className="orb orb-two" /><div className="floating-chip chip-one"><BarChart3 size={16} /><span>+128%</span></div><div className="floating-chip chip-two"><Bot size={17} /><span>AI ready</span></div><div className="laptop"><div className="laptop-screen"><div className="window-bar"><i /><i /><i /></div><div className="screen-layout"><div className="screen-side"><b /><b /><b /><b /></div><div className="screen-content"><span className="screen-title">Dashboard</span><div className="screen-numbers"><b>82.6K</b><b>+24.8%</b></div><div className="chart"><span /><span /><span /><span /><span /><span /><span /></div><div className="screen-cards"><i /><i /><i /></div></div></div></div><div className="laptop-base" /></div><div className="art-spark spark-a">✦</div><div className="art-spark spark-b">✧</div></div>;
}

function Stats() { return <section className="stats section-wrap">{[[BriefcaseBusiness, '1000+', 'Projects Completed'], [Users, '500+', 'Happy Clients'], [Rocket, '50+', 'Expert Team'], [Headphones, '24/7', 'Support Available']].map(([Icon, value, label]) => <div className="stat" key={label as string}><span className="icon-box"><Icon size={18} /></span><div><strong>{value as string}</strong><small>{label as string}</small></div></div>)}</section>; }

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: React.ReactNode; text: string }) { return <div className="section-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>; }

function ServiceCard({ service, onClick }: { service: typeof services[number]; onClick: () => void }) { const Icon = service.icon; return <article className={`service-card ${service.tone}`} onClick={onClick}><span className="service-icon"><Icon size={20} /></span><h3>{service.title}</h3><p>{service.description}</p><button onClick={onClick}>Explore <ArrowRight size={13} /></button><div className="card-glow" /></article>; }
function ImpactStat({ value, label, icon: Icon }: { value: string; label: string; icon: IconType }) { return <div className="impact-stat"><Icon size={17} /><strong>{value}</strong><span>{label}</span></div>; }

function ServicesPage({ filter, setFilter, services: visibleServices, navigate }: { filter: string; setFilter: (filter: string) => void; services: typeof services; navigate: (view: View) => void }) {
  const filters = ['All Services', 'Development', 'Marketing', 'Design', 'Other'];
  return <section className="inner-page section-wrap"><SectionHeading eyebrow="Home  ›  Services" title={<>Our <em>Services</em></>} text="Powerful digital solutions built around your business goals." /><div className="filter-row">{filters.map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="service-list">{visibleServices.map((service, index) => <article className="wide-service" key={service.title}><div className="wide-service-copy"><span className={`service-icon ${service.tone}`}><service.icon size={22} /></span><h2>{service.title}</h2><p>{service.description}</p><ul>{service.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}</ul><button className="primary-btn small" onClick={() => navigate('Jadon AI')}>Learn More <ArrowRight size={14} /></button></div><ServiceVisual type={index % 5} icon={service.icon} /></article>)}</div></section>;
}

function ServiceVisual({ type, icon: Icon }: { type: number; icon: IconType }) { return <div className={`service-visual visual-${type}`}><div className="visual-halo" /><div className="visual-window"><span /><span /><span /><div className="visual-lines"><i /><i /><i /><i /></div></div><Icon className="visual-main-icon" size={54} strokeWidth={1.2} /></div>; }

function PricingPage({ priceMode, setPriceMode, navigate, onBuy }: { priceMode: 'monthly' | 'yearly'; setPriceMode: (mode: 'monthly' | 'yearly') => void; navigate: (view: View) => void; onBuy: (planName: string) => void }) {
  return <section className="inner-page pricing-page section-wrap"><SectionHeading eyebrow="Plans that scale with you" title={<>Simple &amp; Transparent<br /><em>Pricing</em></>} text="Choose the perfect plan for your business" /><div className="billing-toggle"><button className={priceMode === 'monthly' ? 'selected' : ''} onClick={() => setPriceMode('monthly')}>Monthly</button><button className={priceMode === 'yearly' ? 'selected' : ''} onClick={() => setPriceMode('yearly')}>Yearly <b>(Save 20%)</b></button></div><div className="plans-grid">{plans.map((plan) => <article className={plan.popular ? 'plan-card popular' : 'plan-card'} key={plan.name}>{plan.popular && <span className="popular-badge">Most Popular</span>}<h3>{plan.name}</h3><strong>{priceMode === 'yearly' ? (plan.name === 'Starter' ? '₹19,190' : plan.name === 'Pro' ? '₹47,990' : '₹95,990') : `$${plan.usdPrice}`}<small>{priceMode === 'yearly' ? ' /-' : ' USD'}</small></strong><p>{plan.note}</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}</ul><button className="primary-btn" onClick={() => priceMode === 'monthly' ? onBuy(plan.name) : navigate('Dashboard')}>{priceMode === 'monthly' ? 'Buy Now' : 'Get Started'} <ArrowRight size={14} /></button></article>)}</div><article className="enterprise-card"><div><span className="eyebrow">Custom solutions</span><h2>Enterprise</h2><p>Custom Solutions for Your Business</p><div className="enterprise-features"><span><Check size={13} />Unlimited Pages</span><span><Check size={13} />Dedicated Support</span><span><Check size={13} />AI Solutions</span><span><Check size={13} />Mobile App</span><span><Check size={13} />CRM System</span></div><button className="primary-btn" onClick={() => navigate('Jadon AI')}>Contact Us <ArrowRight size={14} /></button></div><div className="handshake"><Users size={62} /><div className="handshake-ring" /></div></article><Comparison /></section>;
}

function Comparison() { const rows = [['Pages', '1 Page', 'Up to 5', 'Up to 15', 'Unlimited'], ['Domain & Hosting', 'no', 'no', 'yes', 'yes'], ['AI Chatbot', 'no', 'no', 'yes', 'yes'], ['Business Email', 'no', 'no', 'yes', 'yes'], ['SEO Optimization', 'no', 'no', 'yes', 'yes'], ['Priority Support', 'no', 'no', 'yes', 'yes'], ['Project Tracking', 'no', 'no', 'yes', 'yes'], ['Custom Features', 'no', 'no', 'yes', 'yes']]; return <div className="comparison"><h2>Compare All Features</h2><div className="comparison-scroll"><table><thead><tr><th>Features</th><th>Starter</th><th>Pro</th><th>Pro Max</th><th>Enterprise</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{index > 0 && (cell === 'yes' || cell === 'no') ? <span className={cell === 'yes' ? 'yes' : 'no'}>{cell === 'yes' ? '✓' : '×'}</span> : cell}</td>)}</tr>)}</tbody></table></div></div>; }

function PortfolioPage({ navigate }: { navigate: (view: View) => void }) { const projects = [{ name: 'E-commerce Website', type: 'Web Development', icon: Globe2, tone: 'blue' }, { name: 'School Management System', type: 'Mobile & Web App', icon: Smartphone, tone: 'violet' }, { name: 'Jadon AI Assistant', type: 'AI Solutions', icon: Bot, tone: 'cyan' }, { name: 'Brand Growth Campaign', type: 'Digital Marketing', icon: TrendingUp, tone: 'orange' }]; return <section className="inner-page section-wrap"><SectionHeading eyebrow="Selected work" title={<>Ideas made <em>real</em></>} text="A glimpse at the digital products and growth systems we have delivered for ambitious teams." /><div className="portfolio-grid">{projects.map((project) => <article className={`portfolio-card ${project.tone}`} key={project.name}><div className="portfolio-art"><project.icon size={42} strokeWidth={1.3} /><div className="portfolio-screen"><i /><i /><i /></div></div><span>{project.type}</span><h2>{project.name}</h2><button onClick={() => navigate('Contact')}>Start a similar project <ArrowRight size={13} /></button></article>)}</div><div className="portfolio-cta"><div><span className="eyebrow">Have a big idea?</span><h2>Let's build something <em>remarkable.</em></h2></div><button className="primary-btn" onClick={() => navigate('Contact')}>Talk to our team <ArrowRight size={14} /></button></div></section>; }

function AboutPage({ navigate }: { navigate: (view: View) => void }) { return <section className="inner-page section-wrap about-page"><SectionHeading eyebrow="The team behind the work" title={<>We turn bold ideas into <em>better businesses.</em></>} text="AS Jadon Solutions is a focused digital partner for businesses ready to move with clarity, craft and confidence." /><div className="about-layout"><div className="about-story"><span className="story-number">01</span><h2>Technology should feel <em>simple.</em></h2><p>We bring strategy, design, engineering and growth together under one roof, so you can spend less time coordinating and more time building what matters.</p><button className="primary-btn" onClick={() => navigate('Services')}>Explore our services <ArrowRight size={14} /></button></div><div className="about-values"><div><Sparkles size={19} /><strong>Thoughtful by default</strong><p>Every screen has a purpose and every detail earns its place.</p></div><div><Rocket size={19} /><strong>Built to move</strong><p>Fast, flexible solutions that grow with the people using them.</p></div><div><Users size={19} /><strong>People first</strong><p>A responsive partner from the first conversation to launch day.</p></div></div></div><div className="about-numbers"><ImpactStat value="5+" label="Years of craft" icon={Sparkles} /><ImpactStat value="50+" label="Experts" icon={Users} /><ImpactStat value="1000+" label="Projects shipped" icon={Rocket} /><ImpactStat value="24/7" label="Always here" icon={Headphones} /></div></section>; }

function ContactPage({ navigate }: { navigate: (view: View) => void }) { return <section className="inner-page section-wrap contact-page"><SectionHeading eyebrow="Let's talk" title={<>Your next big move starts <em>here.</em></>} text="Tell us what you are building. We will bring the right people and ideas to the table." /><div className="contact-layout"><div className="contact-details"><span className="eyebrow">AS Jadon Solutions</span><h2>Have a project in mind?</h2><p>From a first website to a complete business platform, we can help you take the next confident step.</p><div className="contact-detail"><MessageCircle size={18} /><span><small>Chat with Jadon AI</small><button onClick={() => navigate('Jadon AI')}>Get an instant answer <ArrowRight size={12} /></button></span></div><div className="contact-detail"><Headphones size={18} /><span><small>Support, always on</small><b>24/7 assistance for active clients</b></span></div></div><form className="contact-form" onSubmit={(event) => event.preventDefault()}><label>Name<input placeholder="Your name" /></label><label>Email<input type="email" placeholder="you@company.com" /></label><label>What can we build together?<textarea rows={4} placeholder="Tell us a little about your project" /></label><button className="primary-btn" type="submit">Send enquiry <Send size={14} /></button></form></div></section>; }

function Dashboard({ navigate }: { navigate: (view: View) => void }) { return <section className="dashboard section-wrap"><div className="dashboard-intro"><div><span className="eyebrow">Client portal</span><h1>Welcome back,<br /><em>Ajay Jadon</em> <span className="wave">✦</span></h1><p>Here's what's happening with your account today.</p></div><div className="profile-pic">AJ</div></div><div className="plan-banner"><div><span>Current Plan</span><strong>Pro Plan</strong><small>Valid till 25 Aug 2025 · <ShieldCheck size={12} /> Active</small></div><button className="primary-btn" onClick={() => navigate('Pricing')}>Upgrade Plan <ArrowRight size={14} /></button></div><div className="dashboard-stats">{[[BriefcaseBusiness, 'Projects', '12', 'Active Projects'], [Activity, 'Progress', '75%', 'Overall Progress'], [CreditCard, 'Invoices', '8', 'Total Invoices'], [Headphones, 'Support', '3', 'Open Tickets']].map(([Icon, title, value, note]) => <div className="dash-stat" key={title as string}><Icon size={17} /><span>{title as string}</span><strong>{value as string}</strong><small>{note as string}</small></div>)}</div><div className="dashboard-section"><div className="section-title"><h2>Quick Access</h2><MoreHorizontal size={18} /></div><div className="quick-grid">{quickLinks.map(([label, Icon]) => <button key={label} onClick={() => label === 'AI Assistant' && navigate('Jadon AI')}><Icon size={18} /><span>{label}</span></button>)}</div></div><div className="dashboard-columns"><div className="dashboard-section"><div className="section-title"><h2>Recent Projects</h2><button>View All <ArrowRight size={13} /></button></div><div className="project-list"><Project name="E-commerce Website" progress="75%" status="In Progress" color="blue" /><Project name="School Management System" progress="50%" status="In Progress" color="violet" /><Project name="Company Portfolio" progress="90%" status="Almost Done" color="green" /></div></div><div className="dashboard-section invoice-section"><div className="section-title"><h2>Invoices</h2><button>View All <ArrowRight size={13} /></button></div><div className="invoice-list"><Invoice id="INV-2024-001" amount="₹4,999" status="Paid" date="25 Apr 2024" /><Invoice id="INV-2024-002" amount="₹9,999" status="Paid" date="10 May 2024" /><Invoice id="INV-2024-003" amount="₹1,999" status="Pending" date="20 May 2024" /></div></div></div><div className="help-card"><div className="help-icon"><CircleHelp size={22} /></div><div><h2>Need Help?</h2><p>Our support team is always ready to help you.</p></div><button className="primary-btn" onClick={() => navigate('Jadon AI')}>Create Ticket <ArrowRight size={14} /></button></div><div className="mobile-bottom-nav"><button className="active"><LayoutDashboard size={16} />Dashboard</button><button><BriefcaseBusiness size={16} />Projects</button><button><FileText size={16} />Invoices</button><button><Headphones size={16} />Support</button><button><UserRound size={16} />Profile</button></div></section>; }
function Project({ name, progress, status, color }: { name: string; progress: string; status: string; color: string }) { return <div className="project"><span className={`project-avatar ${color}`}>{name.slice(0, 1)}</span><div><strong>{name}</strong><div className="progress-track"><i style={{ width: progress }} /></div></div><b>{progress}</b><small className={color}>{status}</small></div>; }
function Invoice({ id, amount, status, date }: { id: string; amount: string; status: string; date: string }) { return <div className="invoice"><span className="invoice-icon"><FileText size={14} /></span><strong>{id}</strong><b>{amount}</b><small className={status === 'Paid' ? 'paid' : 'pending'}>{status}</small><time>{date}</time></div>; }

function AiPage({ messages, chatInput, setChatInput, sendMessage, navigate }: { messages: { from: string; text: string }[]; chatInput: string; setChatInput: (value: string) => void; sendMessage: () => void; navigate: (view: View) => void }) { return <section className="ai-page section-wrap"><div className="ai-intro"><span className="eyebrow">Your smart business assistant</span><h1>Jadon <em>AI</em></h1><p>Ask anything. Build everything.</p></div><div className="robot"><div className="robot-aura" /><div className="robot-head"><div className="robot-antenna" /><div className="robot-face"><span /><span /></div></div><div className="robot-body"><Bot size={34} /></div><div className="robot-arm left" /><div className="robot-arm right" /></div><div className="chat-panel"><div className="chat-top"><div className="chat-avatar"><Bot size={17} /></div><div><strong>Jadon AI</strong><span>Online and ready to help</span></div><span className="online-dot" /></div><div className="messages">{messages.map((message, index) => <div className={`message-row ${message.from}`} key={`${message.text}-${index}`}><div className="message-avatar">{message.from === 'ai' ? <Bot size={14} /> : 'AJ'}</div><div className="message-bubble">{message.text.split('\n').map((line) => <span key={line}>{line}</span>)}{message.text.includes('plans') && <button onClick={() => navigate('Pricing')}>View Plans <ArrowRight size={12} /></button>}</div></div>)}</div><div className="suggestion-row"><button onClick={() => setChatInput('Website Development')}><Globe2 size={13} />Website Development</button><button onClick={() => setChatInput('Digital Marketing')}><TrendingUp size={13} />Digital Marketing</button><button onClick={() => setChatInput('Mobile App')}><Smartphone size={13} />Mobile App</button></div><div className="chat-input"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Type your message..." /><button onClick={sendMessage} aria-label="Send message"><Send size={15} /></button></div><small className="powered">Powered by Jadon AI <Sparkles size={10} /></small></div></section>; }

export default App;
