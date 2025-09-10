import { generateDMXData, parseDMXData } from "./libs/converter.js";
import datacueSource from "./sample-data/datacue-source.js"
import dmxData from "./sample-data/dmx-default.js"
import { defaultSetting } from "./dmx-settings/conf.js"
import { areObjectsEqual } from "./libs/util.js";

const settings = defaultSetting;

{
    const inputData = datacueSource;
    const expected = dmxData
    const outputData = generateDMXData(inputData, settings);
    console.assert(areObjectsEqual(outputData, expected), "DMX data does not match expected output.");
}

{
    const inputData = dmxData;
    const expected = datacueSource;
    const outputData = parseDMXData(inputData, settings);
    console.assert(areObjectsEqual(outputData, expected), "First object does not match expected.");
}

console.log("All tests finished");