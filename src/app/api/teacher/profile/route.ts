import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";
import bcrypt from "bcryptjs";

// GET: Fetch teacher profile
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized. Teachers only." },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Error fetching profile" },
      { status: 500 }
    );
  }
}

// PUT: Update teacher profile
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized. Teachers only." },
        { status: 403 }
      );
    }

    const { firstName, lastName, currentPassword, newPassword } = await req.json();

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { teacherProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update data object
    const updateData: any = {};
    const updateProfileData: any = {};

    if (firstName) {
      updateData.firstName = firstName;
      updateProfileData.firstName = firstName;
    }
    if (lastName) {
      updateData.lastName = lastName;
      updateProfileData.lastName = lastName;
    }
    if (firstName && lastName) updateData.name = `${firstName} ${lastName}`;

    // If password change requested
    if (currentPassword && newPassword) {
      if (!user.password) {
        return NextResponse.json(
          { error: "Cannot update password for OAuth accounts" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0 && Object.keys(updateProfileData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    // Update user and teacherProfile in a transaction
    const result = await db.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email! },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          image: true,
          role: true,
        },
      });
      
      if (user.teacherProfile && Object.keys(updateProfileData).length > 0) {
        await prisma.teacherProfile.update({
          where: { userId: user.id },
          data: updateProfileData,
        });
      }
      
      return updatedUser;
    });
    
    const updatedUser = result;

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );
  }
}

// DELETE: Delete teacher account
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized. Teachers only." },
        { status: 403 }
      );
    }

    // Delete associated sessions and accounts first
    await db.account.deleteMany({
      where: { user: { email: session.user.email } },
    });

    // Delete the user (will cascade to TeacherProfile, Class, etc.)
    await db.user.delete({
      where: { email: session.user.email },
    });

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Error deleting account" },
      { status: 500 }
    );
  }
}