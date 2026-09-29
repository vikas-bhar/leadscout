/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase";
import { addUserCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, freelancerType } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "New Member",
          freelancer_type: freelancerType || "web_designer",
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      const serviceClient = createSupabaseServiceClient();

      // Upsert profile
      await serviceClient.from("users").upsert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || "New Member",
        freelancer_type: freelancerType || "web_designer",
        subscription_plan: "free",
        subscription_status: "active",
        created_at: new Date().toISOString(),
      });

      // Grant initial 20 free starter credits
      await addUserCredits(
        {
          userId: authData.user.id,
          credits: 20,
          type: "bonus",
          action: "signup_bonus",
          description: "20 Free Starter Credits on Signup",
        },
        serviceClient
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: "Account created successfully with 20 free credits.",
    });
  } catch (error: any) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
