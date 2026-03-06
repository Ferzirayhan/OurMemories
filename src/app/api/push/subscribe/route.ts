import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
    try {
        const { subscription, author } = await request.json();

        if (!subscription?.endpoint || !subscription?.keys) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Upsert — update if same endpoint exists, insert if new
        const { error } = await supabase
            .from("push_subscriptions")
            .upsert(
                {
                    endpoint: subscription.endpoint,
                    keys_p256dh: subscription.keys.p256dh,
                    keys_auth: subscription.keys.auth,
                    author: author || "Anonymous",
                },
                { onConflict: "endpoint" }
            );

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("Subscribe error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
