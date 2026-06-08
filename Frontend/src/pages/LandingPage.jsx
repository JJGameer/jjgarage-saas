import React, { useState, useEffect } from "react";
import landingpageStyles from "../styles/LandingPage.css";

// Imagens de fundo para o Carrossel (substituir pelos teus caminhos ou URLs reais de carros)
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1920", // Carro 1
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920", // Carro 2
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1920", // Carro 3
];

export default function LandingPage({ onNavigateToLogin }) {
  const [currentBg, setCurrentBg] = useState(0);

  // Altera a imagem de fundo a cada 10 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="lp-wrapper">
      {/* NAVBAR */}
      <nav className="lp-navbar">
        <div className="lp-logo">
          <span className="logo-blue">JJ</span>GARAGE
        </div>
        <div className="lp-nav-links">
          <a href="#features">Funcionalidades</a>
          <a href="#demo">Demonstração</a>
          <a href="#pricing">Planos</a>
        </div>
        <button className="lp-btn-login" onClick={onNavigateToLogin}>
          Entrar / Registar
        </button>
      </nav>

      {/* HERO SECTION */}
      <header className="lp-hero">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={img}
            className={`lp-hero-bg ${index === currentBg ? "active" : ""}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="lp-hero-overlay" />

        <div className="lp-hero-content">
          <h1>A gestão inteligente do seu negócio automóvel começa aqui.</h1>
          <p>
            Centralize clientes, ordens de serviço, veículos e faturação numa
            plataforma ágil impulsionada por Inteligência Artificial.
          </p>
          <a
            href="https://whop.com/jjgarage"
            target="_blank"
            rel="noreferrer"
            className="lp-btn-cta"
          >
            Adere já
          </a>
        </div>
      </header>

      {/* SECÇÃO DEMO & VÍDEO VERTICAL */}
      <section id="demo" className="lp-demo-section">
        <div className="lp-container lp-demo-grid">
          <div className="lp-demo-text">
            <h2>Desenhado para o ritmo do seu centro automóvel.</h2>
            <p>
              Esqueça os papéis rasurados e as folhas de Excel confusas. O
              JJGarage foi estruturado para ser simples, rápido e totalmente
              focado na produtividade do seu dia a dia.
            </p>
            <ul className="lp-minimal-list">
              <li>✓ Acesso seguro a partir de qualquer dispositivo.</li>
              <li>✓ Interface limpa e intuitiva sem menus burocráticos.</li>
              <li>✓ Atualizações automáticas na cloud.</li>
            </ul>
          </div>

          {/* Espaço Vertical para o Vídeo Promocional */}
          <div className="lp-video-container">
            <div className="lp-video-wrapper">
              {/* Substituir o src pelo link real do teu vídeo embutido */}
              <iframe
                src="https://www.youtube.com/embed/placeholder"
                title="JJGarage Promo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* SECÇÃO FUNCIONALIDADES */}
      <section id="features" className="lp-features-section">
        <div className="lp-container">
          <h2 className="section-title">Automatizações de Próxima Geração</h2>

          {/* Bloco 1: CRM & Serviços */}
          <div className="lp-feature-row">
            <div className="lp-feature-info">
              <h3>Gestão de Clientes e Folhas de Obra Dinâmicas</h3>
              <p>
                Controle perfis de clientes, histórico de intervenções e ordens
                de serviço num clique. O sistema calcula automaticamente os
                totais somando as peças à mão de obra em tempo real.
              </p>
            </div>
            <div className="lp-feature-image-slot">
              {/* METER PRINT: image_98108b.png ou image_97f9a5.jpg */}
              <div className="lp-image-placeholder">
                <span>
                  [Inserir aqui print da Dashboard ou Clientes -
                  image_98108b.png]
                </span>
              </div>
            </div>
          </div>

          {/* Bloco 2: IA & VIN */}
          <div className="lp-feature-row reverse">
            <div className="lp-feature-info">
              <h3>Ficha Técnica via VIN & Imagens por IA</h3>
              <p>
                Insira o número de chassi (VIN) para decifrar dados técnicos
                instantaneamente através da nossa API. Potenciado com a API do
                Google Gemini, o sistema gera o perfil visual exato do veículo
                automaticamente.
              </p>
            </div>
            <div className="lp-feature-image-slot">
              {/* METER PRINT: image_9810c8.jpg */}
              <div className="lp-image-placeholder">
                <span>
                  [Inserir aqui print do Catálogo de Veículos -
                  image_9810c8.jpg]
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>
          &copy; {new Date().getFullYear()} JJGarage. Todos os direitos
          reservados. Uso Privado.
        </p>
      </footer>
    </div>
  );
}
