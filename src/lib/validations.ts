import { z } from "zod";

// 密码强度校验：至少 8 位，必须包含字母 + 数字
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(72, "密码最多 72 位")
  .regex(/[a-zA-Z]/, "密码必须包含字母")
  .regex(/[0-9]/, "密码必须包含数字");

// 用户注册
export const registerSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱地址"),
    nickname: z.string().min(2, "昵称至少 2 个字符").max(30, "昵称最多 30 个字符"),
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((v) => v === true, {
      message: "请同意服务条款与隐私政策",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// 登录
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 忘记密码（请求重置）
export const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// 重置密码
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "缺少重置令牌"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// 修改密码（已登录用户）
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// 编辑个人资料
export const profileSchema = z.object({
  nickname: z.string().min(2, "昵称至少 2 个字符").max(30, "昵称最多 30 个字符"),
  avatar: z
    .string()
    .url("头像必须是合法 URL")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(200, "个人简介最多 200 字").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// 转运公司报价
export const quoteSchema = z.object({
  channelName: z.string().min(1, "请填写渠道名"),
  serviceType: z.enum(["AIR", "SEA", "RAIL", "SPECIAL"]),
  origin: z.string().min(1, "请填写起运地"),
  destination: z.string().min(1, "请填写目的地"),
  firstWeightKg: z.number().positive("首重必须 > 0"),
  firstWeightPrice: z.number().nonnegative("首重价必须 ≥ 0"),
  continueWeightKg: z.number().positive("续重单位必须 > 0"),
  continueWeightPrice: z.number().nonnegative("续重价必须 ≥ 0"),
  estDaysMin: z.number().int().nonnegative(),
  estDaysMax: z.number().int().nonnegative(),
  restrictions: z.string().optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

// 公司资料
export const companySchema = z.object({
  name: z.string().min(2, "公司名至少 2 个字符").max(80),
  logo: z.string().url("Logo 必须是合法 URL").optional().or(z.literal("")),
  website: z.string().url("官网必须是合法 URL").optional().or(z.literal("")),
  intro: z.string().max(2000, "简介最多 2000 字").optional().or(z.literal("")),
  foundedYear: z.number().int().min(1990).max(new Date().getFullYear()).optional(),
  phone: z.string().max(40).optional().or(z.literal("")),
  wechat: z.string().max(60).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  origins: z.array(z.string()).min(1, "至少选择一个起运地"),
  destinations: z.array(z.string()).min(1, "至少选择一个目的地"),
  serviceTypes: z.array(z.enum(["AIR", "SEA", "RAIL", "SPECIAL"])).min(1, "至少选择一种服务类型"),
});

export type CompanyInput = z.infer<typeof companySchema>;

// 评价
export const reviewSchema = z.object({
  entityType: z.enum(["COMPANY", "PHONE_PLAN"]),
  entityId: z.string().min(1),
  overallRating: z.number().min(1, "请给总分").max(5),
  dimensions: z
    .object({
      price: z.number().min(1).max(5),
      speed: z.number().min(1).max(5),
      package: z.number().min(1).max(5),
      service: z.number().min(1).max(5),
      loss: z.number().min(1).max(5),
      customs: z.number().min(1).max(5),
    }),
  content: z.string().min(10, "评价内容至少 10 字").max(2000, "评价内容最多 2000 字"),
  images: z.array(z.string().url()).max(9).default([]),
  recommend: z.boolean().default(true),
  scenario: z.string().max(40).optional(),
  route: z.string().max(80).optional(),
  weight: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// 优惠码
export const codeSchema = z.object({
  type: z.enum(["INVITE", "DISCOUNT", "REFERRAL"]),
  platform: z.string().min(1, "请填写适用平台"),
  platformCategory: z.enum([
    "ecommerce",
    "streaming",
    "tool",
    "transport",
    "telecom",
    "other",
  ]),
  benefitDescription: z.string().min(2, "请填写优惠内容").max(120),
  codeValue: z.string().max(60).optional().or(z.literal("")),
  link: z.string().url("链接必须合法").optional().or(z.literal("")),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  hasReferral: z.boolean().default(false),
});

export type CodeInput = z.infer<typeof codeSchema>;

// 电话套餐
export const phonePlanSchema = z.object({
  carrier: z.string().min(1, "请填写运营商"),
  planName: z.string().min(1, "请填写套餐名"),
  type: z.enum(["MOBILE", "PREPAID", "BROADBAND", "BUNDLE"]),
  monthlyFee: z.number().nonnegative(),
  dataGb: z.number().int().nonnegative().optional(),
  isUnlimited: z.boolean().default(false),
  network: z.enum(["4G", "5G"]),
  contractMonths: z.number().int().nonnegative().optional(),
  promoPrice: z.number().nonnegative().optional(),
  promoMonths: z.number().int().nonnegative().optional(),
  restorePrice: z.number().nonnegative().optional(),
  officialUrl: z.string().url().optional().or(z.literal("")),
});

export type PhonePlanInput = z.infer<typeof phonePlanSchema>;
