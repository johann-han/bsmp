import { lookup } from "node:dns/promises";

const PAYFAST_HOSTS = ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za", "sandbox.payfast.co.za"] as const;

function ipv4ToInt(ip: string): number | null {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    return (((parts[0]! * 256 + parts[1]!) * 256 + parts[2]!) * 256 + parts[3]!) >>> 0;
}

function matchesCidr(ip: string, cidr: string): boolean {
    const [network, prefixText] = cidr.split("/");
    const ipValue = ipv4ToInt(ip);
    const networkValue = ipv4ToInt(network ?? "");
    const prefix = prefixText === undefined ? 32 : Number(prefixText);
    if (ipValue === null || networkValue === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (ipValue & mask) === (networkValue & mask);
}

export function requestIp(headers: Headers): string | null {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || null;
}

export async function verifyPayFastSourceIp(ip: string | null): Promise<void> {
    if (!ip) throw new Error("PayFast ITN source IP could not be determined.");
    const resolved = new Set<string>();
    for (const host of PAYFAST_HOSTS) {
        try {
            const addresses = await lookup(host, { all: true });
            for (const address of addresses) if (address.family === 4) resolved.add(address.address);
        } catch {
            // Continue with hosts that resolve successfully.
        }
    }
    const allowed = process.env.PAYFAST_ITN_ALLOWED_IPS?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
    const allowedByDns = resolved.has(ip);
    const allowedByConfigured = allowed.some((entry) => matchesCidr(ip, entry));
    if (!allowedByDns && !allowedByConfigured) throw new Error("PayFast ITN source IP verification failed.");
}

export const __test__ = { matchesCidr };
