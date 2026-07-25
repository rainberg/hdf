import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "编辑资料",
};

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/me/edit");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatar: true,
      bio: true,
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/me/edit");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">编辑资料</h1>

      <div className="space-y-8">
        <ProfileForm
          defaultNickname={user.nickname}
          defaultAvatar={user.avatar ?? ""}
          defaultBio={user.bio ?? ""}
        />

        <ChangePasswordForm />
      </div>
    </div>
  );
}
