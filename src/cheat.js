// 1) add solutions from src/test/resources/solutions.json here
// 2) add cheat.js to index.html
// 3) on a level, press ctrl+c to cheat
const solutions = {};

const stepper = (keys) => {
  const target = document.getElementById("panel");
  if (target) {
    const key = keys.shift();
    const event = new KeyboardEvent("keydown", { target: window, bubbles: true, cancelable: true, key: "Arrow" + key });
    target.dispatchEvent(event);
    if (keys.length > 0) {
      window.setTimeout(stepper, 4500, keys);
    }
  }
}

const solver = () => {
  const code = document.location.hash !== undefined ? document.location.hash.substring(1) : undefined;
  if (code) {
    const keys = solutions[code];
    if (keys && keys.length > 0) {
      window.setTimeout(stepper, 100, keys.slice());
    }
  }
};

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && "c" === event.key) {
    solver();
  }
});
