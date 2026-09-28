import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: ag } = await a.from("agencies").insert({ name: "SHARETEST", plan: "pro" }).select("id").single();
const uid = (await a.auth.admin.createUser({ email: `sharetest-${Date.now()}@northwind-test-agency.com`, password: "Xw-test-xyz!", email_confirm: true })).data.user.id;
await a.from("agency_members").insert({ agency_id: ag.id, user_id: uid, role: "owner" });
const { data: cl } = await a.from("clients").insert({ agency_id: ag.id, name: "SHARETEST CLIENT" }).select("id").single();
const { data: tok } = await a.from("client_share_tokens").insert({ agency_id: ag.id, client_id: cl.id }).select("token").single();
console.log("TOKEN:", tok.token);
// keep ids for cleanup
console.log("CLEANUP:", ag.id, uid);
