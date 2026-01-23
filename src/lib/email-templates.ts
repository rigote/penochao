/**
 * Professional Email Templates for Penochão
 * Clean, minimal, enterprise-grade design
 */

// Brand colors
const BRAND = {
  primary: "#7c3aed",
  primaryDark: "#5b21b6",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  background: "#ffffff",
  backgroundAlt: "#f8fafc",
  border: "#e2e8f0",
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
}

// Minimal email wrapper - clean and professional
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Penochão</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 24px !important; }
      .code-text { font-size: 32px !important; letter-spacing: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundAlt}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Minimal logo
function logo(): string {
  return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-bottom: 32px;">
              <span style="font-size: 24px; font-weight: 700; color: ${BRAND.text}; letter-spacing: -0.5px;">
                <span style="color: ${BRAND.primary};">●</span> Penochão
              </span>
            </td>
          </tr>
        </table>`
}

// Footer
function footer(): string {
  return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="padding-top: 32px; border-top: 1px solid ${BRAND.border}; margin-top: 32px;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 13px; color: ${BRAND.textMuted}; line-height: 1.6;">
                © ${new Date().getFullYear()} Penochão. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>`
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Login OTP Code Email
 */
export function loginOtpEmail(params: { code: string; host: string }): { html: string; text: string } {
  const { code, host } = params
  
  const htmlContent = emailWrapper(`
        <table role="presentation" class="container" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: ${BRAND.background}; border-radius: 8px; border: 1px solid ${BRAND.border}; padding: 48px;">
          <tr>
            <td>
              ${logo()}
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: ${BRAND.text};">
                      Código de verificação
                    </h1>
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.5;">
                      Use o código abaixo para acessar sua conta em ${host}
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: ${BRAND.backgroundAlt}; border: 1px solid ${BRAND.border}; border-radius: 6px; padding: 20px 32px;">
                    <span class="code-text" style="font-family: 'SF Mono', 'Fira Code', 'Monaco', 'Consolas', monospace; font-size: 36px; font-weight: 600; color: ${BRAND.text}; letter-spacing: 12px;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND.textMuted};">
                      Este código expira em 5 minutos.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: ${BRAND.textMuted};">
                      Se você não solicitou este código, ignore este email.
                    </p>
                  </td>
                </tr>
              </table>
              
              ${footer()}
            </td>
          </tr>
        </table>
  `)
  
  const textContent = `Código de verificação

Use o código abaixo para acessar sua conta:

${code}

Este código expira em 5 minutos.

Se você não solicitou este código, ignore este email.

—
Penochão
`
  
  return { html: htmlContent, text: textContent }
}

/**
 * Email Change Confirmation
 */
export function emailChangeEmail(params: { newEmail: string; verificationUrl: string }): { html: string; text: string } {
  const { newEmail, verificationUrl } = params
  
  const htmlContent = emailWrapper(`
        <table role="presentation" class="container" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: ${BRAND.background}; border-radius: 8px; border: 1px solid ${BRAND.border}; padding: 48px;">
          <tr>
            <td>
              ${logo()}
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: ${BRAND.text};">
                      Confirme seu novo email
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: ${BRAND.textSecondary}; line-height: 1.5;">
                      Você solicitou a alteração do email da sua conta para:
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: ${BRAND.backgroundAlt}; border: 1px solid ${BRAND.border}; border-radius: 6px; padding: 12px 16px;">
                    <span style="font-size: 14px; font-weight: 500; color: ${BRAND.text};">
                      ${newEmail}
                    </span>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: ${BRAND.primary}; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 12px 24px; border-radius: 6px;">
                      Confirmar alteração
                    </a>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND.textMuted};">
                      Este link expira em 24 horas.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: ${BRAND.textMuted};">
                      Se você não solicitou esta alteração, ignore este email.
                    </p>
                  </td>
                </tr>
              </table>
              
              ${footer()}
            </td>
          </tr>
        </table>
  `)
  
  const textContent = `Confirme seu novo email

Você solicitou a alteração do email da sua conta para: ${newEmail}

Clique no link abaixo para confirmar:
${verificationUrl}

Este link expira em 24 horas.

Se você não solicitou esta alteração, ignore este email.

—
Penochão
`
  
  return { html: htmlContent, text: textContent }
}

/**
 * Feedback Notification Email (Internal)
 */
export function feedbackEmail(params: { 
  userName: string
  userEmail: string
  userPlan: "free" | "pro"
  type: string
  typeLabel: string
  message: string 
}): { html: string; text: string } {
  const { userName, userEmail, userPlan, type, typeLabel, message } = params
  
  const typeConfig: Record<string, { label: string; color: string }> = {
    suggestion: { label: "Sugestão", color: BRAND.success },
    bug: { label: "Bug", color: BRAND.error },
    other: { label: "Outro", color: BRAND.textSecondary }
  }
  
  const config = typeConfig[type] || typeConfig.other
  const planLabel = userPlan === "pro" ? "Pro" : "Free"
  const planColor = userPlan === "pro" ? BRAND.primary : BRAND.textMuted
  
  const timestamp = new Date().toLocaleString('pt-BR', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
  
  const htmlContent = emailWrapper(`
        <table role="presentation" class="container" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: ${BRAND.background}; border-radius: 8px; border: 1px solid ${BRAND.border}; padding: 48px;">
          <tr>
            <td>
              ${logo()}
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600; color: ${BRAND.text};">
                      Novo feedback recebido
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: ${BRAND.textMuted};">
                      ${timestamp}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Metadata Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid ${BRAND.border};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="80" style="font-size: 12px; font-weight: 500; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                          Usuário
                        </td>
                        <td style="font-size: 14px; color: ${BRAND.text};">
                          ${userName}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid ${BRAND.border};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="80" style="font-size: 12px; font-weight: 500; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                          Email
                        </td>
                        <td style="font-size: 14px;">
                          <a href="mailto:${userEmail}" style="color: ${BRAND.primary}; text-decoration: none;">${userEmail}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid ${BRAND.border};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="80" style="font-size: 12px; font-weight: 500; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                          Plano
                        </td>
                        <td>
                          <span style="display: inline-block; font-size: 12px; font-weight: 600; color: ${planColor}; background-color: ${userPlan === 'pro' ? '#ede9fe' : BRAND.backgroundAlt}; padding: 2px 8px; border-radius: 4px;">
                            ${planLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="80" style="font-size: 12px; font-weight: 500; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                          Tipo
                        </td>
                        <td>
                          <span style="display: inline-block; font-size: 12px; font-weight: 600; color: ${config.color};">
                            ${config.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 500; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                      Mensagem
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${BRAND.backgroundAlt}; border: 1px solid ${BRAND.border}; border-radius: 6px; padding: 16px;">
                    <p style="margin: 0; font-size: 14px; color: ${BRAND.text}; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Reply Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <a href="mailto:${userEmail}?subject=Re: Feedback Penochão" style="display: inline-block; background-color: ${BRAND.text}; color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 10px 20px; border-radius: 6px;">
                      Responder
                    </a>
                  </td>
                </tr>
              </table>
              
              ${footer()}
            </td>
          </tr>
        </table>
  `)
  
  const textContent = `Novo feedback recebido
${timestamp}

Usuário: ${userName}
Email: ${userEmail}
Plano: ${planLabel}
Tipo: ${config.label}

Mensagem:
${message}

—
Penochão
`
  
  return { html: htmlContent, text: textContent }
}

// Legacy exports for backward compatibility
export function html(params: { url: string; host: string }) {
  const { html: htmlContent } = loginOtpEmail({ code: params.url, host: params.host })
  return htmlContent
}

export function text(params: { url: string; host: string }) {
  const { text: textContent } = loginOtpEmail({ code: params.url, host: params.host })
  return textContent
}
