<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useDataStore } from "./dataStore";
import Gauge from "./components/Gauge.vue";
import CTable from "./components/Table.vue";
import ApexChart from "vue3-apexcharts";

const chart = ref<ApexChart | null>(null);
const ds = useDataStore();

// let i: NodeJS.Timer;
// onMounted(() => {
//     i = setInterval(() => {
//         const t = Date.now();
//         const va = (Math.sin(Date.now() / 5000) + 1) * 50;
//         const vt = (Math.cos(Date.now() / 5000) + 1) * 50;

//         ds.push({ t, va, vt });
//     }, 500);
// });

// onBeforeUnmount(() => {
//     clearInterval(i);
// });

// const series = computed(() => {
//     return [
//         {
//             name: "actual",
//             data: ds.data.map(({ t, va }) => [t, va]),
//         },
//         {
//             name: "target",
//             data: ds.data.map(({ t, vt }) => [t, vt]),
//         },
//     ];
// });
const INIT = [
    {
        name: "actual",
        data: [],
    },
    {
        name: "target",
        data: [],
    },
];
const temp = ref<number>(30);

function settemp() {
    ds.write(temp.value);
}

ds.$subscribe((m, st) => {
    chart.value?.updateSeries([
        {
            name: "actual",
            data: st.recentData.map(({ t, va }) => [t, va]),
        },
        {
            name: "target",
            data: st.recentData.map(({ t, vt }) => [t, vt]),
        },
    ]);
});

// watch(ds.$state, (newV) => {
//     console.log(newV);
//     chart.value?.updateSeries(
//         [
//         {
//             name: "actual",
//             data: newV.map(({ t, va }) => [t, va]),
//         },
//         {
//             name: "target",
//             data: newV.map(({ t, vt }) => [t, vt]),
//         },
//     ])
// });

const chartOptions = {
    chart: {
        id: "realtime",
        type: "line",
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
    },
    animations: {
        enabled: true,
        easing: "linear",
        dynamicAnimation: {
            speed: 1000,
        },
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        curve: "straight",
        width: 2,
    },
    title: {
        text: "Epic graf 10k",
        align: "center",
    },
    markers: {
        size: 0,
    },
    xaxis: {
        type: "datetime",
        range: 10000,
    },
    yaxis: {
        min: 0,
        max: 100,
        labels: {
            formatter(x: number) {
                return x?.toFixed(0);
            },
        },
    },
    legend: {
        show: true,
    },
};
</script>

<template>
    <div>
        <h1>
            I love <b>SIEMENS</b>
            <span id="status" :class="{ live: true }"></span>
        </h1>
        <div class="hlayout">
            <div class="guage-w-title">
                <h3>Temperatura</h3>
                <Gauge :value="ds.currentValue.va" />
            </div>
            <ApexChart
                type="line"
                width="500"
                :options="chartOptions"
                :series="INIT"
                ref="chart"
            />
        </div>
        <div class="hlayout">
            <CTable :entries="ds.data" />
            <fieldset>
                <h3>Nastavi temperaturo</h3>
                Temperatura:
                <input
                    v-model="temp"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                />
                <br />
                <button @click="settemp">Nastavi</button>
            </fieldset>
        </div>
    </div>
</template>

<style scoped>
.hlayout {
    display: flex;
    flex-direction: row;
}
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
}
h1 {
    font-weight: 500;
    margin: 1rem 0;
}
h1 b {
    font-weight: 900;
    color: #42b883aa;
}

#status {
    margin-left: 10px;
    display: inline-block;
    height: 0.7em;
    aspect-ratio: 1;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px solid black;
}

@keyframes live {
    0% {
        background-color: #0a0f;
        box-shadow: 0 0 3px #0a08;
    }

    100% {
        background-color: #0a08;
        box-shadow: 0 0 10px #0a0f;
    }
}

#status.live {
    animation: live 0.5s infinite alternate ease;
}
</style>
