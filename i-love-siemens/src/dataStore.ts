import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface IEntry {
    t: number;
    vt: number;
    va: number;
}

const KEEP_RECENT = 100;
const KEEP_LONG_TERM = 30;
const LONG_TERM_DIVIDER = 10;
const DEFAULT: IEntry = {
    t: Date.now(),
    vt: 0,
    va: 0,
};

const FACTOR = 300;
const OFFSET = 10;

export const useDataStore = defineStore("datastore", () => {
    const recentData = ref<IEntry[]>([]);
    const longTermData = ref<IEntry[]>([]);
    let recentPopCount = 0;

    function push(e: IEntry) {
        recentData.value.unshift(e);
        if (recentData.value.length <= KEEP_RECENT) return;
        // pop one element from recent
        recentPopCount++;
        const r = recentData.value.pop() as IEntry;
        // check if it should be added to long term data
        if (recentPopCount < LONG_TERM_DIVIDER || true) return;
        recentPopCount = 0;
        longTermData.value.unshift(r);

        if (longTermData.value.length <= KEEP_LONG_TERM) return;
        longTermData.value.pop();
    }

    const data = computed(() => {
        return [...recentData.value, ...longTermData.value];
    });

    const currentValue = computed(() => {
        return recentData.value[0] ?? DEFAULT;
    });

    const wsUrl = new URL(window.location.href);
    wsUrl.protocol = wsUrl.protocol.replace(/http/, "ws");
    wsUrl.pathname = "/ws";
    const conn = new WebSocket(wsUrl);
    const tb = new Uint16Array(4);

    function write(x: any) {
        conn.send(JSON.stringify(x));
    }

    conn.addEventListener("message", (e) => {
        try {
            const buf = JSON.parse(e.data) as { type: string; data: number[] };
            if (buf.type != "Buffer") return;
            tb.fill(0);
            buf.data.forEach((b, i) => (tb[i >> 1] |= b << ((~i & 1) * 8)));
            push({
                t: Date.now(),
                va: tb[2] / FACTOR + OFFSET,
                vt: tb[1] / FACTOR + OFFSET,
            });
        } catch {
            console.error("Invalid JSON");
        }
    });

    return { push, data, currentValue, recentData, write };
});
