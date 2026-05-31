# Configuração de Webhooks Whop e Recuperação de Password

Este guia descreve como configurar e usar as funcionalidades de webhook do Whop e recuperação de password no JJGarage Backend.

## 📋 Pré-requisitos

1. **Node.js 16+** instalado
2. **MySQL** configurado e acessível
3. **SMTP** configurado (Gmail, SendGrid, ou outro provedor)
4. **Conta Whop** com webhook configurada

## 🚀 Instalação

### 1. Instalar Dependências

```bash
npm install nodemailer
```

O `nodemailer` é usado para enviar emails (templates de boas-vindas, recuperação de password, etc).

### 2. Configurar Variáveis de Ambiente

Copie o `.env.example` para `.env` e preencha com os valores reais:

```bash
cp .env.example .env
```

#### Variáveis Necessárias:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_HOST` | Host do servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta SMTP | `465` ou `587` |
| `SMTP_USER` | Email/usuário SMTP | `seu-email@gmail.com` |
| `SMTP_PASS` | Senha/token SMTP | `senha-ou-app-password` |
| `SMTP_FROM` | Email de origem | `noreply@jjgarage.pt` |
| `WHOP_WEBHOOK_SECRET` | Secret para validar webhooks (opcional) | `seu-secret-whop` |
| `FRONTEND_URL` | URL do frontend | `https://jjgarage.pt` |
| `JWT_SECRET` | Secret para JWT tokens | `sua-chave-secreta` |

### 3. Atualizar Base de Dados

Execute o script SQL para criar a tabela `PasswordReset` e adicionar as colunas necessárias:

```bash
mysql -u seu_usuario -p sua_base_dados < Backend/sql/whop_setup.sql
```

Alternativamente, execute manualmente no seu cliente MySQL:

