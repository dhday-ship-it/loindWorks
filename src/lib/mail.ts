import nodemailer from "nodemailer";

// Gmail SMTP(앱 비밀번호)로 보내는 알림 메일. 자격 증명이 없으면 조용히 건너뛴다 —
// 메일 발송은 부가 기능이라, 실패해도 주문 접수 같은 핵심 동작을 막아선 안 된다.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const client = getTransporter();
  if (!client) return;
  try {
    await client.sendMail({
      from: `"LOIND 아티즌" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("메일 발송 실패:", error);
  }
}
