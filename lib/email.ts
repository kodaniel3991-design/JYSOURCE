import nodemailer from "nodemailer";

export interface MailOptions {
  smtpUser:   string;  // 발신자 이메일 (SMTP 인증 계정)
  smtpPass:   string;  // 발신자 이메일 비밀번호
  senderName: string;  // 발신자 표시명
  to:         string;
  subject:    string;
  text:       string;
  attachment?: { filename: string; content: Buffer }; // PDF 첨부
}

export async function sendMail(opts: MailOptions) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? "smtps.hiworks.com",
    port:   Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth:   { user: opts.smtpUser, pass: opts.smtpPass },
  });

  await transporter.sendMail({
    from:    `"${opts.senderName}" <${opts.smtpUser}>`,
    to:      opts.to,
    bcc:     opts.smtpUser, // 발신자 숨은참조 → 웹메일 수신함에 자동 저장
    subject: opts.subject,
    text:    opts.text,
    ...(opts.attachment && {
      attachments: [{ filename: opts.attachment.filename, content: opts.attachment.content }],
    }),
  });
}
