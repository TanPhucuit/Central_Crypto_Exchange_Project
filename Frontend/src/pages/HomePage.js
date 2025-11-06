import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiPieChart, 
  FiShield, 
  FiZap, 
  FiLock,
  FiUsers,
  FiAward,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import './HomePage.css';

const HomePage = () => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [counters, setCounters] = useState({
    users: 0,
    volume: 0,
    coins: 0,
    countries: 0
  });

  // Animated counter effect
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      users: 500000,
      volume: 5.2,
      coins: 200,
      countries: 150
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCounters({
        users: Math.floor(targets.users * progress),
        volume: (targets.volume * progress).toFixed(1),
        coins: Math.floor(targets.coins * progress),
        countries: Math.floor(targets.countries * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const faqs = [
    {
      question: "Cexora là gì?",
      answer: "Cexora (CryptoExchange Oracle) là sàn giao dịch tiền điện tử hàng đầu tại Việt Nam, cung cấp các dịch vụ giao dịch Spot, Futures, P2P với công nghệ Oracle tiên tiến và bảo mật cao."
    },
    {
      question: "Làm sao để bắt đầu giao dịch?",
      answer: "Bạn chỉ cần đăng ký tài khoản, xác thực danh tính (KYC), nạp tiền vào ví và bắt đầu giao dịch. Quy trình đơn giản chỉ mất vài phút."
    },
    {
      question: "Phí giao dịch là bao nhiêu?",
      answer: "Cexora áp dụng mức phí cạnh tranh chỉ 0.1% cho giao dịch Spot và có các chương trình giảm phí cho khối lượng giao dịch lớn."
    },
    {
      question: "Cexora có an toàn không?",
      answer: "Cexora sử dụng công nghệ bảo mật đa lớp, lưu trữ lạnh (cold storage) cho 95% tài sản, xác thực 2 yếu tố (2FA) và tuân thủ các tiêu chuẩn bảo mật quốc tế."
    },
    {
      question: "Làm sao để rút tiền?",
      answer: "Bạn có thể rút tiền về tài khoản ngân hàng thông qua P2P hoặc rút crypto về ví ngoài. Thời gian xử lý thường từ 5-30 phút tùy phương thức."
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-glow hero-glow-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <FiAward /> #1 Crypto Exchange in Vietnam
          </div>
          <h1 className="hero-title">
            Sàn Giao Dịch Crypto<br/>
            <span className="gradient-text">Hàng Đầu Việt Nam</span>
          </h1>
          <p className="hero-description">
            Giao dịch Bitcoin, Ethereum và 200+ loại crypto khác với công nghệ Oracle tiên tiến.
            Bảo mật tuyệt đối, giao diện thân thiện, phí thấp nhất thị trường.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large btn-glow">
              Bắt đầu giao dịch
            </Link>
            <Link to="/market" className="btn btn-secondary btn-large">
              Xem thị trường
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <FiShield className="trust-icon" />
              <span>Bảo mật cao</span>
            </div>
            <div className="trust-item">
              <FiZap className="trust-icon" />
              <span>Giao dịch nhanh</span>
            </div>
            <div className="trust-item">
              <FiLock className="trust-icon" />
              <span>Ví lạnh 95%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Các loại hình giao dịch</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiTrendingUp size={40} />
            </div>
            <h3>Giao dịch Spot</h3>
            <p>Mua bán tức thì với giá thị trường hiện tại</p>
            <Link to="/trading/spot" className="feature-link">
              Giao dịch ngay →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiPieChart size={40} />
            </div>
            <h3>Giao dịch Futures</h3>
            <p>Giao dịch hợp đồng tương lai với đòn bẩy cao</p>
            <Link to="/trading/futures" className="feature-link">
              Giao dịch ngay →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiDollarSign size={40} />
            </div>
            <h3>Giao dịch P2P</h3>
            <p>Mua bán trực tiếp với Merchant uy tín</p>
            <Link to="/trading/p2p" className="feature-link">
              Giao dịch ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <h3 className="stat-value">{counters.users.toLocaleString()}+</h3>
            <p className="stat-label">Người dùng tin tưởng</p>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <h3 className="stat-value">${counters.volume}B</h3>
            <p className="stat-label">Khối lượng 24h</p>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <h3 className="stat-value">{counters.coins}+</h3>
            <p className="stat-label">Loại tiền điện tử</p>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <FiAward />
            </div>
            <h3 className="stat-value">{counters.countries}+</h3>
            <p className="stat-label">Quốc gia phục vụ</p>
          </div>
        </div>
      </section>

      {/* Why Choose Cexora */}
      <section className="why-choose-section">
        <h2 className="section-title">Tại sao chọn Cexora?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <FiShield />
            </div>
            <h3>Bảo mật tuyệt đối</h3>
            <p>95% tài sản được lưu trữ trong ví lạnh, xác thực 2FA và công nghệ mã hóa tiên tiến</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <FiZap />
            </div>
            <h3>Giao dịch siêu nhanh</h3>
            <p>Công nghệ Oracle giúp xử lý giao dịch chỉ trong vài giây với độ chính xác cao</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <FiDollarSign />
            </div>
            <h3>Phí thấp nhất</h3>
            <p>Chỉ 0.1% phí giao dịch với chương trình giảm phí cho khối lượng lớn</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">
              <FiUsers />
            </div>
            <h3>Hỗ trợ 24/7</h3>
            <p>Đội ngũ chăm sóc khách hàng chuyên nghiệp luôn sẵn sàng hỗ trợ bạn mọi lúc</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Câu hỏi thường gặp</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeAccordion === index ? 'active' : ''}`}
            >
              <div 
                className="faq-question" 
                onClick={() => toggleAccordion(index)}
              >
                <h3>{faq.question}</h3>
                {activeAccordion === index ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Sẵn sàng bắt đầu giao dịch?</h2>
          <p>Tham gia cùng 500,000+ người dùng đang giao dịch trên Cexora</p>
          <Link to="/register" className="btn btn-primary btn-large btn-glow">
            Đăng ký miễn phí
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
