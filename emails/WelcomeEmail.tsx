import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  userFirstName?: string
}

export default function WelcomeEmail({ userFirstName = "John" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform, {userFirstName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {userFirstName}! 👋</Heading>
          <Text style={text}>
            We're excited to have you on board. Get started by exploring our
            features and let us know if you need any help.
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={button}
              href="https://your-app.com/getting-started"
            >
              Get Started
            </Button>
          </Section>
          <Text style={footer}>
            If you have any questions, just reply to this email - we're always
            happy to help out.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '24px 0',
}

const buttonContainer = {
  padding: '27px 0 27px',
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  margin: '24px 0',
}
