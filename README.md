# JJAUTOGARAGE
# Software de Gestão para Mecânicos Independentes e Oficinas

Um sistema web completo (SaaS) desenvolvido para modernizar e simplificar o dia a dia de oficinas mecânicas. Permite a gestão integrada de clientes, veículos e histórico de serviços mecânicos com uma interface moderna, rápida e intuitiva.

## ✨ Funcionalidades Principais

* 🤖 **Inteligência Artificial (Google Gemini API):** Integração com IA para geração e preenchimento inteligente através dos dados dos veículos registados, prestando assim visual idêntico ao veículo pretendido.
* 🔍 **Descodificador de VIN Automático:** Preenchimento automático dos dados técnicos do veículo através da integração com uma API de VIN (Vehicle Identification Number), poupando tempo de introdução manual e evitando erros.
* ☁️ **Armazenamento Seguro na Cloud:** Sistema de upload de imagens integrado com o Cloudinary, garantindo armazenamento persistente, rápido e sem perdas de dados em deployments.
* 👥 **Gestão de Clientes:** Criação, edição e pesquisa avançada. Inclui validações de segurança (prevenção de eliminação de clientes com veículos associados).
* 🚗 **Gestão de Frota (Veículos):** Registo detalhado de viaturas associadas a clientes. Interface em grelha responsiva e sistema de pesquisa em tempo real.
* 📋 **Gestão de Serviços:** Registo de reparações, peças substituídas (artigos), custos e observações técnicas. Bloqueio de edição após 7 dias da conclusão do serviço para garantia contabilística.
* 🖨️ **Geração de Faturas/Relatórios (PDF):** Exportação de folhas de serviço para PDF com layout formatado e limpo.
* 🎨 **UI/UX Premium:** Interface limpa com ecrãs modais de confirmação, efeitos de *watermark* e navegação fluída.

## 💻 Tecnologias e Integrações Utilizadas

**Frontend:**
* [React](https://reactjs.org/) (com Vite para *builds* ultra rápidos)
* React Router Dom (Navegação SPA)
* CSS Nativo (Arquitetura orientada a componentes, CSS Grid e Flexbox)

**Backend & APIs:**
* [Node.js](https://nodejs.org/) com Express
* **Google Gemini API:** Utilizada para processamento inteligente e geração de veículos.
* **VIN Decoder API:** Integração com API REST externa para obtenção de dados automóveis em tempo real.
* **Cloudinary & Multer:** Pipeline de upload de ficheiros com armazenamento persistente e otimizado na cloud.
* API RESTful estruturada com rotas e controladores.

**Base de Dados & Infraestrutura:**
* MySQL (Base de dados relacional que garante a integridade de todas as faturas e clientes)
* Alojamento inicial configurado via [Railway](https://railway.app/)
