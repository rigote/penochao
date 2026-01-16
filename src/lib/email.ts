import { Resend } from 'resend'
import { WelcomeEmail } from '@/app/components/emails/WelcomeEmail'
import { renderAsync } from '@react-email/render'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const html = await renderAsync(WelcomeEmail({ userFirstName: firstName }))

    const data = await resend.emails.send({
      from: 'onboarding@yourdomain.com',
      to: email,
      subject: `Welcome to our platform, ${firstName}!`,
      html,
    })

    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}
