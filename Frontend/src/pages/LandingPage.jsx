import React, { useState, useEffect } from "react";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1920", // Imagem 1: Estúdio automotivo premium e iluminado
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920", // Imagem 2: Detalhe dinâmico
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1920", // Imagem 3: Silhueta elegante
];

export default function LandingPage({ onNavigateToLogin }) {
  const [currentBg, setCurrentBg] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Handler para scroll suave controlado por JavaScript
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Como funciona o período de subscrição e acesso?",
      a: "O processamento é gerido de forma 100% segura através do Whop. Assim que conclui a adesão, o seu acesso ao ecossistema JJGarage é libertado instantaneamente. Sem fidelizações obrigatórias.",
    },
    {
      q: "Preciso de instalar algum programa no meu computador ou servidor?",
      a: "Não. O JJGarage é um ecossistema inteiramente SaaS alojado na cloud. Pode aceder através do computador, tablet ou smartphone sem instalar nada, bastando uma ligação à internet.",
    },
    {
      q: "Os dados dos meus clientes e veículos ficam seguros?",
      a: "Totalmente. A nossa infraestrutura de base de dados está isolada num servidor VPS de alta performance na Europa (Hetzner), contando com backups automáticos e comunicações encriptadas por certificados SSL.",
    },
  ];

  return (
    <div className="lp-wrapper">
      {/* NAVBAR GLASSMORPHIC AZULADA */}
      <nav className="lp-navbar">
        <div
          className="lp-logo-text"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ cursor: "pointer" }}
        >
          {/* Voltou o logo escrito JJGARAGE */}
          <span className="logo-blue">JJ</span>GARAGE
        </div>
        <div className="lp-nav-links">
          <a href="#demo" onClick={(e) => handleSmoothScroll(e, "demo")}>
            Demonstração
          </a>
          <a
            href="#features"
            onClick={(e) => handleSmoothScroll(e, "features")}
          >
            Funcionalidades
          </a>
          <a href="#about" onClick={(e) => handleSmoothScroll(e, "about")}>
            Sobre Mim
          </a>
          <a href="#faq" onClick={(e) => handleSmoothScroll(e, "faq")}>
            Perguntas Frequentes
          </a>
        </div>
        <button className="lp-btn-login" onClick={onNavigateToLogin}>
          Área de Membros →
        </button>
      </nav>

      {/* HERO SECTION EQUILIBRADA */}
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
            Centralize a gestão de clientes, histórico de veículos e folhas de
            obra num ecossistema moderno impulsionado por Inteligência
            Artificial.
          </p>
          <div className="lp-hero-actions">
            <a
              href="https://whop.com/jjgarage"
              target="_blank"
              rel="noreferrer"
              className="lp-btn-cta"
            >
              Torne-se Membro do JJGarage
            </a>
            <span className="lp-cta-subtext">
              Adesão imediata e segura via Whop
            </span>
          </div>
        </div>
        <div className="lp-scroll-indicator">↓ Explore as soluções</div>
      </header>

      {/* STORYTELLING & MULTIMÉDIA */}
      <section id="demo" className="lp-demo-section">
        <div className="lp-container lp-demo-grid">
          <div className="lp-demo-text">
            <span className="section-subtitle">O FIM DO CAOS ANALÓGICO</span>
            <h2>Construído para quem valoriza tempo e precisão.</h2>
            <p>
              Sabemos que gerir um centro de serviços automóveis exige foco.
              Perder minutos preciosos a preencher fichas técnicas à mão,
              procurar históricos perdidos ou estruturar faturas atrasa o
              crescimento da sua marca.
            </p>
            <p>
              O JJGarage elimina as barreiras burocráticas para que possa
              focar-se no que realmente importa: a execução do serviço e a
              satisfação do cliente.
            </p>
          </div>

          <div className="lp-video-container">
            <div className="lp-video-wrapper">
              <iframe
                src="https://www.youtube.com/embed/placeholder"
                title="JJGarage Tour"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS COM RITMO VISUAL */}
      <section id="features" className="lp-features-section">
        <div className="lp-container">
          <div className="center-header">
            <span className="section-subtitle">DENTRO DA PLATAFORMA</span>
            <h2 className="section-title">
              Automatizações desenvolvidas para o mundo real
            </h2>
          </div>

          {/* Bloco 1: CRM & Dash */}
          <div className="lp-feature-row">
            <div className="lp-feature-info">
              <div className="feature-number">01</div>
              <h3>Controlo de Serviços & Faturação Clara</h3>
              <p>
                Organize ordens de serviço e associe-as instantaneamente ao
                perfil de cada cliente. O sistema calcula automaticamente os
                totais cruzando o custo das peças com a mão de obra em tempo
                real, gerando PDFs prontos para download ou para envio via
                WhatsApp.
              </p>
            </div>
            <div className="lp-feature-image-slot">
              <div className="lp-mockup-window">
                <div className="mockup-header">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="mockup-content-label">
                  <img
                    src="../assets/img/image.png"
                    alt="Visão Geral do Painel de Controlo"
                    className="feature-image"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 2: VIN & Gemini AI */}
          <div className="lp-feature-row reverse">
            <div className="lp-feature-info">
              <div className="feature-number">02</div>
              <h3>Identificação por VIN e Identidade por IA</h3>
              <p>
                Esqueça os erros de digitação ao registar um veículo. Introduza
                o número de chassi (VIN) para decifrar especificidades técnicas
                de forma automática. De seguida, deixe a inteligência artificial
                do Google Gemini criar o perfil visual do carro com base nos
                dados estruturados.
              </p>
            </div>
            <div className="lp-feature-image-slot">
              <div className="lp-mockup-window">
                <div className="mockup-header">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="mockup-content-label">
                  <img
                    src="../assets/img/Veiculos.png"
                    alt="Visão Geral dos Veículos"
                    className="feature-image"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 3: Dashboard & Métricas */}
          <div className="lp-feature-row">
            <div className="lp-feature-info">
              <div className="feature-number">03</div>
              <h3>Métricas em Tempo Real & Gestão de Performance</h3>
              <p>
                Tenha o controlo absoluto da saúde financeira e operacional do
                seu negócio automóvel num único ecrã. Monitorize a receita total
                gerada, a receita total somente da mão de obra e a distribuição
                estatística dos serviços concluídos mês a mês através de
                gráficos analíticos e intuitivos.
              </p>
            </div>
            <div className="lp-feature-image-slot">
              <div className="lp-mockup-window">
                <div className="mockup-header">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="mockup-content-label">
                  <img
                    src="/assets/img/Dashboard.png"
                    alt="Painel de Controlo e Estatísticas JJGarage"
                    className="feature-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS DA INFRAESTRUTURA (SEM EMOJIS) */}
      <section className="lp-cards-section">
        <div className="lp-container lp-cards-grid">
          <div className="lp-card">
            <h4>Latência Reduzida</h4>
            <p>
              Infraestrutura distribuída com servidores de alta performance
              localizados na Europa para garantir velocidade máxima de
              carregamento.
            </p>
          </div>
          <div className="lp-card">
            <h4>Isolamento de Dados</h4>
            <p>
              Base de dados MySQL dedicada e independente, protegida de acessos
              externos e configurada com backups regulares.
            </p>
          </div>
          <div className="lp-card">
            <h4>Layout Responsivo</h4>
            <p>
              Aceda a partir do computador do escritório ou do telemóvel na zona
              de trabalho. Interface otimizada para qualquer ecrã.
            </p>
          </div>
        </div>
      </section>

      {/* SECÇÃO SOBRE MIM & CONTACTO */}
      <section id="about" className="lp-about-section">
        <div className="lp-container lp-about-grid">
          {/* Lado Esquerdo: A tua foto vertical */}
          <div className="lp-about-image-slot">
            <div className="lp-profile-card">
              <img
                src="../assets/img/_MG_1631.JPG"
                alt="Criador do JJGarage"
                className="lp-profile-image"
              />
            </div>
          </div>

          {/* Lado Direito: O Teu Storytelling e Contacto */}
          <div className="lp-about-text">
            <span className="section-subtitle">POR TRÁS DO PROJETO</span>
            <h2>Mudar a visão de quem trabalha no terreno.</h2>
            <p>
              Olá! Sou um jovem focado nos meus objetivos e o{" "}
              <strong>JJGarage</strong> é o meu primeiro grande projeto
              desenvolvido inteiramente a solo. Tenho vindo a trabalhar e a
              aperfeiçoar este ecossistema de forma dedicada ao longo dos
              últimos meses.
            </p>
            <p>
              A ideia de criar esta plataforma nasceu quando percebi uma
              realidade muito clara no mercado: muitos profissionais e mecânicos
              que realizam os seus serviços de forma independente sofrem com a
              falta de organização cronológica. É extremamente comum perderem o
              histórico mecânico dos veículos dos clientes e, pior, não terem
              uma noção exata de quanto dinheiro estão realmente a faturar ao
              fim do mês.
            </p>
            <p>
              O intuito absoluto do JJGarage é mudar essa visão. Desenvolvi esta
              ferramenta para provar que a gestão automóvel não tem de ser
              complexa, burocrática ou feita em cadernos rasurados. Qualquer
              profissional merece ter o controlo do seu negócio.
            </p>

            {/* Bloco de Contacto Direto Integrado */}
            <div className="lp-about-contact-box">
              <h5>Vamos conversar?</h5>
              <p>
                Se tem dúvidas, sugestões ou quer uma demonstração
                personalizada, estou totalmente disponível.
              </p>
              <div className="lp-contact-links">
                <a href="mailto:geral@jjgarage.pt" className="lp-contact-link">
                  geral@jjgarage.pt
                </a>
                <span className="lp-contact-divider">|</span>
                <a
                  href="https://wa.me/351966222828?text=Ol%C3%A1!%20Vi%20a%20p%C3%A1gina%20do%20JJGarage%20e%20gostaria%20de%20saber%20mais%20informa%C3%A7%C3%B5es."
                  target="_blank"
                  rel="noreferrer"
                  className="lp-contact-link-alt"
                >
                  Envie mensagem privada
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO FAQ */}
      <section id="faq" className="lp-faq-section">
        <div className="lp-container max-800">
          <span className="section-subtitle center">DÚVIDAS FREQUENTES</span>
          <h2 className="section-title center">Perguntas Frequentes</h2>

          <div className="lp-accordion">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`lp-accordion-item ${activeFaq === index ? "open" : ""}`}
              >
                <button
                  className="lp-accordion-trigger"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <span className="arrow">
                    {activeFaq === index ? "−" : "+"}
                  </span>
                </button>
                <div className="lp-accordion-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta-final">
        <div className="lp-container">
          <h2>Pronto para elevar o nível da sua gestão?</h2>
          <p>
            Adira agora através do Whop e transforme a rotina do seu negócio
            automóvel hoje mesmo.
          </p>
          <a
            href="https://whop.com/jjgarage"
            target="_blank"
            rel="noreferrer"
            className="lp-btn-cta-white"
          >
            Começar Agora
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>
          &copy; {new Date().getFullYear()} JJGarage. Todos os direitos
          reservados.
        </p>
      </footer>
    </div>
  );
}
