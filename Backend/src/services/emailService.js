const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ Email enviado para ${to}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${to}:`, error);
    throw error;
  }
};

// Template: Código de Convite para novo cliente
const emailCodigoConvite = (codigo, urlRegistro) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; text-align: center; }
        .code-box { background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px auto; width: fit-content; }
        .code-box .code { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
        .button { background-color: #4a90e2; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        h1 { color: white; }
        p { color: #333; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao JJGarage!</h1>
        </div>
        <div class="content">
          <p>Obrigado por adquirir a sua subscrição no JJGarage! Abaixo encontra o seu código de acesso:</p>
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #ccc;">Código de Acesso</p>
            <div class="code">${codigo}</div>
          </div>
          <p>Use este código para completar o seu registo:</p>
          <table align="center" style="margin-top: 10px;">
            <tr>
              <td>
                <a href="https://jjgarage.pt/register?codigo=${codigo}" class="button">Completar Registo</a>
              </td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666;"><strong>Nota:</strong> Este código é válido por 30 dias.</p>
        </div>
        <div class="footer">
          <p>JJGarage © 2025 | Sistema de Gestão para Oficinas</p>
          <p>Se tiver dúvidas, contacte-nos através do nosso site.</p>
        </div>
      </div>
    </body>
  </html>
`;

// Template: Bem-vindo de volta (reativação)
const emailBemVindoDeVolta = (nomeOficina) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        h2 { color: #1a1a1a; }
        p { color: #333; line-height: 1.6; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Bem-vindo de Volta!</h1>
        </div>
        <div class="content">
          <h2>Olá ${nomeOficina},</h2>
          <p>A sua subscrição foi reativada com sucesso! Pode agora aceder ao JJGarage novamente.</p>
          <p>Seu acesso está <strong>ativo</strong> e pronto para usar. Aproveite todas as funcionalidades da plataforma.</p>
          <a href="https://jjgarage.pt/login" class="button">Aceder ao JJGarage</a>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">Se não reativou a sua subscrição, por favor ignore este email.</p>
        </div>
        <div class="footer">
          <p>JJGarage © 2025 | Sistema de Gestão para Oficinas</p>
        </div>
      </div>
    </body>
  </html>
`;

// Template: Recuperação de Password
const emailRecuperacaoPassword = (nomeOficina, resetLink) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        h2 { color: #1a1a1a; }
        p { color: #333; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Redefinir Palavra-passe</h1>
        </div>
        <div class="content">
          <h2>Olá ${nomeOficina},</h2>
          <p>Recebemos um pedido para redefinir a sua palavra-passe do JJGarage.</p>
          <div class="warning">
            <p><strong>⚠️ Atenção:</strong> Este link válido por <strong>1 hora</strong>. Clique no botão abaixo para redefinir a sua palavra-passe.</p>
          </div>
          <a href="${resetLink}" class="button">Redefinir Palavra-passe</a>
          <p style="margin-top: 30px; color: #666;">Se não solicitou esta alteração, pode ignorar este email com segurança. A sua conta está protegida.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Link de reset: <br><code>${resetLink}</code></p>
        </div>
        <div class="footer">
          <p>JJGarage © 2025 | Sistema de Gestão para Oficinas</p>
        </div>
      </div>
    </body>
  </html>
`;

// Template: Notificação de Suspensão
const emailSuspensao = (nomeOficina) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #e74c3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .warning { background-color: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
        h2 { color: #1a1a1a; }
        p { color: #333; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏸️ Subscrição Suspensa</h1>
        </div>
        <div class="content">
          <h2>Olá ${nomeOficina},</h2>
          <p>A sua subscrição do JJGarage foi suspensa.</p>
          <div class="warning">
            <p><strong>Motivo:</strong> Pagamento não recebido ou subscrição cancelada.</p>
            <p>O seu acesso ao JJGarage está temporariamente indisponível até que regularize o pagamento.</p>
          </div>
          <p>Para reativar a sua subscrição, visite:</p>
          <a href="https://whop.com" class="button">Regularizar Pagamento</a>
          <p style="margin-top: 30px; color: #666;">Se tiver dúvidas, contacte-nos para apoio.</p>
        </div>
        <div class="footer">
          <p>JJGarage © 2025 | Sistema de Gestão para Oficinas</p>
        </div>
      </div>
    </body>
  </html>
`;

module.exports = {
  sendEmail,
  emailCodigoConvite,
  emailBemVindoDeVolta,
  emailRecuperacaoPassword,
  emailSuspensao,
};