```sql
-- Adicionar colunas à tabela CodigoConvite
ALTER TABLE `CodigoConvite`
ADD COLUMN `EmailWhop` varchar(100) DEFAULT NULL;

-- Adicionar colunas à tabela Oficina
ALTER TABLE `Oficina`
ADD COLUMN `EmailWhop` varchar(100) DEFAULT NULL,
ADD COLUMN `Status` tinyint(1) DEFAULT 1;

-- Criar tabela PasswordReset
CREATE TABLE IF NOT EXISTS `PasswordReset` (
  `ResetId` int AUTO_INCREMENT PRIMARY KEY,
  `OficinaId` int NOT NULL UNIQUE,
  `TokenHash` varchar(255) NOT NULL UNIQUE,
  `ExpiresAt` datetime NOT NULL,
  `CreatedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`OficinaId`) REFERENCES `Oficina`(`OficinaId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para performance
CREATE INDEX idx_emailwhop_oficina ON Oficina(EmailWhop);
CREATE INDEX idx_status_oficina ON Oficina(Status);
CREATE INDEX idx_emailwhop_codigo ON CodigoConvite(EmailWhop);
```

## 🔌 Endpoints da API

### Webhooks Whop

#### POST `/webhooks/whop`
Recebe eventos do Whop e processa ativações/cancelamentos de subscrições.

**Eventos suportados:**
- `membership_activated` - Novo cliente ou reativação
- `membership_deactivated` - Subscrição cancelada ou expirada

**Payload esperado:**
```json
{
  "event": "membership_activated",
  "data": {
    "email": "cliente@example.com",
    "id": "membership_123"
  }
}
```

**Fluxo Automático:**
1. Se cliente novo → Gera código de convite e envia por email
2. Se cliente existente → Reativa subscrição e envia email de boas-vindas
3. Se cancelamento → Suspende subscrição (Status = 0)

### Autenticação

#### POST `/auth/login`
**Atualizado:** Agora valida `Status` da oficina. Se `Status = 0`, retorna erro de subscrição suspensa.

```json
{
  "Email": "oficina@example.com",
  "Password": "senha123"
}
```

### Recuperação de Password

#### POST `/auth/forgot-password`
Inicia o processo de recuperação. Envia email com link de reset.

```json
{
  "email": "oficina@example.com"
}
```

**Resposta:**
- Status 200 (segurança: sempre retorna mensagem positiva)
- Email enviado se a conta existir

#### POST `/auth/reset-password`
Redefine a password usando o token do email.

```json
{
  "token": "token_do_email",
  "newPassword": "nova_senha_123"
}
```

**Validações:**
- Token deve estar válido (< 1 hora)
- Password mínimo 8 caracteres

## ⚙️ Configuração do Whop

### 1. Copiar URL do Webhook

A URL para configurar no Whop é:
```
https://jjgarage.pt/webhooks/whop
```

### 2. Adicionar no Whop Dashboard

1. Aceda ao Whop Dashboard
2. Settings → Webhooks
3. Adicione um novo webhook com a URL acima
4. Selecione os eventos:
   - `membership.activated`
   - `payment.succeeded`
   - `membership.canceled`
   - `membership.expired`
3. Copie o "Webhook Secret" e adicione a `.env` como `WHOP_WEBHOOK_SECRET`

### 3. Testar Webhook (Opcional)

Pode testar localmente usando `curl`:

```bash
curl -X POST http://localhost:3001/webhooks/whop \
  -H "Content-Type: application/json" \
  -d '{
    "event": "membership_activated",
    "data": {
      "email": "teste@example.com",
      "id": "membership_123"
    }
  }'
```

## 📧 Configuração de Email (Gmail)

Para usar Gmail com Nodemailer:

1. **Ativar 2FA** na sua conta Google
2. **Gerar App Password:**
   - Aceda a https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Windows Computer"
   - Copie a senha gerada (16 caracteres)
3. **Adicionar ao `.env`:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=senha-de-16-caracteres
   SMTP_FROM=seu-email@gmail.com
   ```

## 🔒 Segurança

### Boas Práticas Implementadas:

1. **Tokens de Reset com Expiração** (1 hora)
2. **Hash de tokens** antes de guardar na BD
3. **Validação de Status** nas rotas protegidas
4. **Transações MySQL** para operações críticas
5. **Senha mínimo 8 caracteres** validada no reset
6. **Verificação de disponibilidade de códigos** antes de usar

### ⚠️ Recomendações Adicionais:

- [ ] Adicionar rate limiting ao endpoint `/auth/forgot-password`
- [ ] Implementar signature verification para webhooks do Whop
- [ ] Registar todas as operações em audit logs
- [ ] Rotacionar `JWT_SECRET` periodicamente
- [ ] Usar HTTPS em produção

## 📂 Estrutura de Arquivos Criados

```
Backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js (atualizado)
│   │   ├── webhookController.js (novo)
│   │   └── passwordController.js (novo)
│   ├── routes/
│   │   ├── authRoutes.js (atualizado)
│   │   └── webhookRoutes.js (novo)
│   ├── services/
│   │   └── emailService.js (novo)
│   └── index.js (atualizado)
├── sql/
│   └── whop_setup.sql (novo)
├── .env.example (novo)
└── package.json (update nodemailer)
```

## 🧪 Testando Localmente

### 1. Iniciar o servidor
```bash
npm run dev
```

### 2. Testar Forgot Password
```bash
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "oficina@example.com"}'
```

### 3. Verificar Logs
O servidor mostrará:
```
✅ Email enviado para oficina@example.com
```

### 4. Testar Webhook
```bash
curl -X POST http://localhost:3001/webhooks/whop \
  -H "Content-Type: application/json" \
  -d '{
    "event": "membership.activated",
    "data": {"email": "novo@example.com"}
  }'
```

## 📝 Logs e Debugging

Todos os eventos são registados no console:
- ✅ Ações bem-sucedidas
- ❌ Erros críticos
- 📩 Emails enviados
- ⏸️ Subscrições suspensas

## 🆘 Troubleshooting

### Email não é enviado
- [ ] Verificar variáveis SMTP no `.env`
- [ ] Verificar se SMTP_PORT está correto (465 para SSL, 587 para TLS)
- [ ] Para Gmail: Verificar se a "App Password" foi gerada corretamente

### Webhook não funciona
- [ ] Verificar se a URL é acessível publicamente (não localhost)
- [ ] Verificar logs do servidor para erros
- [ ] Validar payload do webhook do Whop

### Reset de password não funciona
- [ ] Verificar se token não expirou (< 1 hora)
- [ ] Verificar se tabela PasswordReset existe
- [ ] Verificar se email está correto na BD

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Os logs do console
2. A configuração do `.env`
3. O estado da BD (colunas adicionadas)
4. A conectividade SMTP
