/**
 * 邮件发送抽象层
 *
 * 策略：
 * - 配置了 RESEND_API_KEY 时使用 Resend（推荐生产环境）
 * - 否则降级为 console.log（开发环境），并把邮件内容返回给调用方
 *   便于 admin 后台查看或本地调试
 *
 * 使用 Resend：
 *   1. 注册 https://resend.com（免费层 100 封/天）
 *   2. 在 Vercel 环境变量添加 RESEND_API_KEY
 *   3. （可选）配置 RESEND_FROM 为你的域名邮箱
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  delivered: boolean;
  /** 降级模式下返回邮件内容，便于 admin 转发或调试 */
  fallbackContent?: string;
  error?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM ?? "华德福 <noreply@huadefu.org>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const emailConfigured = Boolean(RESEND_API_KEY);

/**
 * 发送邮件。未配置 Resend 时降级为返回邮件内容（不实际发送）。
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    const fallbackContent = `[邮件降级模式 - 未配置 RESEND_API_KEY]
To: ${message.to}
Subject: ${message.subject}

${message.text ?? message.html.replace(/<[^>]*>/g, "")}
`;
    console.log("📧 [email:fallback]", fallbackContent);
    return { delivered: false, fallbackContent };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { delivered: false, error: `Resend API 错误: ${err}` };
    }

    return { delivered: true };
  } catch (e) {
    return { delivered: false, error: (e as Error).message };
  }
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<SendResult> {
  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: "重置你的华德福账号密码",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #9a1f1f;">重置密码</h2>
        <p>你收到这封邮件是因为有人请求重置华德福账号的密码。</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #9a1f1f; color: #fff;
                    padding: 10px 20px; border-radius: 6px; text-decoration: none;
                    margin: 16px 0;">
            点击重置密码
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          或复制此链接到浏览器：<br>
          ${resetUrl}
        </p>
        <p style="color: #999; font-size: 12px;">
          链接 24 小时内有效。如果不是你本人操作，请忽略此邮件。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">华德福 HuaDeFu · 在德华人生活指南</p>
      </div>
    `,
    text: `重置密码：${resetUrl}\n\n链接 24 小时内有效。如非本人操作请忽略。`,
  });
}

/**
 * 发送邮箱验证邮件
 */
export async function sendEmailVerification(
  to: string,
  token: string,
): Promise<SendResult> {
  const verifyUrl = `${SITE_URL}/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: "验证你的华德福账号邮箱",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #9a1f1f;">验证邮箱</h2>
        <p>欢迎加入华德福！请点击下方按钮验证你的邮箱地址。</p>
        <p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #d4a547; color: #9a1f1f;
                    padding: 10px 20px; border-radius: 6px; text-decoration: none;
                    font-weight: 600; margin: 16px 0;">
            验证邮箱
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          或复制此链接到浏览器：<br>
          ${verifyUrl}
        </p>
        <p style="color: #999; font-size: 12px;">
          链接 48 小时内有效。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">华德福 HuaDeFu · 在德华人生活指南</p>
      </div>
    `,
    text: `验证邮箱：${verifyUrl}\n\n链接 48 小时内有效。`,
  });
}
