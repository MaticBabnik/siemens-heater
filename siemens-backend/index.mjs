import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { config } from "dotenv";
config();

const influx = new InfluxDB({
    url: 'http://home.sync.si:8086',
    token: process.env.TOKEN
});

const write = influx.getWriteApi(process.env.ORG, process.env.BUCKET, 's');
write.useDefaultTags({ location: process.env.LOCATION });

setInterval(async () => {
    try {
        const point1 = new Point('temperature')
            .floatField('value', 20 + Math.round(100 * Math.random()) / 10)
        write.writePoint(point1)
        await write.flush();
    } catch (e) {
        console.error(e);
    }
}, 2000);