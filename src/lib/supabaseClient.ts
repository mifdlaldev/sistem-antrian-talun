import { PostgrestClient } from "@supabase/postgrest-js";
import { RealtimeClient } from "@supabase/realtime-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = new PostgrestClient(supabaseUrl, {
	headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
});

const realtimeUrl = `${supabaseUrl.replace(/^http/, "ws")}/realtime/v1`;

const realtime = new RealtimeClient(realtimeUrl, {
	params: { apikey: supabaseKey },
});

export function subscribeAntrian(
	channelName: string,
	onChange: () => void,
): () => void {
	const channel = realtime.channel(channelName);
	channel
		.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: "antrian" },
			onChange,
		)
		.subscribe();
	return () => {
		realtime.removeChannel(channel);
	};
}
