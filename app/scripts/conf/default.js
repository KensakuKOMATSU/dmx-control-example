const map = {
    1: "pan", 2: "tilt", 3: "dimmer", 4: "red", 5: "green", 6: "blue", 7: "white", 8: "speed"
};

export const colors = [
    'rgb(0, 119, 204)',
    'rgb(255, 127, 0)'
]

export const config = [
    { id: 0, name: "light0", start_address: 1, map },
    { id: 1, name: "light1", start_address: 10, map },
]