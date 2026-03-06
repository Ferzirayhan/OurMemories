import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

webpush.setVapidDetails(
    "mailto:ourmemories@app.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
    try {
        const { author, title, body, url, tag } = await request.json();

        if (!author || !title) {
            return NextResponse.json({ error: "Missing author or title" }, { status: 400 });
        }

        // Get all subscriptions that DON'T belong to the author (send to the other person)
        const { data: subscriptions, error } = await supabase
            .from("push_subscriptions")
            .select("*")
            .neq("author", author);

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, sent: 0 });
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: "/icon-192.png",
            url: url || "/",
            tag: tag || "our-memories",
        });

        let sent = 0;
        const expired: string[] = [];

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys_p256dh,
                                auth: sub.keys_auth,
                            },
                        },
                        payload
                    );
                    sent++;
                } catch (err: any) {
                    // 410 Gone or 404 = subscription expired, remove it
                    if (err?.statusCode === 410 || err?.statusCode === 404) {
                        expired.push(sub.id);
                    }
                    console.error("Push send error:", err?.statusCode, err?.body);
                }
            })
        );

        // Clean up expired subscriptions
        if (expired.length > 0) {
            await supabase
                .from("push_subscriptions")
                .delete()
                .in("id", expired);
        }

        return NextResponse.json({ success: true, sent, expired: expired.length });
    } catch (err: unknown) {
        console.error("Send notification error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
