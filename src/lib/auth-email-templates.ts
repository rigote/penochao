
export function html(params: { url: string; host: string }) {
  const { url: code, host } = params

  const escapedHost = host.replace(/\./g, "&#8203;.")

  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    codeBackground: "#f4f4f5",
    codeText: "#18181b",
    borderColor: "#e4e4e7"
  }

  return `
<body style="background: ${color.background}; font-family: Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 12px; border: 1px solid ${color.borderColor};">
    <tr>
      <td align="center"
        style="padding: 24px 0px 10px 0px; font-size: 24px; color: ${color.text}; font-weight: 600;">
        Login para <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 20px 0px; font-size: 16px; color: ${color.text};">
        Use o código abaixo para fazer login na sua conta.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 8px; background: ${color.codeBackground}; border: 1px solid ${color.borderColor};">
                <div style="font-size: 32px; font-family: 'Courier New', monospace; color: ${color.codeText}; letter-spacing: 8px; font-weight: bold; padding: 24px 40px;">
                  ${code}
                </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 14px; color: #71717a;">
        Este código expira em 5 minutos.
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 20px 0px; font-size: 12px; color: #a1a1aa; border-top: 1px solid ${color.borderColor};">
        Se você não solicitou este email, pode ignorá-lo com segurança.
      </td>
    </tr>
  </table>
</body>
`
}

/** Email Text body (fallback for email clients that don't render HTML) */
export function text({ url, host }: { url: string; host: string }) {
  return `Login para ${host}\nSeu código de acesso é: ${url}\n\n`
}

