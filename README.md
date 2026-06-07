# JJGarage — Sistema de Gestão para Oficinas e Mecânicos Independentes

O **JJGarage** é um software de gestão como serviço (SaaS) moderno, ágil e robusto, desenhado especificamente para responder às necessidades de mecânicos independentes e oficinas em fase inicial que procuram profissionalizar a sua operação. O sistema centraliza o controlo de clientes, registos detalhados de veículos e histórico completo de ordens de serviço, oferecendo automatizações avançadas, inteligência artificial e gestão automatizada de subscrições.

---

## 🌟 Funcionalidades Principais & Diferenciais

### 1. Gestão Centralizada (CRM & ERP Automotivo)
* **Controlo de Clientes:** Registo completo de perfis, contactos e histórico de intervenções associadas.
* **Gestão de Veículos:** Inventário completo de viaturas com rastreio de especificidades técnicas.
* **Ordens de Serviço Inteligentes:** Criação de folhas de obra dinâmicas. O sistema calcula automaticamente o valor total somando o custo das peças à **Mão de Obra (Labor Cost)** em tempo real.

### 2. Automatizações & Integrações Premium
* **Gestão de Acessos via Whop Webhooks:** Integração nativa com a plataforma **Whop** para monetização do SaaS. O backend processa webhooks em tempo real para gerir o ciclo de vida das subscrições dos utilizadores (ativação após compra, suspensão por falta de pagamento ou cancelamento), garantindo o controlo de acessos automatizado e sem intervenção manual.
* **Integração com Google Gemini API:** Inteligência Artificial integrada diretamente no ecossistema. Com base nos dados inseridos no formulário do veículo, o backend gera prompts estruturados e devolve insights visuais e análises preditivas contextualizadas diretamente para o frontend.
* **VIN Decoder API:** Integração nativa com API REST que decifra instantaneamente o número de identificação do veículo (VIN), preenchendo automaticamente a marca, modelo, ano, motorização e especificações técnicas sem erros de digitação.
* **Faturação Automática em PDF:** Emissão e exportação instantânea de orçamentos e faturas detalhadas em formato PDF profissional, prontas para envio imediato ao cliente por WhatsApp ou E-mail.

### 3. Gestão Avançada de Ficheiros & Anexos
* Sistema híbrido robusto configurado com **Multer e Cloudinary** capaz de processar imagens, vídeos de diagnósticos e documentos de forma segura.
* **Engine de Previews Customizada:** Visualização em grelha otimizada contra overflows (max-height de 250px com scroll fluído) e renderização nativa de PDFs via `iframe` com máscaras CSS que removem as barras de scroll internas feias do navegador.
* Separação inteligente de ficheiros em ambiente Cloudinary (`resource_type: "raw"` para PDFs estruturados e `"auto"` para ficheiros de media).

---

## 🛠️ Stack Tecnológica

### Frontend
* **Framework:** React.js
* **Build Tool:** Vite (compilação ultra-rápida em ambiente de produção)
* **Estilização:** CSS3 Customizado (layouts fluidos com herança limpa e resets estritos para inputs numéricos, eliminando os *spin buttons* nativos).

### Backend & API
* **Ambiente de Execução:** Node.js
* **Framework Web:** Express.js
* **Upload Handler:** Multer (Memory Storage) + Cloudinary SDK
* **Monetização/Licenciamento:** Whop Webhooks API

### Base de Dados
* **SGBD:** MySQL / SQL estruturado
* **Gestão de Dados:** DBeaver Enterprise / Workbench

---

## 🌐 Arquitetura de Infraestrutura e Deploy

A infraestrutura foi desenhada seguindo o modelo de separação de responsabilidades (Decoupled Architecture), garantindo escalabilidade individual, latência reduzida na Europa e segurança de dados:

* **Frontend Deploy:** Alojado na **Vercel** com pipeline de Integração Contínua (CI/CD) conectado diretamente ao repositório do GitHub (compilação e deploy automáticos a cada push).
* **Backend & API Gateway (`api.jjgarage.pt`):** Alojado num VPS de alta performance na **Hetzner**, gerido em produção através do **PM2 Process Manager** para garantir resiliência e uptime de 100% (auto-restart em caso de falha).
* **Reverse Proxy:** Servidor **Nginx** configurado no VPS da Hetzner atuando como proxy reverso, gerenciando certificados SSL e encaminhando de forma segura o tráfego para o ecossistema Node.js.
* **Base de Dados SQL:** Instância MySQL dedicada e isolada dentro da infraestrutura da **Hetzner**, gerida de forma remota via túneis SQL seguros no DBeaver.

---

## 📦 Estrutura de Pastas Simplificada

```text
jjgarage/
├── Backend/                 # Servidor API Node.js & Express
│   ├── src/
│   │   ├── config/          # Conexões a Base de Dados e Cloudinary
│   │   ├── controllers/     # Lógica (servicoController, whopWebhookController, Gemini, etc.)
│   │   └── routes/          # Endpoints REST e Webhooks expostos
│   ├── package.json
│   └── server.js
└── Frontend/                # Aplicação Single Page React (Vite)
    ├── src/
    │   ├── components/      # Componentes UI reutilizáveis (Modais, Forms)
    │   ├── pages/           # Vistas Principais (DashboardPage, Clientes)
    │   └── styles/          # Ficheiros de Estilo Globais (main.css com resets estritos)
    ├── package.json
    └── vite.config.js


