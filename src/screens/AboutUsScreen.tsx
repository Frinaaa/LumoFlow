import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AboutUsScreen.css';

// --- Updated Data for LumoFlow ---
const officials = [
  { name: 'Ethan Carter', role: 'Founder & CEO', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan' },
  { name: 'Sophia Bennett', role: 'Lead Architect', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
  { name: 'Liam Harper', role: 'AI Researcher', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam' },
];

const values = [
  { 
    icon: 'fa-shield-halved', 
    title: 'Security', 
    description: 'Local-first data processing.',
    fullContent: "LumoFlow ensures that your source code and debug sessions are processed locally. We prioritize end-to-end encryption for any cloud-synced settings, safeguarding your intellectual property."
  },
  { 
    icon: 'fa-bolt', 
    title: 'Efficiency', 
    description: 'Smart detection, faster fixes.',
    fullContent: "Our AI-driven engine identifies bottlenecks in your logic before you even run the code. By visualizing execution flow, we reduce debugging time by up to 60%."
  },
  { 
    icon: 'fa-users', 
    title: 'Collaboration', 
    description: 'Shared insights for teams.',
    fullContent: "Export animated execution flows to share with your team. LumoFlow makes code reviews interactive and educational rather than just static text comparisons."
  },
  { 
    icon: 'fa-microscope', 
    title: 'Transparency', 
    description: 'Deep dive into execution.',
    fullContent: "No more 'black box' execution. See exactly how variables update in real-time with step-by-step neural link visualizations."
  }
];

const stories = [
    { 
        quote: "'LumoFlow found a race condition in minutes.' — Alex", 
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=500&auto=format&fit=crop',
        fullStory: "Alex was struggling with a complex asynchronous bug in a Node.js project. Using LumoFlow's visual debugger, the AI highlighted the exact moment two functions overlapped, saving days of manual logging.",
    },
    { 
        quote: "'Perfect for onboarding new junior devs.' — Sarah", 
        image: 'https://images.unsplash.com/photo-1525373612132-b3e277947ef0?q=80&w=500&auto=format&fit=crop',
        fullStory: "Sarah's team used LumoFlow to visualize their legacy codebase. New hires could 'watch' the code execute, making the complex architecture understandable within hours instead of weeks.",
    },
];

const AboutUsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<any>(null);

  const closeModal = () => setModalData(null);

  return (
    <div className="about-screen-wrapper">
    
<header className="about-header">
  <div className="header-left-content">
    {/* Circular Back Arrow */}
    <button className="back-nav-btn-icon" onClick={() => navigate(-1)}>
      <i className="fa-solid fa-arrow-left"></i>
    </button>
    
    {/* Branding (Bolt + Text) */}
    <div className="app-brand small" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
      <div className="app-brand-icon">
        <i className="fa-solid fa-bolt"></i>
      </div>
      <h1 className="app-brand-text">
        LUMO<span className="app-brand-highlight">FLOW</span>
      </h1>
    </div>
  </div>
</header>
      <div className="about-scroll-container">
        {/* Intro Section */}
        <section className="about-hero-section">
          <h1 className="about-main-title">Smart detection, faster returns.</h1>
          <p className="about-subtitle">
            LumoFlow's mission is to use AI and visual execution links to reunite developers with their productivity — quickly and safely.
          </p>
          <div className="hero-arch-container">
             <div className="hero-arch-visual">
                <i className="fa-solid fa-brain-circuit neon-pulse-icon"></i>
             </div>
          </div>
        </section>

        <div className="about-content-inner">
          {/* Officials Section */}
          <h2 className="about-section-title">Our Officials</h2>
          <div className="officials-row">
            {officials.map((off, i) => (
              <div key={i} className="official-card">
                <div className="official-avatar-wrapper">
                    <img src={off.image} alt={off.name} />
                </div>
                <h3>{off.name}</h3>
                <p>{off.role}</p>
              </div>
            ))}
          </div>

          {/* Values Section (Interactive) */}
          <h2 className="about-section-title">Our Values</h2>
          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="value-box-card" onClick={() => setModalData({ ...v, type: 'value' })}>
                <i className={`fa-solid ${v.icon}`}></i>
                <h4>{v.title}</h4>
                <p>{v.description}</p>
                <span className="click-hint">LEARN MORE +</span>
              </div>
            ))}
          </div>

          {/* Stories Section (Interactive) */}
          <h2 className="about-section-title">Success Stories</h2>
          <div className="stories-grid">
            {stories.map((s, i) => (
              <div key={i} className="story-image-card" onClick={() => setModalData({ ...s, type: 'story' })}>
                <div className="story-img-container">
                    <img src={s.image} alt="story" />
                </div>
                <div className="story-overlay">
                    <p>{s.quote}</p>
                </div>
              </div>
            ))}
          </div>

          <footer className="about-footer-simple">
            <p>LumoFlow - Code Visualization Platform © 2026 LumoFlow Project</p>
          </footer>
        </div>
      </div>

      {/* --- RECT MODAL IMPLEMENTATION --- */}
      {modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
            
            {modalData.type === 'story' ? (
                <>
                    <img src={modalData.image} className="modal-hero-img" />
                    <h2>Success Story</h2>
                    <p className="modal-quote">{modalData.quote}</p>
                    <p className="modal-text">{modalData.fullStory}</p>
                </>
            ) : (
                <>
                    <div className="modal-icon-circle">
                        <i className={`fa-solid ${modalData.icon}`}></i>
                    </div>
                    <h2>{modalData.title}</h2>
                    <p className="modal-text">{modalData.fullContent}</p>
                </>
            )}
            
            <button className="modal-action-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutUsScreen;