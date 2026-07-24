import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// 微信登录 Provider（自定义，仅当配置了环境变量时启用）
// 微信 OAuth2 流程较为特殊（扫码 + code 换 access_token + 拉用户信息），
// 此处使用通用的 OAuth2 userinfo 模式作为占位实现，实际部署需对接
// 微信开放平台 https://open.weixin.qq.com/ 的具体接口。
function WechatProvider() {
  const clientId = process.env.WECHAT_CLIENT_ID;
  const clientSecret = process.env.WECHAT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    id: "wechat",
    name: "微信",
    type: "oauth" as const,
    clientId,
    clientSecret,
    authorization: {
      url: "https://open.weixin.qq.com/connect/qrconnect",
      params: {
        appid: clientId,
        scope: "snsapi_login",
        response_type: "code",
      },
    },
    token: {
      url: "https://api.weixin.qq.com/sns/oauth2/access_token",
      params: { appid: clientId, secret: clientSecret, grant_type: "authorization_code" },
    },
    userinfo: {
      url: "https://api.weixin.qq.com/sns/userinfo",
      params: { lang: "zh_CN" },
    },
    profile(profile: { openid: string; nickname: string; headimgurl?: string }) {
      return {
        id: profile.openid,
        name: profile.nickname,
        image: profile.headimgurl ?? null,
        email: `${profile.openid}@wechat.placeholder`,
      };
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter 自动管理 users / accounts / sessions 表
  // 但本项目使用 JWT 策略，故未直接使用 adapter；保留以备切换数据库会话模式
  adapter: undefined,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "邮箱密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatar,
          role: user.role,
          creditScore: user.creditScore,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(WechatProvider() ? [WechatProvider()!] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.creditScore = (user as { creditScore?: number }).creditScore ?? 20;
      }
      // 每次签发 JWT 时刷新用户最新信息（避免脏数据）
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, creditScore: true, nickname: true, avatar: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.creditScore = dbUser.creditScore;
          token.name = dbUser.nickname;
          token.picture = dbUser.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.creditScore = token.creditScore as number;
      }
      return session;
    },
    async signIn({ user, account }) {
      // OAuth 首次登录：自动创建/更新用户记录
      if (account?.provider && account.provider !== "credentials" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              nickname: user.name ?? `用户_${Math.random().toString(36).slice(2, 8)}`,
              avatar: user.image,
              emailVerified: new Date(),
            },
          });
        }
      }
      return true;
    },
  },
});

// 扩展类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      creditScore: number;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    creditScore?: number;
  }
}

// 便捷函数：生成默认昵称
export function generateNickname(name?: string | null): string {
  if (name) return name;
  return `华人用户_${Math.random().toString(36).slice(2, 8)}`;
}

// 用于注册时统一邮箱小写 + 生成 slug（虽然 user 表无 slug，预留）
export { slugify };
