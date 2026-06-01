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
      from: `"JJGarage" <${process.env.SMTP_USER}>`,
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
const emailCodigoConvite = (codigo) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎉 Bem-vindo ao JJGarage!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Obrigado por adquirir a sua subscrição no JJGarage! Abaixo encontra o seu código de acesso:
          </p>

          <!-- Code Box -->
          <div style="background-color: #4a90e2; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px; margin: 25px auto; width: fit-content; min-width: 250px;">
            <p style="margin: 0; font-size: 12px; color: #e0e0e0; letter-spacing: 1px;">CÓDIGO DE ACESSO</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #ffffff; margin-top: 12px;">${codigo}</div>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0 20px 0;">
            Use este código para completar o seu registo:
          </p>

          <!-- Button (Centered with Table) -->
          <table align="center" style="margin: 25px auto; text-align: center;">
            <tr>
              <td>
                <a href="https://jjgarage.pt/register?codigo=${codigo}" style="background-color: #4a90e2; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; text-align: center; font-size: 16px;">
                  Completar Registo
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #666; font-size: 14px; margin-top: 25px;">
            <strong>Nota:</strong> Este código é válido por 30 dias.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">
            JJGarage © 2026 | Sistema de Gestão Automóvel
          </p>
          <p style="color: #999; font-size: 11px; margin: 0;">
            Se tiver dúvidas, contacte-nos através do nosso site.
          </p>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">Bem-vindo de Volta!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: left;">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px 0;">Olá ${nomeOficina},</h2>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            A sua subscrição foi reativada com sucesso! Pode agora aceder ao JJGarage novamente.
          </p>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            Seu acesso está <strong>ativo</strong> e pronto para usar. Aproveite todas as funcionalidades da plataforma.
          </p>

          <!-- Button (Centered with Table) -->
          <table align="center" style="margin: 25px auto; text-align: center; width: 100%;">
            <tr>
              <td align="center">
                <a href="https://jjgarage.pt/login" style="background-color: #4a90e2; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; text-align: center; font-size: 16px;">
                  Aceder ao JJGarage
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #999; font-size: 12px; margin-top: 25px; text-align: center;">
            Se não reativou a sua subscrição, por favor ignore este email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            JJGarage © 2026 | Sistema de Gestão Automóvel
          </p>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">Redefinir Palavra-passe</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: left;">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px 0;">Olá ${nomeOficina},</h2>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Recebemos um pedido para redefinir a sua palavra-passe do JJGarage.
          </p>

          <!-- Warning Box -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #856404; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
              ⚠️ Atenção: Este link é válido por apenas 1 hora
            </p>
            <p style="color: #856404; font-size: 14px; margin: 0;">
              Clique no botão abaixo para redefinir a sua palavra-passe.
            </p>
          </div>

          <!-- Button (Centered with Table) -->
          <table align="center" style="margin: 30px auto; text-align: center; width: 100%;">
            <tr>
              <td align="center">
                <a href="${resetLink}" style="background-color: #4a90e2; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; text-align: center; font-size: 16px;">
                  Redefinir Palavra-passe
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 25px 0 15px 0;">
            Se não solicitou esta alteração, pode ignorar este email com segurança. A sua conta está protegida.
          </p>

          <p style="color: #999; font-size: 12px; margin: 0; word-break: break-all;">
            <strong>Link:</strong> ${resetLink}
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            JJGarage © 2026 | Sistema de Gestão Automóvel
          </p>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <!-- Header (Red gradient) -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #e74c3c 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">⏸️ Subscrição Suspensa</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: left;">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px 0;">Olá ${nomeOficina},</h2>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            A sua subscrição do JJGarage foi suspensa.
          </p>

          <!-- Warning Box (Red) -->
          <div style="background-color: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #721c24; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
              ❌ Motivo: Pagamento não recebido ou subscrição cancelada
            </p>
            <p style="color: #721c24; font-size: 14px; margin: 0;">
              O seu acesso ao JJGarage está temporariamente indisponível até que regularize o pagamento.
            </p>
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0 20px 0;">
            Para reativar a sua subscrição, visite:
          </p>

          <!-- Button (Centered with Table) -->
          <table align="center" style="margin: 25px auto; text-align: center; width: 100%;">
            <tr>
              <td align="center">
                <a href="https://whop.com" style="background-color: #4a90e2; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; text-align: center; font-size: 16px;">
                  Regularizar Pagamento
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #666; font-size: 15px; line-height: 1.6; margin-top: 25px;">
            Se tiver dúvidas, contacte-nos para apoio.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            JJGarage © 2026 | Sistema de Gestão Automóvel
          </p>
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
