<script lang="ts" setup>
import { computed } from "vue";
import { IEntry } from "../dataStore";

const props = defineProps<{
    entries: IEntry[];
}>();

const data = computed(() => {
    return props.entries.map(({ t, vt, va }) => ({ vt, va, t: new Date(t) }));
});
</script>

<template>
    <div class="table-container">
        <table>
            <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Target</th>
                <th>Actual</th>
            </tr>
            <tr v-for="(ev, i) in data" :key="i">
                <td class="d">{{ ev.t.toDateString() }}</td>
                <td class="t">{{ ev.t.toLocaleTimeString() }}</td>
                <td class="v">{{ ev.vt.toFixed(1) }}</td>
                <td class="v">{{ ev.va.toFixed(1) }}</td>
            </tr>
        </table>
    </div>
</template>

<style scoped>
.table-container {
    height: 300px;
    width: 500px;
    overflow-y: scroll;
    position: relative;
}

table {
    width: 100%;
    margin-right: 0 !important;
    border-collapse: collapse;
}

th {
    top: 0;
    background-color: #42b883ff;
    color: white;
    position: sticky;
}
tr:nth-child(odd) {
    background-color: #eee;
}

td {
    padding: 5px;
}
td.d {
}
td.t {
}
td.v {
    font-family: monospace;
}
</style>
