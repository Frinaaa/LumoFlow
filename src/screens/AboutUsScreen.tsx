import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AboutUsScreen.css';
import frinaImg from '../assets/frina.png'; 

const AboutUsScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="about-modern-wrapper">
      {/* 1. Header (Floating) */}
      <header className="modern-header">
        <button className="icon-btn-back" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <span className="page-title">About Us</span>
        <div className="placeholder"></div> {/* Balances the flex layout */}
      </header>

      <div className="about-scroll-content">
        
        {/* 2. Hero Section (Text Left, Image Right) */}
        <section className="section-hero">
          <div className="hero-text-col">
            <div className="accent-bar"></div>
            <h1>Empowering <span className="highlight">Neural</span><br />Coding Workflows</h1>
            <p>
              In the rapidly evolving world of development, having seamless logic visualization is crucial. 
              LumoFlow bridges the gap between raw syntax and human understanding with high-fidelity 3D tracing.
            </p>
          </div>
          <div className="hero-img-col">
            
            <img 
              src={frinaImg} 
              alt="Developer" 
              className="hero-img"
            />
          </div>
        </section>

        {/* 3. Stats Row */}
        <section className="section-stats">
          <div className="stat-item">
            <h2>55K+</h2>
            <p>Lines Analyzed</p>
          </div>
          <div className="stat-item">
            <h2>7K+</h2>
            <p>Bugs Squashed</p>
          </div>
          <div className="stat-item">
            <h2>1K+</h2>
            <p>Daily Users</p>
          </div>
          <div className="stat-item">
            <h2>4+</h2>
            <p>Supported Langs</p>
          </div>
        </section>

        {/* 4. Why Choose Us (Cards) */}
        <section className="section-features">
          <div className="section-head">
            <h3>Why Choose LumoFlow</h3>
            <p>Elevate your debugging experience</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="icon-circle"><i className="fa-solid fa-shield-halved"></i></div>
              <h4>Local Security</h4>
              <p>Your code never leaves your machine. We prioritize local-first processing.</p>
            </div>
            <div className="feature-card">
              <div className="icon-circle"><i className="fa-solid fa-layer-group"></i></div>
              <h4>Scalability</h4>
              <p>From snippets to massive monorepos, our engine scales with your logic.</p>
            </div>
            <div className="feature-card">
              <div className="icon-circle"><i className="fa-solid fa-headset"></i></div>
              <h4>AI Support</h4>
              <p>Our neural director is available 24/7 to explain complex algorithms.</p>
            </div>
          </div>
        </section>

        {/* 5. How It Works (Image Left, Steps Right) */}
        <section className="section-steps">
          <div className="steps-img-col">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" 
              alt="Workflow" 
              className="steps-img"
            />
          </div>
          <div className="steps-text-col">
            <span className="sub-label">HOW IT WORKS</span>
            <h3>Use only with 4 easy steps</h3>
            <p className="desc">Discover the effortless way to handle complex logic.</p>

            <ul className="steps-list">
              <li>
                <div className="step-num">1</div>
                <div className="step-info">
                  <h5>Open Project</h5>
                  <p>Open any folder or file to begin your session instantly.</p>
                </div>
              </li>
              <li>
                <div className="step-num">2</div>
                <div className="step-info">
                  <h5>Analyze Code</h5>
                  <p>Let the AI scan your syntax for structural patterns.</p>
                </div>
              </li>
              <li>
                <div className="step-num">3</div>
                <div className="step-info">
                  <h5>Generate Visuals</h5>
                  <p>Watch your logic come to life in the 3D theater.</p>
                </div>
              </li>
              <li>
                <div className="step-num">4</div>
                <div className="step-info">
                  <h5>Fix & Optimize</h5>
                  <p>Identify bottlenecks and apply AI-suggested fixes.</p>
                </div>
              </li>
            </ul>
            
            <button className="btn-get-started" onClick={() => navigate('/editor')}>
              Get Started
            </button>
          </div>
        </section>

        {/* 6. Partners Strip */}
        <section className="section-partners">
          
          <i className="fa-brands fa-js"></i>
          
        </section>

        

      </div>
    </div>
  );
};

export default AboutUsScreen;